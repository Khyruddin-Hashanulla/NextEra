import type { InstructorPlanInfo } from '../../src/services/subscriptionPermission.service';

export const starterPlan: InstructorPlanInfo = {
  status: 'active',
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
  planName: 'Starter',
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
};

export const proPlan: InstructorPlanInfo = {
  status: 'active',
  features: {
    freeCoursesLimit: 0,
    unlimitedCourses: true,
    storageLimitMB: 100 * 1024,
    advancedAnalytics: true,
    coupons: true,
    liveClasses: true,
    featuredInstructor: true,
    prioritySupport: true,
    unlimitedStorage: false,
    premiumMarketing: true,
  },
  planName: 'Pro',
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
};

export const expiredPlan: InstructorPlanInfo = {
  status: 'expired',
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
  planName: 'Starter',
  endDate: new Date(Date.now() - 1000),
};

export const nonePlan: InstructorPlanInfo = {
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
  planName: undefined,
  endDate: null,
};
