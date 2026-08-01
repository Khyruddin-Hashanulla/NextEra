import { RevenueService, revenueService } from './revenue.service';
import { Course } from '../models/course.model';
import { ApiError } from '../utils/ApiError';

export interface InstructorPlanInfo {
  status: 'active' | 'expired' | 'cancelled' | 'none';
  features: {
    freeCoursesLimit: number;
    unlimitedCourses: boolean;
    storageLimitMB: number;
    advancedAnalytics: boolean;
    coupons: boolean;
    liveClasses: boolean;
    featuredInstructor: boolean;
    prioritySupport: boolean;
    unlimitedStorage: boolean;
    premiumMarketing: boolean;
  };
  planName?: string;
  endDate?: Date | null;
}

const DEFAULT_STARTER_FEATURES = {
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
};

export class SubscriptionPermissionService {
  constructor(private revenueService: RevenueService) {}

  async getInstructorPlanInfo(instructorId: string): Promise<InstructorPlanInfo> {
    const subscription = await this.revenueService.getInstructorSubscription(instructorId);
    const plan = subscription?.plan;
    const features = plan?.features || DEFAULT_STARTER_FEATURES;

    return {
      status: subscription?.status || 'none',
      features: {
        freeCoursesLimit: features.freeCoursesLimit ?? DEFAULT_STARTER_FEATURES.freeCoursesLimit,
        unlimitedCourses: features.unlimitedCourses ?? DEFAULT_STARTER_FEATURES.unlimitedCourses,
        storageLimitMB: features.storageLimitMB ?? DEFAULT_STARTER_FEATURES.storageLimitMB,
        advancedAnalytics: features.advancedAnalytics ?? DEFAULT_STARTER_FEATURES.advancedAnalytics,
        coupons: features.coupons ?? DEFAULT_STARTER_FEATURES.coupons,
        liveClasses: features.liveClasses ?? DEFAULT_STARTER_FEATURES.liveClasses,
        featuredInstructor: features.featuredInstructor ?? DEFAULT_STARTER_FEATURES.featuredInstructor,
        prioritySupport: features.prioritySupport ?? DEFAULT_STARTER_FEATURES.prioritySupport,
        unlimitedStorage: features.unlimitedStorage ?? DEFAULT_STARTER_FEATURES.unlimitedStorage,
        premiumMarketing: features.premiumMarketing ?? DEFAULT_STARTER_FEATURES.premiumMarketing,
      },
      planName: plan?.name,
      endDate: subscription?.endDate,
    };
  }

  isActive(info: InstructorPlanInfo): boolean {
    return info.status === 'active';
  }

  canCreatePaidCourse(info: InstructorPlanInfo): boolean {
    if (!this.isActive(info)) return false;
    return info.features.unlimitedCourses;
  }

  async canPublishCourse(instructorId: string, info: InstructorPlanInfo): Promise<{ allowed: boolean; reason?: string }> {
    if (info.features.unlimitedCourses) {
      return { allowed: true };
    }
    const publishedCount = await Course.countDocuments({
      instructor: instructorId,
      status: 'published',
    });
    if (publishedCount >= info.features.freeCoursesLimit) {
      return {
        allowed: false,
        reason: `You have reached the limit of ${info.features.freeCoursesLimit} published courses. Upgrade to publish more.`,
      };
    }
    return { allowed: true };
  }

  canCreateBundle(info: InstructorPlanInfo): boolean {
    if (!this.isActive(info)) return false;
    return info.features.unlimitedCourses;
  }

  canCreateSubscriptionProduct(info: InstructorPlanInfo): boolean {
    if (!this.isActive(info)) return false;
    return info.features.unlimitedCourses;
  }

  canUseCoupons(info: InstructorPlanInfo): boolean {
    if (!this.isActive(info)) return false;
    return info.features.coupons;
  }

  canScheduleLiveClass(info: InstructorPlanInfo): boolean {
    if (!this.isActive(info)) return false;
    return info.features.liveClasses;
  }

  canAccessAdvancedAnalytics(info: InstructorPlanInfo): boolean {
    if (!this.isActive(info)) return false;
    return info.features.advancedAnalytics;
  }

  canAccessPremiumAnalytics(info: InstructorPlanInfo): boolean {
    if (!this.isActive(info)) return false;
    return info.features.advancedAnalytics && info.features.premiumMarketing;
  }

  canFeatureInstructor(info: InstructorPlanInfo): boolean {
    if (!this.isActive(info)) return false;
    return info.features.featuredInstructor;
  }

  getRemainingPublishedCourseSlots(info: InstructorPlanInfo, publishedCount: number): number {
    if (info.features.unlimitedCourses) return Infinity;
    return Math.max(0, info.features.freeCoursesLimit - publishedCount);
  }

  async requireAdvancedAnalyticsPermission(instructorId: string, info?: InstructorPlanInfo): Promise<void> {
    const planInfo = info || await this.getInstructorPlanInfo(instructorId);
    if (!this.canAccessAdvancedAnalytics(planInfo)) {
      throw ApiError.forbidden('Advanced analytics are available on Pro and Premium plans.');
    }
  }

  async requirePaidCoursePermission(instructorId: string, info?: InstructorPlanInfo): Promise<void> {
    const planInfo = info || await this.getInstructorPlanInfo(instructorId);
    if (!this.canCreatePaidCourse(planInfo)) {
      throw ApiError.forbidden('Upgrade to Pro to create paid courses.');
    }
  }

  async requireCouponPermission(instructorId: string, info?: InstructorPlanInfo): Promise<void> {
    const planInfo = info || await this.getInstructorPlanInfo(instructorId);
    if (!this.canUseCoupons(planInfo)) {
      throw ApiError.forbidden('Coupons are available on the Pro plan. Upgrade to create coupons.');
    }
  }

  async requireLiveClassPermission(instructorId: string, info?: InstructorPlanInfo): Promise<void> {
    const planInfo = info || await this.getInstructorPlanInfo(instructorId);
    if (!this.canScheduleLiveClass(planInfo)) {
      throw ApiError.forbidden('Live classes require a Pro subscription. Upgrade to schedule live classes.');
    }
  }

  async requireBundlePermission(instructorId: string, info?: InstructorPlanInfo): Promise<void> {
    const planInfo = info || await this.getInstructorPlanInfo(instructorId);
    if (!this.canCreateBundle(planInfo)) {
      throw ApiError.forbidden('Bundles are available on the Pro plan. Upgrade to create bundles.');
    }
  }

  async requireSubscriptionProductPermission(instructorId: string, info?: InstructorPlanInfo): Promise<void> {
    const planInfo = info || await this.getInstructorPlanInfo(instructorId);
    if (!this.canCreateSubscriptionProduct(planInfo)) {
      throw ApiError.forbidden('Subscription products are available on the Pro plan.');
    }
  }

  async requirePublishPermission(instructorId: string, info?: InstructorPlanInfo): Promise<void> {
    const planInfo = info || await this.getInstructorPlanInfo(instructorId);
    const { allowed, reason } = await this.canPublishCourse(instructorId, planInfo);
    if (!allowed) {
      throw ApiError.forbidden(reason || 'You have reached the maximum number of published courses.');
    }
  }
}

export const subscriptionPermissionService = new SubscriptionPermissionService(revenueService);
