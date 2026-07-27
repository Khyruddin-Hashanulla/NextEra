import crypto from 'crypto';
import { Course } from '../models/course.model';
import { Bundle } from '../models/bundle.model';
import { Enrollment } from '../models/enrollment.model';
import { Payment } from '../models/payment.model';
import { PlatformWallet } from '../models/platformWallet.model';
import { Payout } from '../models/payout.model';
import { Subscription } from '../models/subscription.model';
import { SubscriptionEnrollment } from '../models/subscriptionEnrollment.model';
import { Coupon } from '../models/coupon.model';
import { User } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { ROLES } from '../constants/roles';
import { logger } from '../utils/logger';

const RAZORPAY_KEY_ID = env.razorpayKeyId;
const RAZORPAY_KEY_SECRET = env.razorpayKeySecret;
const DEFAULT_COMMISSION_PERCENT = 25;

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
  calculateCommission(amount: number, commissionPercent: number = DEFAULT_COMMISSION_PERCENT) {
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
  async creditWallet(paymentId: string) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.walletCredited) return;

    const wallet = await this.getOrCreateWallet();
    wallet.totalRevenue += payment.amount;
    wallet.totalCommissionCollected += payment.totalCommissionAmount;
    wallet.currentBalance += payment.amount;
    wallet.lastUpdated = new Date();
    await wallet.save();

    payment.walletCredited = true;
    await payment.save();

    // Schedule payouts for instructors
    if (payment.commissionSplits.length > 0) {
      for (const split of payment.commissionSplits) {
        if (split.instructorShare > 0) {
          await Payout.create({
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
      wallet.pendingPayouts += payment.totalInstructorShare;
      await wallet.save();
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
      const enrollment = await Enrollment.create({ user: userId, course: courseId });
      await Course.findByIdAndUpdate(courseId, { $inc: { totalEnrollments: 1 } });
      return { free: true, enrollment };
    }

    const commission = this.calculateCommission(amount);
    const instructorId = course.instructor.toString();

    const razorpay = await this.getRazorpay();
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_course_${courseId}_${userId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    const payment = await Payment.create({
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
    });

    if (coupon) {
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
    }

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: RAZORPAY_KEY_ID,
      paymentId: payment._id,
    };
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

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'success';
    await payment.save();

    await Enrollment.create({ user: userId, course: payment.course });
    await Course.findByIdAndUpdate(payment.course, { $inc: { totalEnrollments: 1 } });

    await this.creditWallet(payment._id.toString());

    return { success: true, paymentId: payment._id };
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
      const enrollments = await Enrollment.insertMany(
        courseIds.map((cid: any) => ({ user: userId, course: cid }))
      );
      await Bundle.findByIdAndUpdate(bundleId, { $inc: { totalEnrollments: 1 } });
      await Course.updateMany({ _id: { $in: courseIds } }, { $inc: { totalEnrollments: 1 } });
      return { free: true, enrollments };
    }

    // Calculate commission splits per course in bundle
    const courses = bundle.courses as any[];
    const totalBundleAmount = amount;
    const commissionSplits: any[] = [];
    let totalCommissionAmount = 0;
    let totalInstructorShare = 0;

    if (courses.length > 0) {
      const originalTotal = courses.reduce((sum: number, c: any) => sum + c.price, 0);
      for (const course of courses) {
        const ratio = originalTotal > 0 ? course.price / originalTotal : 1 / courses.length;
        const courseAmount = Math.round(totalBundleAmount * ratio);
        const commission = this.calculateCommission(courseAmount);
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

    const payment = await Payment.create({
      user: userId,
      type: 'bundle',
      bundle: bundleId,
      razorpayOrderId: order.id,
      amount: totalBundleAmount,
      coupon: coupon?._id,
      discountAmount,
      status: 'pending',
      commissionPercent: DEFAULT_COMMISSION_PERCENT,
      commissionSplits,
      totalCommissionAmount,
      totalInstructorShare,
    });

    if (coupon) {
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
    }

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: RAZORPAY_KEY_ID,
      paymentId: payment._id,
    };
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

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'success';
    await payment.save();

    const bundle = await Bundle.findById(payment.bundle);
    if (!bundle) throw ApiError.notFound('Bundle not found');

    const enrollments = await Enrollment.insertMany(
      bundle.courses.map((cid) => ({ user: userId, course: cid }))
    );
    await Bundle.findByIdAndUpdate(payment.bundle, { $inc: { totalEnrollments: 1 } });
    await Course.updateMany(
      { _id: { $in: bundle.courses } },
      { $inc: { totalEnrollments: 1 } }
    );

    await this.creditWallet(payment._id.toString());

    return { success: true, paymentId: payment._id, enrollments };
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
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.durationDays);
      const subEnrollment = await SubscriptionEnrollment.create({
        user: userId,
        subscription: subscriptionId,
        razorpayOrderId: `free_${Date.now()}`,
        startDate,
        endDate,
        status: 'active',
      });
      await Subscription.findByIdAndUpdate(subscriptionId, { $inc: { totalSubscribers: 1 } });
      return { free: true, subscriptionEnrollment: subEnrollment };
    }

    const commission = this.calculateCommission(amount);

    const razorpay = await this.getRazorpay();
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_sub_${subscriptionId}_${userId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    const payment = await Payment.create({
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
    });

    if (coupon) {
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
    }

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: RAZORPAY_KEY_ID,
      paymentId: payment._id,
    };
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

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'success';
    await payment.save();

    const plan = await Subscription.findById(payment.subscription);
    if (!plan) throw ApiError.notFound('Subscription plan not found');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const subEnrollment = await SubscriptionEnrollment.create({
      user: userId,
      subscription: payment.subscription,
      razorpayOrderId,
      razorpayPaymentId,
      startDate,
      endDate,
      status: 'active',
    });
    await Subscription.findByIdAndUpdate(payment.subscription, { $inc: { totalSubscribers: 1 } });

    payment.subscriptionEnrollment = subEnrollment._id;
    await payment.save();

    await this.creditWallet(payment._id.toString());

    return { success: true, paymentId: payment._id, subscriptionEnrollment: subEnrollment };
  }

  // ─── Razorpay Webhook Handler ────────────────────────────
  async handleWebhook(event: string, payload: any, signature: string) {
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw ApiError.badRequest('Invalid webhook signature');
    }

    if (event === 'payment.captured') {
      const rzpPaymentId = payload.payload?.payment?.entity?.id;
      const orderId = payload.payload?.payment?.entity?.order_id;
      if (orderId) {
        const payment = await Payment.findOne({ razorpayOrderId: orderId });
        if (payment && payment.status === 'pending') {
          payment.razorpayPaymentId = rzpPaymentId;
          payment.status = 'success';
          await payment.save();

          if (payment.type === 'course' && payment.course) {
            await Enrollment.create({ user: payment.user, course: payment.course });
            await Course.findByIdAndUpdate(payment.course, { $inc: { totalEnrollments: 1 } });
          } else if (payment.type === 'bundle' && payment.bundle) {
            const bundle = await Bundle.findById(payment.bundle);
            if (bundle) {
              await Enrollment.insertMany(
                bundle.courses.map((cid) => ({ user: payment.user, course: cid }))
              );
              await Bundle.findByIdAndUpdate(payment.bundle, { $inc: { totalEnrollments: 1 } });
              await Course.updateMany(
                { _id: { $in: bundle.courses } },
                { $inc: { totalEnrollments: 1 } }
              );
            }
          } else if (payment.type === 'subscription' && payment.subscription) {
            const plan = await Subscription.findById(payment.subscription);
            if (plan) {
              const start = new Date();
              const end = new Date();
              end.setDate(end.getDate() + plan.durationDays);
              const subEnrollment = await SubscriptionEnrollment.create({
                user: payment.user,
                subscription: payment.subscription,
                razorpayOrderId: orderId,
                razorpayPaymentId: rzpPaymentId,
                startDate: start,
                endDate: end,
                status: 'active',
              });
              await Subscription.findByIdAndUpdate(payment.subscription, { $inc: { totalSubscribers: 1 } });
              payment.subscriptionEnrollment = subEnrollment._id;
              await payment.save();
            }
          }

          await this.creditWallet(payment._id.toString());
        }
      }
    }

    return { received: true };
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

      payout.razorpayPayoutId = rzpPayout.id;
      payout.utr = rzpPayout.utr || '';
      payout.status = 'completed';
      payout.completedDate = new Date();
      await payout.save();

      const wallet = await this.getOrCreateWallet();
      wallet.totalPayoutsMade += payout.amount;
      wallet.pendingPayouts -= payout.amount;
      wallet.currentBalance -= payout.amount;
      wallet.lastUpdated = new Date();
      await wallet.save();

      return payout;
    } catch (error: any) {
      payout.status = 'failed';
      payout.notes = error.message || 'Payout processing failed';
      await payout.save();
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
    const wallet = await this.getOrCreateWallet();
    return {
      commissionPercent: DEFAULT_COMMISSION_PERCENT,
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
}

export const paymentService = new PaymentService();
