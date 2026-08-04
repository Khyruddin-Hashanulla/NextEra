import { describe, expect, it } from 'vitest';
import {
  SUBSCRIPTION_PLANS,
  DEFAULT_STARTER_FEATURES,
  isSubscriptionActive,
  hasFeature,
  getRemainingFreeCourseSlots,
  getUpgradePlanForFeature,
  getFeatureLabel,
  type PlanInfo,
} from '@/lib/subscription';

const activePlan: PlanInfo = {
  status: 'active',
  planName: 'pro',
  endDate: null,
  features: {
    ...DEFAULT_STARTER_FEATURES,
    unlimitedCourses: true,
    advancedAnalytics: true,
  },
};

const expiredPlan: PlanInfo = {
  ...activePlan,
  status: 'expired',
};

describe('isSubscriptionActive', () => {
  it('returns true when active', () => {
    expect(isSubscriptionActive(activePlan)).toBe(true);
  });

  it('returns false for other statuses', () => {
    expect(isSubscriptionActive(expiredPlan)).toBe(false);
    expect(isSubscriptionActive({ ...activePlan, status: 'cancelled' })).toBe(false);
    expect(isSubscriptionActive({ ...activePlan, status: 'none' })).toBe(false);
  });
});

describe('hasFeature', () => {
  it('allows freeCoursesLimit even when inactive', () => {
    expect(hasFeature(expiredPlan, 'freeCoursesLimit')).toBe(true);
  });

  it('denies paid features when inactive', () => {
    expect(hasFeature(expiredPlan, 'unlimitedCourses')).toBe(false);
  });

  it('reflects feature flags when active', () => {
    expect(hasFeature(activePlan, 'unlimitedCourses')).toBe(true);
    expect(hasFeature(activePlan, 'coupons')).toBe(false);
  });
});

describe('getRemainingFreeCourseSlots', () => {
  it('returns Infinity for unlimited plans', () => {
    expect(getRemainingFreeCourseSlots(activePlan, 5)).toBe(Infinity);
  });

  it('returns remaining slots for limited plans', () => {
    const starter = { ...activePlan, status: 'none' as const, features: { ...DEFAULT_STARTER_FEATURES } };
    expect(getRemainingFreeCourseSlots(starter, 1)).toBe(1);
    expect(getRemainingFreeCourseSlots(starter, 5)).toBe(0);
  });
});

describe('getUpgradePlanForFeature', () => {
  it('maps features to the pro plan', () => {
    expect(getUpgradePlanForFeature('unlimitedCourses')).toBe(SUBSCRIPTION_PLANS.PRO);
    expect(getUpgradePlanForFeature('advancedAnalytics')).toBe(SUBSCRIPTION_PLANS.PRO);
    expect(getUpgradePlanForFeature('coupons')).toBe(SUBSCRIPTION_PLANS.PRO);
    expect(getUpgradePlanForFeature('liveClasses')).toBe(SUBSCRIPTION_PLANS.PRO);
  });

  it('maps premium features to the premium plan', () => {
    expect(getUpgradePlanForFeature('featuredInstructor')).toBe(SUBSCRIPTION_PLANS.PREMIUM);
    expect(getUpgradePlanForFeature('unlimitedStorage')).toBe(SUBSCRIPTION_PLANS.PREMIUM);
    expect(getUpgradePlanForFeature('premiumMarketing')).toBe(SUBSCRIPTION_PLANS.PREMIUM);
  });

  it('defaults unknown features to pro', () => {
    expect(getUpgradePlanForFeature('freeCoursesLimit')).toBe(SUBSCRIPTION_PLANS.PRO);
  });
});

describe('getFeatureLabel', () => {
  it('returns a human-readable label for every feature', () => {
    expect(getFeatureLabel('unlimitedCourses')).toBe('Unlimited Paid Courses');
    expect(getFeatureLabel('storageLimitMB')).toBe('Storage');
    expect(getFeatureLabel('prioritySupport')).toBe('Priority Support');
  });
});
