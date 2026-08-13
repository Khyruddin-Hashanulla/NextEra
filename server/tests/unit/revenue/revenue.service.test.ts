import { RevenueService } from '../../../src/services/revenue.service';

vi.mock('../../../src/models/payment.model', () => ({ Payment: {} }));
vi.mock('../../../src/models/payout.model', () => ({ Payout: {} }));
vi.mock('../../../src/models/platformWallet.model', () => ({ PlatformWallet: {} }));
vi.mock('../../../src/models/affiliate.model', () => ({ Affiliate: {} }));
vi.mock('../../../src/models/featuredPromotion.model', () => ({ FeaturedPromotion: {} }));
vi.mock('../../../src/models/user.model', () => ({ User: {} }));
vi.mock('../../../src/models/course.model', () => ({ Course: {} }));
vi.mock('../../../src/models/liveClass.model', () => ({ LiveClass: {} }));
vi.mock('../../../src/models/coupon.model', () => ({ Coupon: {} }));
vi.mock('../../../src/models/instructorSubscriptionPlan.model', () => ({
  InstructorSubscriptionPlan: {
    findOne: vi.fn(),
    findById: vi.fn(),
    find: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
    create: vi.fn(),
  },
}));
vi.mock('../../../src/models/instructorSubscription.model', () => ({
  InstructorSubscription: { findOne: vi.fn(), countDocuments: vi.fn(), create: vi.fn() },
}));
vi.mock('../../../src/services/payment.service', () => ({ paymentService: {} }));
vi.mock('../../../src/services/entitlement.service', () => ({
  deriveEntitlements: vi.fn(),
  entitlementService: { getEntitlementView: vi.fn() },
  deriveLegacyFeaturesFromEntitlements: vi.fn((ent: any) => ({ derivedFrom: ent })),
}));
vi.mock('../../../src/cache/cache.service', () => ({
  cacheService: { remember: vi.fn(async (_k: unknown, _o: unknown, fn: () => Promise<unknown>) => fn()) },
}));
vi.mock('../../../src/cache/cacheManager', () => ({
  cacheManager: { invalidateRevenueCache: vi.fn(), invalidateInstructorCache: vi.fn() },
}));

import { InstructorSubscriptionPlan } from '../../../src/models/instructorSubscriptionPlan.model';
import { InstructorSubscription } from '../../../src/models/instructorSubscription.model';

const service = new RevenueService();

describe('RevenueService.updateInstructorSubscriptionPlan', () => {
  afterEach(() => vi.clearAllMocks());

  const existingEntitlements = {
    courses: {
      canCreateFree: true,
      canCreatePaid: true,
      maxCreationCount: 10,
      creationWindowDays: 30,
      maxPublishedCourses: 10,
      unlimitedCreationMode: true,
      highCreationCap: 200,
    },
    students: { maxStudents: 5000 },
    revenue: { enabled: true, commissionPercent: 25, instructorSharePercent: 75 },
    storage: { videoGB: 100, materialGB: 50, recordingGB: 10, maxVideoFileSizeMB: 2000 },
    certificates: { enabled: true, qrVerification: true },
    liveClasses: { enabled: true, monthlyLimit: 60, maxDurationMinutes: 180, recording: true },
    analytics: { basic: true, advanced: true, revenue: true, export: true },
    marketing: {
      coupons: true,
      maxActiveCoupons: 50,
      bundles: true,
      instructorSubscriptions: true,
      affiliate: true,
      affiliatePayout: true,
    },
    support: { level: 'dedicated' },
  };

  it('deep-merges a single-field patch without wiping sibling entitlements', async () => {
    vi.mocked(InstructorSubscriptionPlan.findById as never).mockResolvedValue({
      _id: 'plan1',
      entitlements: existingEntitlements,
    });
    vi.mocked(InstructorSubscriptionPlan.findByIdAndUpdate as never).mockResolvedValue({
      _id: 'plan1',
      entitlements: { ...existingEntitlements, courses: { ...existingEntitlements.courses, canCreatePaid: false } },
    });

    await service.updateInstructorSubscriptionPlan('plan1', {
      entitlements: { courses: { canCreatePaid: false } },
    });

    const updateCall = (InstructorSubscriptionPlan.findByIdAndUpdate as any).mock.calls[0][1];
    const merged = updateCall.entitlements;
    // The patch applied...
    expect(merged.courses.canCreatePaid).toBe(false);
    // ...but sibling fields inside `courses` survived.
    expect(merged.courses.unlimitedCreationMode).toBe(true);
    expect(merged.courses.highCreationCap).toBe(200);
    expect(merged.courses.maxCreationCount).toBe(10);
    // Other top-level groups are untouched.
    expect(merged.students.maxStudents).toBe(5000);
    expect(merged.revenue.commissionPercent).toBe(25);
    expect(merged.marketing.maxActiveCoupons).toBe(50);
    expect(merged.support.level).toBe('dedicated');
    // Legacy flat features are re-derived from the merged view.
    expect(updateCall.features).toEqual({ derivedFrom: merged });
  });

  it('replaces top-level groups that are fully provided', async () => {
    vi.mocked(InstructorSubscriptionPlan.findById as never).mockResolvedValue({
      _id: 'plan1',
      entitlements: existingEntitlements,
    });
    vi.mocked(InstructorSubscriptionPlan.findByIdAndUpdate as never).mockResolvedValue({ _id: 'plan1' });

    const fullStudents = { maxStudents: 9000 };
    await service.updateInstructorSubscriptionPlan('plan1', {
      entitlements: { students: fullStudents },
    });

    const updateCall = (InstructorSubscriptionPlan.findByIdAndUpdate as any).mock.calls[0][1];
    expect(updateCall.entitlements.students).toEqual(fullStudents);
    expect(updateCall.entitlements.courses.maxCreationCount).toBe(10);
  });

  it('writes through scalar patches unchanged', async () => {
    vi.mocked(InstructorSubscriptionPlan.findById as never).mockResolvedValue({
      _id: 'plan1',
      entitlements: existingEntitlements,
    });
    vi.mocked(InstructorSubscriptionPlan.findByIdAndUpdate as never).mockResolvedValue({ _id: 'plan1' });

    await service.updateInstructorSubscriptionPlan('plan1', {
      name: 'Pro Plus',
      price: 1499,
    });

    const updateCall = (InstructorSubscriptionPlan.findByIdAndUpdate as any).mock.calls[0][1];
    expect(updateCall.name).toBe('Pro Plus');
    expect(updateCall.price).toBe(1499);
    // No entitlements patch -> features are not re-derived.
    expect(updateCall.features).toBeUndefined();
  });
});

describe('RevenueService.deleteInstructorSubscriptionPlan', () => {
  afterEach(() => vi.clearAllMocks());

  it('blocks deletion when historical subscriptions reference the plan', async () => {
    vi.mocked(InstructorSubscription.countDocuments as never).mockResolvedValue(1);

    await expect(service.deleteInstructorSubscriptionPlan('plan1')).rejects.toThrow(
      'Cannot delete a plan with existing subscription history'
    );
    expect(InstructorSubscriptionPlan.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('deletes the plan when no subscriptions reference it', async () => {
    vi.mocked(InstructorSubscription.countDocuments as never).mockResolvedValue(0);
    vi.mocked(InstructorSubscriptionPlan.findByIdAndDelete as never).mockResolvedValue({ _id: 'plan1' });

    const result = await service.deleteInstructorSubscriptionPlan('plan1');

    expect(InstructorSubscription.countDocuments).toHaveBeenCalledWith({ plan: 'plan1' });
    expect(InstructorSubscriptionPlan.findByIdAndDelete).toHaveBeenCalledWith('plan1');
    expect(result).toEqual({ _id: 'plan1' });
  });

  it('throws when the plan does not exist', async () => {
    vi.mocked(InstructorSubscription.countDocuments as never).mockResolvedValue(0);
    vi.mocked(InstructorSubscriptionPlan.findByIdAndDelete as never).mockResolvedValue(null);

    await expect(service.deleteInstructorSubscriptionPlan('plan1')).rejects.toThrow('Plan not found');
  });
});

describe('RevenueService.listInstructorSubscriptionPlans', () => {
  afterEach(() => vi.clearAllMocks());

  it('normalizes a null legacy features object to an empty object', async () => {
    vi.mocked(InstructorSubscriptionPlan.find as never).mockReturnValue({
      sort: () => ({
        lean: async () => [{ _id: 'plan1', name: 'Pro', features: null, entitlements: undefined }],
      }),
    });

    const plans = await service.listInstructorSubscriptionPlans();

    expect(plans[0].features).toEqual({});
  });
});
