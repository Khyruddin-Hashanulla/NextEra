import mongoose from 'mongoose';
import { affiliateService } from '../services/affiliate.service';
import { Affiliate } from '../models/affiliate.model';
import { AffiliateSetting } from '../models/affiliateSetting.model';
import { ReferralClick } from '../models/referralClick.model';
import { Referral } from '../models/referral.model';
import { ReferralTransaction } from '../models/referralTransaction.model';

jest.mock('../models/affiliate.model', () => ({
  Affiliate: { findOne: jest.fn(), create: jest.fn(), populate: jest.fn() },
}));
jest.mock('../models/affiliateSetting.model', () => ({
  AffiliateSetting: { findOne: jest.fn(), create: jest.fn() },
}));
jest.mock('../models/referralClick.model', () => ({
  ReferralClick: { aggregate: jest.fn(), find: jest.fn(), countDocuments: jest.fn(), distinct: jest.fn() },
}));
jest.mock('../models/referral.model', () => ({
  Referral: { aggregate: jest.fn(), countDocuments: jest.fn() },
}));
jest.mock('../models/referralTransaction.model', () => ({
  ReferralTransaction: { aggregate: jest.fn(), find: jest.fn() },
}));

const mockedClickAggregate = ReferralClick.aggregate as jest.Mock;
const mockedReferralAggregate = Referral.aggregate as jest.Mock;
const mockedTransactionAggregate = ReferralTransaction.aggregate as jest.Mock;

function chainable(result: unknown) {
  const chain: any = {
    lean: jest.fn().mockResolvedValue(result),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };
  return chain;
}

const affiliateDoc = {
  _id: new mongoose.Types.ObjectId(),
  code: 'ABC12345',
  user: new mongoose.Types.ObjectId(),
  totalEarnings: 1000,
  status: 'active',
  commissionPercent: 10,
  payoutMethod: 'bank',
  payoutDetails: {},
};

const settingsDoc = {
  commissionType: 'percentage',
  commissionValue: 10,
  minimumPurchaseAmount: 100,
  maxCommissionPerOrder: 500,
  eligibleProducts: ['course', 'bundle'],
};

describe('AffiliateService.getDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Affiliate.findOne as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(affiliateDoc) });
    (AffiliateSetting.findOne as jest.Mock).mockReturnValue({ lean: jest.fn().mockResolvedValue(settingsDoc) });
  });

  it('merges click, referral and transaction stats into three facet aggregations', async () => {
    mockedClickAggregate.mockResolvedValue([
      {
        total: [{ count: 50 }],
        ips: [{ _id: '1.1.1.1' }, { _id: '2.2.2.2' }, { _id: '3.3.3.3' }],
      },
    ]);
    mockedReferralAggregate.mockResolvedValue([
      {
        all: [{ count: 20 }],
        converted: [{ count: 6 }],
      },
    ]);
    mockedTransactionAggregate.mockResolvedValue([
      {
        pending: [{ _id: null, total: 300 }],
        approved: [{ _id: null, total: 700 }],
        reversed: [{ _id: null, total: 100 }],
        monthly: [{ _id: '2026-08', commission: 200, count: 2 }],
      },
    ]);
    (ReferralTransaction.find as jest.Mock).mockReturnValue(
      chainable([{ _id: 'tx1', amount: 100, type: 'commission', status: 'approved' }])
    );
    (ReferralClick.find as jest.Mock).mockReturnValue(
      chainable([{ _id: 'c1', ip: '1.1.1.1', clickedAt: new Date() }])
    );

    const result = await affiliateService.getDashboard(affiliateDoc.user.toString());

    expect(result.affiliate.code).toBe('ABC12345');
    expect(result.stats.totalClicks).toBe(50);
    expect(result.stats.uniqueClicks).toBe(3);
    expect(result.stats.totalReferrals).toBe(20);
    expect(result.stats.convertedReferrals).toBe(6);
    expect(result.stats.conversionRate).toBe(30);
    expect(result.stats.pendingCommission).toBe(300);
    expect(result.stats.approvedCommission).toBe(700);
    expect(result.stats.reversedCommission).toBe(100);
    expect(result.stats.withdrawableBalance).toBe(700);
    expect(result.stats.walletBalance).toBe(1000);
    expect(result.monthlyAnalytics).toEqual([{ _id: '2026-08', commission: 200, count: 2 }]);
    expect(result.recentTransactions).toHaveLength(1);
    expect(result.recentClicks).toHaveLength(1);

    expect(mockedClickAggregate).toHaveBeenCalledTimes(1);
    expect(mockedReferralAggregate).toHaveBeenCalledTimes(1);
    expect(mockedTransactionAggregate).toHaveBeenCalledTimes(1);
    expect(ReferralClick.countDocuments).not.toHaveBeenCalled();
    expect(ReferralClick.distinct).not.toHaveBeenCalled();

    const clickPipeline = mockedClickAggregate.mock.calls[0][0];
    expect(clickPipeline[1].$facet).toHaveProperty('total');
    expect(clickPipeline[1].$facet).toHaveProperty('ips');
    const referralPipeline = mockedReferralAggregate.mock.calls[0][0];
    expect(referralPipeline[1].$facet).toHaveProperty('all');
    expect(referralPipeline[1].$facet).toHaveProperty('converted');
    const transactionPipeline = mockedTransactionAggregate.mock.calls[0][0];
    expect(transactionPipeline[1].$facet).toHaveProperty('pending');
    expect(transactionPipeline[1].$facet).toHaveProperty('approved');
    expect(transactionPipeline[1].$facet).toHaveProperty('reversed');
    expect(transactionPipeline[1].$facet).toHaveProperty('monthly');
  });

  it('returns zeroed stats when there is no activity', async () => {
    mockedClickAggregate.mockResolvedValue([{ total: [], ips: [] }]);
    mockedReferralAggregate.mockResolvedValue([{ all: [], converted: [] }]);
    mockedTransactionAggregate.mockResolvedValue([{ pending: [], approved: [], reversed: [], monthly: [] }]);
    (ReferralTransaction.find as jest.Mock).mockReturnValue(chainable([]));
    (ReferralClick.find as jest.Mock).mockReturnValue(chainable([]));

    const result = await affiliateService.getDashboard(affiliateDoc.user.toString());

    expect(result.stats.totalClicks).toBe(0);
    expect(result.stats.uniqueClicks).toBe(0);
    expect(result.stats.totalReferrals).toBe(0);
    expect(result.stats.convertedReferrals).toBe(0);
    expect(result.stats.pendingCommission).toBe(0);
    expect(result.stats.approvedCommission).toBe(0);
    expect(result.stats.reversedCommission).toBe(0);
    expect(result.stats.withdrawableBalance).toBe(0);
  });
});
