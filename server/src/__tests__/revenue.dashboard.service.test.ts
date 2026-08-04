import { revenueService } from '../services/revenue.service';
import { cacheService } from '../cache/cache.service';
import { Payment } from '../models/payment.model';
import { Payout } from '../models/payout.model';
import { PlatformWallet } from '../models/platformWallet.model';
import { InstructorSubscription } from '../models/instructorSubscription.model';
import { FeaturedPromotion } from '../models/featuredPromotion.model';

jest.mock('../models/payment.model', () => ({
  Payment: { aggregate: jest.fn(), find: jest.fn(), findById: jest.fn() },
}));
jest.mock('../models/payout.model', () => ({
  Payout: { aggregate: jest.fn(), find: jest.fn(), findById: jest.fn() },
}));
jest.mock('../models/platformWallet.model', () => ({
  PlatformWallet: { findOne: jest.fn(), create: jest.fn() },
}));
jest.mock('../models/instructorSubscription.model', () => ({
  InstructorSubscription: { countDocuments: jest.fn(), aggregate: jest.fn(), findOne: jest.fn(), create: jest.fn() },
}));
jest.mock('../models/featuredPromotion.model', () => ({
  FeaturedPromotion: { countDocuments: jest.fn() },
}));

const mockedPaymentAggregate = Payment.aggregate as jest.Mock;
const mockedPayoutAggregate = Payout.aggregate as jest.Mock;

const walletDoc = {
  totalRevenue: 1000,
  totalCommissionCollected: 250,
  totalPayoutsMade: 400,
  currentBalance: 600,
  pendingPayouts: 50,
};

describe('RevenueService.getRevenueDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    void cacheService.invalidatePattern('revenue:*');
    void cacheService.invalidatePattern('admin:*');
    (PlatformWallet.findOne as jest.Mock).mockResolvedValue(walletDoc);
  });

  it('merges all payment aggregates into a single $facet and preserves the response', async () => {
    mockedPaymentAggregate.mockResolvedValue([
      {
        dailyRevenue: [{ _id: '2026-08-01', amount: 100, count: 1 }],
        revenueBySource: [{ _id: 'course', amount: 90, count: 1, commission: 20 }],
        monthlyTrend: [{ _id: '2026-08', amount: 100, commission: 20, instructorShare: 70 }],
        instructorSubscriptionRevenue: [{ _id: null, amount: 50 }],
        featuredPromotionRevenue: [{ _id: null, amount: 30 }],
      },
    ]);
    mockedPayoutAggregate.mockResolvedValue([
      { _id: 'i1', instructor: { name: 'Ins', email: 'e@x.com', avatar: {} }, totalPaid: 200 },
    ]);
    (InstructorSubscription.countDocuments as jest.Mock).mockResolvedValue(5);
    (FeaturedPromotion.countDocuments as jest.Mock).mockResolvedValue(2);

    const result = await revenueService.getRevenueDashboard();

    expect(result.wallet).toEqual(walletDoc);
    expect(result.dailyRevenue).toEqual([{ _id: '2026-08-01', amount: 100, count: 1 }]);
    expect(result.revenueBySource).toEqual([{ _id: 'course', amount: 90, count: 1, commission: 20 }]);
    expect(result.monthlyTrend).toEqual([{ _id: '2026-08', amount: 100, commission: 20, instructorShare: 70 }]);
    expect(result.instructorSubscriptionRevenue).toBe(50);
    expect(result.featuredPromotionRevenue).toBe(30);
    expect(result.activeInstructorSubscriptions).toBe(5);
    expect(result.activePromotions).toBe(2);
    expect(result.topInstructors).toHaveLength(1);

    expect(mockedPaymentAggregate).toHaveBeenCalledTimes(1);
    expect(mockedPayoutAggregate).toHaveBeenCalledTimes(1);
    const pipeline = mockedPaymentAggregate.mock.calls[0][0];
    expect(pipeline[0].$facet).toHaveProperty('dailyRevenue');
    expect(pipeline[0].$facet).toHaveProperty('revenueBySource');
    expect(pipeline[0].$facet).toHaveProperty('monthlyTrend');
    expect(pipeline[0].$facet).toHaveProperty('instructorSubscriptionRevenue');
    expect(pipeline[0].$facet).toHaveProperty('featuredPromotionRevenue');
  });
});

describe('RevenueService.getRevenueSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    void cacheService.invalidatePattern('revenue:*');
    void cacheService.invalidatePattern('admin:*');
  });

  it('computes all revenue totals from one payment $facet and one payout aggregate', async () => {
    mockedPaymentAggregate.mockResolvedValue([
      {
        totalRevenue: [{ _id: null, amount: 1000, count: 10 }],
        totalCommissions: [{ _id: null, amount: 250 }],
        instructorSubscriptions: [{ _id: null, amount: 100 }],
        featuredPromotions: [{ _id: null, amount: 50 }],
      },
    ]);
    mockedPayoutAggregate.mockResolvedValue([{ _id: null, amount: 400 }]);

    const result = await revenueService.getRevenueSummary();

    expect(result.totalRevenue).toBe(1000);
    expect(result.totalTransactions).toBe(10);
    expect(result.totalCommissions).toBe(250);
    expect(result.totalPayouts).toBe(400);
    expect(result.instructorSubscriptionRevenue).toBe(100);
    expect(result.featuredPromotionRevenue).toBe(50);

    expect(mockedPaymentAggregate).toHaveBeenCalledTimes(1);
    expect(mockedPayoutAggregate).toHaveBeenCalledTimes(1);
    const pipeline = mockedPaymentAggregate.mock.calls[0][0];
    expect(pipeline[0].$facet).toHaveProperty('totalRevenue');
    expect(pipeline[0].$facet).toHaveProperty('totalCommissions');
    expect(pipeline[0].$facet).toHaveProperty('instructorSubscriptions');
    expect(pipeline[0].$facet).toHaveProperty('featuredPromotions');
  });
});
