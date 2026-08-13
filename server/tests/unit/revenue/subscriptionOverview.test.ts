import { RevenueService } from '../../../src/services/revenue.service';

vi.mock('../../../src/models/payment.model', () => ({ Payment: {} }));
vi.mock('../../../src/models/payout.model', () => ({ Payout: {} }));
vi.mock('../../../src/models/platformWallet.model', () => ({ PlatformWallet: {} }));
vi.mock('../../../src/models/affiliate.model', () => ({ Affiliate: {} }));
vi.mock('../../../src/models/featuredPromotion.model', () => ({ FeaturedPromotion: {} }));
vi.mock('../../../src/models/user.model', () => ({ User: {} }));
vi.mock('../../../src/models/course.model', () => ({
  Course: { countDocuments: vi.fn().mockResolvedValue(3) },
}));
vi.mock('../../../src/models/liveClass.model', () => ({
  LiveClass: { countDocuments: vi.fn().mockResolvedValue(2) },
}));
vi.mock('../../../src/models/coupon.model', () => ({
  Coupon: { countDocuments: vi.fn().mockResolvedValue(1) },
}));
vi.mock('../../../src/models/instructorSubscriptionPlan.model', () => ({
  InstructorSubscriptionPlan: { findOne: vi.fn(), findById: vi.fn(), find: vi.fn() },
}));
vi.mock('../../../src/models/instructorSubscription.model', () => ({
  InstructorSubscription: { findOne: vi.fn(), countDocuments: vi.fn(), create: vi.fn() },
}));
vi.mock('../../../src/services/payment.service', () => ({ paymentService: {} }));
vi.mock('../../../src/services/entitlement.service', () => ({
  deriveEntitlements: vi.fn(),
  entitlementService: { getEntitlementView: vi.fn() },
  deriveLegacyFeaturesFromEntitlements: vi.fn(),
}));
vi.mock('../../../src/cache/cache.service', () => ({
  cacheService: { remember: vi.fn(async (_k: unknown, _o: unknown, fn: () => Promise<unknown>) => fn()) },
}));
vi.mock('../../../src/cache/cacheManager', () => ({
  cacheManager: { invalidateRevenueCache: vi.fn(), invalidateInstructorCache: vi.fn() },
}));

import { InstructorSubscription } from '../../../src/models/instructorSubscription.model';
import { deriveEntitlements } from '../../../src/services/entitlement.service';

const service = new RevenueService();

beforeEach(() => {
  vi.mocked(deriveEntitlements as never).mockReturnValue({
    courses: {
      canCreateFree: true,
      canCreatePaid: true,
      maxCreationCount: 10,
      creationWindowDays: 30,
      maxPublishedCourses: 10,
      unlimitedCreationMode: false,
      highCreationCap: 0,
    },
    students: { maxStudents: 1000 },
    revenue: { enabled: false, commissionPercent: 0, instructorSharePercent: 100 },
    storage: { videoGB: 10, materialGB: 5, recordingGB: 2, maxVideoFileSizeMB: 1000 },
    certificates: { enabled: true, qrVerification: true },
    liveClasses: { enabled: true, monthlyLimit: 30, maxDurationMinutes: 120, recording: true },
    analytics: { basic: true, advanced: true, revenue: false, export: true },
    marketing: {
      coupons: true,
      maxActiveCoupons: 10,
      bundles: true,
      instructorSubscriptions: true,
      affiliate: false,
      affiliatePayout: false,
    },
    support: { level: 'standard' },
  });
});

function chain(value: unknown) {
  return {
    populate: () => ({ sort: () => ({ lean: async () => value }) }),
  };
}

describe('RevenueService.getSubscriptionOverview', () => {
  afterEach(() => vi.clearAllMocks());

  it('reports an active subscription when one exists', async () => {
    vi.mocked(InstructorSubscription.findOne as never).mockReturnValueOnce(
      chain({ _id: 's1', status: 'ACTIVE', plan: { code: 'PRO' } }) as never
    );

    const result = await service.getSubscriptionOverview('i1');
    expect(result.status).toBe('active');
    expect(result.plan.code).toBe('PRO');
    expect(InstructorSubscription.findOne).toHaveBeenCalledTimes(1);
  });

  it('reports cancelled when no active sub exists but a cancelled one is in history', async () => {
    vi.mocked(InstructorSubscription.findOne as never)
      .mockReturnValueOnce(chain(null) as never)
      .mockReturnValueOnce(chain({ _id: 's2', status: 'CANCELLED', plan: { code: 'PRO' } }) as never);

    const result = await service.getSubscriptionOverview('i1');
    expect(result.status).toBe('cancelled');
    expect(result.plan.code).toBe('PRO');
    expect(result.subscription).toBeNull();
  });

  it('reports expired when the latest historical record is expired', async () => {
    vi.mocked(InstructorSubscription.findOne as never)
      .mockReturnValueOnce(chain(null) as never)
      .mockReturnValueOnce(chain({ _id: 's3', status: 'EXPIRED', plan: { code: 'LEGACY' } }) as never);

    const result = await service.getSubscriptionOverview('i1');
    expect(result.status).toBe('expired');
  });

  it('reports none when the instructor has no subscription history at all', async () => {
    vi.mocked(InstructorSubscription.findOne as never).mockReturnValue(chain(null) as never);

    const result = await service.getSubscriptionOverview('i1');
    expect(result.status).toBe('none');
    expect(result.plan).toBeNull();
  });
});
