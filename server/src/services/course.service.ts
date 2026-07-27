import { Course } from '../models/course.model';
import { Section } from '../models/section.model';
import { Lecture } from '../models/lecture.model';
import { User } from '../models/user.model';
import { Enrollment } from '../models/enrollment.model';
import { Review } from '../models/review.model';
import { ApiError } from '../utils/ApiError';
import { ROLES } from '../constants/roles';

export class CourseService {
  // ─── CRUD ────────────────────────────────────────────────────
  async create(instructorId: string, data: any) {
    const course = await Course.create({ ...data, instructor: instructorId });
    await User.findByIdAndUpdate(instructorId, { $inc: { totalCourses: 1 } });
    return course;
  }

  async getById(courseId: string) {
    const course = await Course.findById(courseId)
      .populate('category', 'name slug')
      .populate('instructor', 'name email avatar bio')
      .lean();
    if (!course) throw ApiError.notFound('Course not found');
    return course;
  }

  async getBySlug(slug: string) {
    const course = await Course.findOne({ slug })
      .populate('category', 'name slug')
      .populate('instructor', 'name email avatar bio')
      .lean();
    if (!course) throw ApiError.notFound('Course not found');
    return course;
  }

  async update(courseId: string, instructorId: string, data: any) {
    const course = await Course.findOneAndUpdate(
      { _id: courseId, instructor: instructorId },
      { $set: { ...data, lastActivity: new Date() } },
      { new: true, runValidators: true }
    ).populate('category', 'name').lean();
    if (!course) throw ApiError.notFound('Course not found or unauthorized');
    return course;
  }

  async delete(courseId: string, instructorId: string) {
    const course = await Course.findOneAndDelete({ _id: courseId, instructor: instructorId });
    if (!course) throw ApiError.notFound('Course not found or unauthorized');
    await Section.deleteMany({ course: courseId });
    await Lecture.deleteMany({ course: courseId });
    await Enrollment.deleteMany({ course: courseId });
    await Review.deleteMany({ course: courseId });
    await User.findByIdAndUpdate(instructorId, { $inc: { totalCourses: -1 } });
    return { deleted: true };
  }

  async duplicate(courseId: string, instructorId: string) {
    const original = await Course.findById(courseId).lean();
    if (!original) throw ApiError.notFound('Course not found');

    const newCourseData = { ...original, _id: undefined, __v: undefined, createdAt: undefined, updatedAt: undefined };
    newCourseData.title = `${original.title} (Copy)`;
    newCourseData.status = 'draft';
    newCourseData.isApproved = false;
    newCourseData.totalEnrollments = 0;
    newCourseData.averageRating = 0;
    newCourseData.totalReviews = 0;
    newCourseData.lastActivity = new Date();

    const newCourse = await Course.create(newCourseData);

    const sections = await Section.find({ course: courseId }).sort({ order: 1 }).lean();
    for (const section of sections) {
      const { _id, createdAt, updatedAt, ...sectionData } = section;
      const newSection = await Section.create({ ...sectionData, course: newCourse._id });

      const lectures = await Lecture.find({ section: section._id }).sort({ order: 1 }).lean();
      for (const lecture of lectures) {
        const { _id: lecId, createdAt: lc, updatedAt: lu, ...lectureData } = lecture;
        await Lecture.create({ ...lectureData, section: newSection._id, course: newCourse._id });
      }
    }

    return newCourse;
  }

  async listByInstructor(instructorId: string, status?: string) {
    const filter: any = { instructor: instructorId };
    if (status) filter.status = status;
    return Course.find(filter)
      .populate('category', 'name')
      .sort({ lastActivity: -1 })
      .lean();
  }

  async listAll(filters: { search?: string; category?: string; level?: string; status?: string; page?: number; limit?: number; sort?: string; featured?: boolean }) {
    const query: any = {};
    if (filters.search) query.title = { $regex: filters.search, $options: 'i' };
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
  }

  // ─── Publishing Workflow ─────────────────────────────────────
  async submitForReview(courseId: string, instructorId: string) {
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status !== 'draft' && course.status !== 'review') {
      throw ApiError.badRequest('Only draft courses can be submitted for review');
    }

    const sectionCount = await Section.countDocuments({ course: courseId });
    if (!sectionCount) throw ApiError.badRequest('Course must have at least one section');

    const lectureCount = await Lecture.countDocuments({ course: courseId });
    if (!lectureCount) throw ApiError.badRequest('Course must have at least one lecture');
    const videoLectures = await Lecture.countDocuments({ course: courseId, type: 'video' });
    if (!videoLectures) throw ApiError.badRequest('Course must have at least one video lecture');

    await this.recalculateTotals(courseId, course);
    course.status = 'review';
    await course.save();
    return course;
  }

  async approve(courseId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status !== 'review') throw ApiError.badRequest('Course is not in review status');
    course.status = 'published';
    course.isApproved = true;
    await course.save();
    return course;
  }

  async reject(courseId: string, reason?: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status !== 'review') throw ApiError.badRequest('Course is not in review status');
    course.status = 'draft';
    course.isApproved = false;
    await course.save();
    return { rejected: true, reason };
  }

  async publish(courseId: string, instructorId: string) {
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) throw ApiError.notFound('Course not found');
    const sections = await Section.countDocuments({ course: courseId });
    if (!sections) throw ApiError.badRequest('Add at least one section before publishing');
    const lectures = await Lecture.countDocuments({ course: courseId });
    if (!lectures) throw ApiError.badRequest('Add at least one lecture before publishing');
    await this.recalculateTotals(courseId, course);
    course.status = 'published';
    course.courseType = course.price > 0 ? 'paid' : 'free';
    course.lastActivity = new Date();
    await course.save();
    return course;
  }

  async unpublish(courseId: string, instructorId: string) {
    const course = await Course.findOneAndUpdate(
      { _id: courseId, instructor: instructorId, status: 'published' },
      { status: 'draft', courseType: 'draft', lastActivity: new Date() },
      { new: true }
    );
    if (!course) throw ApiError.notFound('Course not found or not published');
    return course;
  }

  async archive(courseId: string, instructorId: string) {
    const course = await Course.findOneAndUpdate(
      { _id: courseId, instructor: instructorId },
      { status: 'archived', lastActivity: new Date() },
      { new: true }
    );
    if (!course) throw ApiError.notFound('Course not found');
    return course;
  }

  async toggleFeatured(courseId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    course.featured = !course.featured;
    await course.save();
    return course;
  }

  // ─── Curriculum ──────────────────────────────────────────────
  async getCurriculum(courseId: string): Promise<any[]> {
    const course = await Course.findById(courseId).select('title instructor').lean();
    if (!course) throw ApiError.notFound('Course not found');

    const sections = await Section.find({ course: courseId }).sort({ order: 1 }).lean();
    const sectionsWithLectures = await Promise.all(
      sections.map(async (section: any) => {
        const lectures = await Lecture.find({ section: section._id }).sort({ order: 1 }).select('-quiz.questions.correctAnswer').lean();
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
        const lectures = await Lecture.find({ section: section._id }).sort({ order: 1 })
          .select(isEnrolled ? '-quiz.questions.correctAnswer' : 'title type duration isFree order description videoSource videoUrl')
          .lean();
        const filteredLectures = isEnrolled ? lectures : lectures.filter((l: any) => l.isFree || false);
        return { ...section, lectures: filteredLectures };
      })
    );

    return { curriculum: sectionsWithLectures, isEnrolled };
  }

  // ─── Sections ────────────────────────────────────────────────
  async createSection(courseId: string, instructorId: string, data: { title: string; description?: string; objective?: string }) {
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) throw ApiError.notFound('Course not found or unauthorized');

    const lastSection = await Section.findOne({ course: courseId }).sort({ order: -1 });
    const order = (lastSection?.order ?? -1) + 1;

    const section = await Section.create({ course: courseId, ...data, order });
    await Course.findByIdAndUpdate(courseId, { $inc: { totalSections: 1 }, lastActivity: new Date() });
    return section;
  }

  async updateSection(sectionId: string, courseId: string, instructorId: string, data: any) {
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) throw ApiError.notFound('Course not found or unauthorized');

    const section = await Section.findOneAndUpdate(
      { _id: sectionId, course: courseId },
      { $set: { ...data, lastActivity: new Date() } },
      { new: true, runValidators: true }
    );
    if (!section) throw ApiError.notFound('Section not found');
    return section;
  }

  async deleteSection(sectionId: string, courseId: string, instructorId: string) {
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) throw ApiError.notFound('Course not found or unauthorized');

    const section = await Section.findOneAndDelete({ _id: sectionId, course: courseId });
    if (!section) throw ApiError.notFound('Section not found');

    const deletedLectures = await Lecture.deleteMany({ section: sectionId });
    await Course.findByIdAndUpdate(courseId, {
      $inc: { totalSections: -1, totalLectures: -deletedLectures.deletedCount },
      lastActivity: new Date(),
    });
  }

  async reorderSections(courseId: string, instructorId: string, sectionOrder: { sectionId: string; order: number }[]) {
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) throw ApiError.notFound('Course not found or unauthorized');

    const updates = sectionOrder.map((s) => Section.findByIdAndUpdate(s.sectionId, { order: s.order }));
    await Promise.all(updates);
    await Course.findByIdAndUpdate(courseId, { lastActivity: new Date() });
  }

  async getSection(sectionId: string) {
    const section = await Section.findById(sectionId).lean();
    if (!section) throw ApiError.notFound('Section not found');
    return section;
  }

  // ─── Lectures ────────────────────────────────────────────────
  async createLecture(sectionId: string, courseId: string, instructorId: string, data: any) {
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) throw ApiError.notFound('Course not found or unauthorized');

    const section = await Section.findOne({ _id: sectionId, course: courseId });
    if (!section) throw ApiError.notFound('Section not found');

    const lastLecture = await Lecture.findOne({ section: sectionId }).sort({ order: -1 });
    const order = (lastLecture?.order ?? -1) + 1;

    const lecture = await Lecture.create({ section: sectionId, course: courseId, ...data, order });
    await this.recalculateSection(sectionId);
    await this.recalculateCourseTotals(courseId);
    return lecture;
  }

  async updateLecture(lectureId: string, courseId: string, instructorId: string, data: any) {
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) throw ApiError.notFound('Course not found or unauthorized');

    const lecture = await Lecture.findOneAndUpdate(
      { _id: lectureId, course: courseId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!lecture) throw ApiError.notFound('Lecture not found');

    await this.recalculateSection(lecture.section.toString());
    await this.recalculateCourseTotals(courseId);
    return lecture;
  }

  async deleteLecture(lectureId: string, courseId: string, instructorId: string) {
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) throw ApiError.notFound('Course not found or unauthorized');

    const lecture = await Lecture.findOneAndDelete({ _id: lectureId, course: courseId });
    if (!lecture) throw ApiError.notFound('Lecture not found');

    await this.recalculateSection(lecture.section.toString());
    await this.recalculateCourseTotals(courseId);
  }

  async reorderLectures(sectionId: string, courseId: string, instructorId: string, lectureOrder: { lectureId: string; order: number }[]) {
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) throw ApiError.notFound('Course not found or unauthorized');

    const updates = lectureOrder.map((l) => Lecture.findByIdAndUpdate(l.lectureId, { order: l.order }));
    await Promise.all(updates);
    await Course.findByIdAndUpdate(courseId, { lastActivity: new Date() });
  }

  async getLecture(lectureId: string, courseId: string, userId?: string): Promise<any> {
    const query: any = { _id: lectureId, course: courseId };
    const lecture = await Lecture.findOne(query).lean();
    if (!lecture) throw ApiError.notFound('Lecture not found');

    if (userId) {
      const enrollment = await Enrollment.findOne({ user: userId, course: courseId }).lean();
      if (!enrollment && !lecture.isFree) throw ApiError.forbidden('Not enrolled in this course');
    }

    const section = await Section.findById(lecture.section).lean();
    const prev = await Lecture.findOne({ section: lecture.section, order: { $lt: lecture.order } }).sort({ order: -1 }).select('_id title').lean();
    const next = await Lecture.findOne({ section: lecture.section, order: { $gt: lecture.order } }).sort({ order: 1 }).select('_id title').lean();

    return { ...lecture, section: section || null, prevLecture: prev || null, nextLecture: next || null };
  }

  // ─── Recaclulation ──────────────────────────────────────────
  private async recalculateSection(sectionId: string) {
    const [{ totalLectures, totalDuration }] = await Lecture.aggregate([
      { $match: { section: sectionId as any } },
      { $group: { _id: null, totalLectures: { $sum: 1 }, totalDuration: { $sum: '$duration' } } },
    ]).then((r) => (r.length ? r : [{ totalLectures: 0, totalDuration: 0 }]));

    await Section.findByIdAndUpdate(sectionId, { totalLectures, totalDuration });
  }

  private async recalculateCourseTotals(courseId: string) {
    const [sectionStats, lectureStats] = await Promise.all([
      Section.aggregate([
        { $match: { course: courseId as any } },
        { $group: { _id: null, totalSections: { $sum: 1 }, totalDuration: { $sum: '$totalDuration' }, totalLectures: { $sum: '$totalLectures' } } },
      ]).then((r) => (r.length ? r[0] : { totalSections: 0, totalDuration: 0, totalLectures: 0 })),
      Lecture.aggregate([
        { $match: { course: courseId as any } },
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
