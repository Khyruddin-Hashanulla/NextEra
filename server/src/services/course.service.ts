import mongoose from 'mongoose';
import { Course } from '../models/course.model';
import { Section } from '../models/section.model';
import { Lecture } from '../models/lecture.model';
import { User } from '../models/user.model';
import { Enrollment } from '../models/enrollment.model';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { withTransaction } from '../utils/transaction';
import { escapeRegex } from '../utils/escapeRegex';
import { cascadeDeleteService } from './cascadeDelete.service';
import { subscriptionPermissionService } from './subscriptionPermission.service';
import { courseQuotaService } from './courseQuota.service';
import { entitlementService } from './entitlement.service';
import { uploadService } from './upload.service';
import { CourseCreationEvent } from '../models/courseCreationEvent.model';
import { cacheService } from '../cache/cache.service';
import { cacheKeys, CACHE_TTL } from '../cache/cacheKeys';
import { cacheManager } from '../cache/cacheManager';

export class CourseService {
  private async invalidateCourseCaches(courseId?: string, slug?: string): Promise<void> {
    await cacheManager.invalidateCourseCache(courseId, slug);
  }

  // ─── CRUD ────────────────────────────────────────────────────
  async create(instructorId: string, data: any) {
    const course = await courseQuotaService.createCourseWithQuota(instructorId, data);
    await this.invalidateCourseCaches();
    return course;
  }

  async getById(courseId: string) {
    return cacheService.remember(cacheKeys.courseById(courseId), { ttl: CACHE_TTL.COURSE_DETAIL }, async () => {
      const course = await Course.findById(courseId)
        .populate('category', 'name slug')
        .populate('instructor', 'name email avatar bio')
        .lean();
      if (!course) throw ApiError.notFound('Course not found');
      return course;
    });
  }

  async getBySlug(slug: string) {
    return cacheService.remember(cacheKeys.courseBySlug(slug), { ttl: CACHE_TTL.COURSE_DETAIL }, async () => {
      const course = await Course.findOne({ slug })
        .populate('category', 'name slug')
        .populate('instructor', 'name email avatar bio')
        .lean();
      if (!course) throw ApiError.notFound('Course not found');
      return course;
    });
  }

  async update(courseId: string, data: any) {
    const protectedFields = ['status', 'isApproved', 'isActive', 'publishedAt', 'archivedAt', 'rejectionReason'];
    const sanitized = Object.keys(data).reduce((acc: any, key) => {
      if (!protectedFields.includes(key)) acc[key] = data[key];
      return acc;
    }, {});

    const existing = await Course.findById(courseId).lean();
    if (!existing) throw ApiError.notFound('Course not found');

    const price = data.price ?? existing.price;
    const courseType = data.courseType ?? existing.courseType;
    const isPaid = price > 0 || courseType === 'paid';
    const touchesMonetization =
      Object.prototype.hasOwnProperty.call(data, 'price') || Object.prototype.hasOwnProperty.call(data, 'courseType');
    // ANY change that keeps or turns the course paid (converting free→paid,
    // re-pricing an existing paid course, or toggling courseType to 'paid')
    // requires paid-course permission. The previous guard only covered the
    // free→paid transition, so a downgraded instructor could re-price an
    // existing paid course after losing paid-course access.
    if (touchesMonetization && isPaid) {
      const planInfo = await subscriptionPermissionService.getInstructorPlanInfo(existing.instructor.toString());
      await subscriptionPermissionService.requirePaidCoursePermission(existing.instructor.toString(), planInfo);
    }

    const course = await Course.findByIdAndUpdate(
      courseId,
      { $set: { ...sanitized, lastActivity: new Date() } },
      { new: true, runValidators: true }
    )
      .populate('category', 'name')
      .lean();
    if (!course) throw ApiError.notFound('Course not found');
    await this.invalidateCourseCaches(courseId, existing.slug);
    return course;
  }

  async delete(courseId: string) {
    return withTransaction(async (session) => {
      const course = await Course.findByIdAndDelete(courseId, { session });
      if (!course) throw ApiError.notFound('Course not found');
      await cascadeDeleteService.deleteCourse(courseId, session);
      await User.findByIdAndUpdate(course.instructor, { $inc: { totalCourses: -1 } }, { session });
      await courseQuotaService.detachEventOnCourseDelete(courseId);
      await this.invalidateCourseCaches(courseId, course.slug);
      return { deleted: true };
    });
  }

  async duplicate(courseId: string, instructorId: string) {
    const original = await Course.findById(courseId).lean();
    if (!original) throw ApiError.notFound('Course not found');

    const view = await entitlementService.getEntitlementView(instructorId);
    const limits = view.entitlements.courses;
    const isPaid = original.price > 0 || original.courseType === 'paid';
    if (isPaid && !limits.canCreatePaid) {
      throw ApiError.forbidden(
        'Paid course creation is available on Growth and higher plans. Upgrade your instructor plan to sell paid courses.',
        'PAID_COURSE_NOT_ALLOWED'
      );
    }
    if (!limits.canCreateFree) {
      throw ApiError.forbidden('Course creation is not available on your current plan.', 'FEATURE_NOT_AVAILABLE');
    }

    const limit = limits.unlimitedCreationMode
      ? limits.highCreationCap || limits.maxCreationCount
      : limits.maxCreationCount;

    const newCourseData: any = {
      ...original,
      _id: undefined,
      __v: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };
    newCourseData.title = `${original.title} (Copy)`;
    newCourseData.status = 'draft';
    newCourseData.isApproved = false;
    newCourseData.totalEnrollments = 0;
    newCourseData.averageRating = 0;
    newCourseData.totalReviews = 0;
    newCourseData.lastActivity = new Date();

    // Duplicating creates a NEW course, so it counts against the rolling
    // creation quota exactly like a fresh create. The quota check + creation
    // must run under the per-instructor advisory lock or two concurrent
    // duplicate requests could both pass the last available slot.
    return courseQuotaService.withQuotaLock(instructorId, async () => {
      const windowDays = limits.creationWindowDays || 30;
      const used = await courseQuotaService.getWindowUsage(instructorId, windowDays);
      if (used >= limit) {
        throw ApiError.forbidden(
          `You have reached the limit of ${limit} course creations within the last ${windowDays} days.`,
          'COURSE_CREATION_LIMIT_REACHED'
        );
      }

      return withTransaction(async (session) => {
        const [newCourse] = await Course.create([newCourseData], { session });
        const subRecord = await entitlementService.getActiveSubscriptionRecord(instructorId);
        await CourseCreationEvent.create(
          [
            {
              instructor: instructorId,
              course: newCourse._id,
              subscription: subRecord?._id || null,
              plan: subRecord?.plan?._id || subRecord?.plan || null,
            },
          ],
          { session }
        );
        await User.findByIdAndUpdate(instructorId, { $inc: { totalCourses: 1 } }, { session });

        const sections = await Section.find({ course: courseId }).sort({ order: 1 }).lean();
        for (const section of sections) {
          const { _id, createdAt: _createdAt, updatedAt: _updatedAt, ...sectionData } = section;
          const [newSection] = await Section.create([{ ...sectionData, course: newCourse._id }], { session });

          const lectures = await Lecture.find({ section: section._id }).sort({ order: 1 }).lean();
          const lectureDocs = lectures.map((lecture: any) => {
            const { _id: _lecId, createdAt: _lc, updatedAt: _lu, ...lectureData } = lecture;
            return { ...lectureData, section: newSection._id, course: newCourse._id };
          });
          if (lectureDocs.length > 0) {
            await Lecture.insertMany(lectureDocs, { session, ordered: true });
          }
        }

        return newCourse;
      });
    });
  }

  async listByInstructor(instructorId: string, status?: string) {
    const filter: any = { instructor: instructorId };
    if (status) filter.status = status;
    return Course.find(filter).populate('category', 'name').sort({ lastActivity: -1 }).lean();
  }

  async listAll(filters: {
    search?: string;
    category?: string;
    level?: string;
    status?: string;
    page?: number;
    limit?: number;
    sort?: string;
    featured?: boolean;
  }) {
    // Search results are unique and low hit-rate; only cache unfiltered browsing.
    return cacheService.remember(
      cacheKeys.courseList(filters),
      { ttl: CACHE_TTL.COURSE_LIST },
      async () => {
        const query: any = {};
        if (filters.search) query.title = { $regex: escapeRegex(filters.search), $options: 'i' };
        if (filters.category) query.category = filters.category;
        if (filters.level) query.level = filters.level;
        if (filters.status) query.status = filters.status;
        else query.status = 'published';
        if (filters.featured) query.featured = true;

        const { page = 1, limit = 12, sort = '-createdAt' } = filters;
        const skip = (page - 1) * limit;

        const [courses, total] = await Promise.all([
          Course.find(query)
            .populate('category', 'name')
            .populate('instructor', 'name avatar')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
          Course.countDocuments(query),
        ]);

        return { courses, total, page, limit, totalPages: Math.ceil(total / limit) };
      },
      !filters.search
    );
  }

  // ─── Publishing Workflow ─────────────────────────────────────
  async submitForReview(courseId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status !== 'draft' && course.status !== 'rejected') {
      throw ApiError.badRequest('Only draft or rejected courses can be submitted for review');
    }

    const sectionCount = await Section.countDocuments({ course: courseId });
    if (!sectionCount) throw ApiError.badRequest('Course must have at least one section');

    const lectureCount = await Lecture.countDocuments({ course: courseId });
    if (!lectureCount) throw ApiError.badRequest('Course must have at least one lecture');
    const videoLectures = await Lecture.countDocuments({ course: courseId, type: 'video' });
    if (!videoLectures) throw ApiError.badRequest('Course must have at least one video lecture');

    await this.recalculateTotals(courseId, course);
    course.status = 'review';
    course.rejectionReason = '';
    course.lastActivity = new Date();
    await course.save();
    await this.invalidateCourseCaches(courseId, course.slug);
    return course;
  }

  async approve(courseId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status !== 'review') throw ApiError.badRequest('Course must be in review status to approve');
    course.status = 'approved';
    course.lastActivity = new Date();
    await course.save();
    await this.invalidateCourseCaches(courseId, course.slug);
    return course;
  }

  async reject(courseId: string, reason?: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status !== 'review') throw ApiError.badRequest('Course must be in review status to reject');
    course.status = 'rejected';
    course.rejectionReason = reason || '';
    course.lastActivity = new Date();
    await course.save();
    await this.invalidateCourseCaches(courseId, course.slug);
    return course;
  }

  async publish(courseId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status !== 'approved') {
      throw ApiError.badRequest('Course must be approved before publishing');
    }

    const instructorId = course.instructor.toString();
    const planInfo = await subscriptionPermissionService.getInstructorPlanInfo(instructorId);

    const isPaid = course.price > 0 || course.courseType === 'paid';
    if (isPaid) {
      await subscriptionPermissionService.requirePaidCoursePermission(instructorId, planInfo);
    }
    await subscriptionPermissionService.requirePublishPermission(instructorId, planInfo);

    const sections = await Section.countDocuments({ course: courseId });
    if (!sections) throw ApiError.badRequest('Add at least one section before publishing');
    const lectures = await Lecture.countDocuments({ course: courseId });
    if (!lectures) throw ApiError.badRequest('Add at least one lecture before publishing');
    await this.recalculateTotals(courseId, course);
    course.status = 'published';
    course.courseType = course.price > 0 ? 'paid' : 'free';
    course.lastActivity = new Date();
    await course.save();
    await this.invalidateCourseCaches(courseId, course.slug);
    await cacheManager.invalidateStudentCourseList();
    return course;
  }

  async unpublish(courseId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status !== 'published') {
      throw ApiError.badRequest('Only published courses can be unpublished');
    }
    course.status = 'draft';
    course.lastActivity = new Date();
    await course.save();
    await this.invalidateCourseCaches(courseId, course.slug);
    await cacheManager.invalidateStudentCourseList();
    return course;
  }

  async archive(courseId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status !== 'published' && course.status !== 'approved') {
      throw ApiError.badRequest('Only published or approved courses can be archived');
    }
    course.status = 'archived';
    course.lastActivity = new Date();
    await course.save();
    await this.invalidateCourseCaches(courseId, course.slug);
    await cacheManager.invalidateStudentCourseList();
    return course;
  }

  async restore(courseId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status !== 'archived') {
      throw ApiError.badRequest('Only archived courses can be restored');
    }
    course.status = 'draft';
    course.lastActivity = new Date();
    await course.save();
    await this.invalidateCourseCaches(courseId, course.slug);
    await cacheManager.invalidateStudentCourseList();
    return course;
  }

  async markCourseContentCompleted(courseId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status === 'archived') {
      throw ApiError.badRequest('Cannot finalize an archived course');
    }
    if (course.status === 'draft' || course.status === 'rejected') {
      throw ApiError.badRequest('Course must be in an active, reviewable state before finalizing content');
    }

    const lectureCount = await Lecture.countDocuments({ course: courseId });
    if (lectureCount === 0) {
      throw ApiError.badRequest('Add at least one lecture before finalizing course content');
    }

    course.contentStatus = 'COMPLETED';
    course.lastActivity = new Date();
    await course.save();
    await this.invalidateCourseCaches(courseId, course.slug);
    await cacheManager.invalidateStudentCourseList();
    return course;
  }

  async toggleFeatured(courseId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    course.featured = !course.featured;
    await course.save();
    await this.invalidateCourseCaches(courseId, course.slug);
    await cacheManager.invalidateStudentCourseList();
    return course;
  }

  // ─── Curriculum ──────────────────────────────────────────────
  async getCurriculum(courseId: string): Promise<any[]> {
    const course = await Course.findById(courseId).select('title instructor').lean();
    if (!course) throw ApiError.notFound('Course not found');

    const sections = await Section.find({ course: courseId }).sort({ order: 1 }).lean();
    const sectionsWithLectures = await Promise.all(
      sections.map(async (section: any) => {
        const lectures = await Lecture.find({ section: section._id }).sort({ order: 1 }).lean();
        const freeLectures = lectures.filter((l: any) => l.isFree || false);
        return { ...section, lectures: this.sanitizeCurriculumLectures(freeLectures, false) };
      })
    );
    return sectionsWithLectures;
  }

  async getOwnerCurriculum(courseId: string): Promise<any[]> {
    const course = await Course.findById(courseId).select('title instructor').lean();
    if (!course) throw ApiError.notFound('Course not found');

    const sections = await Section.find({ course: courseId }).sort({ order: 1 }).lean();
    const sectionsWithLectures = await Promise.all(
      sections.map(async (section: any) => {
        const lectures = await Lecture.find({ section: section._id }).sort({ order: 1 }).lean();
        return { ...section, lectures };
      })
    );
    return sectionsWithLectures;
  }

  async getPublishedCurriculum(courseId: string, userId?: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');

    let isEnrolled = false;
    if (userId) {
      const enrollment = await Enrollment.findOne({ user: userId, course: courseId }).lean();
      isEnrolled = !!enrollment;
    }

    const sections = await Section.find({ course: courseId }).sort({ order: 1 }).lean();
    const sectionsWithLectures = await Promise.all(
      sections.map(async (section: any) => {
        const lectures = await Lecture.find({ section: section._id }).sort({ order: 1 }).lean();
        return { ...section, lectures: this.sanitizeCurriculumLectures(lectures, isEnrolled) };
      })
    );

    return { curriculum: sectionsWithLectures, isEnrolled };
  }

  /**
   * Strips answer keys (and, for non-enrolled viewers, all playback content on
   * non-free lectures) from curriculum lectures before they are returned to the
   * client. Every lecture stays visible so the full curriculum is disclosed
   * pre-enrollment; only playback is restricted.
   *
   * - Owner (instructor/admin): full lecture, minus quiz answer keys only.
   * - Enrolled student:        full lecture, minus quiz answer keys only.
   * - Public/non-enrolled:     metadata for ALL lectures (title/type/duration/
   *                            isFree/order/description); videoSource/videoUrl
   *                            only on free-preview lectures.
   */
  private sanitizeCurriculumLectures(lectures: any[], isEnrolled: boolean): any[] {
    return lectures.map((lecture) => {
      if (!isEnrolled) {
        const base = {
          _id: lecture._id,
          title: lecture.title,
          type: lecture.type,
          duration: lecture.duration,
          isFree: lecture.isFree,
          order: lecture.order,
          description: lecture.description,
        };
        if (lecture.isFree) {
          return {
            ...base,
            videoSource: lecture.videoSource,
            videoUrl: lecture.videoUrl,
          };
        }
        return base;
      }
      const { quiz, ...rest } = lecture;
      if (quiz?.questions) {
        quiz.questions = quiz.questions.map((q: any) => {
          const { correctAnswer: _correctAnswer, ...safeQuestion } = q;
          return safeQuestion;
        });
      }
      return { ...rest, quiz };
    });
  }

  // ─── Sections ────────────────────────────────────────────────
  async createSection(courseId: string, data: { title: string; description?: string; objective?: string }) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');

    const lastSection = await Section.findOne({ course: courseId }).sort({ order: -1 });
    const order = (lastSection?.order ?? -1) + 1;

    return withTransaction(async (session) => {
      const [section] = await Section.create([{ course: courseId, ...data, order }], { session });
      await Course.findByIdAndUpdate(courseId, { $inc: { totalSections: 1 }, lastActivity: new Date() }, { session });
      await this.invalidateCourseCaches(courseId);
      return section;
    });
  }

  async updateSection(sectionId: string, courseId: string, data: any) {
    const section = await Section.findOneAndUpdate(
      { _id: sectionId, course: courseId },
      { $set: { ...data, lastActivity: new Date() } },
      { new: true, runValidators: true }
    );
    if (!section) throw ApiError.notFound('Section not found');
    await this.invalidateCourseCaches(courseId);
    return section;
  }

  async deleteSection(sectionId: string, courseId: string) {
    return withTransaction(async (session) => {
      const section = await Section.findOneAndDelete({ _id: sectionId, course: courseId }, { session });
      if (!section) throw ApiError.notFound('Section not found');

      const deletedLectures = await Lecture.countDocuments({ section: sectionId });
      await cascadeDeleteService.deleteSection(sectionId, courseId, session);
      await Course.findByIdAndUpdate(
        courseId,
        {
          $inc: { totalSections: -1, totalLectures: -deletedLectures },
          lastActivity: new Date(),
        },
        { session }
      );
      await this.compactSectionOrder(courseId, session);
      await this.invalidateCourseCaches(courseId);
    });
  }

  private async compactSectionOrder(courseId: string, session?: any): Promise<void> {
    const remaining = await Section.find({ course: courseId }).sort({ order: 1 }).select('_id').lean();
    if (remaining.length === 0) return;
    await Section.bulkWrite(
      remaining.map((section: any, index: number) => ({
        updateOne: { filter: { _id: section._id }, update: { $set: { order: index } } },
      })),
      { session }
    );
  }

  async reorderSections(courseId: string, sectionOrder: { sectionId: string; order: number }[]) {
    if (!sectionOrder?.length) throw ApiError.badRequest('Reorder list cannot be empty');

    const requestedIds = sectionOrder.map((s) => s.sectionId);
    if (new Set(requestedIds).size !== requestedIds.length) {
      throw ApiError.badRequest('Reorder list contains duplicate sections');
    }

    const courseSections = await Section.find({ course: courseId }).select('_id').lean();
    const ownedIds = new Set(courseSections.map((section: any) => section._id.toString()));
    const unknown = requestedIds.filter((id) => !ownedIds.has(id));
    if (unknown.length > 0) {
      throw ApiError.badRequest('One or more sections do not belong to this course');
    }
    if (requestedIds.length !== courseSections.length) {
      throw ApiError.badRequest('Reorder list must include every section of the course');
    }

    await withTransaction(async (session) => {
      const ops = requestedIds.map((sectionId, index) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(sectionId), course: courseId },
          update: { $set: { order: index } },
        },
      }));
      await Section.bulkWrite(ops, { session });
      await Course.findByIdAndUpdate(courseId, { lastActivity: new Date() }, { session });
    });
    await this.invalidateCourseCaches(courseId);
  }

  async getSection(sectionId: string) {
    const section = await Section.findById(sectionId).lean();
    if (!section) throw ApiError.notFound('Section not found');
    return section;
  }

  // ─── Lectures ────────────────────────────────────────────────
  /**
   * Derives the authoritative video duration from Cloudinary for directly
   * uploaded videos, so the stored value never depends on a client-supplied
   * number. Falls back to the validated client value (logging the failure)
   * only when Cloudinary is unreachable, and leaves other sources (YouTube,
   * Vimeo, etc.) untouched.
   */
  private async resolveVideoDuration(data: any, existing?: any): Promise<any> {
    if (!data) return data;

    const existingData = existing && typeof existing.toObject === 'function' ? existing.toObject() : existing;
    const effective = existingData ? { ...existingData, ...data } : data;
    if (effective.type !== 'video') return data;

    const source = effective.videoSource;
    const isDirect = source?.source === 'direct';
    const publicId = isDirect ? source?.videoId || effective.videoUrl?.publicId : null;
    if (!publicId) return data;

    const duration = await uploadService.getVideoDuration(publicId);
    if (duration === null) {
      logger.warn(`Could not derive video duration from Cloudinary for publicId=${publicId}; keeping provided value`);
      return data;
    }
    return { ...data, duration };
  }

  async createLecture(sectionId: string, courseId: string, data: any) {
    const section = await Section.findOne({ _id: sectionId, course: courseId });
    if (!section) throw ApiError.notFound('Section not found');

    const lastLecture = await Lecture.findOne({ section: sectionId }).sort({ order: -1 });
    const order = (lastLecture?.order ?? -1) + 1;

    const resolved = await this.resolveVideoDuration(data);
    const lecture = await Lecture.create({ section: sectionId, course: courseId, ...resolved, order });
    await this.recalculateSection(sectionId);
    await this.recalculateCourseTotals(courseId);
    await this.invalidateCourseCaches(courseId);
    return lecture;
  }

  async updateLecture(lectureId: string, courseId: string, data: any) {
    const existing = await Lecture.findOne({ _id: lectureId, course: courseId });
    if (!existing) throw ApiError.notFound('Lecture not found');

    const resolved = await this.resolveVideoDuration(data, existing);
    const lecture = await Lecture.findOneAndUpdate(
      { _id: lectureId, course: courseId },
      { $set: resolved },
      { new: true, runValidators: true }
    );
    if (!lecture) throw ApiError.notFound('Lecture not found');

    await this.recalculateSection(lecture.section.toString());
    await this.recalculateCourseTotals(courseId);
    await this.invalidateCourseCaches(courseId);
    return lecture;
  }

  async deleteLecture(lectureId: string, courseId: string) {
    const lecture = await Lecture.findById(lectureId).select('section').lean();
    if (!lecture) throw ApiError.notFound('Lecture not found');

    return withTransaction(async (session) => {
      await cascadeDeleteService.deleteLecture(lectureId, courseId, session);
      await this.compactLectureOrder(lecture.section.toString(), courseId, session);
      await this.recalculateSection(lecture.section.toString());
      await this.recalculateCourseTotals(courseId);
      await this.invalidateCourseCaches(courseId);
    });
  }

  private async compactLectureOrder(sectionId: string, courseId: string, session?: any): Promise<void> {
    const remaining = await Lecture.find({ section: sectionId, course: courseId })
      .sort({ order: 1 })
      .select('_id')
      .lean();
    if (remaining.length === 0) return;
    await Lecture.bulkWrite(
      remaining.map((lecture: any, index: number) => ({
        updateOne: { filter: { _id: lecture._id }, update: { $set: { order: index } } },
      })),
      { session }
    );
  }

  async reorderLectures(sectionId: string, courseId: string, lectureOrder: { lectureId: string; order: number }[]) {
    if (!lectureOrder?.length) throw ApiError.badRequest('Reorder list cannot be empty');

    const section = await Section.findOne({ _id: sectionId, course: courseId }).select('_id').lean();
    if (!section) throw ApiError.notFound('Section not found');

    const requestedIds = lectureOrder.map((l) => l.lectureId);
    if (new Set(requestedIds).size !== requestedIds.length) {
      throw ApiError.badRequest('Reorder list contains duplicate lectures');
    }

    const sectionLectures = await Lecture.find({ section: sectionId, course: courseId }).select('_id').lean();
    const ownedIds = new Set(sectionLectures.map((lecture: any) => lecture._id.toString()));
    const unknown = requestedIds.filter((id) => !ownedIds.has(id));
    if (unknown.length > 0) {
      throw ApiError.badRequest('One or more lectures do not belong to this section');
    }
    if (requestedIds.length !== sectionLectures.length) {
      throw ApiError.badRequest('Reorder list must include every lecture of the section');
    }

    await withTransaction(async (session) => {
      const ops = requestedIds.map((lectureId, index) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(lectureId), section: sectionId, course: courseId },
          update: { $set: { order: index } },
        },
      }));
      await Lecture.bulkWrite(ops, { session });
      await Course.findByIdAndUpdate(courseId, { lastActivity: new Date() }, { session });
    });
    await this.invalidateCourseCaches(courseId);
  }

  async moveLecture(lectureId: string, courseId: string, targetSectionId: string) {
    const lecture = await Lecture.findOne({ _id: lectureId, course: courseId }).select('section course title');
    if (!lecture) throw ApiError.notFound('Lecture not found');

    const targetSection = await Section.findOne({ _id: targetSectionId, course: courseId });
    if (!targetSection) throw ApiError.notFound('Target section not found');

    const sourceSectionId = lecture.section.toString();
    if (sourceSectionId === targetSectionId) return lecture;

    const lastLecture = await Lecture.findOne({ section: targetSectionId }).sort({ order: -1 });
    const newOrder = (lastLecture?.order ?? -1) + 1;

    lecture.section = new mongoose.Types.ObjectId(targetSectionId);
    lecture.order = newOrder;
    await lecture.save();

    await this.recalculateSection(sourceSectionId);
    await this.recalculateSection(targetSectionId);
    await this.recalculateCourseTotals(courseId);
    await this.invalidateCourseCaches(courseId);
    return lecture;
  }

  async getLecture(lectureId: string, courseId: string, userId?: string): Promise<any> {
    const query: any = { _id: lectureId, course: courseId };
    const lecture = await Lecture.findOne(query).lean();
    if (!lecture) throw ApiError.notFound('Lecture not found');

    let isEnrolled = false;
    if (userId) {
      const enrollment = await Enrollment.findOne({ user: userId, course: courseId }).lean();
      isEnrolled = !!enrollment;
      if (!enrollment && !lecture.isFree) throw ApiError.forbidden('Not enrolled in this course');
    }

    if (!isEnrolled && !lecture.isFree) {
      throw ApiError.forbidden('Not enrolled in this course');
    }

    const section = await Section.findById(lecture.section).lean();
    const prev = await Lecture.findOne({ section: lecture.section, order: { $lt: lecture.order } })
      .sort({ order: -1 })
      .select('_id title')
      .lean();
    const next = await Lecture.findOne({ section: lecture.section, order: { $gt: lecture.order } })
      .sort({ order: 1 })
      .select('_id title')
      .lean();

    const safeLecture = this.sanitizeLectureForViewer(lecture, isEnrolled);
    return { ...safeLecture, section: section || null, prevLecture: prev || null, nextLecture: next || null };
  }

  /**
   * Strips answer keys (correctAnswer, and explanation for non-enrolled/free
   * viewers) from a single lecture before returning it to a viewer who is not
   * the course owner.
   */
  private sanitizeLectureForViewer(lecture: any, isEnrolled: boolean): any {
    const { quiz, ...rest } = lecture;
    if (quiz?.questions) {
      quiz.questions = quiz.questions.map((q: any) => {
        const safe: any = { ...q };
        if (!isEnrolled) {
          delete safe.correctAnswer;
          delete safe.explanation;
        }
        return safe;
      });
    }
    return { ...rest, quiz };
  }

  // ─── Recaclulation ──────────────────────────────────────────
  private async recalculateSection(sectionId: string) {
    const [{ totalLectures, totalDuration }] = await Lecture.aggregate([
      { $match: { section: new mongoose.Types.ObjectId(sectionId) } },
      { $group: { _id: null, totalLectures: { $sum: 1 }, totalDuration: { $sum: '$duration' } } },
    ]).then((r) => (r.length ? r : [{ totalLectures: 0, totalDuration: 0 }]));

    await Section.findByIdAndUpdate(sectionId, { totalLectures, totalDuration });
  }

  private async recalculateCourseTotals(courseId: string) {
    const courseObjectId = new mongoose.Types.ObjectId(courseId);
    const [sectionStats, lectureStats] = await Promise.all([
      Section.aggregate([
        { $match: { course: courseObjectId } },
        {
          $group: {
            _id: null,
            totalSections: { $sum: 1 },
            totalDuration: { $sum: '$totalDuration' },
            totalLectures: { $sum: '$totalLectures' },
          },
        },
      ]).then((r) => (r.length ? r[0] : { totalSections: 0, totalDuration: 0, totalLectures: 0 })),
      Lecture.aggregate([
        { $match: { course: courseObjectId } },
        { $group: { _id: null, totalResources: { $sum: { $size: { $ifNull: ['$resources', []] } } } } },
      ]).then((r) => (r.length ? r[0] : { totalResources: 0 })),
    ]);

    await Course.findByIdAndUpdate(courseId, {
      totalSections: sectionStats.totalSections,
      totalLectures: sectionStats.totalLectures,
      totalDuration: sectionStats.totalDuration,
      totalResources: lectureStats.totalResources,
    });
  }

  private async recalculateTotals(courseId: string, course?: any) {
    if (!course) course = await Course.findById(courseId);
    if (!course) return;

    const lectures = await Lecture.find({ course: courseId });
    const sections = await Section.find({ course: courseId });

    course.totalLectures = lectures.length;
    course.totalSections = sections.length;
    course.totalDuration = lectures.reduce((sum, l) => sum + (l.duration || 0), 0);
    course.totalResources = lectures.reduce((sum, l) => sum + (l.resources?.length || 0), 0);
  }
}

export const courseService = new CourseService();
