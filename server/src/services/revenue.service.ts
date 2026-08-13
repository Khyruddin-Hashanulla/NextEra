import { Payment } from '../models/payment.model';
import { Payout } from '../models/payout.model';
import { PlatformWallet } from '../models/platformWallet.model';
import { InstructorSubscriptionPlan } from '../models/instructorSubscriptionPlan.model';
import type { IPlanEntitlements } from '../models/instructorSubscriptionPlan.model';
import { InstructorSubscription } from '../models/instructorSubscription.model';
import { Affiliate } from '../models/affiliate.model';
import { FeaturedPromotion } from '../models/featuredPromotion.model';
import { Course } from '../models/course.model';
import { LiveClass } from '../models/liveClass.model';
import { Coupon } from '../models/coupon.model';
import { ApiError } from '../utils/ApiError';
import { escapeRegex } from '../utils/escapeRegex';
import { cacheService } from '../cache/cache.service';
import { cacheKeys, CACHE_TTL } from '../cache/cacheKeys';
import { cacheManager } from '../cache/cacheManager';
import { paymentService } from './payment.service';
import { deriveEntitlements, entitlementService, deriveLegacyFeaturesFromEntitlements } from './entitlement.service';

/**
 * Merge an entitlements patch into the existing snapshot one level deep.
 * `IPlanEntitlements` is a two-level structure (top-level groups holding scalar
 * leaves), so a shallow merge would replace an entire edited group (e.g.
 * `courses`) and silently wipe its sibling fields. Deep-merging each group
 * preserves untouched sibling entitlements while applying single-field patches.
 */
function mergeEntitlements(
  base: Partial<IPlanEntitlements> | undefined,
  patch: Record<string, any>
): IPlanEntitlements {
  const source = (base || {}) as Record<string, any>;
  const merged: Record<string, any> = { ...source };
  for (const key of Object.keys(patch || {})) {
    const value = patch[key];
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      merged[key] &&
      typeof merged[key] === 'object' &&
      !Array.isArray(merged[key])
    ) {
      merged[key] = { ...merged[key], ...value };
    } else {
      merged[key] = value;
    }
  }
  return merged as IPlanEntitlements;
}

export class RevenueService {
  // ─── Platform Wallet ─────────────────────────────────────────
  async getPlatformWallet() {
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

  // ─── Revenue Dashboard (Admin) ───────────────────────────────
  async getRevenueDashboard() {
    return cacheService.remember(cacheKeys.revenueDashboard(), { ttl: CACHE_TTL.REVENUE_DASHBOARD }, async () => {
      const wallet = await this.getPlatformWallet();

      const [paymentResult, topInstructors, activePlans, activePromotions] = await Promise.all([
        Payment.aggregate([
          {
            $facet: {
              dailyRevenue: [
                { $match: { status: 'success', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
                {
                  $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 },
                  },
                },
                { $sort: { _id: 1 } },
              ],
              revenueBySource: [
                { $match: { status: 'success' } },
                {
                  $group: {
                    _id: '$type',
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 },
                    commission: { $sum: '$totalCommissionAmount' },
                  },
                },
              ],
              monthlyTrend: [
                { $match: { status: 'success' } },
                {
                  $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    amount: { $sum: '$amount' },
                    commission: { $sum: '$totalCommissionAmount' },
                    instructorShare: { $sum: '$totalInstructorShare' },
                  },
                },
                { $sort: { _id: 1 } },
                { $limit: 12 },
              ],
              instructorSubscriptionRevenue: [
                { $match: { status: 'success', type: 'instructor_subscription' } },
                { $group: { _id: null, amount: { $sum: '$amount' } } },
              ],
              featuredPromotionRevenue: [
                { $match: { status: 'success', type: 'featured_promotion' } },
                { $group: { _id: null, amount: { $sum: '$amount' } } },
              ],
            },
          },
        ]),
        Payout.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: '$instructor', totalPaid: { $sum: '$amount' } } },
          { $sort: { totalPaid: -1 } },
          { $limit: 10 },
          {
            $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'instructor' },
          },
          { $unwind: '$instructor' },
          { $project: { 'instructor.name': 1, 'instructor.email': 1, 'instructor.avatar': 1, totalPaid: 1 } },
        ]),
        InstructorSubscription.countDocuments({ status: { $in: ['ACTIVE', 'active'] } }),
        FeaturedPromotion.countDocuments({ status: 'active' }),
      ]);

      const paymentFacet = paymentResult?.[0] ?? {};

      return {
        wallet: {
          totalRevenue: wallet.totalRevenue,
          totalCommissionCollected: wallet.totalCommissionCollected,
          totalPayoutsMade: wallet.totalPayoutsMade,
          currentBalance: wallet.currentBalance,
          pendingPayouts: wallet.pendingPayouts,
        },
        dailyRevenue: paymentFacet.dailyRevenue ?? [],
        revenueBySource: paymentFacet.revenueBySource ?? [],
        monthlyTrend: paymentFacet.monthlyTrend ?? [],
        activeInstructorSubscriptions: activePlans,
        activePromotions,
        topInstructors,
        instructorSubscriptionRevenue: paymentFacet.instructorSubscriptionRevenue?.[0]?.amount || 0,
        featuredPromotionRevenue: paymentFacet.featuredPromotionRevenue?.[0]?.amount || 0,
      };
    });
  }

  // ─── Instructor Subscription Plan Management (Admin) ─────────
  async listInstructorSubscriptionPlans(): Promise<any[]> {
    const plans = await InstructorSubscriptionPlan.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
    // Structured entitlements are the source of truth: always expose freshly
    // derived legacy features so the admin editor/cards never show a stale
    // flat snapshot that diverges from what the permission stack enforces.
    return plans.map((plan) => this.normalizePlanFeatures({ ...plan, features: plan.features ?? {} }));
  }

  async createInstructorSubscriptionPlan(data: {
    name: string;
    type: string;
    price: number;
    durationDays: number;
    description: string;
    features: any;
    status: string;
    sortOrder: number;
    code?: string;
    discountPrice?: number;
    isDefaultForFree?: boolean;
    entitlements?: any;
  }) {
    const existing = await InstructorSubscriptionPlan.findOne({ name: data.name });
    if (existing) throw ApiError.conflict('A plan with this name already exists');
    if (data.code) {
      const codeExists = await InstructorSubscriptionPlan.findOne({ code: data.code.toUpperCase() });
      if (codeExists) throw ApiError.conflict('A plan with this code already exists', 'PLAN_ALREADY_EXISTS');
    }
    const entitlements = data.entitlements;
    const record = entitlements
      ? { ...data, entitlements, features: deriveLegacyFeaturesFromEntitlements(entitlements) }
      : data;
    return InstructorSubscriptionPlan.create(record);
  }

  async updateInstructorSubscriptionPlan(
    id: string,
    data: Partial<{
      name: string;
      type: string;
      price: number;
      durationDays: number;
      description: string;
      features: any;
      status: string;
      sortOrder: number;
      code?: string;
      discountPrice?: number;
      isDefaultForFree?: boolean;
      entitlements?: any;
    }>
  ) {
    const existing = await InstructorSubscriptionPlan.findById(id);
    if (!existing) throw ApiError.notFound('Plan not found');
    if (data.name && data.name !== existing.name) {
      const nameExists = await InstructorSubscriptionPlan.findOne({
        name: data.name,
        _id: { $ne: id },
      });
      if (nameExists) throw ApiError.conflict('A plan with this name already exists');
    }
    if (data.code) {
      const codeExists = await InstructorSubscriptionPlan.findOne({
        code: data.code.toUpperCase(),
        _id: { $ne: id },
      });
      if (codeExists) throw ApiError.conflict('A plan with this code already exists', 'PLAN_ALREADY_EXISTS');
    }
    // Structured entitlements are the source of truth: deep-merge the patch into
    // the existing snapshot, then re-derive the legacy flat features so both the
    // entitlement and legacy permission stacks stay aligned after any edit.
    const updateDoc = { ...data };
    if (data.entitlements) {
      const merged = mergeEntitlements(existing.entitlements || {}, data.entitlements);
      updateDoc.entitlements = merged;
      updateDoc.features = deriveLegacyFeaturesFromEntitlements(merged);
    }
    const plan = await InstructorSubscriptionPlan.findByIdAndUpdate(id, updateDoc, { new: true });
    return plan;
  }

  async deleteInstructorSubscriptionPlan(id: string) {
    const historical = await InstructorSubscription.countDocuments({ plan: id });
    if (historical > 0) {
      throw ApiError.badRequest('Cannot delete a plan with existing subscription history');
    }
    const plan = await InstructorSubscriptionPlan.findByIdAndDelete(id);
    if (!plan) throw ApiError.notFound('Plan not found');
    return plan;
  }

  // ─── Instructor Subscription (Self-Service) ──────────────────
  /**
   * Keep the legacy flat `features` on the read-path aligned with the structured
   * `entitlements` (the source of truth). Old clients gate on the flat object, so
   * any plan carrying entitlements must expose freshly derived features instead of
   * whatever snapshot the editor happened to persist. Legacy plans without
   * entitlements keep their own stored `features`.
   */
  private normalizePlanFeatures(plan: any): any {
    if (!plan) return plan;
    if (plan.entitlements) {
      return { ...plan, features: deriveLegacyFeaturesFromEntitlements(deriveEntitlements(plan)) };
    }
    return plan;
  }

  async getInstructorSubscription(instructorId: string): Promise<any> {
    const active = await InstructorSubscription.findOne({
      instructor: instructorId,
      status: { $in: ['active', 'ACTIVE'] },
    })
      .populate('plan')
      .sort({ createdAt: -1 })
      .lean();
    if (active) return { ...active, plan: this.normalizePlanFeatures(active.plan) };

    const latest = await InstructorSubscription.findOne({ instructor: instructorId })
      .populate('plan')
      .sort({ createdAt: -1 })
      .lean();

    if (latest) {
      const starterPlan = await InstructorSubscriptionPlan.findOne({
        $or: [{ code: 'STARTER' }, { type: 'free' }, { isDefaultForFree: true }],
        status: 'active',
      })
        .sort({ sortOrder: 1 })
        .lean();
      return {
        ...latest,
        plan: this.normalizePlanFeatures(latest.plan || starterPlan),
        status: 'expired',
      };
    }

    const starterPlan = await InstructorSubscriptionPlan.findOne({
      $or: [{ code: 'STARTER' }, { type: 'free' }, { isDefaultForFree: true }],
      status: 'active',
    })
      .sort({ sortOrder: 1 })
      .lean();
    return {
      instructor: instructorId,
      plan: this.normalizePlanFeatures(starterPlan) || {
        name: 'Starter',
        type: 'free',
        features: { freeCoursesLimit: 2, storageLimitMB: 500 },
      },
      status: 'none',
      startDate: null,
      endDate: null,
    };
  }

  /**
   * Stripped public plan list for the self-service upgrade/seats UI. Only active
   * plans are shown. Legacy flat `features` are merged so old clients keep working.
   */
  async listSubscribablePlans(): Promise<any[]> {
    const plans = await InstructorSubscriptionPlan.find({ status: 'active' }).sort({ sortOrder: 1 }).lean();
    return plans.map((plan) => ({
      ...plan,
      features: plan.features ?? {},
    }));
  }

  // ─── Admin provisioning ────────────────────────────────────────
  /**
   * Insert an ACTIVE subscription, falling back to the already-active record if a
   * concurrent grant/verify/webhook won the single-ACTIVE race (unique index).
   */
  private async createActiveSubSafely(doc: any, session?: any): Promise<any> {
    try {
      const [sub] = await InstructorSubscription.create([doc], { session });
      // Keep the admin plan card subscriber count aligned with live ACTIVE
      // subscriptions (decremented on cancel/expiry).
      if (doc.plan) {
        await InstructorSubscriptionPlan.findByIdAndUpdate(
          doc.plan,
          { $inc: { totalSubscribers: 1 } },
          { session }
        ).catch(() => undefined);
      }
      return sub;
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      return InstructorSubscription.findOne({
        instructor: doc.instructor,
        status: { $in: ['ACTIVE', 'active'] },
      }).session(session || null);
    }
  }

  /**
   * Assign the built-in default (Starter/free) entitlement to an instructor.
   * Used when an instructor profile is approved/appointed. Idempotent: an
   * existing ACTIVE subscription is left untouched.
   */
  async grantDefaultFreePlan(instructorId: string, session?: any) {
    const existing = await InstructorSubscription.findOne({
      instructor: instructorId,
      status: { $in: ['ACTIVE', 'active'] },
    }).session(session || null);
    if (existing) return existing;

    const plan = await InstructorSubscriptionPlan.findOne({ code: 'STARTER' }).session(session || null);
    if (!plan) {
      const dashboardPlan = await InstructorSubscriptionPlan.findOne({
        $or: [{ type: 'free' }, { isDefaultForFree: true }],
      }).session(session || null);
      if (!dashboardPlan) return null;
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + (dashboardPlan.durationDays || 365));
      return this.createActiveSubSafely(
        {
          instructor: instructorId,
          plan: dashboardPlan._id,
          planSnapshot: {
            code: dashboardPlan.code || undefined,
            name: dashboardPlan.name,
            type: dashboardPlan.type,
            price: dashboardPlan.price || 0,
            durationDays: dashboardPlan.durationDays || 365,
          },
          startDate: start,
          endDate: end,
          status: 'ACTIVE',
        },
        session
      );
    }

    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + (plan.durationDays || 365));
    return this.createActiveSubSafely(
      {
        instructor: instructorId,
        plan: plan._id,
        planSnapshot: {
          code: plan.code,
          name: plan.name,
          type: plan.type,
          price: plan.price ?? 0,
          durationDays: plan.durationDays || 365,
        },
        startDate: start,
        endDate: end,
        status: 'ACTIVE',
      },
      session
    );
  }

  /**
   * Self-service order placement for an instructor plan. Free plans complete
   * immediately; paid plans return a Razorpay order ready for checkout. Existing
   * ACTIVE subscriptions are rejected (cancel first, or upgrade on expiry).
   */
  async initiateOrRenew(instructorId: string, planId: string) {
    const plan = await InstructorSubscriptionPlan.findById(planId);
    if (!plan) throw ApiError.notFound('Plan not found', 'PLAN_NOT_FOUND');
    if (plan.status !== 'active') throw ApiError.badRequest('This plan is not available', 'PLAN_INACTIVE');

    const existing = await InstructorSubscription.findOne({
      instructor: instructorId,
      status: { $in: ['ACTIVE', 'active'] },
    });

    // Block re-subscribing to the exact same plan (no-op upgrade).
    if (existing && existing.plan.toString() === plan._id.toString()) {
      throw ApiError.conflict('You are already on this plan', 'ALREADY_ON_PLAN');
    }

    // Upgrade path: instructor has a different active plan — proceed with payment
    // or immediate activation. The old subscription is cancelled atomically during
    // payment verification (or immediately for free-plan switches).

    if (plan.type === 'free') {
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + (plan.durationDays || 365));

      // Cancel old subscription if present.
      if (existing) {
        existing.status = 'CANCELLED';
        existing.cancelledAt = new Date();
        existing.cancellationReason = 'Upgraded to new plan';
        await existing.save();
        if (existing.plan) {
          await InstructorSubscriptionPlan.findByIdAndUpdate(existing.plan, { $inc: { totalSubscribers: -1 } }).catch(
            () => undefined
          );
        }
      }

      const subscription = await this.createActiveSubSafely({
        instructor: instructorId,
        plan: plan._id,
        planSnapshot: {
          code: plan.code || undefined,
          name: plan.name,
          type: plan.type,
          price: plan.price ?? 0,
          durationDays: plan.durationDays || 365,
        },
        startDate: start,
        endDate: end,
        status: 'ACTIVE',
      });
      if (subscription) {
        await cacheManager.invalidateInstructorCache(instructorId);
        await cacheManager.invalidateRevenueCache();
      }
      return { completed: true, subscription };
    }

    // Paid plan — create Razorpay order.  The old subscription is NOT cancelled
    // here; it will be cancelled atomically inside verifyInstructorSubscription
    // after payment succeeds, so the instructor keeps access until payment clears.
    const result = await paymentService.initiateInstructorSubscriptionPayment(instructorId, plan._id.toString());
    return {
      completed: false,
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      key: result.key,
      paymentId: result.paymentId,
      plan: {
        _id: plan._id,
        code: plan.code,
        name: plan.name,
        price: plan.price,
        durationDays: plan.durationDays,
      },
    };
  }

  /**
   * Verify a paid instructor-plan payment and activate the subscription.
   * The Razorpay signature has already been validated inside the payment service.
   * Activation always goes through the signature-verified razorpay detail trio;
   * the legacy Mongo Payment-id activation path was removed because it could not
   * prove ownership/type/plan-binding and allowed any successful payment to grant
   * a plan (privilege escalation).
   */
  async verifyInstructorSubscriptionPayment(
    instructorId: string,
    planId: string,
    reference: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }
  ) {
    const plan = await InstructorSubscriptionPlan.findById(planId);
    if (!plan) throw ApiError.notFound('Plan not found', 'PLAN_NOT_FOUND');

    await paymentService.verifyInstructorSubscriptionPayment(
      instructorId,
      reference.razorpayOrderId,
      reference.razorpayPaymentId,
      reference.razorpaySignature,
      planId
    );

    await cacheManager.invalidateRevenueCache();
    await cacheManager.invalidateInstructorCache(instructorId);
    return { success: true };
  }

  async cancelInstructorSubscription(instructorId: string) {
    const subscription = await InstructorSubscription.findOne({
      instructor: instructorId,
      status: { $in: ['ACTIVE', 'active'] },
    });
    if (!subscription) throw ApiError.notFound('No active subscription found');
    const wasActive = subscription.status === 'ACTIVE' || String(subscription.status).toLowerCase() === 'active';
    subscription.status = 'CANCELLED';
    subscription.cancelledAt = new Date();
    await subscription.save();
    if (wasActive && subscription.plan) {
      await InstructorSubscriptionPlan.findByIdAndUpdate(subscription.plan, { $inc: { totalSubscribers: -1 } }).catch(
        () => undefined
      );
    }
    await cacheManager.invalidateRevenueCache();
    await cacheManager.invalidateInstructorCache(instructorId);
    return subscription;
  }

  /**
   * Full entitlements + usage payload for the instructor subscription UI.
   */
  async getSubscriptionOverview(instructorId: string) {
    const sub = await InstructorSubscription.findOne({
      instructor: instructorId,
      status: { $in: ['ACTIVE', 'active'] },
    })
      .populate('plan')
      .sort({ createdAt: -1 })
      .lean();

    let plan = sub?.plan && (sub.plan as any)?.code ? (sub.plan as any) : null;
    let status: string;
    if (sub) status = sub.status === 'EXPIRED' ? 'expired' : 'active';
    else {
      // A cancelled (or expired) subscription still exists in history. Surface it
      // so the UI shows "cancelled" instead of pretending there is no plan.
      const latest = await InstructorSubscription.findOne({ instructor: instructorId })
        .populate('plan')
        .sort({ createdAt: -1 })
        .lean();
      plan = latest?.plan && (latest.plan as any)?.code ? (latest.plan as any) : plan;
      status = latest ? (latest.status === 'EXPIRED' ? 'expired' : 'cancelled') : 'none';
    }

    const entitlements = deriveEntitlements(plan || {});

    const [published, liveClasses, coupons] = await Promise.all([
      Course.countDocuments({ instructor: instructorId, status: 'published' }),
      LiveClass.countDocuments({
        instructor: instructorId,
        startTime: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      }),
      Coupon.countDocuments({ createdBy: instructorId, isActive: true }),
    ]);

    return {
      subscription: sub || null,
      plan: plan || null,
      status,
      entitlements,
      planCode: plan?.code || null,
      usage: {
        publishedCourses: published,
        maxPublishedCourses: entitlements.courses.maxPublishedCourses,
        liveClassesThisMonth: liveClasses,
        maxLiveClasses: entitlements.liveClasses.monthlyLimit,
        activeCoupons: coupons,
        maxActiveCoupons: entitlements.marketing.maxActiveCoupons,
        maxStudents: entitlements.students.maxStudents,
        storageLimitGB: entitlements.storage.videoGB,
        canCreatePaid: entitlements.courses.canCreatePaid,
      },
    };
  }

  // ─── Entitlements (Instructor UI) ─────────────────────────────
  async getEntitlementsForInstructor(instructorId: string): Promise<any> {
    const view = await entitlementService.getEntitlementView(instructorId);
    return view;
  }

  // ─── Instructor Subscription Stats (Admin) ───────────────────
  async getInstructorSubscriptionStats() {
    return cacheService.remember(
      cacheKeys.instructorSubscriptionStats(),
      { ttl: CACHE_TTL.INSTRUCTOR_SUBSCRIPTION_STATS },
      async () => {
        const [subscriptionResult, revenue] = await Promise.all([
          InstructorSubscription.aggregate([
            {
              $facet: {
                total: [{ $count: 'count' }],
                active: [{ $match: { status: { $in: ['ACTIVE', 'active'] } } }, { $count: 'count' }],
                byPlan: [
                  { $group: { _id: '$plan', count: { $sum: 1 } } },
                  {
                    $lookup: {
                      from: 'instructorsubscriptionplans',
                      localField: '_id',
                      foreignField: '_id',
                      as: 'plan',
                    },
                  },
                  { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
                  { $project: { 'plan.name': 1, count: 1 } },
                ],
              },
            },
          ]),
          Payment.aggregate([
            { $match: { status: 'success', type: 'instructor_subscription' } },
            { $group: { _id: null, amount: { $sum: '$amount' } } },
          ]),
        ]);

        return {
          total: subscriptionResult?.[0]?.total?.[0]?.count ?? 0,
          active: subscriptionResult?.[0]?.active?.[0]?.count ?? 0,
          byPlan: subscriptionResult?.[0]?.byPlan ?? [],
          revenue: revenue[0]?.amount || 0,
        };
      }
    );
  }

  // ─── Affiliate Management ────────────────────────────────────
  async listAffiliates(page = 1, limit = 20, search?: string) {
    const filter: any = {};
    if (search) {
      filter.$or = [{ code: { $regex: escapeRegex(search), $options: 'i' } }];
    }
    const skip = (page - 1) * limit;
    const [affiliates, total] = await Promise.all([
      Affiliate.find(filter)
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Affiliate.countDocuments(filter),
    ]);
    return { affiliates, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async createAffiliate(
    userId: string,
    data: {
      code: string;
      commissionPercent?: number;
      payoutMethod?: string;
      payoutDetails?: any;
    }
  ) {
    const existingUser = await Affiliate.findOne({ user: userId });
    if (existingUser) throw ApiError.conflict('User is already an affiliate');

    const existingCode = await Affiliate.findOne({ code: data.code.toUpperCase() });
    if (existingCode) throw ApiError.conflict('Affiliate code already in use');

    return Affiliate.create({
      user: userId,
      code: data.code.toUpperCase(),
      commissionPercent: data.commissionPercent || 10,
      payoutMethod: data.payoutMethod || 'bank',
      payoutDetails: data.payoutDetails || {},
    });
  }

  async updateAffiliate(
    id: string,
    data: Partial<{
      commissionPercent: number;
      status: string;
      payoutMethod: string;
      payoutDetails: any;
    }>
  ) {
    const affiliate = await Affiliate.findByIdAndUpdate(id, data, { new: true }).populate('user', 'name email avatar');
    if (!affiliate) throw ApiError.notFound('Affiliate not found');
    return affiliate;
  }

  async deleteAffiliate(id: string) {
    const affiliate = await Affiliate.findByIdAndDelete(id);
    if (!affiliate) throw ApiError.notFound('Affiliate not found');
    return affiliate;
  }

  async getAffiliateByCode(code: string) {
    const affiliate = await Affiliate.findOne({ code: code.toUpperCase(), status: 'active' }).populate('user', 'name');
    if (!affiliate) throw ApiError.notFound('Invalid affiliate code');
    return affiliate;
  }

  async trackAffiliateClick(code: string) {
    const affiliate = await Affiliate.findOne({ code: code.toUpperCase(), status: 'active' });
    if (affiliate) {
      await Affiliate.findByIdAndUpdate(affiliate._id, { $inc: { totalClicks: 1 } });
    }
  }

  async trackAffiliateConversion(code: string, saleAmount: number) {
    const affiliate = await Affiliate.findOne({ code: code.toUpperCase(), status: 'active' });
    if (!affiliate) return null;

    const commissionAmount = Math.round((saleAmount * affiliate.commissionPercent) / 100);

    await Affiliate.findByIdAndUpdate(affiliate._id, {
      $inc: { totalConversions: 1, totalEarnings: commissionAmount },
    });

    return { affiliateId: affiliate._id, commissionAmount };
  }

  async getAffiliateStats() {
    const [total, active, stats] = await Promise.all([
      Affiliate.countDocuments(),
      Affiliate.countDocuments({ status: 'active' }),
      Affiliate.aggregate([
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$totalEarnings' },
            totalClicks: { $sum: '$totalClicks' },
            totalConversions: { $sum: '$totalConversions' },
          },
        },
      ]),
    ]);

    const s = stats[0] || { totalEarnings: 0, totalClicks: 0, totalConversions: 0 };

    return {
      total,
      active,
      totalEarnings: s.totalEarnings,
      totalClicks: s.totalClicks,
      totalConversions: s.totalConversions,
    };
  }

  // ─── Featured Promotions Management ─────────────────────────
  async listFeaturedPromotions(page = 1, limit = 20, status?: string) {
    const filter: any = {};
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [promotions, total] = await Promise.all([
      FeaturedPromotion.find(filter)
        .populate('course', 'title thumbnail')
        .populate('instructor', 'name email avatar')
        .populate('payment', 'amount')
        .sort({ position: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FeaturedPromotion.countDocuments(filter),
    ]);
    return { promotions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async createFeaturedPromotion(data: {
    type: string;
    course?: string;
    instructor?: string;
    startDate: string;
    endDate: string;
    price: number;
    position: number;
    notes?: string;
  }) {
    return FeaturedPromotion.create({
      type: data.type,
      course: data.course,
      instructor: data.instructor,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      price: data.price,
      position: data.position || 0,
      notes: data.notes,
    });
  }

  async updateFeaturedPromotion(
    id: string,
    data: Partial<{
      type: string;
      course: string;
      instructor: string;
      startDate: string;
      endDate: string;
      price: number;
      status: string;
      position: number;
      notes: string;
    }>
  ) {
    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    const promotion = await FeaturedPromotion.findByIdAndUpdate(id, updateData, { new: true })
      .populate('course', 'title thumbnail')
      .populate('instructor', 'name email avatar');
    if (!promotion) throw ApiError.notFound('Promotion not found');
    return promotion;
  }

  async deleteFeaturedPromotion(id: string) {
    const promotion = await FeaturedPromotion.findByIdAndDelete(id);
    if (!promotion) throw ApiError.notFound('Promotion not found');
    return promotion;
  }

  async getFeaturedPromotionStats() {
    const [total, active, expired, revenue] = await Promise.all([
      FeaturedPromotion.countDocuments(),
      FeaturedPromotion.countDocuments({ status: 'active' }),
      FeaturedPromotion.countDocuments({ status: 'expired' }),
      Payment.aggregate([
        { $match: { status: 'success', type: 'featured_promotion' } },
        { $group: { _id: null, amount: { $sum: '$amount' } } },
      ]),
    ]);

    return { total, active, expired, revenue: revenue[0]?.amount || 0 };
  }

  async expirePastPromotions() {
    const result = await FeaturedPromotion.updateMany(
      { endDate: { $lt: new Date() }, status: 'active' },
      { status: 'expired' }
    );
    return { modifiedCount: result.modifiedCount };
  }

  // ─── Instructor-Specific Revenue ────────────────────────────
  async getInstructorRevenueDetail(instructorId: string): Promise<any> {
    return cacheService.remember(
      cacheKeys.instructorRevenueDetail(instructorId),
      { ttl: CACHE_TTL.REVENUE_DASHBOARD },
      async () => {
        const [payouts, payoutStats, courseEarnings, subscriptionInfo] = await Promise.all([
          Payout.find({ instructor: instructorId, status: 'completed' }).sort({ createdAt: -1 }).limit(50).lean(),
          Payout.aggregate([
            {
              $facet: {
                totalEarned: [
                  { $match: { instructor: instructorId as any, status: 'completed' } },
                  { $group: { _id: null, amount: { $sum: '$amount' } } },
                ],
                pending: [
                  { $match: { instructor: instructorId as any, status: { $in: ['pending', 'processing'] } } },
                  { $group: { _id: null, amount: { $sum: '$amount' } } },
                ],
              },
            },
          ]),
          Payment.aggregate([
            { $match: { status: 'success', 'commissionSplits.instructor': instructorId as any } },
            { $unwind: '$commissionSplits' },
            { $match: { 'commissionSplits.instructor': instructorId as any } },
            {
              $group: {
                _id: '$course',
                totalSales: { $sum: '$commissionSplits.baseAmount' },
                instructorShare: { $sum: '$commissionSplits.instructorShare' },
                count: { $sum: 1 },
              },
            },
            {
              $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' },
            },
            { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
            { $project: { courseTitle: '$course.title', totalSales: 1, instructorShare: 1, count: 1 } },
            { $sort: { instructorShare: -1 } },
          ]),
          this.getInstructorSubscription(instructorId),
        ]);

        const stats = payoutStats?.[0] ?? {};

        return {
          totalEarned: stats.totalEarned?.[0]?.amount || 0,
          pendingPayouts: stats.pending?.[0]?.amount || 0,
          recentPayouts: payouts,
          courseEarnings,
          subscription: subscriptionInfo,
        };
      }
    );
  }

  async getRevenueSummary() {
    return cacheService.remember(cacheKeys.revenueSummary(), { ttl: CACHE_TTL.REVENUE_SUMMARY }, async () => {
      const [paymentResult, totalPayouts] = await Promise.all([
        Payment.aggregate([
          {
            $facet: {
              totalRevenue: [
                { $match: { status: 'success' } },
                { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
              ],
              totalCommissions: [
                { $match: { status: 'success' } },
                { $group: { _id: null, amount: { $sum: '$totalCommissionAmount' } } },
              ],
              instructorSubscriptions: [
                { $match: { status: 'success', type: 'instructor_subscription' } },
                { $group: { _id: null, amount: { $sum: '$amount' } } },
              ],
              featuredPromotions: [
                { $match: { status: 'success', type: 'featured_promotion' } },
                { $group: { _id: null, amount: { $sum: '$amount' } } },
              ],
            },
          },
        ]),
        Payout.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]),
      ]);

      const paymentFacet = paymentResult?.[0] ?? {};

      return {
        totalRevenue: paymentFacet.totalRevenue?.[0]?.amount || 0,
        totalTransactions: paymentFacet.totalRevenue?.[0]?.count || 0,
        totalCommissions: paymentFacet.totalCommissions?.[0]?.amount || 0,
        totalPayouts: totalPayouts[0]?.amount || 0,
        instructorSubscriptionRevenue: paymentFacet.instructorSubscriptions?.[0]?.amount || 0,
        featuredPromotionRevenue: paymentFacet.featuredPromotions?.[0]?.amount || 0,
      };
    });
  }
}

export const revenueService = new RevenueService();
