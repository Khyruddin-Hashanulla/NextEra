import { IPlanEntitlements, IPlanLegacyFeatures } from '../models/instructorSubscriptionPlan.model';

/**
 * Canonical default instructor plan configurations.
 *
 * These are DEFAULT values used by the opt-in `--seed-plans` script. The admin
 * can customize any of these values at runtime; the seed script only fills in
 * fields that are absent, and never silently overwrites existing values.
 *
 * The structured `entitlements` block is the source of truth for permission and
 * limit enforcement. `legacyFeatures` mirrors the old flat feature object so
 * existing frontend/admin surfaces keep rendering until they are migrated.
 */
export interface DefaultPlanSeed {
  code: string;
  name: string;
  type: 'free' | 'paid';
  price: number;
  discountPrice: number;
  durationDays: number;
  description: string;
  sortOrder: number;
  isDefaultForFree: boolean;
  entitlements: IPlanEntitlements;
  legacyFeatures: IPlanLegacyFeatures;
}

export const CANONICAL_PLAN_CODES = ['STARTER', 'GROWTH', 'PRO', 'ELITE'] as const;
export type CanonicalPlanCode = (typeof CANONICAL_PLAN_CODES)[number];

export const STARTER = 'STARTER' as const;
export const GROWTH = 'GROWTH' as const;
export const PRO = 'PRO' as const;
export const ELITE = 'ELITE' as const;

export const DEFAULT_INSTRUCTOR_PLANS: Record<CanonicalPlanCode, DefaultPlanSeed> = {
  [STARTER]: {
    code: STARTER,
    name: 'Starter',
    type: 'free',
    price: 0,
    discountPrice: 0,
    durationDays: 30,
    description: 'Free plan for every new instructor. Host up to 2 free courses with basic tools.',
    sortOrder: 1,
    isDefaultForFree: true,
    entitlements: {
      courses: {
        canCreateFree: true,
        canCreatePaid: false,
        maxCreationCount: 2,
        creationWindowDays: 30,
        maxPublishedCourses: 2,
        unlimitedCreationMode: false,
        highCreationCap: 0,
      },
      students: { maxStudents: 100 },
      revenue: { enabled: false, commissionPercent: 0, instructorSharePercent: 0 },
      storage: { videoGB: 2, materialGB: 1, recordingGB: 0, maxVideoFileSizeMB: 500, unlimited: false },
      certificates: { enabled: false, qrVerification: false },
      liveClasses: { enabled: false, monthlyLimit: 0, maxDurationMinutes: 0, recording: false },
      analytics: { basic: true, advanced: false, revenue: false, export: false },
      marketing: {
        coupons: false,
        maxActiveCoupons: 0,
        bundles: false,
        instructorSubscriptions: false,
        affiliate: false,
        affiliatePayout: false,
      },
      support: { level: 'none' },
    },
    legacyFeatures: {
      freeCoursesLimit: 2,
      unlimitedCourses: false,
      storageLimitMB: 2000,
      advancedAnalytics: false,
      coupons: false,
      liveClasses: false,
      featuredInstructor: false,
      prioritySupport: false,
      unlimitedStorage: false,
      premiumMarketing: false,
    },
  },
  [GROWTH]: {
    code: GROWTH,
    name: 'Growth',
    type: 'paid',
    price: 499,
    discountPrice: 0,
    durationDays: 30,
    description: 'Sell courses, run live classes, and issue certificates.',
    sortOrder: 2,
    isDefaultForFree: false,
    entitlements: {
      courses: {
        canCreateFree: true,
        canCreatePaid: true,
        maxCreationCount: 5,
        creationWindowDays: 30,
        maxPublishedCourses: 5,
        unlimitedCreationMode: false,
        highCreationCap: 0,
      },
      students: { maxStudents: 500 },
      revenue: { enabled: true, commissionPercent: 25, instructorSharePercent: 75 },
      storage: { videoGB: 10, materialGB: 5, recordingGB: 5, maxVideoFileSizeMB: 1024, unlimited: false },
      certificates: { enabled: true, qrVerification: true },
      liveClasses: { enabled: true, monthlyLimit: 4, maxDurationMinutes: 60, recording: true },
      analytics: { basic: true, advanced: false, revenue: false, export: false },
      marketing: {
        coupons: true,
        maxActiveCoupons: 5,
        bundles: false,
        instructorSubscriptions: false,
        affiliate: false,
        affiliatePayout: false,
      },
      support: { level: 'email' },
    },
    legacyFeatures: {
      freeCoursesLimit: 5,
      unlimitedCourses: false,
      storageLimitMB: 15000,
      advancedAnalytics: false,
      coupons: true,
      liveClasses: true,
      featuredInstructor: false,
      prioritySupport: false,
      unlimitedStorage: false,
      premiumMarketing: false,
    },
  },
  [PRO]: {
    code: PRO,
    name: 'Pro',
    type: 'paid',
    price: 999,
    discountPrice: 0,
    durationDays: 30,
    description: 'Serious creators: advanced analytics, coupons, bundles, and more.',
    sortOrder: 3,
    isDefaultForFree: false,
    entitlements: {
      courses: {
        canCreateFree: true,
        canCreatePaid: true,
        maxCreationCount: 15,
        creationWindowDays: 30,
        maxPublishedCourses: 15,
        unlimitedCreationMode: false,
        highCreationCap: 0,
      },
      students: { maxStudents: 2000 },
      revenue: { enabled: true, commissionPercent: 20, instructorSharePercent: 80 },
      storage: { videoGB: 50, materialGB: 20, recordingGB: 25, maxVideoFileSizeMB: 2048, unlimited: false },
      certificates: { enabled: true, qrVerification: true },
      liveClasses: { enabled: true, monthlyLimit: 15, maxDurationMinutes: 120, recording: true },
      analytics: { basic: true, advanced: true, revenue: true, export: true },
      marketing: {
        coupons: true,
        maxActiveCoupons: 20,
        bundles: true,
        instructorSubscriptions: true,
        affiliate: true,
        affiliatePayout: true,
      },
      support: { level: 'priority' },
    },
    legacyFeatures: {
      freeCoursesLimit: 15,
      unlimitedCourses: true,
      storageLimitMB: 70000,
      advancedAnalytics: true,
      coupons: true,
      liveClasses: true,
      featuredInstructor: false,
      prioritySupport: true,
      unlimitedStorage: false,
      premiumMarketing: false,
    },
  },
  [ELITE]: {
    code: ELITE,
    name: 'Elite',
    type: 'paid',
    price: 1999,
    discountPrice: 0,
    durationDays: 30,
    description: 'Maximum scale: dedicated support, the largest limits, and every feature.',
    sortOrder: 4,
    isDefaultForFree: false,
    entitlements: {
      courses: {
        canCreateFree: true,
        canCreatePaid: true,
        maxCreationCount: 200,
        creationWindowDays: 30,
        maxPublishedCourses: 200,
        unlimitedCreationMode: true,
        highCreationCap: 200,
      },
      students: { maxStudents: 10000 },
      revenue: { enabled: true, commissionPercent: 15, instructorSharePercent: 85 },
      storage: { videoGB: 200, materialGB: 100, recordingGB: 100, maxVideoFileSizeMB: 5120, unlimited: false },
      certificates: { enabled: true, qrVerification: true },
      liveClasses: { enabled: true, monthlyLimit: 60, maxDurationMinutes: 180, recording: true },
      analytics: { basic: true, advanced: true, revenue: true, export: true },
      marketing: {
        coupons: true,
        maxActiveCoupons: 5000,
        bundles: true,
        instructorSubscriptions: true,
        affiliate: true,
        affiliatePayout: true,
      },
      support: { level: 'dedicated' },
    },
    legacyFeatures: {
      freeCoursesLimit: 200,
      unlimitedCourses: true,
      storageLimitMB: 300000,
      advancedAnalytics: true,
      coupons: true,
      liveClasses: true,
      featuredInstructor: true,
      prioritySupport: true,
      unlimitedStorage: true,
      premiumMarketing: true,
    },
  },
};
