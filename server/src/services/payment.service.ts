import crypto from 'crypto';
import mongoose from 'mongoose';
import { Course } from '../models/course.model';
import { Bundle } from '../models/bundle.model';
import { Enrollment } from '../models/enrollment.model';
import { Payment } from '../models/payment.model';
import { PlatformWallet } from '../models/platformWallet.model';
import { Payout } from '../models/payout.model';
import { Subscription } from '../models/subscription.model';
import { SubscriptionEnrollment } from '../models/subscriptionEnrollment.model';
import { Coupon } from '../models/coupon.model';
import { Refund } from '../models/refund.model';
import { WebhookEvent } from '../models/webhookEvent.model';
import { Notification } from '../models/notification.model';
import { AuditLog } from '../models/auditLog.model';
import { User } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { ROLES } from '../constants/roles';
import { logger } from '../utils/logger';
import { withTransaction } from '../utils/transaction';
import { platformSettingsService } from './platformSettings.service';

const RAZORPAY_KEY_ID = env.razorpayKeyId;
const RAZORPAY_KEY_SECRET = env.razorpayKeySecret;

export class PaymentService {
  // ─── Razorpay Instance ──────────────────────────────────────
  private async getRazorpay() {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw ApiError.internal('Payment gateway not configured');
    }
    const Razorpay = (await import('razorpay')).default;
    return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  }

  // ─── Platform Wallet (Singleton) ──────────────────────────
  async getOrCreateWallet() {
    let wallet = await PlatformWallet.findOne();
    if (!wallet) {
      wallet = await PlatformWallet.create({
        totalRevenue: 0,
        totalCommissionCollected: 0,
        totalPayoutsMade: 0,
        currentBalance: 0,
        pendingPayouts: 0,
      });
    }
    return wallet;
  }

  async getWallet() {
    return this.getOrCreateWallet();
  }

  // ─── Commission Calculation ──────────────────────────────
  calculateCommission(amount: number, commissionPercent: number) {
    const commissionAmount = Math.round((amount * commissionPercent) / 100);
    const instructorShare = amount - commissionAmount;
    return { commissionPercent, commissionAmount, instructorShare };
  }

  // ─── Coupon Validation ──────────────────────────────────
  async validateCoupon(couponCode: string | undefined, amount: number) {
    if (!couponCode) return { coupon: null, discountAmount: 0, finalAmount: amount };

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon) throw ApiError.notFound('Invalid coupon code');
    if (coupon.expiresAt < new Date()) throw ApiError.badRequest('Coupon has expired');
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      throw ApiError.badRequest('Coupon usage limit reached');
    }
    if (amount < coupon.minAmount) throw ApiError.badRequest('Minimum amount not met for coupon');

    const discountAmount = coupon.discountType === 'percentage'
      ? Math.round((amount * coupon.discountValue) / 100)
      : coupon.discountValue;
    const finalAmount = Math.max(0, amount - discountAmount);

    return { coupon, discountAmount, finalAmount };
  }

  // ─── Credit Wallet After Payment ───────────────────────
  async creditWallet(paymentId: string, session?: mongoose.ClientSession) {
    const payment = await Payment.findOneAndUpdate(
      { _id: paymentId, walletCredited: false },
      { $set: { walletCredited: true } },
      { new: true, session }
    );
    if (!payment) return;

    const wallet = await this.getOrCreateWallet();
    await PlatformWallet.findByIdAndUpdate(
      wallet._id,
      {
        $inc: {
          totalRevenue: payment.amount,
          totalCommissionCollected: payment.totalCommissionAmount,
          currentBalance: payment.amount,
        },
        $set: { lastUpdated: new Date() },
      },
      { session }
    );

    if (payment.commissionSplits.length > 0) {
      const payoutDocs: any[] = [];
      for (const split of payment.commissionSplits) {
        if (split.instructorShare > 0) {
          payoutDocs.push({
            instructor: split.instructor,
            amount: split.instructorShare,
            commissionAmount: split.commissionAmount,
            totalAmount: split.baseAmount,
            sourcePayment: payment._id,
            sourceType: payment.type,
            status: 'pending',
            scheduledDate: new Date(),
          });
        }
      }
      if (payoutDocs.length > 0) {
        await Payout.insertMany(payoutDocs, { session });
        await PlatformWallet.findByIdAndUpdate(
          wallet._id,
          { $inc: { pendingPayouts: payment.totalInstructorShare } },
          { session }
        );
      }
    }
  }

  // ─── Idempotent Payment Helpers ─────────────────────────
  private async claimPayment(
    paymentId: string,
    razorpayPaymentId: string,
    razorpaySignature: string | undefined,
    session?: mongoose.ClientSession
  ) {
    const update: Record<string, any> = {
      status: 'success',
      razorpayPaymentId,
    };
    if (razorpaySignature !== undefined) update.razorpaySignature = razorpaySignature;
    return Payment.findOneAndUpdate(
      { _id: paymentId, status: 'pending' },
      { $set: update },
      { new: true, session }
    );
  }

  private async createPaymentSideEffects(payment: any, session: mongoose.ClientSession) {
    if (payment.type === 'course' && payment.course) {
      const existingEnrollment = await Enrollment.findOne(
        { user: payment.user, course: payment.course },
        null,
        { session }
      );
      if (!existingEnrollment) {
        await Enrollment.create([{ user: payment.user, course: payment.course }], { session });
        await Course.findByIdAndUpdate(payment.course, { $inc: { totalEnrollments: 1 } }, { session });
      }
    } else if (payment.type === 'bundle' && payment.bundle) {
      const bundle = await Bundle.findById(payment.bundle).session(session);
      if (bundle) {
        const allCourseIds = bundle.courses;
        const existingEnrollments = await Enrollment.find(
          { user: payment.user, course: { $in: allCourseIds } },
          null,
          { session }
        );
        const existingCourseIdSet = new Set(existingEnrollments.map((e) => e.course.toString()));
        const newCourseIds = allCourseIds.filter(
          (cid: mongoose.Types.ObjectId) => !existingCourseIdSet.has(cid.toString())
        );

        if (newCourseIds.length > 0) {
          await Enrollment.insertMany(
            newCourseIds.map((cid: mongoose.Types.ObjectId) => ({ user: payment.user, course: cid })),
            { session, ordered: true }
          );
          await Bundle.findByIdAndUpdate(payment.bundle, { $inc: { totalEnrollments: 1 } }, { session });
          await Course.updateMany(
            { _id: { $in: newCourseIds } },
            { $inc: { totalEnrollments: 1 } },
            { session }
          );
        }
      }
    } else if (payment.type === 'subscription' && payment.subscription) {
      const existingSub = await SubscriptionEnrollment.findOne(
        { user: payment.user, subscription: payment.subscription },
        null,
        { session }
      );
      if (!existingSub) {
        const plan = await Subscription.findById(payment.subscription).session(session);
        if (plan) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + plan.durationDays);
          const [subEnrollment] = await SubscriptionEnrollment.create(
            [{
              user: payment.user,
              subscription: payment.subscription,
              razorpayOrderId: payment.razorpayOrderId,
              razorpayPaymentId: payment.razorpayPaymentId,
              startDate,
              endDate,
              status: 'active',
            }],
            { session }
          );
          payment.subscriptionEnrollment = subEnrollment._id;
          await payment.save({ session });
          await Subscription.findByIdAndUpdate(
            payment.subscription,
            { $inc: { totalSubscribers: 1 } },
            { session }
          );
        }
      }
    }
  }

  // ─── Course Purchase (Updated with commission + wallet) ──
  async initiateCoursePayment(userId: string, courseId: string, couponCode?: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status !== 'published' || !course.isApproved) {
      throw ApiError.badRequest('Course is not available for purchase');
    }

    const existing = await Enrollment.findOne({ user: userId, course: courseId });
    if (existing) throw ApiError.conflict('Already enrolled in this course');

    let amount = course.price;
    let discountAmount = 0;
    let coupon: any = null;

    if (couponCode && course.price > 0) {
      const validated = await this.validateCoupon(couponCode, course.price);
      coupon = validated.coupon;
      discountAmount = validated.discountAmount;
      amount = validated.finalAmount;
    }

    if (amount === 0) {
      return withTransaction(async (session) => {
        const enrollment = await Enrollment.create([{ user: userId, course: courseId }], { session });
        await Course.findByIdAndUpdate(courseId, { $inc: { totalEnrollments: 1 } }, { session });
        return { free: true, enrollment: enrollment[0] };
      });
    }

    const commissionPercent = await platformSettingsService.getCommissionPercentage();
    const commission = this.calculateCommission(amount, commissionPercent);
    const instructorId = course.instructor.toString();

    const razorpay = await this.getRazorpay();
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_course_${courseId}_${userId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return withTransaction(async (session) => {
      const [payment] = await Payment.create([{
        user: userId,
        type: 'course',
        course: courseId,
        razorpayOrderId: order.id,
        amount,
        coupon: coupon?._id,
        discountAmount,
        status: 'pending',
        commissionPercent: commission.commissionPercent,
        commissionSplits: [{
          instructor: instructorId,
          baseAmount: amount,
          commissionPercent: commission.commissionPercent,
          commissionAmount: commission.commissionAmount,
          instructorShare: commission.instructorShare,
        }],
        totalCommissionAmount: commission.commissionAmount,
        totalInstructorShare: commission.instructorShare,
      }], { session });

      if (coupon) {
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } }, { session });
      }

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: RAZORPAY_KEY_ID,
        paymentId: payment._id,
      };
    });
  }

  async verifyCoursePayment(userId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw ApiError.badRequest('Invalid payment signature');
    }

    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.type !== 'course') throw ApiError.badRequest('Not a course payment');

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const claimed = await this.claimPayment(payment._id.toString(), razorpayPaymentId, razorpaySignature, session);
      if (!claimed) {
        await session.abortTransaction();
        return { success: true, paymentId: payment._id };
      }
      await this.createPaymentSideEffects(claimed, session);
      await this.creditWallet(claimed._id.toString(), session);
      await session.commitTransaction();
      return { success: true, paymentId: claimed._id };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ─── Bundle Purchase ────────────────────────────────────
  async initiateBundlePayment(userId: string, bundleId: string, couponCode?: string) {
    const bundle = await Bundle.findById(bundleId).populate('courses');
    if (!bundle) throw ApiError.notFound('Bundle not found');
    if (bundle.status !== 'published') throw ApiError.badRequest('Bundle is not available');

    const courseIds = bundle.courses.map((c: any) => c._id);
    const existingEnrollments = await Enrollment.find({ user: userId, course: { $in: courseIds } });
    if (existingEnrollments.length > 0) {
      throw ApiError.conflict('You are already enrolled in one or more courses in this bundle');
    }

    let amount = bundle.discountedPrice > 0 ? bundle.discountedPrice : bundle.price;
    let discountAmount = 0;
    let coupon: any = null;

    if (couponCode && amount > 0) {
      const validated = await this.validateCoupon(couponCode, amount);
      coupon = validated.coupon;
      discountAmount = validated.discountAmount;
      amount = validated.finalAmount;
    }

    if (amount === 0) {
      return withTransaction(async (session) => {
        const enrollments = await Enrollment.insertMany(
          courseIds.map((cid: any) => ({ user: userId, course: cid })),
          { session, ordered: false }
        );
        await Bundle.findByIdAndUpdate(bundleId, { $inc: { totalEnrollments: 1 } }, { session });
        await Course.updateMany({ _id: { $in: courseIds } }, { $inc: { totalEnrollments: 1 } }, { session });
        return { free: true, enrollments };
      });
    }

    // Calculate commission splits per course in bundle
    const courses = bundle.courses as any[];
    const totalBundleAmount = amount;
    const commissionSplits: any[] = [];
    let totalCommissionAmount = 0;
    let totalInstructorShare = 0;

    const commissionPercent = await platformSettingsService.getCommissionPercentage();

    if (courses.length > 0) {
      const originalTotal = courses.reduce((sum: number, c: any) => sum + c.price, 0);
      for (const course of courses) {
        const ratio = originalTotal > 0 ? course.price / originalTotal : 1 / courses.length;
        const courseAmount = Math.round(totalBundleAmount * ratio);
        const commission = this.calculateCommission(courseAmount, commissionPercent);
        commissionSplits.push({
          instructor: course.instructor,
          baseAmount: courseAmount,
          commissionPercent: commission.commissionPercent,
          commissionAmount: commission.commissionAmount,
          instructorShare: commission.instructorShare,
        });
        totalCommissionAmount += commission.commissionAmount;
        totalInstructorShare += commission.instructorShare;
      }
    }

    const razorpay = await this.getRazorpay();
    const options = {
      amount: totalBundleAmount * 100,
      currency: 'INR',
      receipt: `receipt_bundle_${bundleId}_${userId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return withTransaction(async (session) => {
      const [payment] = await Payment.create([{
        user: userId,
        type: 'bundle',
        bundle: bundleId,
        razorpayOrderId: order.id,
        amount: totalBundleAmount,
        coupon: coupon?._id,
        discountAmount,
        status: 'pending',
        commissionPercent,
        commissionSplits,
        totalCommissionAmount,
        totalInstructorShare,
      }], { session });

      if (coupon) {
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } }, { session });
      }

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: RAZORPAY_KEY_ID,
        paymentId: payment._id,
      };
    });
  }

  async verifyBundlePayment(userId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw ApiError.badRequest('Invalid payment signature');
    }

    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.type !== 'bundle') throw ApiError.badRequest('Not a bundle payment');

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const claimed = await this.claimPayment(payment._id.toString(), razorpayPaymentId, razorpaySignature, session);
      if (!claimed) {
        await session.abortTransaction();
        return { success: true, paymentId: payment._id };
      }
      await this.createPaymentSideEffects(claimed, session);
      await this.creditWallet(claimed._id.toString(), session);
      await session.commitTransaction();
      return { success: true, paymentId: claimed._id };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ─── Subscription Purchase ──────────────────────────────
  async initiateSubscriptionPayment(userId: string, subscriptionId: string, couponCode?: string) {
    const plan = await Subscription.findById(subscriptionId);
    if (!plan) throw ApiError.notFound('Subscription plan not found');
    if (plan.status !== 'active') throw ApiError.badRequest('Subscription plan is not active');

    const existingActive = await SubscriptionEnrollment.findOne({
      user: userId,
      status: 'active',
    });
    if (existingActive) throw ApiError.conflict('You already have an active subscription');

    let amount = plan.discountedPrice > 0 ? plan.discountedPrice : plan.price;
    let discountAmount = 0;
    let coupon: any = null;

    if (couponCode && amount > 0) {
      const validated = await this.validateCoupon(couponCode, amount);
      coupon = validated.coupon;
      discountAmount = validated.discountAmount;
      amount = validated.finalAmount;
    }

    if (amount === 0) {
      return withTransaction(async (session) => {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.durationDays);
        const [subEnrollment] = await SubscriptionEnrollment.create([{
          user: userId,
          subscription: subscriptionId,
          razorpayOrderId: `free_${Date.now()}`,
          startDate,
          endDate,
          status: 'active',
        }], { session });
        await Subscription.findByIdAndUpdate(subscriptionId, { $inc: { totalSubscribers: 1 } }, { session });
        return { free: true, subscriptionEnrollment: subEnrollment };
      });
    }

    const commissionPercent = await platformSettingsService.getCommissionPercentage();
    const commission = this.calculateCommission(amount, commissionPercent);

    const razorpay = await this.getRazorpay();
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_sub_${subscriptionId}_${userId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return withTransaction(async (session) => {
      const [payment] = await Payment.create([{
        user: userId,
        type: 'subscription',
        subscription: subscriptionId,
        razorpayOrderId: order.id,
        amount,
        coupon: coupon?._id,
        discountAmount,
        status: 'pending',
        commissionPercent: commission.commissionPercent,
        commissionSplits: [],
        totalCommissionAmount: commission.commissionAmount,
        totalInstructorShare: 0,
      }], { session });

      if (coupon) {
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } }, { session });
      }

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: RAZORPAY_KEY_ID,
        paymentId: payment._id,
      };
    });
  }

  async verifySubscriptionPayment(userId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw ApiError.badRequest('Invalid payment signature');
    }

    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.type !== 'subscription') throw ApiError.badRequest('Not a subscription payment');

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const claimed = await this.claimPayment(payment._id.toString(), razorpayPaymentId, razorpaySignature, session);
      if (!claimed) {
        await session.abortTransaction();
        return { success: true, paymentId: payment._id };
      }
      await this.createPaymentSideEffects(claimed, session);
      await this.creditWallet(claimed._id.toString(), session);
      await session.commitTransaction();
      return { success: true, paymentId: claimed._id, subscriptionEnrollment: claimed.subscriptionEnrollment };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ─── Notification Helper ─────────────────────────────────
  private async sendPaymentNotification(
    userIds: string[],
    title: string,
    message: string,
    type: 'payment' | 'system' = 'payment',
    link?: string
  ) {
    const docs = userIds.map((uid) => ({ user: uid, title, message, type, link }));
    await Notification.insertMany(docs);
  }

  // ─── Razorpay Webhook Handler (Fully Idempotent) ────────
  async handleWebhook(event: string, payload: any, signature: string) {
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.warn('Webhook rejected: invalid signature', { event });
      throw ApiError.badRequest('Invalid webhook signature');
    }

    const eventId = payload.event_id || payload.eventId;
    const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity || {};
    const rzpPaymentId = entity.id || '';
    const orderId = entity.order_id || '';
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

    if (!eventId) {
      logger.warn('Webhook received without event_id', { event });
      return { received: true };
    }

    logger.info('Webhook received', { eventId, event, paymentId: rzpPaymentId, orderId });

    const recordEvent = async (session: mongoose.ClientSession, status: string = 'processed') => {
      const existing = await WebhookEvent.findOne({ eventId }).session(session);
      if (existing) return false;
      await WebhookEvent.create([{ eventId, eventType: event, paymentId: rzpPaymentId, orderId, payloadHash, status: status as any }], { session });
      return true;
    };

    if (event === 'payment.captured') {
      if (!orderId) {
        logger.warn('Webhook missing order_id for payment.captured', { eventId });
        return { received: true };
      }
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        if (!(await recordEvent(session))) {
          await session.abortTransaction();
          logger.info('Duplicate payment.captured webhook', { eventId });
          return { received: true, duplicate: true };
        }
        const payment = await Payment.findOne({ razorpayOrderId: orderId }).session(session);
        if (!payment) {
          logger.warn('payment.captured: payment not found', { orderId, eventId });
          await session.abortTransaction();
          return { received: true };
        }
        const claimed = await this.claimPayment(payment._id.toString(), rzpPaymentId, undefined, session);
        if (!claimed) {
          logger.info('payment.captured: payment already claimed', { orderId, eventId });
          await session.commitTransaction();
          return { received: true };
        }
        claimed.paymentCapturedAt = new Date();
        await claimed.save({ session });
        await this.createPaymentSideEffects(claimed, session);
        await this.creditWallet(claimed._id.toString(), session);
        await session.commitTransaction();
        logger.info('Payment processed via payment.captured', { orderId, paymentId: claimed._id, eventId });
        return { received: true, processed: true };
      } catch (error: any) {
        await session.abortTransaction();
        if (error?.code === 11000) {
          logger.info('Duplicate payment.captured (concurrent)', { eventId });
          return { received: true, duplicate: true };
        }
        logger.error('payment.captured failed', { eventId, error: error.message });
        throw error;
      } finally {
        session.endSession();
      }
    }

    if (event === 'payment.authorized') {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        if (!(await recordEvent(session))) {
          await session.abortTransaction();
          return { received: true, duplicate: true };
        }
        if (orderId) {
          await Payment.findOneAndUpdate(
            { razorpayOrderId: orderId },
            { $set: { status: 'pending', pendingReason: 'Payment authorized by gateway' } },
            { session }
          );
        }
        await session.commitTransaction();
        logger.info('payment.authorized processed', { orderId, eventId });
        return { received: true, processed: true };
      } catch (error: any) {
        await session.abortTransaction();
        if (error?.code === 11000) return { received: true, duplicate: true };
        logger.error('payment.authorized failed', { eventId, error: error.message });
        throw error;
      } finally {
        session.endSession();
      }
    }

    if (event === 'payment.pending') {
      if (!orderId) {
        logger.warn('payment.pending: missing order_id', { eventId });
        return { received: true };
      }
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        if (!(await recordEvent(session, 'pending'))) {
          await session.abortTransaction();
          return { received: true, duplicate: true };
        }
        const payment = await Payment.findOne({ razorpayOrderId: orderId }).session(session);
        if (!payment) {
          logger.warn('payment.pending: payment not found', { orderId, eventId });
          await session.abortTransaction();
          return { received: true };
        }
        const pendingReason = entity.status_reason || entity.description || 'Payment is pending processing';
        const update: Record<string, any> = { status: 'pending', pendingReason };
        await Payment.findByIdAndUpdate(payment._id, { $set: update }, { session });

        const user = await User.findById(payment.user).select('email name').session(session).lean();

        await this.sendPaymentNotification(
          [payment.user.toString()],
          'Payment Pending',
          'Your payment is currently pending. We will update you automatically once it is confirmed.',
          'payment'
        );

        const adminUsers = await User.find({ role: ROLES.ADMIN }).select('_id').session(session).lean();
        await this.sendPaymentNotification(
          adminUsers.map((a: any) => a._id.toString()),
          'Payment Pending - Action Required',
          `Payment of ₹${(payment.amount / 100).toFixed(2)} for order ${orderId} is pending. Reason: ${pendingReason}`,
          'payment'
        );

        await AuditLog.create([{
          user: payment.user,
          action: 'payment_pending',
          resource: 'Payment',
          resourceId: payment._id.toString(),
          details: { orderId, pendingReason, eventId },
        }], { session });

        await session.commitTransaction();
        logger.info('payment.pending processed', { orderId, paymentId: payment._id, eventId, pendingReason });
        return { received: true, processed: true };
      } catch (error: any) {
        await session.abortTransaction();
        if (error?.code === 11000) return { received: true, duplicate: true };
        logger.error('payment.pending failed', { eventId, error: error.message });
        throw error;
      } finally {
        session.endSession();
      }
    }

    if (event === 'payment.failed') {
      if (!orderId && !rzpPaymentId) {
        logger.warn('payment.failed: missing order_id and payment_id', { eventId });
        return { received: true };
      }
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        if (!(await recordEvent(session, 'failed'))) {
          await session.abortTransaction();
          return { received: true, duplicate: true };
        }
        const query = orderId ? { razorpayOrderId: orderId } : { razorpayPaymentId: rzpPaymentId };
        const payment = await Payment.findOne(query).session(session);
        if (!payment) {
          logger.warn('payment.failed: payment not found', { orderId, rzpPaymentId, eventId });
          await session.abortTransaction();
          return { received: true };
        }
        const acqData = entity.acquirer_data || {};
        const cardData = entity.card || {};
        const failureDetails: Record<string, any> = {
          failureCode: entity.failure_code || entity.error_code || '',
          failureReason: entity.failure_reason || entity.error_reason || '',
          failureDescription: entity.error_description || entity.failure_description || '',
          paymentMethod: entity.method || '',
          bank: entity.bank || '',
          wallet: entity.wallet || '',
          upiProvider: entity.vpa || acqData.vpa || '',
          cardLast4: cardData.last4 || '',
          cardNetwork: cardData.network || '',
          cardIssuer: cardData.issuer || '',
          failedAt: new Date(),
        };
        await Payment.findByIdAndUpdate(payment._id, {
          $set: {
            status: 'failed',
            razorpayPaymentId: rzpPaymentId || payment.razorpayPaymentId,
            failureDetails,
          },
        }, { session });

        const student = await User.findById(payment.user).select('name email').session(session).lean();
        await this.sendPaymentNotification(
          [payment.user.toString()],
          'Payment Failed',
          'Your payment could not be completed. Please retry or use another payment method.',
          'payment',
          '/student/payments'
        );

        if (payment.type === 'course' && payment.course) {
          const course = await Course.findById(payment.course).populate('instructor', '_id name').session(session).lean();
          if (course && (course.instructor as any)?._id) {
            await this.sendPaymentNotification(
              [(course.instructor as any)._id.toString()],
              'Payment Failed - Course Purchase',
              `Payment failed for course "${course.title}" by student ${(student as any)?.name || 'Unknown'}.`,
              'payment'
            );
          }
        } else if (payment.type === 'bundle' && payment.bundle) {
          const bundle = await Bundle.findById(payment.bundle).session(session).lean();
          if (bundle) {
            const courses = await Course.find({ _id: { $in: bundle.courses as any } })
              .populate('instructor', '_id name').session(session).lean();
            const instructorIds = new Set(courses.map((c: any) => c.instructor?._id?.toString()).filter(Boolean));
            await this.sendPaymentNotification(
              [...instructorIds],
              'Payment Failed - Bundle Purchase',
              `Payment failed for bundle "${bundle.title}" by student ${(student as any)?.name || 'Unknown'}.`,
              'payment'
            );
          }
        }

        const adminUsers = await User.find({ role: ROLES.ADMIN }).select('_id').session(session).lean();
        await this.sendPaymentNotification(
          adminUsers.map((a: any) => a._id.toString()),
          'Payment Failed - Alert',
          `A payment of ₹${(payment.amount / 100).toFixed(2)} has failed. Order: ${orderId}. Reason: ${failureDetails.failureReason || 'Unknown'}`,
          'payment'
        );

        await AuditLog.create([{
          user: payment.user,
          action: 'payment_failed',
          resource: 'Payment',
          resourceId: payment._id.toString(),
          details: { orderId, eventId, failureDetails },
        }], { session });

        await session.commitTransaction();
        logger.info('payment.failed processed', {
          orderId, paymentId: payment._id, eventId,
          failureCode: failureDetails.failureCode,
          failureReason: failureDetails.failureReason,
        });
        return { received: true, processed: true };
      } catch (error: any) {
        await session.abortTransaction();
        if (error?.code === 11000) return { received: true, duplicate: true };
        logger.error('payment.failed failed', { eventId, error: error.message });
        throw error;
      } finally {
        session.endSession();
      }
    }

    if (event === 'order.paid' || event === 'subscription.charged') {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        if (!(await recordEvent(session))) {
          await session.abortTransaction();
          return { received: true, duplicate: true };
        }
        await session.commitTransaction();
        logger.info('Non-critical webhook recorded', { eventId, event });
        return { received: true };
      } catch (error: any) {
        await session.abortTransaction();
        if (error?.code === 11000) return { received: true, duplicate: true };
        logger.error('Webhook recording failed', { eventId, event, error: error.message });
        throw error;
      } finally {
        session.endSession();
      }
    }

    if (event === 'payment.refunded') {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        if (!(await recordEvent(session))) {
          await session.abortTransaction();
          return { received: true, duplicate: true };
        }
        if (orderId) {
          await Payment.findOneAndUpdate(
            { razorpayOrderId: orderId, status: 'success' },
            { $set: { status: 'refunded' } },
            { session }
          );
        }
        await session.commitTransaction();
        logger.info('Refund webhook processed', { orderId, eventId });
        return { received: true, processed: true };
      } catch (error: any) {
        await session.abortTransaction();
        if (error?.code === 11000) return { received: true, duplicate: true };
        logger.error('Refund webhook failed', { eventId, error: error.message });
        throw error;
      } finally {
        session.endSession();
      }
    }

    logger.info('Unexpected webhook event type', { event, eventId });
    return { received: true };
  }

  // ─── Retry Failed Payment ──────────────────────────────
  async retryPayment(userId: string, paymentId: string) {
    const payment = await Payment.findOne({ _id: paymentId, user: userId });
    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.status !== 'failed') throw ApiError.badRequest('Only failed payments can be retried');

    const razorpay = await this.getRazorpay();

    const options = {
      amount: payment.amount * 100,
      currency: payment.currency || 'INR',
      receipt: `retry_${payment._id}_${Date.now()}`,
    };
    const newOrder = await razorpay.orders.create(options);

    payment.razorpayOrderId = newOrder.id;
    payment.status = 'pending';
    payment.failureDetails = undefined;
    payment.pendingReason = 'Retry initiated';
    await payment.save();

    logger.info('Payment retry order created', { paymentId: payment._id, newOrderId: newOrder.id });

    return {
      orderId: newOrder.id,
      amount: newOrder.amount,
      currency: newOrder.currency,
      key: RAZORPAY_KEY_ID,
      paymentId: payment._id,
    };
  }

  // ─── Payouts ──────────────────────────────────────────────
  async getInstructorPayouts(instructorId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [payouts, total, totals] = await Promise.all([
      Payout.find({ instructor: instructorId })
        .populate('sourcePayment', 'amount createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payout.countDocuments({ instructor: instructorId }),
      Payout.aggregate([
        { $match: { instructor: instructorId as any } },
        {
          $group: {
            _id: null,
            totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } },
            totalPending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
            totalOverall: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const summary = totals[0] || { totalPaid: 0, totalPending: 0, totalOverall: 0 };

    return {
      payouts,
      summary,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllPayouts(page = 1, limit = 20, status?: string) {
    const filter: any = {};
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [payouts, total, totals] = await Promise.all([
      Payout.find(filter)
        .populate('instructor', 'name email avatar')
        .populate('sourcePayment', 'amount type createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payout.countDocuments(filter),
      Payout.aggregate([
        { $match: status ? { status } as any : {} },
        {
          $group: {
            _id: null,
            totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } },
            totalPending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
            totalProcessing: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, '$amount', 0] } },
            totalFailed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, '$amount', 0] } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const summary = totals[0] || { totalPaid: 0, totalPending: 0, totalProcessing: 0, totalFailed: 0, count: 0 };

    return { payouts, summary, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async processPayout(payoutId: string) {
    const payout = await Payout.findById(payoutId).populate('instructor');
    if (!payout) throw ApiError.notFound('Payout not found');
    if (payout.status !== 'pending') throw ApiError.badRequest('Payout is not in pending status');

    payout.status = 'processing';
    await payout.save();

    try {
      const instructor = payout.instructor as any;
      const razorpay = await this.getRazorpay();

      const rzpPayout = await razorpay.payouts.create({
        account_number: RAZORPAY_KEY_ID,
        fund_account: {
          account_type: 'bank_account',
          bank_account: {
            name: instructor.name,
            account_number: instructor.bankAccountNumber || '00000000000',
            ifsc: instructor.ifscCode || 'SBIN0000000',
          },
          contact: {
            name: instructor.name,
            email: instructor.email,
          },
        },
        amount: payout.amount * 100,
        currency: 'INR',
        mode: 'IMPS',
        purpose: 'payout',
        queue_if_low_balance: true,
      });

      return withTransaction(async (session) => {
        const updatedPayout = await Payout.findByIdAndUpdate(
          payoutId,
          {
            $set: {
              razorpayPayoutId: rzpPayout.id,
              utr: rzpPayout.utr || '',
              status: 'completed',
              completedDate: new Date(),
            },
          },
          { new: true, session }
        );

        const wallet = await this.getOrCreateWallet();
        await PlatformWallet.findByIdAndUpdate(
          wallet._id,
          {
            $inc: {
              totalPayoutsMade: payout.amount,
              pendingPayouts: -payout.amount,
              currentBalance: -payout.amount,
            },
            $set: { lastUpdated: new Date() },
          },
          { session }
        );

        return updatedPayout;
      });
    } catch (error: any) {
      await Payout.findByIdAndUpdate(payoutId, {
        status: 'failed',
        notes: error.message || 'Payout processing failed',
      });
      throw ApiError.internal(`Payout failed: ${error.message}`);
    }
  }

  async processAllPendingPayouts() {
    const pendingPayouts = await Payout.find({ status: 'pending' });
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const payout of pendingPayouts) {
      try {
        await this.processPayout(payout._id.toString());
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Payout ${payout._id}: ${error.message}`);
      }
    }

    return results;
  }

  // ─── Commission Settings ─────────────────────────────────
  async getCommissionSettings() {
    const [commissionPercent, wallet] = await Promise.all([
      platformSettingsService.getCommissionPercentage(),
      this.getOrCreateWallet(),
    ]);
    return {
      commissionPercent,
      platformCommission: wallet.totalCommissionCollected,
      totalRevenue: wallet.totalRevenue,
      totalPayoutsMade: wallet.totalPayoutsMade,
      currentBalance: wallet.currentBalance,
      pendingPayouts: wallet.pendingPayouts,
    };
  }

  // ─── Admin Wallet Management ─────────────────────────────
  async getWalletTransactions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find({ status: 'success' })
        .populate('user', 'name email')
        .populate('course', 'title')
        .populate('bundle', 'title')
        .populate('subscription', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments({ status: 'success' }),
    ]);

    return { payments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Refund Processing (Synchronous, Razorpay-first, Transactional) ─
  async processRefundPayment(
    paymentId: string,
    refundAmount: number,
    reason: string,
    refundType: 'full' | 'partial',
    adminId: string,
    adminNote?: string
  ) {
    const payment = await Payment.findById(paymentId).populate('course', 'title instructor').populate('bundle', 'title courses');
    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.status !== 'success' && payment.status !== 'refunded') throw ApiError.badRequest('Only successful payments can be refunded');
    if ((payment.status as string) === 'refunded') throw ApiError.badRequest('Payment has already been refunded');
    if (!payment.razorpayPaymentId) throw ApiError.badRequest('Payment has no Razorpay payment ID');

    if (refundAmount <= 0 || refundAmount > payment.amount) {
      throw ApiError.badRequest(`Refund amount must be between 1 and ${payment.amount}`);
    }

    const existingRefund = await Refund.findOne({ payment: paymentId, status: { $in: ['pending', 'approved', 'processed'] } });
    if (existingRefund) throw ApiError.badRequest('A refund is already being processed for this payment');

    const refundDoc = await Refund.create({
      payment: paymentId,
      user: payment.user,
      course: payment.course?._id,
      bundle: payment.bundle?._id,
      amount: refundAmount,
      reason,
      refundType,
      status: 'pending',
      processedBy: adminId,
      adminNote,
    });

    let razorpayResponse: any;
    try {
      const razorpay: any = await this.getRazorpay();
      razorpayResponse = await razorpay.payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(refundAmount * 100),
        notes: { reason, adminId, refundType, refundId: refundDoc._id.toString() },
      });
    } catch (error: any) {
      logger.error('Razorpay refund API call failed', { paymentId, refundId: refundDoc._id, error: error.message });
      await Refund.findByIdAndUpdate(refundDoc._id, {
        status: 'rejected',
        adminNote: adminNote ? `${adminNote} | Gateway error: ${error.message}` : `Gateway error: ${error.message}`,
      });
      throw ApiError.internal(`Refund failed at payment gateway: ${error.message}`);
    }

    const isFullRefund = refundType === 'full' || refundAmount >= payment.amount;

    await withTransaction(async (session) => {
      await Refund.findByIdAndUpdate(refundDoc._id, {
        status: 'processed',
        processedAt: new Date(),
        razorpayRefundId: razorpayResponse.id,
        razorpayRefundStatus: razorpayResponse.status,
        razorpayRefundSpeed: razorpayResponse.speed || razorpayResponse.speed_processed,
        gatewayResponse: {
          id: razorpayResponse.id,
          status: razorpayResponse.status,
          amount: razorpayResponse.amount,
          speed: razorpayResponse.speed_processed || razorpayResponse.speed,
          created_at: razorpayResponse.created_at,
        },
      }, { session });

      const paymentUpdate: Record<string, any> = { refundedAt: new Date() };
      if (isFullRefund) paymentUpdate.status = 'refunded';
      await Payment.findByIdAndUpdate(paymentId, { $set: paymentUpdate }, { session });

      if (payment.course) {
        await Enrollment.deleteOne({ user: payment.user, course: payment.course._id }, { session });
        await Course.findByIdAndUpdate(payment.course._id, { $inc: { totalEnrollments: -1 } }, { session });
      } else if (payment.bundle) {
        const bundleDoc = payment.bundle as any;
        const courseIds = bundleDoc.courses || [];
        await Enrollment.deleteMany({ user: payment.user, course: { $in: courseIds } }, { session });
        await Bundle.findByIdAndUpdate(bundleDoc._id, { $inc: { totalEnrollments: -1 } }, { session });
        await Course.updateMany(
          { _id: { $in: courseIds } },
          { $inc: { totalEnrollments: -1 } },
          { session }
        );
      } else if (payment.subscription) {
        await SubscriptionEnrollment.deleteOne({ user: payment.user, subscription: payment.subscription }, { session });
        await Subscription.findByIdAndUpdate(payment.subscription, { $inc: { totalSubscribers: -1 } }, { session });
      }

      if (payment.walletCredited) {
        const wallet = await PlatformWallet.findOne().session(session);
        if (wallet) {
          const reversalAmount = isFullRefund ? payment.amount : refundAmount;
          const commissionRatio = payment.amount > 0 ? reversalAmount / payment.amount : 0;
          const commissionReversal = Math.round((payment.totalCommissionAmount || 0) * commissionRatio);
          const instructorReversal = Math.round((payment.totalInstructorShare || 0) * commissionRatio);

          await PlatformWallet.findByIdAndUpdate(wallet._id, {
            $inc: {
              currentBalance: -reversalAmount,
              totalRevenue: -reversalAmount,
              totalCommissionCollected: -commissionReversal,
            },
            $set: { lastUpdated: new Date() },
          }, { session });

          if (instructorReversal > 0) {
            await Payout.updateMany(
              { sourcePayment: paymentId, status: 'pending' },
              { status: 'cancelled' },
              { session }
            );
            await PlatformWallet.findByIdAndUpdate(wallet._id, {
              $inc: { pendingPayouts: -instructorReversal },
            }, { session });
          }
        }
      }

      await this.sendPaymentNotification(
        [payment.user.toString()],
        'Refund Processed',
        `Your refund of ₹${refundAmount.toFixed(2)} has been processed successfully. ${isFullRefund ? 'The full amount has been refunded.' : ''}`,
        'payment',
        '/student/payments'
      );

      if (payment.course) {
        const courseDoc = payment.course as any;
        if (courseDoc.instructor) {
          await this.sendPaymentNotification(
            [courseDoc.instructor.toString()],
            'Refund Issued - Course Purchase',
            `A refund of ₹${refundAmount.toFixed(2)} has been processed for course "${courseDoc.title}".`,
            'payment'
          );
        }
      } else if (payment.bundle) {
        const instructorIds = [...new Set(
          (payment.commissionSplits || []).map((s: any) => s.instructor?.toString()).filter(Boolean)
        )] as string[];
        if (instructorIds.length > 0) {
          await this.sendPaymentNotification(
            instructorIds,
            'Refund Issued - Bundle Purchase',
            `A refund of ₹${refundAmount.toFixed(2)} has been processed for a bundle purchase.`,
            'payment'
          );
        }
      }

      const adminUsers = await User.find({ role: ROLES.ADMIN }).select('_id').session(session).lean();
      const adminIds = adminUsers.map((a: any) => a._id.toString()).filter((id) => id !== adminId);
      if (adminIds.length > 0) {
        await this.sendPaymentNotification(
          adminIds,
          'Refund Completed',
          `A refund of ₹${refundAmount.toFixed(2)} has been processed. Payment: ${paymentId}. Reason: ${reason}`,
          'payment'
        );
      }

      await AuditLog.create([{
        user: adminId as any,
        action: 'refund_processed',
        resource: 'Payment',
        resourceId: paymentId,
        details: {
          refundId: refundDoc._id,
          refundAmount,
          refundType,
          reason,
          paymentAmount: payment.amount,
          razorpayRefundId: razorpayResponse.id,
          isFullRefund,
        },
      }], { session });
    });

    logger.info('Refund processed successfully', {
      paymentId,
      refundId: refundDoc._id,
      amount: refundAmount,
      razorpayRefundId: razorpayResponse.id,
      isFullRefund,
    });

    return {
      success: true,
      refundId: refundDoc._id,
      razorpayRefundId: razorpayResponse.id,
      amount: refundAmount,
      isFullRefund,
      status: 'processed',
    };
  }
}

export const paymentService = new PaymentService();
