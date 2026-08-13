import { describe, it, expect } from 'vitest';
import { deriveLegacyFeaturesFromEntitlements } from '../../../src/services/entitlement.service';

describe('deriveLegacyFeaturesFromEntitlements', () => {
  it('derives features from a full entitlements snapshot', () => {
    const features = deriveLegacyFeaturesFromEntitlements({
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
      storage: { videoGB: 10, materialGB: 5, recordingGB: 2, maxVideoFileSizeMB: 1024, unlimited: false },
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
    } as never);

    expect(features.freeCoursesLimit).toBe(5);
    expect(features.unlimitedCourses).toBe(false); // capped plan: paid creation alone is not "unlimited"
    expect(features.storageLimitMB).toBe(10240);
    expect(features.coupons).toBe(true);
    expect(features.liveClasses).toBe(true);
    expect(features.prioritySupport).toBe(false);
    expect(features.premiumMarketing).toBe(false);
  });

  it('does not crash on partial snapshots (missing storage/analytics/marketing)', () => {
    const features = deriveLegacyFeaturesFromEntitlements({
      courses: {
        canCreateFree: true,
        canCreatePaid: false,
        maxCreationCount: 3,
        creationWindowDays: 30,
        maxPublishedCourses: 3,
        unlimitedCreationMode: false,
        highCreationCap: 0,
      },
      students: { maxStudents: 200 },
      support: { level: 'priority' },
    } as never);

    expect(features.freeCoursesLimit).toBe(3);
    expect(features.storageLimitMB).toBeGreaterThanOrEqual(1);
    expect(features.coupons).toBe(false);
    expect(features.prioritySupport).toBe(true);
  });

  it('treats dedicated support as the premium tier', () => {
    const features = deriveLegacyFeaturesFromEntitlements({
      courses: {
        canCreateFree: true,
        canCreatePaid: true,
        maxCreationCount: 10,
        creationWindowDays: 30,
        maxPublishedCourses: 10,
        unlimitedCreationMode: false,
        highCreationCap: 0,
      },
      students: { maxStudents: 100 },
      support: { level: 'dedicated' },
    } as never);

    expect(features.premiumMarketing).toBe(true);
    expect(features.featuredInstructor).toBe(true);
    expect(features.prioritySupport).toBe(true);
    expect(features.unlimitedCourses).toBe(false);
  });

  it('sets unlimitedCourses only for true unlimited creation mode', () => {
    const features = deriveLegacyFeaturesFromEntitlements({
      courses: {
        canCreateFree: true,
        canCreatePaid: true,
        maxCreationCount: 10,
        creationWindowDays: 30,
        maxPublishedCourses: 10,
        unlimitedCreationMode: true,
        highCreationCap: 200,
      },
      students: { maxStudents: 100 },
      support: { level: 'priority' },
    } as never);

    expect(features.unlimitedCourses).toBe(true);
    expect(features.freeCoursesLimit).toBe(200);
  });
});
