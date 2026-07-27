import { Payment } from '../models/payment.model';
import { Payout } from '../models/payout.model';
import { PlatformWallet } from '../models/platformWallet.model';
import { InstructorSubscriptionPlan } from '../models/instructorSubscriptionPlan.model';
import { InstructorSubscription } from '../models/instructorSubscription.model';
import { Affiliate } from '../models/affiliate.model';
import { FeaturedPromotion } from '../models/featuredPromotion.model';
import { User } from '../models/user.model';
import { Course } from '../models/course.model';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export class RevenueService {
  // ─── Platform Wallet ─────────────────────────────────────────
  async getPlatformWallet() {
    let wallet = await PlatformWallet.findOne();
    if (!wallet) {
      wallet = await PlatformWallet.create({
        totalRevenue: 0, totalCommissionCollected: 0,
        totalPayoutsMade: 0, currentBalance: 0, pendingPayouts: 0,
      });
    }
    return wallet;
  }

  // ─── Revenue Dashboard (Admin) ───────────────────────────────
  async getRevenueDashboard() {
    const wallet = await this.getPlatformWallet();

    const [dailyRevenue, revenueBySource, monthlyTrend, activePlans, activePromotions, topInstructors] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'success', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: '$type', amount: { $sum: '$amount' }, count: { $sum: 1 }, commission: { $sum: '$totalCommissionAmount' } } },
      ]),
      Payment.aggregate([
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
      ]),
      InstructorSubscription.countDocuments({ status: 'active' }),
      FeaturedPromotion.countDocuments({ status: 'active' }),
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
    ]);

    const instructorSubRevenue = await Payment.aggregate([
      { $match: { status: 'success', type: 'instructor_subscription' } },
      { $group: { _id: null, amount: { $sum: '$amount' } } },
    ]);

    const featuredRevenue = await Payment.aggregate([
      { $match: { status: 'success', type: 'featured_promotion' } },
      { $group: { _id: null, amount: { $sum: '$amount' } } },
    ]);

    return {
      wallet: {
        totalRevenue: wallet.totalRevenue,
        totalCommissionCollected: wallet.totalCommissionCollected,
        totalPayoutsMade: wallet.totalPayoutsMade,
        currentBalance: wallet.currentBalance,
        pendingPayouts: wallet.pendingPayouts,
      },
      dailyRevenue,
      revenueBySource,
      monthlyTrend,
      activeInstructorSubscriptions: activePlans,
      activePromotions,
      topInstructors,
      instructorSubscriptionRevenue: instructorSubRevenue[0]?.amount || 0,
      featuredPromotionRevenue: featuredRevenue[0]?.amount || 0,
    };
  }

  // ─── Instructor Subscription Plan Management (Admin) ─────────
  async listInstructorSubscriptionPlans() {
    return InstructorSubscriptionPlan.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
  }

  async createInstructorSubscriptionPlan(data: {
    name: string; type: string; price: number; durationDays: number;
    description: string; features: any; status: string; sortOrder: number;
  }) {
    const existing = await InstructorSubscriptionPlan.findOne({ name: data.name });
    if (existing) throw ApiError.conflict('A plan with this name already exists');
    return InstructorSubscriptionPlan.create(data);
  }

  async updateInstructorSubscriptionPlan(id: string, data: Partial<{
    name: string; type: string; price: number; durationDays: number;
    description: string; features: any; status: string; sortOrder: number;
  }>) {
    const plan = await InstructorSubscriptionPlan.findByIdAndUpdate(id, data, { new: true });
    if (!plan) throw ApiError.notFound('Plan not found');
    return plan;
  }

  async deleteInstructorSubscriptionPlan(id: string) {
    const subscribers = await InstructorSubscription.countDocuments({ plan: id, status: 'active' });
    if (subscribers > 0) throw ApiError.badRequest('Cannot delete plan with active subscribers');
    const plan = await InstructorSubscriptionPlan.findByIdAndDelete(id);
    if (!plan) throw ApiError.notFound('Plan not found');
    return plan;
  }

  // ─── Instructor Subscription (Self-Service) ──────────────────
  async getInstructorSubscription(instructorId: string): Promise<any> {
    const active = await InstructorSubscription.findOne({ instructor: instructorId, status: 'active' })
      .populate('plan')
      .sort({ createdAt: -1 })
      .lean();
    if (active) return active;

    const latest = await InstructorSubscription.findOne({ instructor: instructorId })
      .populate('plan')
      .sort({ createdAt: -1 })
      .lean();

    if (latest) {
      const starterPlan = await InstructorSubscriptionPlan.findOne({ name: 'Starter', status: 'active' }).lean();
      return { ...latest, plan: latest.plan || starterPlan, status: 'expired' };
    }

    const starterPlan = await InstructorSubscriptionPlan.findOne({ name: 'Starter', status: 'active' }).lean();
    return {
      instructor: instructorId,
      plan: starterPlan || { name: 'Starter', type: 'free', features: { freeCoursesLimit: 2, storageLimitMB: 500 } },
      status: 'none',
      startDate: null,
      endDate: null,
    };
  }

  async subscribeToPlan(instructorId: string, planId: string) {
    const plan = await InstructorSubscriptionPlan.findById(planId);
    if (!plan) throw ApiError.notFound('Plan not found');
    if (plan.status !== 'active') throw ApiError.badRequest('Plan is not active');

    const existing = await InstructorSubscription.findOne({ instructor: instructorId, status: 'active' });
    if (existing) throw ApiError.conflict('You already have an active subscription');

    if (plan.type === 'free') {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.durationDays);

      return InstructorSubscription.create({
        instructor: instructorId,
        plan: planId,
        startDate,
        endDate,
        status: 'active',
      });
    }

    return {
      requiresPayment: true,
      plan: {
        _id: plan._id,
        name: plan.name,
        price: plan.price,
        durationDays: plan.durationDays,
      },
    };
  }

  async verifySubscriptionPayment(instructorId: string, planId: string, paymentId: string) {
    const plan = await InstructorSubscriptionPlan.findById(planId);
    if (!plan) throw ApiError.notFound('Plan not found');

    const payment = await Payment.findById(paymentId);
    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.status !== 'success') throw ApiError.badRequest('Payment not completed');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    return InstructorSubscription.create({
      instructor: instructorId,
      plan: planId,
      payment: paymentId,
      startDate,
      endDate,
      status: 'active',
    });
  }

  async cancelInstructorSubscription(instructorId: string) {
    const subscription = await InstructorSubscription.findOne({ instructor: instructorId, status: 'active' });
    if (!subscription) throw ApiError.notFound('No active subscription found');
    subscription.status = 'cancelled';
    await subscription.save();
    return subscription;
  }

  // ─── Instructor Subscription Stats (Admin) ───────────────────
  async getInstructorSubscriptionStats() {
    const [total, active, byPlan, revenue] = await Promise.all([
      InstructorSubscription.countDocuments(),
      InstructorSubscription.countDocuments({ status: 'active' }),
      InstructorSubscription.aggregate([
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
      ]),
      Payment.aggregate([
        { $match: { status: 'success', type: 'instructor_subscription' } },
        { $group: { _id: null, amount: { $sum: '$amount' } } },
      ]),
    ]);

    return { total, active, byPlan, revenue: revenue[0]?.amount || 0 };
  }

  // ─── Affiliate Management ────────────────────────────────────
  async listAffiliates(page = 1, limit = 20, search?: string) {
    const filter: any = {};
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
      ];
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

  async createAffiliate(userId: string, data: {
    code: string; commissionPercent?: number; payoutMethod?: string; payoutDetails?: any;
  }) {
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

  async updateAffiliate(id: string, data: Partial<{
    commissionPercent: number; status: string; payoutMethod: string; payoutDetails: any;
  }>) {
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

    return { total, active, totalEarnings: s.totalEarnings, totalClicks: s.totalClicks, totalConversions: s.totalConversions };
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
    type: string; course?: string; instructor?: string;
    startDate: string; endDate: string; price: number; position: number; notes?: string;
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

  async updateFeaturedPromotion(id: string, data: Partial<{
    type: string; course: string; instructor: string;
    startDate: string; endDate: string; price: number; status: string; position: number; notes: string;
  }>) {
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
    const [payouts, totalEarned, courseEarnings, subscriptionInfo] = await Promise.all([
      Payout.find({ instructor: instructorId, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Payout.aggregate([
        { $match: { instructor: instructorId as any, status: 'completed' } },
        { $group: { _id: null, amount: { $sum: '$amount' } } },
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

    const pendingPayouts = await Payout.aggregate([
      { $match: { instructor: instructorId as any, status: { $in: ['pending', 'processing'] } } },
      { $group: { _id: null, amount: { $sum: '$amount' } } },
    ]);

    return {
      totalEarned: totalEarned[0]?.amount || 0,
      pendingPayouts: pendingPayouts[0]?.amount || 0,
      recentPayouts: payouts,
      courseEarnings,
      subscription: subscriptionInfo,
    };
  }

  async getRevenueSummary() {
    const [totalRevenue, totalCommissions, totalPayouts, totalInstructorSubs, totalPromotions] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, amount: { $sum: '$totalCommissionAmount' } } },
      ]),
      Payout.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, amount: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'success', type: 'instructor_subscription' } },
        { $group: { _id: null, amount: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'success', type: 'featured_promotion' } },
        { $group: { _id: null, amount: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      totalRevenue: totalRevenue[0]?.amount || 0,
      totalTransactions: totalRevenue[0]?.count || 0,
      totalCommissions: totalCommissions[0]?.amount || 0,
      totalPayouts: totalPayouts[0]?.amount || 0,
      instructorSubscriptionRevenue: totalInstructorSubs[0]?.amount || 0,
      featuredPromotionRevenue: totalPromotions[0]?.amount || 0,
    };
  }
}

export const revenueService = new RevenueService();
