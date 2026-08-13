import { Types } from 'mongoose';
import { CourseCreationEvent } from '../models/courseCreationEvent.model';
import { InstructorQuotaLock } from '../models/instructorQuotaLock.model';
import { Course } from '../models/course.model';
import { User } from '../models/user.model';
import { withTransaction } from '../utils/transaction';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { entitlementService } from './entitlement.service';

const LOCK_TIMEOUT_MS = 90 * 1000;
const LOCK_WAIT_MS = 10 * 1000;
const LOCK_POLL_INTERVAL_MS = 250;

/**
 * Rolling 30-day course-creation quota.
 *
 * The quota counts COURSE CREATION EVENTS (an immutable audit trail) within the
 * configured rolling window. Events are never removed when a course is deleted,
 * so deletion can never "reset" the quota. A per-instructor advisory lock +
 * outer transaction serializes concurrent creation requests so two simultaneous
 * requests cannot sneak past the last available slot.
 */
export class CourseQuotaService {
  // ─── Advisory lock ─────────────────────────────────────────────
  private async acquireLock(instructorId: string): Promise<boolean> {
    const now = new Date();
    const lease = new Date(now.getTime() + LOCK_TIMEOUT_MS);
    const acquired = await InstructorQuotaLock.findOneAndUpdate(
      {
        instructor: new Types.ObjectId(instructorId),
        $or: [{ leaseExpiresAt: { $lte: now } }],
      },
      { $set: { acquiredAt: now, leaseExpiresAt: lease } },
      { upsert: false }
    );
    if (acquired) return true;

    // Not yet present OR lease still active — try an atomic upsert.
    const created = await InstructorQuotaLock.findOneAndUpdate(
      { instructor: new Types.ObjectId(instructorId) },
      { $setOnInsert: { acquiredAt: now, leaseExpiresAt: lease } },
      { upsert: true, new: true }
    ).catch(() => null);
    if (created && created.leaseExpiresAt.getTime() === lease.getTime()) {
      return true;
    }
    return false;
  }

  private async releaseLock(instructorId: string): Promise<void> {
    await InstructorQuotaLock.deleteOne({ instructor: new Types.ObjectId(instructorId) }).catch(() => undefined);
  }

  /** Wrap a quota-sensitive critical section with the per-instructor lock. */
  async withQuotaLock<T>(instructorId: string, fn: () => Promise<T>): Promise<T> {
    const deadline = Date.now() + LOCK_WAIT_MS;
    for (;;) {
      if (await this.acquireLock(instructorId)) break;
      if (Date.now() > deadline) {
        throw ApiError.tooManyRequests(
          'Too many course operations in progress. Please retry shortly.',
          'COURSE_CREATION_LIMIT_REACHED'
        );
      }
      await new Promise((r) => setTimeout(r, LOCK_POLL_INTERVAL_MS));
    }
    try {
      return await fn();
    } finally {
      await this.releaseLock(instructorId);
    }
  }

  // ─── Window + usage ────────────────────────────────────────────
  async getWindowUsage(instructorId: string, windowDays: number): Promise<number> {
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    return CourseCreationEvent.countDocuments({
      instructor: new Types.ObjectId(instructorId),
      createdAt: { $gte: since },
    });
  }

  async getCourseCreationUsage(instructorId: string): Promise<{ used: number; limit: number; windowDays: number }> {
    const view = await entitlementService.getEntitlementView(instructorId);
    const windowDays = view.entitlements.courses.creationWindowDays || 30;
    // Entitlement service owns the authoritative usage/limit computation.
    const { used, limit } = await entitlementService.getCourseCreationUsage(instructorId, windowDays);
    return { used, limit, windowDays };
  }

  // ─── Enforced creation ─────────────────────────────────────────
  /**
   * Atomically checks the rolling creation quota and creates the course +
   * records the immutable creation event. Runs under the instructor lock; if
   * Mongo transactions are available the check+insert are additionally atomic.
   */
  async createCourseWithQuota(instructorId: string, data: any) {
    const view = await entitlementService.getEntitlementView(instructorId);
    const entitlements = view.entitlements.courses;

    const isPaid = data.price > 0 || data.courseType === 'paid';
    if (isPaid && !entitlements.canCreatePaid) {
      throw ApiError.forbidden(
        'Paid course creation is available on Growth and higher plans. Upgrade your instructor plan to sell paid courses.',
        'PAID_COURSE_NOT_ALLOWED'
      );
    }
    if (!entitlements.canCreateFree) {
      throw ApiError.forbidden('Course creation is not available on your current plan.', 'FEATURE_NOT_AVAILABLE');
    }

    return this.withQuotaLock(instructorId, async () => {
      return withTransaction(async (session) => {
        const windowDays = entitlements.creationWindowDays || 30;
        const used = await this.getWindowUsage(instructorId, windowDays);
        const limit = entitlements.unlimitedCreationMode
          ? entitlements.highCreationCap || entitlements.maxCreationCount
          : entitlements.maxCreationCount;

        if (used >= limit) {
          throw ApiError.forbidden(
            `You have reached the limit of ${limit} course creations within the last ${windowDays} days. Delete a course and recreate it after the rolling window passes.`,
            'COURSE_CREATION_LIMIT_REACHED'
          );
        }

        const [course] = await Course.create([{ ...data, instructor: instructorId }], { session });
        // Attach the plan/subscription context held at creation time so the
        // immutable event trail can later explain under which entitlements a
        // course was created.
        const subRecord = await entitlementService.getActiveSubscriptionRecord(instructorId);
        await CourseCreationEvent.create(
          [
            {
              instructor: instructorId,
              course: course._id,
              subscription: subRecord?._id || null,
              plan: subRecord?.plan?._id || subRecord?.plan || null,
            },
          ],
          { session }
        );
        await User.findByIdAndUpdate(instructorId, { $inc: { totalCourses: 1 } }, { session });
        return course;
      });
    });
  }

  /** Called by the course-delete flow to detach the event (never deletes it). */
  async detachEventOnCourseDelete(courseId: string): Promise<void> {
    await CourseCreationEvent.updateMany({ course: new Types.ObjectId(courseId) }, { $unset: { course: 1 } }).catch(
      (err) => logger.warn('CourseCreationEvent detach failed', { courseId, error: err })
    );
  }
}

export const courseQuotaService = new CourseQuotaService();
