import mongoose from 'mongoose';
import crypto from 'crypto';
import { Affiliate } from '../models/affiliate.model';
import { Referral } from '../models/referral.model';
import { ReferralClick } from '../models/referralClick.model';
import { ReferralTransaction } from '../models/referralTransaction.model';
import { AffiliateSetting } from '../models/affiliateSetting.model';
import { Payment } from '../models/payment.model';
import { User } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { withTransaction } from '../utils/transaction';

const REFERAL_CODE_LENGTH = 8;
const CLICK_DEDUP_WINDOW_MS = 60_000;

function generateReferralCode(): string {
  return crypto.randomBytes(6).toString('base64url').toUpperCase().slice(0, REFERAL_CODE_LENGTH);
}

export class AffiliateService {
  // ─── Settings ─────────────────────────────────────────────────
  async getSettings(): Promise<Record<string, any>> {
    const existing = await AffiliateSetting.findOne().lean();
    if (existing) return existing;
    const created = await AffiliateSetting.create({});
    return created.toObject();
  }

  async updateSettings(
    data: Partial<{
      enabled: boolean;
      commissionType: 'percentage' | 'fixed';
      commissionValue: number;
      eligibleProducts: ('course' | 'bundle' | 'subscription')[];
      minimumPurchaseAmount: number;
      referralCookieExpiryDays: number;
      maxCommissionPerOrder: number;
      autoApproveCommission: boolean;
    }>,
    adminId: string
  ) {
    let settings = await AffiliateSetting.findOne();
    if (!settings) {
      settings = new AffiliateSetting();
    }
    if (data.enabled !== undefined) settings.enabled = data.enabled;
    if (data.commissionType) settings.commissionType = data.commissionType;
    if (data.commissionValue !== undefined) settings.commissionValue = data.commissionValue;
    if (data.eligibleProducts) settings.eligibleProducts = data.eligibleProducts;
    if (data.minimumPurchaseAmount !== undefined) settings.minimumPurchaseAmount = data.minimumPurchaseAmount;
    if (data.referralCookieExpiryDays !== undefined) settings.referralCookieExpiryDays = data.referralCookieExpiryDays;
    if (data.maxCommissionPerOrder !== undefined) settings.maxCommissionPerOrder = data.maxCommissionPerOrder;
    if (data.autoApproveCommission !== undefined) settings.autoApproveCommission = data.autoApproveCommission;
    settings.updatedBy = new mongoose.Types.ObjectId(adminId);
    return settings.save();
  }

  // ─── Affiliate Profile ────────────────────────────────────────
  async getOrCreateAffiliate(userId: string): Promise<any> {
    let affiliate = await Affiliate.findOne({ user: userId }).populate('user', 'name email avatar');
    if (!affiliate) {
      let code: string;
      let isUnique = false;
      while (!isUnique) {
        code = generateReferralCode();
        const existing = await Affiliate.findOne({ code });
        if (!existing) isUnique = true;
      }
      affiliate = await Affiliate.create({
        user: userId,
        code: code!,
        commissionPercent: 10,
        payoutMethod: 'bank',
        payoutDetails: {},
      });
      affiliate = await Affiliate.populate(affiliate, { path: 'user', select: 'name email avatar' });
    }
    return affiliate;
  }

  async getAffiliateProfile(userId: string): Promise<any> {
    const affiliate = await Affiliate.findOne({ user: userId }).populate('user', 'name email avatar');
    if (!affiliate) {
      return this.getOrCreateAffiliate(userId);
    }
    return affiliate;
  }

  async updateAffiliateProfile(
    userId: string,
    data: {
      payoutMethod?: string;
      payoutDetails?: Record<string, any>;
    }
  ) {
    const affiliate = await Affiliate.findOne({ user: userId });
    if (!affiliate) throw ApiError.notFound('Affiliate profile not found. Generate a referral link first.');

    if (data.payoutMethod) affiliate.payoutMethod = data.payoutMethod as any;
    if (data.payoutDetails) {
      affiliate.payoutDetails = { ...affiliate.payoutDetails, ...data.payoutDetails };
    }
    return affiliate.save();
  }

  // ─── Referral Link Generation ────────────────────────────────
  generateReferralLink(code: string, productPath?: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'https://example.com';
    if (productPath) {
      return `${baseUrl}/${productPath.replace(/^\//, '')}?ref=${code}`;
    }
    return `${baseUrl}/register?ref=${code}`;
  }

  // ─── Click Tracking ──────────────────────────────────────────
  async trackClick(code: string, ip: string, userAgent?: string, referrer?: string, landingPage?: string) {
    const affiliate = await Affiliate.findOne({ code: code.toUpperCase(), status: 'active' });
    if (!affiliate) return null;

    const oneMinuteAgo = new Date(Date.now() - CLICK_DEDUP_WINDOW_MS);
    const recentClick = await ReferralClick.findOne({
      code: code.toUpperCase(),
      ip,
      clickedAt: { $gte: oneMinuteAgo },
    });

    if (!recentClick) {
      await ReferralClick.create({
        code: code.toUpperCase(),
        ip,
        userAgent: userAgent || '',
        referrer: referrer || '',
        landingPage: landingPage || '',
        converted: false,
      });
      await Affiliate.findByIdAndUpdate(affiliate._id, { $inc: { totalClicks: 1 } });
    }

    return {
      affiliateId: affiliate._id,
      code: affiliate.code,
      referrerName: (affiliate as any).user?.name || 'Someone',
    };
  }

  // ─── Referral on Registration ────────────────────────────────
  async registerReferral(referredUserId: string, code: string) {
    if (!code) return null;

    const affiliate = await Affiliate.findOne({ code: code.toUpperCase(), status: 'active' });
    if (!affiliate) return null;

    if (affiliate.user.toString() === referredUserId) {
      logger.warn('Self-referral attempt', { userId: referredUserId, code });
      return null;
    }

    const existingReferral = await Referral.findOne({ referred: referredUserId });
    if (existingReferral) return null;

    const referral = await Referral.create({
      referrer: affiliate.user,
      referred: referredUserId,
      code: code.toUpperCase(),
      status: 'pending',
    });

    await User.findByIdAndUpdate(referredUserId, {
      $set: {
        referredBy: affiliate.user,
        referredAt: new Date(),
      },
    });

    return referral;
  }

  // ─── Commission on Purchase ──────────────────────────────────
  async processPurchaseCommission(paymentId: string, session?: mongoose.ClientSession) {
    const payment = await Payment.findById(paymentId).session(session || null);
    if (!payment) return;
    if (payment.status !== 'success') return;

    const buyer = await User.findById(payment.user).session(session || null);
    if (!buyer || !buyer.referredBy) return;

    const referral = await Referral.findOne({ referred: payment.user._id, status: 'pending' }).session(session || null);
    if (!referral) return;

    const affiliate = await Affiliate.findOne({ user: referral.referrer, status: 'active' }).session(session || null);
    if (!affiliate) return;

    const existingTx = await ReferralTransaction.findOne({ payment: paymentId }).session(session || null);
    if (existingTx) return;

    const settings = await this.getSettings();
    if (!settings.enabled) return;

    if (!settings.eligibleProducts.includes(payment.type as any)) return;
    if (payment.amount < settings.minimumPurchaseAmount) return;

    let commission = 0;
    const commissionRate = affiliate.commissionPercent || settings.commissionValue;

    if (settings.commissionType === 'percentage') {
      commission = Math.round((payment.amount * commissionRate) / 100);
    } else {
      commission = Math.round(commissionRate);
    }

    if (settings.maxCommissionPerOrder > 0) {
      commission = Math.min(commission, settings.maxCommissionPerOrder);
    }

    if (commission <= 0) return;

    const status = settings.autoApproveCommission ? 'approved' : 'pending';

    const tx = await ReferralTransaction.create(
      [
        {
          affiliate: affiliate._id,
          referral: referral._id,
          payment: payment._id,
          type: 'commission',
          amount: commission,
          commissionRate,
          originalAmount: payment.amount,
          status,
          description: `Commission from ${payment.type} purchase`,
        },
      ],
      { session: session || undefined }
    );

    await Promise.all([
      Referral.findByIdAndUpdate(
        referral._id,
        { status: 'converted', convertedAt: new Date() },
        { session: session || undefined }
      ),
      Affiliate.findByIdAndUpdate(
        affiliate._id,
        {
          $inc: { totalEarnings: commission, totalConversions: 1 },
        },
        { session: session || undefined }
      ),
      Payment.findByIdAndUpdate(
        payment._id,
        {
          $set: {
            referredBy: referral.referrer,
            affiliateCommission: commission,
          },
        },
        { session: session || undefined }
      ),
    ]);

    return tx[0];
  }

  // ─── Commission Reversal on Refund ──────────────────────────
  async reverseCommissionOnRefund(paymentId: string, session?: mongoose.ClientSession) {
    const commissionTx = await ReferralTransaction.findOne({
      payment: paymentId,
      type: 'commission',
      status: { $in: ['pending', 'approved'] },
    }).session(session || null);

    if (!commissionTx) return;

    const reversal = await ReferralTransaction.create(
      [
        {
          affiliate: commissionTx.affiliate,
          referral: commissionTx.referral,
          payment: commissionTx.payment,
          type: 'reversal',
          amount: -commissionTx.amount,
          commissionRate: commissionTx.commissionRate,
          originalAmount: commissionTx.originalAmount,
          status: 'approved',
          description: `Reversal: ${commissionTx.description}`,
          reversedTransaction: commissionTx._id,
        },
      ],
      { session: session || undefined }
    );

    commissionTx.status = 'reversed';
    await commissionTx.save({ session: session || undefined });

    await Affiliate.findByIdAndUpdate(
      commissionTx.affiliate,
      {
        $inc: { totalEarnings: -commissionTx.amount, totalConversions: -1 },
      },
      { session: session || undefined }
    );

    return reversal[0];
  }

  // ─── Dashboard ───────────────────────────────────────────────
  async getDashboard(userId: string) {
    const affiliate = await this.getOrCreateAffiliate(userId);
    const affiliateId = affiliate._id;

    const settings = await this.getSettings();

    const [clickResult, referralResult, transactionResult, transactions, recentClicks] = await Promise.all([
      ReferralClick.aggregate([
        { $match: { code: affiliate.code } },
        {
          $facet: {
            total: [{ $count: 'count' }],
            ips: [{ $group: { _id: '$ip' } }],
          },
        },
      ]),
      Referral.aggregate([
        { $match: { referrer: affiliate.user } },
        {
          $facet: {
            all: [{ $count: 'count' }],
            converted: [{ $match: { status: 'converted' } }, { $count: 'count' }],
          },
        },
      ]),
      ReferralTransaction.aggregate([
        { $match: { affiliate: new mongoose.Types.ObjectId(affiliateId) } },
        {
          $facet: {
            pending: [
              { $match: { type: 'commission', status: 'pending' } },
              { $group: { _id: null, total: { $sum: '$amount' } } },
            ],
            approved: [
              { $match: { type: 'commission', status: 'approved' } },
              { $group: { _id: null, total: { $sum: '$amount' } } },
            ],
            reversed: [
              { $match: { type: 'reversal', status: 'approved' } },
              { $group: { _id: null, total: { $sum: '$amount' } } },
            ],
            monthly: [
              { $match: { type: 'commission' } },
              {
                $group: {
                  _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                  commission: { $sum: '$amount' },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
              { $limit: 12 },
            ],
          },
        },
      ]),
      ReferralTransaction.find({ affiliate: affiliateId, type: 'commission' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({
          path: 'payment',
          select: 'amount type course bundle',
          populate: [
            { path: 'course', select: 'title price' },
            { path: 'bundle', select: 'title price' },
          ],
        })
        .lean(),
      ReferralClick.find({ code: affiliate.code }).sort({ clickedAt: -1 }).limit(10).lean(),
    ]);

    const clickFacet = clickResult?.[0] ?? {};
    const referralFacet = referralResult?.[0] ?? {};
    const transactionFacet = transactionResult?.[0] ?? {};

    const totalClicks = clickFacet.total?.[0]?.count ?? 0;
    const uniqueClicks = (clickFacet.ips ?? []).length;
    const referrals = referralFacet.all?.[0]?.count ?? 0;
    const conversions = referralFacet.converted?.[0]?.count ?? 0;
    const monthlyStats = transactionFacet.monthly ?? [];

    const totalEarnings = affiliate.totalEarnings || 0;
    const pendingTotal = transactionFacet.pending?.[0]?.total || 0;
    const approvedTotal = transactionFacet.approved?.[0]?.total || 0;
    const reversedTotal = transactionFacet.reversed?.[0]?.total || 0;
    const withdrawable = approvedTotal;

    const referralLink = this.generateReferralLink(affiliate.code);

    return {
      affiliate: {
        code: affiliate.code,
        status: affiliate.status,
        commissionPercent: affiliate.commissionPercent,
        referralLink,
        payoutMethod: affiliate.payoutMethod,
        payoutDetails: affiliate.payoutDetails,
      },
      stats: {
        totalClicks,
        uniqueClicks,
        totalReferrals: referrals,
        convertedReferrals: conversions,
        conversionRate: referrals > 0 ? Math.round((conversions / referrals) * 100) : 0,
        pendingCommission: pendingTotal,
        approvedCommission: approvedTotal,
        reversedCommission: Math.abs(reversedTotal),
        totalEarnings,
        withdrawableBalance: withdrawable,
        walletBalance: affiliate.totalEarnings,
      },
      monthlyAnalytics: monthlyStats,
      recentTransactions: transactions,
      recentClicks,
      settings: {
        commissionType: settings.commissionType,
        commissionValue: settings.commissionValue,
        minimumPurchaseAmount: settings.minimumPurchaseAmount,
        maxCommissionPerOrder: settings.maxCommissionPerOrder,
        eligibleProducts: settings.eligibleProducts,
      },
    };
  }

  // ─── Referrals List ──────────────────────────────────────────
  async getReferrals(userId: string, page = 1, limit = 20) {
    const affiliate = await Affiliate.findOne({ user: userId });
    if (!affiliate) return { referrals: [], pagination: { page, limit, total: 0, pages: 0 } };

    const skip = (page - 1) * limit;
    const filter = { referrer: affiliate.user };
    const [referrals, total] = await Promise.all([
      Referral.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('referred', 'name email avatar createdAt')
        .lean(),
      Referral.countDocuments(filter),
    ]);

    return {
      referrals,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // ─── Transactions List ───────────────────────────────────────
  async getTransactions(userId: string, page = 1, limit = 20) {
    const affiliate = await Affiliate.findOne({ user: userId });
    if (!affiliate) return { transactions: [], pagination: { page, limit, total: 0, pages: 0 } };

    const skip = (page - 1) * limit;
    const filter = { affiliate: affiliate._id };
    const [transactions, total] = await Promise.all([
      ReferralTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'payment',
          select: 'amount type course bundle status',
          populate: [
            { path: 'course', select: 'title' },
            { path: 'bundle', select: 'title' },
          ],
        })
        .lean(),
      ReferralTransaction.countDocuments(filter),
    ]);

    return {
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // ─── Payouts ─────────────────────────────────────────────────
  async requestPayout(userId: string) {
    const affiliate = await Affiliate.findOne({ user: userId });
    if (!affiliate) throw ApiError.notFound('Affiliate profile not found');

    const approvedTxns = await ReferralTransaction.aggregate([
      { $match: { affiliate: affiliate._id, type: 'commission', status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const pendingPayouts = await ReferralTransaction.aggregate([
      { $match: { affiliate: affiliate._id, type: 'payout', status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const approvedTotal = approvedTxns[0]?.total || 0;
    const pendingTotal = pendingPayouts[0]?.total || 0;
    const withdrawable = approvedTotal - pendingTotal;

    if (withdrawable <= 0) {
      throw ApiError.badRequest('No withdrawable commission available');
    }

    const settings = await this.getSettings();
    const minPayout = settings.minimumPurchaseAmount > 0 ? settings.minimumPurchaseAmount : 100;
    if (withdrawable < minPayout) {
      throw ApiError.badRequest(`Minimum payout amount is ₹${minPayout}`);
    }

    return withTransaction(async (session) => {
      const payoutTxns = await ReferralTransaction.find({
        affiliate: affiliate._id,
        type: 'commission',
        status: 'approved',
      }).session(session);

      let totalPayoutAmount = 0;
      for (const tx of payoutTxns) {
        totalPayoutAmount += tx.amount;
        tx.status = 'paid';
        tx.paidAt = new Date();
        await tx.save({ session });
      }

      const payoutRecord = await ReferralTransaction.create(
        [
          {
            affiliate: affiliate._id,
            referral: null,
            payment: null,
            type: 'payout',
            amount: -totalPayoutAmount,
            commissionRate: 0,
            originalAmount: totalPayoutAmount,
            status: 'approved',
            description: 'Payout requested',
            paidAt: new Date(),
          },
        ],
        { session }
      );

      return {
        payoutId: payoutRecord[0]._id,
        amount: totalPayoutAmount,
        payoutMethod: affiliate.payoutMethod,
        payoutDetails: affiliate.payoutDetails,
        message: 'Payout request submitted. It will be processed by admin.',
      };
    });
  }

  async getPayoutHistory(userId: string, page = 1, limit = 20) {
    const affiliate = await Affiliate.findOne({ user: userId });
    if (!affiliate) return { payouts: [], pagination: { page, limit, total: 0, pages: 0 } };

    const skip = (page - 1) * limit;
    const filter = { affiliate: affiliate._id, type: 'payout' as const };
    const [payouts, total] = await Promise.all([
      ReferralTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ReferralTransaction.countDocuments(filter),
    ]);

    return {
      payouts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // ─── Public Referral Lookup ──────────────────────────────────
  async getReferralInfo(code: string) {
    const affiliate = await Affiliate.findOne({ code: code.toUpperCase(), status: 'active' }).populate('user', 'name');
    if (!affiliate) throw ApiError.notFound('Invalid referral code');
    return {
      valid: true,
      code: affiliate.code,
      referrerName: (affiliate.user as any)?.name || 'Someone',
    };
  }

  // ─── Admin: Affiliate Analytics ──────────────────────────────
  async getAdminAnalytics() {
    const settings = await this.getSettings();

    const [
      totalAffiliates,
      activeAffiliates,
      totalReferrals,
      convertedReferrals,
      [earningsStats, topAffiliates, monthlyTrend, transactionSummary, pendingPayouts],
    ] = await Promise.all([
      Affiliate.countDocuments(),
      Affiliate.countDocuments({ status: 'active' }),
      Referral.countDocuments(),
      Referral.countDocuments({ status: 'converted' }),
      Promise.all([
        ReferralTransaction.aggregate([
          { $match: { type: 'commission', status: 'approved' } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        Affiliate.aggregate([
          { $match: { status: 'active' } },
          { $sort: { totalEarnings: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              code: 1,
              totalEarnings: 1,
              totalClicks: 1,
              totalConversions: 1,
              'user.name': 1,
              'user.email': 1,
              'user.avatar': 1,
            },
          },
        ]),
        ReferralTransaction.aggregate([
          { $match: { type: 'commission' } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              commission: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $limit: 12 },
        ]),
        ReferralTransaction.aggregate([
          {
            $group: {
              _id: '$type',
              total: { $sum: { $cond: [{ $eq: ['$type', 'reversal'] }, { $abs: '$amount' }, '$amount'] } },
              count: { $sum: 1 },
            },
          },
        ]),
        ReferralTransaction.aggregate([
          { $match: { type: 'payout', status: 'pending' } },
          { $group: { _id: null, total: { $sum: { $abs: '$amount' } }, count: { $sum: 1 } } },
        ]),
      ]),
    ]);

    const earnings = earningsStats[0] || { total: 0, count: 0 };
    const payoutInfo = pendingPayouts[0] || { total: 0, count: 0 };

    const transactionMap: Record<string, { total: number; count: number }> = {};
    for (const t of transactionSummary) {
      transactionMap[t._id] = { total: t.total, count: t.count };
    }

    const clickData = await ReferralClick.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' } },
          clicks: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ]);

    return {
      settings: {
        enabled: settings.enabled,
        commissionType: settings.commissionType,
        commissionValue: settings.commissionValue,
        eligibleProducts: settings.eligibleProducts,
        minimumPurchaseAmount: settings.minimumPurchaseAmount,
        referralCookieExpiryDays: settings.referralCookieExpiryDays,
        maxCommissionPerOrder: settings.maxCommissionPerOrder,
        autoApproveCommission: settings.autoApproveCommission,
      },
      stats: {
        totalAffiliates,
        activeAffiliates,
        totalReferrals,
        conversionRate: totalReferrals > 0 ? Math.round((convertedReferrals / totalReferrals) * 100) : 0,
        totalCommissionPaid: earnings.total,
        totalCommissionCount: earnings.count,
        pendingPayoutsTotal: payoutInfo.total,
        pendingPayoutsCount: payoutInfo.count,
      },
      topAffiliates,
      monthlyTrend,
      transactionBreakdown: transactionMap,
      clickAnalytics: clickData,
    };
  }

  async getAdminReferrals(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [referrals, total] = await Promise.all([
      Referral.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('referrer', 'name email avatar')
        .populate('referred', 'name email avatar')
        .lean(),
      Referral.countDocuments(),
    ]);

    return {
      referrals,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getAdminTransactions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      ReferralTransaction.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'affiliate',
          select: 'code user',
          populate: { path: 'user', select: 'name email' },
        })
        .populate({
          path: 'payment',
          select: 'amount type status',
          populate: [
            { path: 'course', select: 'title' },
            { path: 'bundle', select: 'title' },
          ],
        })
        .lean(),
      ReferralTransaction.countDocuments(),
    ]);

    return {
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getAdminPayouts(page = 1, limit = 20, status?: string) {
    const filter: any = { type: 'payout' as const };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [payouts, total] = await Promise.all([
      ReferralTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'affiliate',
          select: 'code user payoutMethod payoutDetails',
          populate: { path: 'user', select: 'name email' },
        })
        .lean(),
      ReferralTransaction.countDocuments(filter),
    ]);

    return {
      payouts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async generateCsvReport() {
    const transactions = await ReferralTransaction.find({ type: { $ne: 'payout' } })
      .sort({ createdAt: -1 })
      .populate({
        path: 'affiliate',
        select: 'code user',
        populate: { path: 'user', select: 'name email' },
      })
      .populate({ path: 'payment', select: 'amount type' })
      .lean();

    const headers =
      'Date,Affiliate,Affiliate Email,Code,Type,Amount,Commission Rate,Status,Payment Amount,Payment Type\n';
    const rows = transactions
      .map((t: any) => {
        const affUser = t.affiliate?.user || {};
        return [
          new Date(t.createdAt).toISOString().split('T')[0],
          `"${affUser.name || 'Unknown'}"`,
          affUser.email || '',
          t.affiliate?.code || '',
          t.type,
          t.amount,
          `${t.commissionRate}%`,
          t.status,
          t.payment?.amount || 0,
          t.payment?.type || '',
        ].join(',');
      })
      .join('\n');

    return headers + rows;
  }
}

export const affiliateService = new AffiliateService();
