import { SubscriptionPermissionService, InstructorPlanInfo } from '../services/subscriptionPermission.service';
import { RevenueService } from '../services/revenue.service';

const mockRevenueService = {
  getInstructorSubscription: jest.fn(),
} as unknown as jest.Mocked<RevenueService>;

const QUOTA_FIXTURES = {
  starter: (overrides = {}): InstructorPlanInfo => ({
    status: 'none',
    features: {
      freeCoursesLimit: 2,
      unlimitedCourses: false,
      storageLimitMB: 500,
      advancedAnalytics: false,
      coupons: false,
      liveClasses: false,
      featuredInstructor: false,
      prioritySupport: false,
      unlimitedStorage: false,
      premiumMarketing: false,
    },
    ...overrides,
  }),
  pro: (overrides = {}): InstructorPlanInfo => ({
    status: 'active',
    planName: 'Pro',
    features: {
      freeCoursesLimit: 10,
      unlimitedCourses: true,
      storageLimitMB: 5000,
      advancedAnalytics: true,
      coupons: true,
      liveClasses: true,
      featuredInstructor: false,
      prioritySupport: true,
      unlimitedStorage: false,
      premiumMarketing: false,
    },
    ...overrides,
  }),
  premium: (overrides = {}): InstructorPlanInfo => ({
    status: 'active',
    planName: 'Premium',
    features: {
      freeCoursesLimit: 100,
      unlimitedCourses: true,
      storageLimitMB: 10000,
      advancedAnalytics: true,
      coupons: true,
      liveClasses: true,
      featuredInstructor: true,
      prioritySupport: true,
      unlimitedStorage: true,
      premiumMarketing: true,
    },
    ...overrides,
  }),
};

jest.mock('../models/course.model', () => ({
  Course: { countDocuments: jest.fn() },
}));

import { Course } from '../models/course.model';

let service: SubscriptionPermissionService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new SubscriptionPermissionService(mockRevenueService);
});

describe('SubscriptionPermissionService', () => {
  describe('isActive', () => {
    it('returns true for active status', () => {
      expect(service.isActive(QUOTA_FIXTURES.pro())).toBe(true);
    });

    it('returns false for expired status', () => {
      expect(service.isActive(QUOTA_FIXTURES.starter({ status: 'expired' }))).toBe(false);
    });

    it('returns false for cancelled status', () => {
      expect(service.isActive(QUOTA_FIXTURES.starter({ status: 'cancelled' }))).toBe(false);
    });

    it('returns false for none status', () => {
      expect(service.isActive(QUOTA_FIXTURES.starter())).toBe(false);
    });
  });

  describe('canCreatePaidCourse', () => {
    it('allows paid course creation with unlimitedCourses feature', () => {
      expect(service.canCreatePaidCourse(QUOTA_FIXTURES.pro())).toBe(true);
      expect(service.canCreatePaidCourse(QUOTA_FIXTURES.premium())).toBe(true);
    });

    it('denies paid course creation for starter plan', () => {
      expect(service.canCreatePaidCourse(QUOTA_FIXTURES.starter())).toBe(false);
    });

    it('denies paid course creation for inactive plans even with unlimitedCourses', () => {
      expect(service.canCreatePaidCourse(QUOTA_FIXTURES.pro({ status: 'expired' }))).toBe(false);
    });
  });

  describe('canPublishCourse', () => {
    beforeEach(() => {
      (Course.countDocuments as jest.Mock).mockResolvedValue(0);
    });

    it('allows unlimited courses with pro plan', async () => {
      const result = await service.canPublishCourse('instructor1', QUOTA_FIXTURES.pro());
      expect(result.allowed).toBe(true);
    });

    it('allows publishing when under the free course limit', async () => {
      (Course.countDocuments as jest.Mock).mockResolvedValue(1);
      const result = await service.canPublishCourse('instructor1', QUOTA_FIXTURES.starter());
      expect(result.allowed).toBe(true);
    });

    it('denies publishing when at the free course limit', async () => {
      (Course.countDocuments as jest.Mock).mockResolvedValue(2);
      const result = await service.canPublishCourse('instructor1', QUOTA_FIXTURES.starter());
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('limit');
    });

    it('denies publishing when over the free course limit', async () => {
      (Course.countDocuments as jest.Mock).mockResolvedValue(5);
      const result = await service.canPublishCourse('instructor1', QUOTA_FIXTURES.starter());
      expect(result.allowed).toBe(false);
    });
  });

  describe('canUseCoupons', () => {
    it('allows coupons for pro plan', () => {
      expect(service.canUseCoupons(QUOTA_FIXTURES.pro())).toBe(true);
    });

    it('denies coupons for starter', () => {
      expect(service.canUseCoupons(QUOTA_FIXTURES.starter())).toBe(false);
    });

    it('denies coupons for expired pro plan', () => {
      expect(service.canUseCoupons(QUOTA_FIXTURES.pro({ status: 'expired' }))).toBe(false);
    });
  });

  describe('canScheduleLiveClass', () => {
    it('allows live classes for pro', () => {
      expect(service.canScheduleLiveClass(QUOTA_FIXTURES.pro())).toBe(true);
    });

    it('denies live classes for starter', () => {
      expect(service.canScheduleLiveClass(QUOTA_FIXTURES.starter())).toBe(false);
    });
  });

  describe('canAccessAdvancedAnalytics', () => {
    it('allows analytics for pro', () => {
      expect(service.canAccessAdvancedAnalytics(QUOTA_FIXTURES.pro())).toBe(true);
    });

    it('denies analytics for starter', () => {
      expect(service.canAccessAdvancedAnalytics(QUOTA_FIXTURES.starter())).toBe(false);
    });

    it('denies analytics for expired plans', () => {
      expect(service.canAccessAdvancedAnalytics(QUOTA_FIXTURES.pro({ status: 'expired' }))).toBe(false);
    });
  });

  describe('canCreateBundle', () => {
    it('allows bundles for pro', () => {
      expect(service.canCreateBundle(QUOTA_FIXTURES.pro())).toBe(true);
    });

    it('denies bundles for starter', () => {
      expect(service.canCreateBundle(QUOTA_FIXTURES.starter())).toBe(false);
    });
  });

  describe('canAccessPremiumAnalytics', () => {
    it('allows premium analytics for premium plan', () => {
      expect(service.canAccessPremiumAnalytics(QUOTA_FIXTURES.premium())).toBe(true);
    });

    it('denies premium analytics for pro plan (lacks premiumMarketing)', () => {
      expect(service.canAccessPremiumAnalytics(QUOTA_FIXTURES.pro())).toBe(false);
    });
  });

  describe('canFeatureInstructor', () => {
    it('allows featured instructor for premium', () => {
      expect(service.canFeatureInstructor(QUOTA_FIXTURES.premium())).toBe(true);
    });

    it('denies featured instructor for pro', () => {
      expect(service.canFeatureInstructor(QUOTA_FIXTURES.pro())).toBe(false);
    });
  });

  describe('getRemainingPublishedCourseSlots', () => {
    it('returns Infinity for pro plan', () => {
      expect(service.getRemainingPublishedCourseSlots(QUOTA_FIXTURES.pro(), 0)).toBe(Infinity);
    });

    it('returns remaining slots for starter plan', () => {
      expect(service.getRemainingPublishedCourseSlots(QUOTA_FIXTURES.starter(), 1)).toBe(1);
      expect(service.getRemainingPublishedCourseSlots(QUOTA_FIXTURES.starter(), 2)).toBe(0);
    });

    it('returns 0 when over limit', () => {
      expect(service.getRemainingPublishedCourseSlots(QUOTA_FIXTURES.starter(), 5)).toBe(0);
    });
  });

  describe('getInstructorPlanInfo', () => {
    it('returns starter defaults when no subscription exists', async () => {
      mockRevenueService.getInstructorSubscription.mockResolvedValue(null);
      const info = await service.getInstructorPlanInfo('instructor1');
      expect(info.status).toBe('none');
      expect(info.features.unlimitedCourses).toBe(false);
      expect(info.features.freeCoursesLimit).toBe(2);
    });

    it('returns active subscription plan features', async () => {
      mockRevenueService.getInstructorSubscription.mockResolvedValue({
        status: 'active',
        plan: {
          name: 'Pro',
          features: {
            freeCoursesLimit: 10,
            unlimitedCourses: true,
            storageLimitMB: 5000,
            advancedAnalytics: true,
            coupons: true,
            liveClasses: true,
            featuredInstructor: false,
            prioritySupport: true,
            unlimitedStorage: false,
            premiumMarketing: false,
          },
        },
        endDate: new Date('2026-12-31'),
      });
      const info = await service.getInstructorPlanInfo('instructor1');
      expect(info.status).toBe('active');
      expect(info.planName).toBe('Pro');
      expect(info.features.unlimitedCourses).toBe(true);
      expect(info.features.coupons).toBe(true);
    });

    it('returns expired status for non-active subscription with a plan', async () => {
      mockRevenueService.getInstructorSubscription.mockResolvedValue({
        status: 'expired',
        plan: { name: 'Pro', features: { unlimitedCourses: true } },
      });
      const info = await service.getInstructorPlanInfo('instructor1');
      expect(info.status).toBe('expired');
    });
  });
});

describe('SubscriptionPermissionService — require* methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    service = new SubscriptionPermissionService(mockRevenueService);
  });

  describe('requirePaidCoursePermission', () => {
    it('passes for pro plan', async () => {
      await expect(service.requirePaidCoursePermission('instr1', QUOTA_FIXTURES.pro())).resolves.toBeUndefined();
    });

    it('throws for starter plan', async () => {
      await expect(service.requirePaidCoursePermission('instr1', QUOTA_FIXTURES.starter())).rejects.toThrow(
        'Upgrade to Pro'
      );
    });

    it('throws for expired pro plan', async () => {
      await expect(
        service.requirePaidCoursePermission('instr1', QUOTA_FIXTURES.pro({ status: 'expired' }))
      ).rejects.toThrow('Upgrade to Pro');
    });
  });

  describe('requirePublishPermission', () => {
    beforeEach(() => {
      (Course.countDocuments as jest.Mock).mockResolvedValue(0);
    });

    it('passes for pro plan with unlimited courses', async () => {
      await expect(service.requirePublishPermission('instr1', QUOTA_FIXTURES.pro())).resolves.toBeUndefined();
    });

    it('passes for starter plan under limit', async () => {
      (Course.countDocuments as jest.Mock).mockResolvedValue(1);
      await expect(service.requirePublishPermission('instr1', QUOTA_FIXTURES.starter())).resolves.toBeUndefined();
    });

    it('throws for starter plan at limit', async () => {
      (Course.countDocuments as jest.Mock).mockResolvedValue(2);
      await expect(service.requirePublishPermission('instr1', QUOTA_FIXTURES.starter())).rejects.toThrow('limit');
    });
  });

  describe('requireCouponPermission', () => {
    it('passes for pro', async () => {
      await expect(service.requireCouponPermission('instr1', QUOTA_FIXTURES.pro())).resolves.toBeUndefined();
    });

    it('throws for starter', async () => {
      await expect(service.requireCouponPermission('instr1', QUOTA_FIXTURES.starter())).rejects.toThrow('Coupons');
    });
  });

  describe('requireLiveClassPermission', () => {
    it('passes for pro', async () => {
      await expect(service.requireLiveClassPermission('instr1', QUOTA_FIXTURES.pro())).resolves.toBeUndefined();
    });

    it('throws for starter', async () => {
      await expect(service.requireLiveClassPermission('instr1', QUOTA_FIXTURES.starter())).rejects.toThrow(
        'Live classes'
      );
    });
  });

  describe('requireBundlePermission', () => {
    it('passes for pro', async () => {
      await expect(service.requireBundlePermission('instr1', QUOTA_FIXTURES.pro())).resolves.toBeUndefined();
    });

    it('throws for starter', async () => {
      await expect(service.requireBundlePermission('instr1', QUOTA_FIXTURES.starter())).rejects.toThrow('Bundles');
    });
  });

  describe('requireAdvancedAnalyticsPermission', () => {
    it('passes for pro', async () => {
      await expect(service.requireAdvancedAnalyticsPermission('instr1', QUOTA_FIXTURES.pro())).resolves.toBeUndefined();
    });

    it('throws for starter', async () => {
      await expect(service.requireAdvancedAnalyticsPermission('instr1', QUOTA_FIXTURES.starter())).rejects.toThrow(
        'analytics'
      );
    });
  });

  describe('require* methods fetch planInfo when not provided', () => {
    it('requirePaidCoursePermission fetches planInfo if omitted', async () => {
      mockRevenueService.getInstructorSubscription.mockResolvedValue({
        status: 'active',
        plan: { name: 'Pro', features: { unlimitedCourses: true } },
      });
      await expect(service.requirePaidCoursePermission('instr1')).resolves.toBeUndefined();
    });

    it('requirePaidCoursePermission throws when fetcher returns starter', async () => {
      mockRevenueService.getInstructorSubscription.mockResolvedValue(null);
      await expect(service.requirePaidCoursePermission('instr1')).rejects.toThrow('Upgrade to Pro');
    });
  });
});
