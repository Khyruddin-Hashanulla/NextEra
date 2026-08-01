export const SUBSCRIPTION_PLANS = {
  STARTER: 'starter',
  PRO: 'pro',
  PREMIUM: 'premium',
} as const;

export const SUBSCRIPTION_FEATURES = {
  UNLIMITED_COURSES: 'unlimitedCourses',
  ADVANCED_ANALYTICS: 'advancedAnalytics',
  COUPONS: 'coupons',
  LIVE_CLASSES: 'liveClasses',
  FEATURED_INSTRUCTOR: 'featuredInstructor',
  PRIORITY_SUPPORT: 'prioritySupport',
  UNLIMITED_STORAGE: 'unlimitedStorage',
  PREMIUM_MARKETING: 'premiumMarketing',
} as const;

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS];
export type SubscriptionFeature = (typeof SUBSCRIPTION_FEATURES)[keyof typeof SUBSCRIPTION_FEATURES];

export interface PlanInfo {
  status: 'active' | 'expired' | 'cancelled' | 'none';
  planName?: string;
  endDate?: string | null;
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
}

export const DEFAULT_STARTER_FEATURES: PlanInfo['features'] = {
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

export function isSubscriptionActive(info: PlanInfo): boolean {
  return info.status === 'active';
}

export function hasFeature(info: PlanInfo, feature: keyof PlanInfo['features']): boolean {
  if (!isSubscriptionActive(info) && feature !== 'freeCoursesLimit') return false;
  return Boolean(info.features[feature]);
}

export function getRemainingFreeCourseSlots(info: PlanInfo, publishedCount: number): number {
  if (info.features.unlimitedCourses) return Infinity;
  return Math.max(0, info.features.freeCoursesLimit - publishedCount);
}

export function getUpgradePlanForFeature(feature: keyof PlanInfo['features']): string {
  switch (feature) {
    case 'unlimitedCourses':
    case 'coupons':
    case 'liveClasses':
      return SUBSCRIPTION_PLANS.PRO;
    case 'advancedAnalytics':
      return SUBSCRIPTION_PLANS.PRO;
    case 'featuredInstructor':
    case 'unlimitedStorage':
    case 'premiumMarketing':
      return SUBSCRIPTION_PLANS.PREMIUM;
    default:
      return SUBSCRIPTION_PLANS.PRO;
  }
}

export function getFeatureLabel(feature: keyof PlanInfo['features']): string {
  const labels: Record<keyof PlanInfo['features'], string> = {
    unlimitedCourses: 'Unlimited Paid Courses',
    advancedAnalytics: 'Advanced Analytics',
    coupons: 'Coupons & Promotions',
    liveClasses: 'Live Classes',
    featuredInstructor: 'Featured Instructor',
    prioritySupport: 'Priority Support',
    unlimitedStorage: 'Unlimited Storage',
    premiumMarketing: 'Premium Marketing',
    freeCoursesLimit: 'Free Courses',
    storageLimitMB: 'Storage',
  };
  return labels[feature];
}
