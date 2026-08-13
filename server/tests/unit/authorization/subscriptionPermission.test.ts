import { ApiError } from '../../../src/utils/ApiError';
import {
  SubscriptionPermissionService,
  InstructorPlanInfo,
} from '../../../src/services/subscriptionPermission.service';
import { Course } from '../../../src/models/course.model';
import { starterPlan, proPlan, expiredPlan, nonePlan } from '../../fixtures/plans';

vi.mock('../../../src/models/course.model', () => ({
  Course: { countDocuments: vi.fn() },
}));

function createService(subscription?: unknown): SubscriptionPermissionService {
  const fakeRevenue = {
    getInstructorSubscription: vi.fn().mockResolvedValue(subscription ?? null),
  };
  return new SubscriptionPermissionService(fakeRevenue as never);
}

describe('getInstructorPlanInfo', () => {
  it('returns defaults when no subscription exists', async () => {
    const service = createService();
    const info = await service.getInstructorPlanInfo('instructor-1');
    expect(info.status).toBe('none');
    expect(info.features.freeCoursesLimit).toBe(2);
    expect(info.features.unlimitedCourses).toBe(false);
    expect(info.features.coupons).toBe(false);
    expect(info.endDate).toBeUndefined();
  });

  it('merges subscription features over defaults', async () => {
    const service = createService({
      status: 'active',
      plan: {
        name: 'Pro',
        features: { unlimitedCourses: true, advancedAnalytics: true },
      },
      endDate: new Date('2027-01-01'),
    });
    const info = await service.getInstructorPlanInfo('instructor-1');
    expect(info.status).toBe('active');
    expect(info.planName).toBe('Pro');
    expect(info.features.unlimitedCourses).toBe(true);
    expect(info.features.advancedAnalytics).toBe(true);
    expect(info.features.coupons).toBe(false);
    expect(info.endDate).toEqual(new Date('2027-01-01'));
  });
});

describe('isActive', () => {
  const service = createService();
  it('returns true only for active status', () => {
    expect(service.isActive(starterPlan)).toBe(true);
    expect(service.isActive(proPlan)).toBe(true);
    expect(service.isActive(expiredPlan)).toBe(false);
    expect(service.isActive(nonePlan)).toBe(false);
  });
});

describe('plan feature gates', () => {
  const service = createService();

  it('canCreatePaidCourse requires an active unlimited plan', () => {
    expect(service.canCreatePaidCourse(proPlan)).toBe(true);
    expect(service.canCreatePaidCourse(starterPlan)).toBe(false);
    expect(service.canCreatePaidCourse(expiredPlan)).toBe(false);
  });

  it('canCreateBundle mirrors canCreatePaidCourse', () => {
    expect(service.canCreateBundle(proPlan)).toBe(true);
    expect(service.canCreateBundle(starterPlan)).toBe(false);
  });

  it('canCreateSubscriptionProduct requires unlimited courses', () => {
    expect(service.canCreateSubscriptionProduct(proPlan)).toBe(true);
    expect(service.canCreateSubscriptionProduct(starterPlan)).toBe(false);
  });

  it('canUseCoupons is true only for plans with coupons', () => {
    expect(service.canUseCoupons(proPlan)).toBe(true);
    expect(service.canUseCoupons(starterPlan)).toBe(false);
    expect(service.canUseCoupons(expiredPlan)).toBe(false);
  });

  it('canScheduleLiveClass is true only for plans with live classes', () => {
    expect(service.canScheduleLiveClass(proPlan)).toBe(true);
    expect(service.canScheduleLiveClass(starterPlan)).toBe(false);
  });

  it('canAccessAdvancedAnalytics is true only for analytics plans', () => {
    expect(service.canAccessAdvancedAnalytics(proPlan)).toBe(true);
    expect(service.canAccessAdvancedAnalytics(starterPlan)).toBe(false);
  });

  it('canAccessPremiumAnalytics requires both analytics and marketing', () => {
    expect(service.canAccessPremiumAnalytics(proPlan)).toBe(true);
    const analyticsOnly: InstructorPlanInfo = {
      ...starterPlan,
      features: { ...starterPlan.features, advancedAnalytics: true, premiumMarketing: false },
    };
    expect(service.canAccessPremiumAnalytics(analyticsOnly)).toBe(false);
  });

  it('canFeatureInstructor requires the featured feature', () => {
    expect(service.canFeatureInstructor(proPlan)).toBe(true);
    expect(service.canFeatureInstructor(starterPlan)).toBe(false);
  });
});

describe('getRemainingPublishedCourseSlots', () => {
  const service = createService();
  it('returns Infinity for unlimited plans', () => {
    expect(service.getRemainingPublishedCourseSlots(proPlan, 3)).toBe(Infinity);
  });

  it('returns remaining slots for limited plans', () => {
    expect(service.getRemainingPublishedCourseSlots(starterPlan, 1)).toBe(1);
    expect(service.getRemainingPublishedCourseSlots(starterPlan, 2)).toBe(0);
  });

  it('never goes below zero', () => {
    expect(service.getRemainingPublishedCourseSlots(starterPlan, 10)).toBe(0);
  });
});

describe('canPublishCourse', () => {
  const service = createService();
  afterEach(() => vi.clearAllMocks());

  it('allows publishing when unlimited', async () => {
    await expect(service.canPublishCourse('i1', proPlan)).resolves.toEqual({ allowed: true });
    expect(Course.countDocuments).not.toHaveBeenCalled();
  });

  it('allows publishing below the limit', async () => {
    vi.mocked(Course.countDocuments as never).mockResolvedValue(1);
    await expect(service.canPublishCourse('i1', starterPlan)).resolves.toEqual({ allowed: true });
    expect(Course.countDocuments).toHaveBeenCalledWith({ instructor: 'i1', status: 'published' });
  });

  it('blocks publishing at the limit', async () => {
    vi.mocked(Course.countDocuments as never).mockResolvedValue(2);
    const result = await service.canPublishCourse('i1', starterPlan);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('limit of 2 published courses');
  });
});

describe('require* permission methods', () => {
  const service = createService();

  it('requireAdvancedAnalyticsPermission throws for non-analytics plans', async () => {
    await expect(service.requireAdvancedAnalyticsPermission('i1', starterPlan)).rejects.toThrow(ApiError);
    await expect(service.requireAdvancedAnalyticsPermission('i1', proPlan)).resolves.toBeUndefined();
  });

  it('requirePaidCoursePermission throws for limited plans', async () => {
    await expect(service.requirePaidCoursePermission('i1', starterPlan)).rejects.toThrow('Upgrade to Pro');
    await expect(service.requirePaidCoursePermission('i1', proPlan)).resolves.toBeUndefined();
  });

  it('requireCouponPermission throws without the coupon feature', async () => {
    await expect(service.requireCouponPermission('i1', starterPlan)).rejects.toThrow('Coupons');
    await expect(service.requireCouponPermission('i1', proPlan)).resolves.toBeUndefined();
  });

  it('requireLiveClassPermission throws without live classes', async () => {
    await expect(service.requireLiveClassPermission('i1', starterPlan)).rejects.toThrow('Live classes');
    await expect(service.requireLiveClassPermission('i1', proPlan)).resolves.toBeUndefined();
  });

  it('requireBundlePermission throws for non-unlimited plans', async () => {
    await expect(service.requireBundlePermission('i1', starterPlan)).rejects.toThrow('Bundles');
    await expect(service.requireBundlePermission('i1', proPlan)).resolves.toBeUndefined();
  });

  it('requireSubscriptionProductPermission throws for non-unlimited plans', async () => {
    await expect(service.requireSubscriptionProductPermission('i1', starterPlan)).rejects.toThrow(
      'Subscription products'
    );
    await expect(service.requireSubscriptionProductPermission('i1', proPlan)).resolves.toBeUndefined();
  });

  it('requirePublishPermission throws when the publish limit is reached', async () => {
    vi.mocked(Course.countDocuments as never).mockResolvedValue(2);
    await expect(service.requirePublishPermission('i1', starterPlan)).rejects.toThrow(ApiError);
    vi.mocked(Course.countDocuments as never).mockResolvedValue(1);
    await expect(service.requirePublishPermission('i1', starterPlan)).resolves.toBeUndefined();
  });
});
