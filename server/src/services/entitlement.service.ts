import { Types } from 'mongoose';
import { InstructorSubscription } from '../models/instructorSubscription.model';
import {
  InstructorSubscriptionPlan,
  IPlanEntitlements,
  IPlanLegacyFeatures,
} from '../models/instructorSubscriptionPlan.model';
import { Course } from '../models/course.model';
import { CourseCreationEvent } from '../models/courseCreationEvent.model';
import { Coupon } from '../models/coupon.model';
import { Enrollment } from '../models/enrollment.model';
import { LiveClass } from '../models/liveClass.model';
import { platformSettingsService } from './platformSettings.service';
import { ApiError } from '../utils/ApiError';
import { cacheService } from '../cache/cache.service';
import { cacheKeys, CACHE_TTL } from '../cache/cacheKeys';

export type EntitlementStatus = 'active' | 'trial' | 'pastDue' | 'cancelled' | 'expired' | 'suspended' | 'none';

export interface EntitlementView {
  status: EntitlementStatus;
  planCode?: string;
  planName?: string;
  endDate?: Date | null;
  startDate?: Date | null;
  autoRenew: boolean;
  entitlements: IPlanEntitlements;
}

export type InstructorPermissionKey =
  | 'course.create'
  | 'course.createPaid'
  | 'course.createFree'
  | 'certificate.issue'
  | 'certificate.qrVerification'
  | 'liveClass.create'
  | 'liveClass.recording'
  | 'analytics.basic'
  | 'analytics.advanced'
  | 'analytics.revenue'
  | 'analytics.export'
  | 'marketing.coupons'
  | 'marketing.bundles'
  | 'marketing.instructorSubscriptions'
  | 'marketing.affiliate'
  | 'marketing.affiliatePayout'
  | 'support.email'
  | 'support.priority'
  | 'support.dedicated';

export type InstructorLimitKey =
  | 'course.creation'
  | 'course.creationWindowDays'
  | 'course.maxPublishedCourses'
  | 'students.maxStudents'
  | 'storage.videoGB'
  | 'storage.materialGB'
  | 'storage.recordingGB'
  | 'storage.maxVideoFileSizeMB'
  | 'liveClass.monthlyLimit'
  | 'liveClass.maxDurationMinutes'
  | 'marketing.maxActiveCoupons';

const DEFAULT_FALLBACK_ENTITLEMENTS: IPlanEntitlements = {
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
};

// Legacy status strings should keep working on the read path during transition.
function normalizeStatus(value: any): EntitlementStatus {
  const v = typeof value === 'string' ? value.toLowerCase() : '';
  switch (v) {
    case 'active':
      return 'active';
    case 'trial':
    case 'trialing':
      return 'trial';
    case 'pastdue':
    case 'past_due':
      return 'pastDue';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'expired':
      return 'expired';
    case 'suspended':
      return 'suspended';
    default:
      return 'none';
  }
}

function deepCloneEntitlements(src?: IPlanEntitlements): IPlanEntitlements {
  return JSON.parse(JSON.stringify(src || DEFAULT_FALLBACK_ENTITLEMENTS)) as IPlanEntitlements;
}

/**
 * Derive structured entitlements from a plan document. Structured entitlements
 * win; when absent (legacy plans) the legacy flat `features` object is mapped.
 */
export function deriveEntitlements(plan: {
  entitlements?: IPlanEntitlements;
  features?: Partial<IPlanLegacyFeatures>;
}): IPlanEntitlements {
  if (plan.entitlements) return deepCloneEntitlements(plan.entitlements);

  const f = plan.features ?? {};
  const hasCustom = Object.keys(f).length > 0;
  const ent = deepCloneEntitlements(undefined);

  if (!hasCustom) return ent;

  const cap = f.unlimitedCourses ? f.freeCoursesLimit || 200 : (f.freeCoursesLimit ?? 2);
  ent.courses.canCreateFree = true;
  ent.courses.canCreatePaid = Boolean(f.unlimitedCourses);
  ent.courses.maxCreationCount = cap;
  ent.courses.creationWindowDays = 30;
  ent.courses.maxPublishedCourses = cap;
  ent.courses.unlimitedCreationMode = Boolean(f.unlimitedCourses);
  ent.courses.highCreationCap = f.unlimitedCourses ? f.freeCoursesLimit || 200 : 0;
  ent.students.maxStudents = 10000;
  ent.revenue.enabled = Boolean(f.unlimitedCourses);
  ent.revenue.commissionPercent = f.unlimitedCourses ? 25 : 0;
  ent.revenue.instructorSharePercent = f.unlimitedCourses ? 75 : 100;
  ent.storage.videoGB = Math.max(f.storageLimitMB ?? 500, 1) / 1024;
  ent.storage.materialGB = Math.max(f.storageLimitMB ?? 500, 1) / 2048;
  ent.storage.recordingGB = f.liveClasses ? 5 : 0;
  ent.storage.maxVideoFileSizeMB = Math.min(Math.max(f.storageLimitMB ?? 500, 100), 2000);
  ent.storage.unlimited = Boolean(f.unlimitedStorage);
  ent.certificates.enabled = Boolean(f.unlimitedCourses);
  ent.certificates.qrVerification = Boolean(f.unlimitedCourses);
  ent.liveClasses.enabled = Boolean(f.liveClasses);
  ent.liveClasses.monthlyLimit = f.liveClasses ? 15 : 0;
  ent.liveClasses.maxDurationMinutes = f.liveClasses ? 120 : 0;
  ent.liveClasses.recording = Boolean(f.liveClasses);
  ent.analytics.basic = true;
  ent.analytics.advanced = Boolean(f.advancedAnalytics);
  ent.analytics.revenue = Boolean(f.premiumMarketing);
  ent.analytics.export = Boolean(f.premiumMarketing);
  ent.marketing.coupons = Boolean(f.coupons);
  ent.marketing.maxActiveCoupons = f.coupons ? 20 : 0;
  ent.marketing.bundles = Boolean(f.unlimitedCourses);
  ent.marketing.instructorSubscriptions = Boolean(f.premiumMarketing);
  ent.marketing.affiliate = Boolean(f.premiumMarketing);
  ent.marketing.affiliatePayout = Boolean(f.premiumMarketing);
  ent.support.level = f.prioritySupport ? 'priority' : f.premiumMarketing ? 'dedicated' : 'none';

  return ent;
}

/**
 * Reverse mapping used to keep legacy flat `features` in sync with the structured
 * `entitlements` (the source of truth). Legacy consumers still gate on the flat
 * object, so any plan edited through the entitlements editor must keep both views
 * aligned. `unlimitedCourses` mirrors only true unlimited creation
 * (`unlimitedCreationMode`); merely being able to create paid courses does NOT
 * grant it, so the summary never claims unlimited capacity on a capped plan.
 * Premium/featured flags are reserved for the top tier (dedicated support) to
 * avoid silently widening access for lower tiers.
 */
export function deriveLegacyFeaturesFromEntitlements(ent: IPlanEntitlements): IPlanLegacyFeatures {
  // Normalize partial/legacy snapshots: an update patch (or a plan that only
  // ever stored a subset of sections) can arrive without e.g. `storage` or
  // `analytics`. Merge each section over the defaults so the derivation never
  // crashes on a missing group and missing leaves fall back to the baseline.
  const src = (ent || {}) as Partial<IPlanEntitlements>;
  const full = {} as IPlanEntitlements;
  for (const key of Object.keys(DEFAULT_FALLBACK_ENTITLEMENTS)) {
    const def = (DEFAULT_FALLBACK_ENTITLEMENTS as any)[key];
    (full as any)[key] = { ...def, ...(src as any)[key] };
  }

  const c = full.courses;
  const cap = c.unlimitedCreationMode ? c.highCreationCap || c.maxCreationCount || 200 : c.maxCreationCount;
  const isTopTier = full.support.level === 'dedicated';
  return {
    freeCoursesLimit: cap,
    unlimitedCourses: c.unlimitedCreationMode,
    storageLimitMB: Math.max(1, Math.round(full.storage.videoGB * 1024)),
    advancedAnalytics: full.analytics.advanced,
    coupons: full.marketing.coupons,
    liveClasses: full.liveClasses.enabled,
    featuredInstructor: isTopTier,
    prioritySupport: full.support.level === 'priority' || isTopTier,
    unlimitedStorage: Boolean(full.storage.unlimited) || c.unlimitedCreationMode,
    premiumMarketing: isTopTier,
  };
}

export class EntitlementService {
  /**
   * Resolve the instructor's effective plan + entitlements, hitting the DB once
   * and caching the result briefly. Used by every permission/limit check.
   */
  async getEntitlementView(instructorId: string): Promise<EntitlementView> {
    return cacheService.remember(
      cacheKeys.instructorEntitlements(instructorId),
      { ttl: CACHE_TTL.INSTRUCTOR_ENTITLEMENTS },
      async () => this.buildEntitlementView(instructorId)
    );
  }

  private async buildEntitlementView(instructorId: string): Promise<EntitlementView> {
    const sub = await this.getActiveOrLatestSubscription(instructorId);
    const plan = sub?.plan || null;
    const entitlements = deriveEntitlements(plan || {});
    const status = normalizeStatus(sub?.status);

    return {
      status,
      planCode: plan?.code || undefined,
      planName: plan?.name,
      endDate: sub?.endDate ?? null,
      startDate: sub?.startDate ?? null,
      autoRenew: sub?.autoRenew ?? false,
      entitlements,
    };
  }

  private async getActiveOrLatestSubscription(instructorId: string): Promise<any> {
    const active = await InstructorSubscription.findOne({
      instructor: new Types.ObjectId(instructorId),
      status: { $in: ['ACTIVE', 'active'] },
    })
      .populate('plan')
      .sort({ createdAt: -1 })
      .lean();
    if (active) return active;

    const latest = await InstructorSubscription.findOne({
      instructor: new Types.ObjectId(instructorId),
    })
      .populate('plan')
      .sort({ createdAt: -1 })
      .lean();
    if (latest) return latest;
    return null;
  }

  /**
   * Active-or-latest subscription record (populated plan) without the full
   * entitlements view. Used to attach plan/subscription context to usage events.
   */
  async getActiveSubscriptionRecord(instructorId: string): Promise<any> {
    return this.getActiveOrLatestSubscription(instructorId);
  }

  getActiveStatus(view: EntitlementView): boolean {
    return view.status === 'active';
  }

  // ─── Permission checks ─────────────────────────────────────────
  canInstructor(view: EntitlementView, permission: InstructorPermissionKey): boolean {
    const e = view.entitlements;
    switch (permission) {
      case 'course.create':
        return this.getActiveStatus(view) && e.courses.canCreateFree;
      case 'course.createFree':
        return this.getActiveStatus(view) && e.courses.canCreateFree;
      case 'course.createPaid':
        return this.getActiveStatus(view) && e.courses.canCreatePaid;
      case 'certificate.issue':
        return this.getActiveStatus(view) && e.certificates.enabled;
      case 'certificate.qrVerification':
        return this.getActiveStatus(view) && e.certificates.enabled && e.certificates.qrVerification;
      case 'liveClass.create':
        return this.getActiveStatus(view) && e.liveClasses.enabled;
      case 'liveClass.recording':
        return this.getActiveStatus(view) && e.liveClasses.recording;
      case 'analytics.basic':
        return e.analytics.basic;
      case 'analytics.advanced':
        return this.getActiveStatus(view) && e.analytics.advanced;
      case 'analytics.revenue':
        return this.getActiveStatus(view) && e.analytics.revenue;
      case 'analytics.export':
        return this.getActiveStatus(view) && e.analytics.export;
      case 'marketing.coupons':
        return this.getActiveStatus(view) && e.marketing.coupons;
      case 'marketing.bundles':
        return this.getActiveStatus(view) && e.marketing.bundles;
      case 'marketing.instructorSubscriptions':
        return this.getActiveStatus(view) && e.marketing.instructorSubscriptions;
      case 'marketing.affiliate':
        return this.getActiveStatus(view) && e.marketing.affiliate;
      case 'marketing.affiliatePayout':
        return this.getActiveStatus(view) && e.marketing.affiliatePayout;
      case 'support.email':
        return e.support.level === 'email';
      case 'support.priority':
        return e.support.level === 'priority' || e.support.level === 'dedicated';
      case 'support.dedicated':
        return e.support.level === 'dedicated';
      default:
        return false;
    }
  }

  // ─── Limits ────────────────────────────────────────────────────
  getInstructorLimit(view: EntitlementView, limitKey: InstructorLimitKey): number {
    const e = view.entitlements;
    switch (limitKey) {
      case 'course.creation':
        return e.courses.unlimitedCreationMode
          ? e.courses.highCreationCap || e.courses.maxCreationCount
          : e.courses.maxCreationCount;
      case 'course.creationWindowDays':
        return e.courses.creationWindowDays;
      case 'course.maxPublishedCourses':
        return e.courses.unlimitedCreationMode
          ? e.courses.highCreationCap || e.courses.maxPublishedCourses
          : e.courses.maxPublishedCourses;
      case 'students.maxStudents':
        return e.students.maxStudents;
      case 'storage.videoGB':
        return e.storage.videoGB;
      case 'storage.materialGB':
        return e.storage.materialGB;
      case 'storage.recordingGB':
        return e.storage.recordingGB;
      case 'storage.maxVideoFileSizeMB':
        return e.storage.maxVideoFileSizeMB;
      case 'liveClass.monthlyLimit':
        return e.liveClasses.monthlyLimit;
      case 'liveClass.maxDurationMinutes':
        return e.liveClasses.maxDurationMinutes;
      case 'marketing.maxActiveCoupons':
        return e.marketing.maxActiveCoupons;
      default:
        return 0;
    }
  }

  // ─── Commission ────────────────────────────────────────────────
  async getInstructorCommission(
    instructorId: string,
    view?: EntitlementView
  ): Promise<{ commissionPercent: number; instructorSharePercent: number }> {
    const resolved = view || (await this.getEntitlementView(instructorId));
    const e = resolved.entitlements;
    // Commission splits are a benefit of an ACTIVE subscription. When the
    // instructor has no active subscription (expired, cancelled, none) the
    // platform takes no cut and the instructor keeps 100%. The previous code
    // resolved entitlements from the "latest subscription" fallback, so a plan's
    // commission rate silently persisted after expiry.
    if (!this.getActiveStatus(resolved)) {
      return { commissionPercent: 0, instructorSharePercent: 100 };
    }
    // Plan values are authoritative; fall back to the platform-level default
    // only when the plan does not define a share split (e.g. free plan).
    if (e.revenue.enabled && e.revenue.commissionPercent > 0) {
      return {
        commissionPercent: e.revenue.commissionPercent,
        instructorSharePercent: e.revenue.instructorSharePercent,
      };
    }
    const defaultPercent = await platformSettingsService.getCommissionPercentage();
    return {
      commissionPercent: defaultPercent,
      instructorSharePercent: Math.max(0, 100 - defaultPercent),
    };
  }

  // ─── Usage helpers ─────────────────────────────────────────────
  async getCourseCreationUsage(instructorId: string, windowDays?: number): Promise<{ used: number; limit: number }> {
    const view = await this.getEntitlementView(instructorId);
    const window = windowDays || view.entitlements.courses.creationWindowDays || 30;
    const since = new Date(Date.now() - window * 24 * 60 * 60 * 1000);
    const used = await CourseCreationEvent.countDocuments({
      instructor: new Types.ObjectId(instructorId),
      createdAt: { $gte: since },
    });
    return { used, limit: this.getInstructorLimit(view, 'course.creation') };
  }

  async getPublishedCourseCount(instructorId: string): Promise<number> {
    return Course.countDocuments({
      instructor: new Types.ObjectId(instructorId),
      status: 'published',
    });
  }

  async getActiveStudentCount(instructorId: string): Promise<number> {
    const courseIds = await Course.find({ instructor: new Types.ObjectId(instructorId) }).distinct('_id');
    const result = await Enrollment.aggregate<{ _id: null; students: number }>([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: null, students: { $addToSet: '$user' } } },
    ]);
    return result[0]?.students ?? 0;
  }

  /**
   * Blocks a new enrollment when the instructor has reached their plan's student
   * capacity. `studentId` is the prospective enrollee; they are added to the
   * instructor's distinct-student set so re-rollovers do not double count.
   */
  async requireStudentCapacity(instructorId: string, studentId: string): Promise<void> {
    const view = await this.getEntitlementView(instructorId);
    const maxStudents = this.getInstructorLimit(view, 'students.maxStudents');
    if (maxStudents <= 0) return;

    const courseIds = await Course.find({ instructor: new Types.ObjectId(instructorId) }).distinct('_id');
    const aggregation = await Enrollment.aggregate<{ _id: null; students: Types.ObjectId[] }>([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: null, students: { $addToSet: '$user' } } },
    ]);
    const students = new Set((aggregation[0]?.students ?? []).map((id) => id.toString()));
    students.add(studentId);

    if (students.size > maxStudents) {
      throw ApiError.forbidden(
        `You have reached the maximum of ${maxStudents} students on your plan. Upgrade your instructor plan to enroll more students.`,
        'STUDENT_LIMIT_REACHED'
      );
    }
  }

  async getMonthlyLiveClassUsage(instructorId: string): Promise<{ used: number; limit: number }> {
    const view = await this.getEntitlementView(instructorId);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const used = await LiveClass.countDocuments({
      instructor: new Types.ObjectId(instructorId),
      startTime: { $gte: startOfMonth },
    });
    return { used, limit: this.getInstructorLimit(view, 'liveClass.monthlyLimit') };
  }

  async getActiveCouponCount(instructorId: string): Promise<{ used: number; limit: number }> {
    const view = await this.getEntitlementView(instructorId);
    const used = await Coupon.countDocuments({
      createdBy: new Types.ObjectId(instructorId),
      isActive: true,
    });
    return { used, limit: this.getInstructorLimit(view, 'marketing.maxActiveCoupons') };
  }

  async getVideoStorageUsage(instructorId: string): Promise<{ usedGB: number; limitGB: number }> {
    const view = await this.getEntitlementView(instructorId);
    const usedGB = 0; // Upload usage aggregation lives behind the upload service (no storage layer yet).
    return { usedGB, limitGB: this.getInstructorLimit(view, 'storage.videoGB') };
  }

  // ─── Operational shortcuts ─────────────────────────────────────
  async requirePaidCoursePermission(instructorId: string): Promise<void> {
    const view = await this.getEntitlementView(instructorId);
    if (!this.canInstructor(view, 'course.createPaid')) {
      throw ApiError.forbidden(
        'Paid course creation is available on Growth and higher plans. Upgrade your instructor plan to sell paid courses.',
        'PAID_COURSE_NOT_ALLOWED'
      );
    }
  }

  async requireActiveSubscription(instructorId: string): Promise<void> {
    const view = await this.getEntitlementView(instructorId);
    if (!this.getActiveStatus(view)) {
      throw ApiError.forbidden(
        'An active instructor subscription is required for this feature. Upgrade your plan.',
        view.status === 'expired' ? 'SUBSCRIPTION_EXPIRED' : 'SUBSCRIPTION_REQUIRED'
      );
    }
  }

  // Convenience passthrough (cached) used by the subscription UI.
  async resolvePlansForUI(): Promise<any[]> {
    return InstructorSubscriptionPlan.find({ status: 'active' }).sort({ sortOrder: 1 }).lean();
  }
}

export const entitlementService = new EntitlementService();
