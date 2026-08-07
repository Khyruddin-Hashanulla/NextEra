import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { ROLES } from '../constants/roles';
import { Course } from '../models/course.model';
import { Bundle } from '../models/bundle.model';
import { Subscription } from '../models/subscription.model';
import { SubscriptionEnrollment } from '../models/subscriptionEnrollment.model';
import { Enrollment } from '../models/enrollment.model';
import { Payment } from '../models/payment.model';
import { Lecture } from '../models/lecture.model';
import { Section } from '../models/section.model';
import { Note } from '../models/note.model';
import { Bookmark } from '../models/bookmark.model';
import { Discussion } from '../models/discussion.model';
import { Review } from '../models/review.model';
import { QuizAttempt } from '../models/quizAttempt.model';
import { AssignmentSubmission } from '../models/assignmentSubmission.model';
import { Certificate } from '../models/certificate.model';
import { Coupon } from '../models/coupon.model';
import { Notification } from '../models/notification.model';
import { Wishlist } from '../models/wishlist.model';
import { ApiError } from '../utils/ApiError';
import { sanitizePlainText } from '../utils/sanitize';
import { escapeRegex } from '../utils/escapeRegex';
import { env } from '../config/env';
import { generateCertificateSignature, generateQrCodeDataUrl, verifyCertificateSignature, getVerificationUrl } from '../utils/certificate';
import { generateCertificateId } from '../utils/certificateIdGenerator';
import { generateCertificatePdf, getCertificateUrl, getCertificateFilePath } from '../utils/pdfGenerator';
import fs from 'fs';
import { logger } from '../utils/logger';
import { withTransaction } from '../utils/transaction';
import { paymentService } from './payment.service';
import { cacheService } from '../cache/cache.service';
import { cacheKeys, CACHE_TTL } from '../cache/cacheKeys';
import { cacheManager } from '../cache/cacheManager';

const RAZORPAY_KEY_ID = env.razorpayKeyId;
const RAZORPAY_KEY_SECRET = env.razorpayKeySecret;

export class StudentService {
  // ─── Dashboard ───────────────────────────────────────────────
  async getDashboard(userId: string) {
    return cacheService.remember(
      cacheKeys.studentDashboard(userId),
      { ttl: CACHE_TTL.STUDENT_DASHBOARD },
      async () => {
        const [enrollmentResult, certificates] = await Promise.all([
          Enrollment.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            { $sort: { enrolledAt: -1 } },
            {
              $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'course' },
            },
            {
              $addFields: {
                course: {
                  $let: {
                    vars: { c: { $arrayElemAt: ['$course', 0] } },
                    in: {
                      $cond: [
                        { $eq: ['$$c', null] },
                        null,
                        {
                          _id: '$$c._id',
                          title: '$$c.title',
                          thumbnail: '$$c.thumbnail',
                          price: '$$c.price',
                          level: '$$c.level',
                          totalLectures: '$$c.totalLectures',
                          totalDuration: '$$c.totalDuration',
                        },
                      ],
                    },
                  },
                },
              },
            },
          ]),
          Certificate.countDocuments({ user: userId }),
        ]);

        const enrollments = enrollmentResult ?? [];
        const totalCourses = enrollments.length;
        const completedCourses = enrollments.filter((e) => e.isCompleted).length;
        const inProgress = enrollments.filter((e) => !e.isCompleted && e.completionPercentage > 0).length;

        const recentCourses = enrollments.slice(0, 5);

        return { totalCourses, completedCourses, inProgress, certificates, recentCourses, enrollments };
      }
    );
  }

  // ─── Course Catalog ──────────────────────────────────────────
  async listCourses(search?: string, category?: string, level?: string, page = 1, limit = 12) {
    // Search queries are unique per user and low hit-rate; only cache unfiltered
    // catalog browsing (homepage, category/level listing).
    return cacheService.remember(
      cacheKeys.studentCourseList({ search, category, level, page, limit }),
      { ttl: CACHE_TTL.STUDENT_COURSE_LIST },
      async () => {
        const filter: any = { status: 'published', isApproved: true };
        if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };
        if (category) filter.category = category;
        if (level) filter.level = level;

        const skip = (page - 1) * limit;
        const [courses, total] = await Promise.all([
          Course.find(filter)
            .populate('category', 'name')
            .populate('instructor', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          Course.countDocuments(filter),
        ]);

        return { courses, total, page, limit, totalPages: Math.ceil(total / limit) };
      },
      !search
    );
  }

  // ─── Public Instructors ──────────────────────────────────────
  async listInstructors() {
    const instructors = await User.find({
      role: ROLES.INSTRUCTOR,
      isActive: true,
      isDeleted: false,
    })
      .select('name email avatar bio instructorProfile createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const ids = instructors.map((instructor) => instructor._id);

    const stats = await Course.aggregate<{
      _id: mongoose.Types.ObjectId;
      coursesCount: number;
      studentsCount: number;
      reviewsCount: number;
      avgRatingSum: number;
    }>([
      { $match: { instructor: { $in: ids }, status: 'published', isApproved: true } },
      {
        $group: {
          _id: '$instructor',
          coursesCount: { $sum: 1 },
          studentsCount: { $sum: { $ifNull: ['$totalEnrollments', 0] } },
          reviewsCount: { $sum: { $ifNull: ['$totalReviews', 0] } },
          avgRatingSum: { $sum: { $ifNull: ['$averageRating', 0] } },
        },
      },
    ]);

    const statsByInstructor = new Map(stats.map((stat) => [String(stat._id), stat]));

    return instructors.map((instructor) => {
      const stat = statsByInstructor.get(String(instructor._id));
      const coursesCount = stat?.coursesCount ?? 0;
      const avgRating = coursesCount > 0 ? (stat?.avgRatingSum ?? 0) / coursesCount : 0;
      const expertise = instructor.instructorProfile?.expertise ?? [];
      const teachingCategories = instructor.instructorProfile?.teachingCategories ?? [];
      return {
        _id: instructor._id,
        name: instructor.name,
        email: instructor.email,
        avatar: instructor.avatar?.url ?? '',
        bio: instructor.bio ?? '',
        title: instructor.instructorProfile?.qualification ?? '',
        experience: instructor.instructorProfile?.experience ?? '',
        specialties: expertise.length > 0 ? expertise : teachingCategories,
        rating: Math.round(avgRating * 10) / 10,
        coursesCount,
        studentsCount: stat?.studentsCount ?? 0,
        totalReviews: stat?.reviewsCount ?? 0,
      };
    });
  }

  async getInstructorProfile(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.notFound('Instructor not found');
    }

    const instructor = await User.findOne({
      _id: id,
      role: ROLES.INSTRUCTOR,
      isActive: true,
      isDeleted: false,
    })
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .lean();

    if (!instructor) throw ApiError.notFound('Instructor not found');

    const stats = await Course.aggregate<{
      _id: mongoose.Types.ObjectId;
      coursesCount: number;
      studentsCount: number;
      reviewsCount: number;
      avgRatingSum: number;
    }>([
      { $match: { instructor: new mongoose.Types.ObjectId(id), status: 'published', isApproved: true } },
      {
        $group: {
          _id: '$instructor',
          coursesCount: { $sum: 1 },
          studentsCount: { $sum: { $ifNull: ['$totalEnrollments', 0] } },
          reviewsCount: { $sum: { $ifNull: ['$totalReviews', 0] } },
          avgRatingSum: { $sum: { $ifNull: ['$averageRating', 0] } },
        },
      },
    ]);

    const stat = stats[0];
    const coursesCount = stat?.coursesCount ?? 0;
    const avgRating = coursesCount > 0 ? (stat?.avgRatingSum ?? 0) / coursesCount : 0;
    const expertise = instructor.instructorProfile?.expertise ?? [];
    const teachingCategories = instructor.instructorProfile?.teachingCategories ?? [];

    return {
      _id: instructor._id,
      name: instructor.name,
      email: instructor.email,
      phone: instructor.phone ?? '',
      address: instructor.address ?? '',
      avatar: instructor.avatar,
      bio: instructor.bio ?? '',
      socialLinks: instructor.socialLinks,
      instructorProfile: {
        qualification: instructor.instructorProfile?.qualification ?? '',
        experience: instructor.instructorProfile?.experience ?? '',
        expertise,
        teachingCategories,
        resume: instructor.instructorProfile?.resume,
        demoVideo: instructor.instructorProfile?.demoVideo,
        completedCourses: instructor.instructorProfile?.completedCourses ?? 0,
        totalStudents: instructor.instructorProfile?.totalStudents ?? 0,
        rating: instructor.instructorProfile?.rating ?? 0,
      },
      specialties: expertise.length > 0 ? expertise : teachingCategories,
      totalCourses: coursesCount,
      totalStudents: stat?.studentsCount ?? 0,
      totalReviews: stat?.reviewsCount ?? 0,
      averageRating: Math.round(avgRating * 10) / 10,
      createdAt: instructor.createdAt,
    };
  }

  // ─── Enrollment ──────────────────────────────────────────────
  async getMyCourses(userId: string) {
    const enrollments = await Enrollment.find({ user: userId })
      .populate({
        path: 'course',
        select: 'title thumbnail price level totalLectures totalDuration instructor',
        populate: { path: 'instructor', select: 'name avatar' },
      })
      .sort({ enrolledAt: -1 })
      .lean();
    return enrollments;
  }

  async getCourseWithCurriculum(courseId: string, userId?: string): Promise<any> {
    const course = await Course.findById(courseId)
      .populate('category', 'name')
      .populate('instructor', 'name email avatar bio')
      .lean();
    if (!course) throw ApiError.notFound('Course not found');

    // Unpublished/draft courses are only reachable by the owning instructor or
    // an enrolled student. This guard stays strict even when an unrelated
    // signed-in user hits the public course route (optional auth).
    if (course.status !== 'published') {
      let canView = false;
      if (userId) {
        const ownerId = course.instructor?._id?.toString?.() || course.instructor?.toString?.();
        canView = ownerId === userId;
        if (!canView) {
          const draftEnrollment = await Enrollment.findOne({ user: userId, course: courseId }).lean();
          canView = !!draftEnrollment;
        }
      }
      if (!canView) throw ApiError.notFound('Course not found');
    }

    const sections = await Section.find({ course: courseId }).sort({ order: 1 }).lean();
    const sectionIds = sections.map((s) => s._id);
    const lectures = await Lecture.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean();

    let enrollment = null;
    let isEnrolled = false;
    if (userId) {
      enrollment = await Enrollment.findOne({ user: userId, course: courseId }).lean();
      isEnrolled = !!enrollment;
    }

    const curriculum = sections.map((section) => ({
      ...section,
      lectures: this.sanitizeCurriculumLectures(
        lectures.filter((l) => l.section.toString() === section._id.toString()),
        isEnrolled
      ),
    }));

    return { course, curriculum, isEnrolled, enrollment };
  }

  /**
   * Strips answer keys from curriculum lectures. For viewers who are not
   * enrolled, EVERY lecture is returned so the complete curriculum stays
   * visible (lock icons on the client), but playback content
   * (videoSource/videoUrl) is only attached to free-preview lectures.
   */
  private sanitizeCurriculumLectures(lectures: any[], isEnrolled: boolean): any[] {
    if (!isEnrolled) {
      return lectures.map((lecture) => {
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
      });
    }
    return lectures.map((lecture) => {
      const { quiz, ...rest } = lecture;
      if (quiz?.questions) {
        quiz.questions = quiz.questions.map((q: any) => {
          const { correctAnswer, ...safeQuestion } = q;
          return safeQuestion;
        });
      }
      return { ...rest, quiz };
    });
  }

  // ─── Payment & Enrollment ────────────────────────────────────
  async initiatePayment(userId: string, courseId: string, couponCode?: string) {
    return paymentService.initiateCoursePayment(userId, courseId, couponCode);
  }

  /**
   * Enrolls a student in a free course without touching the payment gateway.
   * Idempotent: if the student is already enrolled, the existing enrollment is
   * returned (no 409). This is the ONLY entry point for free-course enrollment.
   */
  async enrollFreeCourse(userId: string, courseId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status !== 'published' || !course.isApproved) {
      throw ApiError.badRequest('Course is not available for enrollment');
    }
    if (course.price > 0 && course.courseType !== 'free') {
      throw ApiError.badRequest('This course requires payment to enroll');
    }

    const existing = await Enrollment.findOne({ user: userId, course: courseId }).lean();
    if (existing) {
      return { free: true, alreadyEnrolled: true, enrollment: existing };
    }

    try {
      const result = await withTransaction(async (session) => {
        const enrollment = await Enrollment.create([{ user: userId, course: courseId }], { session });
        await Course.findByIdAndUpdate(courseId, { $inc: { totalEnrollments: 1 } }, { session });
        return enrollment[0];
      });
      await this.invalidateEnrollmentCaches(userId, [courseId]);
      return { free: true, alreadyEnrolled: false, enrollment: result };
    } catch (error: any) {
      // E11000: concurrent duplicate inserts hit the unique (user, course) index.
      // The first insert wins; this request must return the winner instead of failing.
      if (error?.code === 11000 || (error?.message || '').includes('E11000')) {
        const winner = await Enrollment.findOne({ user: userId, course: courseId }).lean();
        if (winner) {
          await this.invalidateEnrollmentCaches(userId, [courseId]);
          return { free: true, alreadyEnrolled: true, enrollment: winner };
        }
      }
      throw error;
    }
  }

  private async invalidateEnrollmentCaches(userId: string, courseIds: string[]): Promise<void> {
    const course = await Course.findById(courseIds[0]).select('instructor').lean();
    await Promise.allSettled([
      cacheManager.invalidateStudentCache(userId),
      cacheManager.invalidateStudentCourseList(),
      cacheManager.invalidateCourseCache(),
      cacheManager.invalidateAdminCache(),
      cacheManager.invalidateRevenueCache(),
      course ? cacheManager.invalidateInstructorCache(course.instructor.toString()) : Promise.resolve(),
    ]);
  }

  async verifyPayment(userId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    return paymentService.verifyCoursePayment(userId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
  }

  async retryPayment(userId: string, paymentId: string) {
    return paymentService.retryPayment(userId, paymentId);
  }

  // ─── Bundles ─────────────────────────────────────────────────
  async listBundles(page = 1, limit = 12) {
    const skip = (page - 1) * limit;
    const [bundles, total] = await Promise.all([
      Bundle.find({ status: 'published' })
        .populate('courses', 'title thumbnail price instructor totalDuration averageRating')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Bundle.countDocuments({ status: 'published' }),
    ]);
    return { bundles, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getBundleById(bundleId: string) {
    const bundle = await Bundle.findById(bundleId)
      .populate({
        path: 'courses',
        select: 'title thumbnail price instructor totalDuration totalLectures averageRating totalReviews level',
        populate: { path: 'instructor', select: 'name avatar' },
      })
      .lean();
    if (!bundle) throw ApiError.notFound('Bundle not found');
    return bundle;
  }

  async initiateBundlePayment(userId: string, bundleId: string, couponCode?: string) {
    return paymentService.initiateBundlePayment(userId, bundleId, couponCode);
  }

  async verifyBundlePayment(userId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    return paymentService.verifyBundlePayment(userId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
  }

  // ─── Subscriptions ───────────────────────────────────────────
  async listSubscriptionPlans() {
    const plans = await Subscription.find({ status: 'active' }).sort({ price: 1 }).lean();
    return plans;
  }

  async getMySubscription(userId: string) {
    const sub = await SubscriptionEnrollment.findOne({ user: userId })
      .populate('subscription')
      .sort({ createdAt: -1 })
      .lean();
    return sub;
  }

  async initiateSubscriptionPayment(userId: string, subscriptionId: string, couponCode?: string) {
    return paymentService.initiateSubscriptionPayment(userId, subscriptionId, couponCode);
  }

  async verifySubscriptionPayment(userId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    return paymentService.verifySubscriptionPayment(userId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
  }

  // ─── Progress Tracking ───────────────────────────────────────
  async updateProgress(userId: string, courseId: string, lectureId: string, data: { position?: number; completed?: boolean; duration?: number }) {
    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (!enrollment) throw ApiError.notFound('Not enrolled in this course');

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) throw ApiError.notFound('Lecture not found');

    const historyEntry = enrollment.watchHistory.find((h) => h.lecture.toString() === lectureId);
    if (historyEntry) {
      if (data.position !== undefined) historyEntry.lastPosition = data.position;
      if (data.completed) historyEntry.completed = true;
      historyEntry.watchedAt = new Date();
    } else {
      enrollment.watchHistory.push({
        lecture: lecture._id,
        lastPosition: data.position || 0,
        completed: data.completed || false,
        watchedAt: new Date(),
      });
    }

    if (data.completed && !enrollment.completedLectures.some((id) => id.toString() === lectureId)) {
      enrollment.completedLectures.push(lecture._id);
    }

    enrollment.lastWatchedLecture = lecture._id;
    if (data.position !== undefined) enrollment.lastWatchedTimestamp = data.position;

    const totalLectures = await Lecture.countDocuments({ course: courseId });
    enrollment.completionPercentage = totalLectures > 0
      ? Math.round((enrollment.completedLectures.length / totalLectures) * 100)
      : 0;

    if (enrollment.completionPercentage >= 100) {
      enrollment.isCompleted = true;
    }

    await enrollment.save();
    await cacheService.del(cacheKeys.studentDashboard(userId));
    return enrollment;
  }

  async getProgress(userId: string, courseId: string): Promise<any> {
    const enrollment = await Enrollment.findOne({ user: userId, course: courseId })
      .populate('lastWatchedLecture', 'title duration')
      .lean();
    if (!enrollment) throw ApiError.notFound('Not enrolled in this course');

    const total = await Lecture.countDocuments({ course: courseId });
    return { ...enrollment, totalLectures: total };
  }

  async getWatchHistory(userId: string) {
    const enrollments = await Enrollment.find({ user: userId, lastWatchedLecture: { $ne: null } })
      .populate({
        path: 'course',
        select: 'title thumbnail',
      })
      .populate('lastWatchedLecture', 'title duration')
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();
    return enrollments;
  }

  // ─── Notes ───────────────────────────────────────────────────
  async createNote(userId: string, data: { courseId: string; lectureId: string; content: string; timestamp?: number }) {
    const note = await Note.create({ user: userId, ...data });
    return note;
  }

  async listNotes(userId: string, courseId?: string, lectureId?: string) {
    const filter: any = { user: userId };
    if (courseId) filter.course = courseId;
    if (lectureId) filter.lecture = lectureId;
    const notes = await Note.find(filter)
      .populate('lecture', 'title')
      .sort({ createdAt: -1 })
      .lean();
    return notes;
  }

  async updateNote(noteId: string, data: { content: string; timestamp?: number }) {
    const note = await Note.findByIdAndUpdate(noteId, { $set: data }, { new: true });
    if (!note) throw ApiError.notFound('Note not found');
    return note;
  }

  async deleteNote(noteId: string) {
    const note = await Note.findByIdAndDelete(noteId);
    if (!note) throw ApiError.notFound('Note not found');
  }

  // ─── Bookmarks ───────────────────────────────────────────────
  async toggleBookmark(userId: string, courseId: string, lectureId: string) {
    const existing = await Bookmark.findOne({ user: userId, lecture: lectureId });
    if (existing) {
      await existing.deleteOne();
      return { bookmarked: false };
    }
    await Bookmark.create({ user: userId, course: courseId, lecture: lectureId });
    return { bookmarked: true };
  }

  async listBookmarks(userId: string, courseId?: string) {
    const filter: any = { user: userId };
    if (courseId) filter.course = courseId;
    const bookmarks = await Bookmark.find(filter)
      .populate('lecture', 'title duration type')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .lean();
    return bookmarks;
  }

  // ─── Discussion ──────────────────────────────────────────────
  async createDiscussion(userId: string, data: { courseId: string; lectureId?: string; title: string; content: string }) {
    const discussion = await Discussion.create({ user: userId, ...data });
    const populated = await Discussion.findById(discussion._id)
      .populate('user', 'name avatar')
      .lean();
    return populated;
  }

  async listDiscussions(courseId: string, lectureId?: string, page = 1, limit = 20) {
    const filter: any = { course: courseId };
    if (lectureId) filter.lecture = lectureId;
    const skip = (page - 1) * limit;
    const [discussions, total] = await Promise.all([
      Discussion.find(filter)
        .populate('user', 'name avatar')
        .populate('replies.user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Discussion.countDocuments(filter),
    ]);
    return { discussions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async replyToDiscussion(discussionId: string, userId: string, content: string) {
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) throw ApiError.notFound('Discussion not found');
    discussion.replies.push({ user: userId as any, content, createdAt: new Date() });
    await discussion.save();
    const populated = await Discussion.findById(discussionId)
      .populate('user', 'name avatar')
      .populate('replies.user', 'name avatar')
      .lean();
    return populated;
  }

  // ─── Reviews ─────────────────────────────────────────────────
  async createReview(userId: string, courseId: string, rating: number, review?: string) {
    const enrolled = await Enrollment.findOne({ user: userId, course: courseId });
    if (!enrolled) throw ApiError.badRequest('You must be enrolled to review');

    const existing = await Review.findOne({ user: userId, course: courseId });
    if (existing) throw ApiError.conflict('You have already reviewed this course');

    return withTransaction(async (session) => {
      const [newReview] = await Review.create([{ user: userId, course: courseId, rating, review }], { session });
      await this.updateCourseRatings(courseId, session);
      return newReview;
    });
  }

  async updateReview(reviewId: string, rating: number, review?: string) {
    return withTransaction(async (session) => {
      const updated = await Review.findByIdAndUpdate(
        reviewId,
        { $set: { rating, review } },
        { new: true, session }
      );
      if (!updated) throw ApiError.notFound('Review not found');
      await this.updateCourseRatings(updated.course.toString(), session);
      return updated;
    });
  }

  async listReviews(courseId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find({ course: courseId })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ course: courseId }),
    ]);
    return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private async updateCourseRatings(courseId: string, session?: mongoose.ClientSession) {
    const stats = await Review.aggregate([
      { $match: { course: courseId as any } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
    ]).session(session || null);
    if (stats.length > 0) {
      await Course.findByIdAndUpdate(courseId, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
      }, { session });
    }
  }

  // ─── Quiz ────────────────────────────────────────────────────
  async submitQuiz(userId: string, courseId: string, lectureId: string, answers: { question: string; selectedAnswer: string }[]) {
    const lecture = await Lecture.findById(lectureId);
    if (!lecture || lecture.type !== 'assignment' || !lecture.assignment) {
      throw ApiError.badRequest('This lecture does not contain a quiz');
    }

    const quizData = lecture.assignment;
    if (!quizData.question) throw ApiError.badRequest('Quiz questions not found');

    const questions = JSON.parse(quizData.question) as { question: string; options: string[]; correctAnswer: string }[];
    let score = 0;
    const totalQuestions = questions.length;

    const processedAnswers = answers.map((a) => {
      const q = questions.find((q) => q.question === a.question);
      const isCorrect = q?.correctAnswer === a.selectedAnswer;
      if (isCorrect) score++;
      return { question: a.question, selectedAnswer: a.selectedAnswer, isCorrect };
    });

    const passed = score >= totalQuestions * 0.6;

    const attempt = await QuizAttempt.create({
      user: userId,
      course: courseId,
      lecture: lectureId,
      answers: processedAnswers,
      score,
      totalQuestions,
      passed,
      startedAt: new Date(Date.now() - 60000),
      completedAt: new Date(),
    });

    return attempt;
  }

  async getQuizAttempts(userId: string, lectureId: string) {
    const attempts = await QuizAttempt.find({ user: userId, lecture: lectureId })
      .sort({ createdAt: -1 })
      .lean();
    return attempts;
  }

  // ─── Assignment ──────────────────────────────────────────────
  async submitAssignment(userId: string, courseId: string, lectureId: string, content?: string, files?: { url: string; publicId: string; name: string }[]) {
    const user = await User.findById(userId).lean();
    if (!user || !user.isActive) throw ApiError.forbidden('Account is blocked');

    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (!enrollment) throw ApiError.forbidden('You are not enrolled in this course');

    const lecture = await Lecture.findById(lectureId);
    if (!lecture || lecture.type !== 'assignment') {
      throw ApiError.badRequest('This lecture is not an assignment');
    }
    if (lecture.course.toString() !== courseId) {
      throw ApiError.badRequest('Lecture does not belong to this course');
    }

    const assignmentConfig = lecture.assignment;
    const now = new Date();
    const dueDate = assignmentConfig?.dueDate ? new Date(assignmentConfig.dueDate) : null;
    const allowLateSubmission = assignmentConfig?.allowLateSubmission ?? false;

    const existing = await AssignmentSubmission.findOne({ user: userId, lecture: lectureId });

    if (existing) {
      if (existing.status === 'returned_for_resubmission') {
        if (dueDate && now > dueDate && !allowLateSubmission) {
          throw ApiError.badRequest('The deadline for resubmission has passed');
        }

        existing.content = content || '';
        existing.files = files || [];
        existing.submittedAt = new Date();
        existing.submissionVersion = (existing.submissionVersion || 1) + 1;
        existing.resubmittedAt = new Date();
        existing.status = 'submitted';
        existing.grade = undefined;
        existing.maxMarks = undefined;
        existing.percentage = undefined;
        existing.passFail = undefined;
        existing.letterGrade = undefined;
        existing.feedback = undefined;
        existing.gradedAt = undefined;
        existing.gradedBy = undefined;
        existing.publishedAt = undefined;
        existing.publishedBy = undefined;
        existing.rubric = [];

        if (dueDate && now > dueDate && allowLateSubmission) {
          existing.status = 'late_submission';
          const lateHours = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60));
          existing.penaltyPercent = Math.min(50, lateHours);
          existing.penaltyApplied = true;
        }

        await existing.save();
        return existing;
      }

      throw ApiError.conflict('You have already submitted this assignment');
    }

    let status: 'submitted' | 'late_submission' = 'submitted';
    let penaltyPercent = 0;
    let penaltyApplied = false;

    if (dueDate && now > dueDate) {
      if (!allowLateSubmission) {
        throw ApiError.badRequest('The deadline for this assignment has passed');
      }
      status = 'late_submission';
      const lateHours = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60));
      penaltyPercent = Math.min(50, lateHours);
      penaltyApplied = true;
    }

    const submission = await AssignmentSubmission.create({
      user: userId,
      course: courseId,
      lecture: lectureId,
      content: content || '',
      files: files || [],
      status,
      lateSubmission: status === 'late_submission',
      penaltyPercent,
      penaltyApplied,
      submissionVersion: 1,
    });
    return submission;
  }

  async getAssignmentSubmissions(userId: string, courseId?: string) {
    const filter: any = { user: userId };
    if (courseId) filter.course = courseId;
    const submissions = await AssignmentSubmission.find(filter)
      .populate('lecture', 'title assignment')
      .sort({ submittedAt: -1 })
      .lean();
    return submissions;
  }

  async getAssignmentsOverview(userId: string, page = 1, limit = 20, courseId?: string, status?: string) {
    const enrolledCourses = await Enrollment.find({ user: userId })
      .select('course')
      .lean();
    const enrolledCourseIds = enrolledCourses.map((e) => e.course);

    const lectureMatch: any = { type: 'assignment' };
    if (courseId) {
      if (!enrolledCourseIds.some((id) => id.toString() === courseId)) {
        throw ApiError.forbidden('You are not enrolled in this course');
      }
      lectureMatch.course = courseId;
    } else {
      lectureMatch.course = { $in: enrolledCourseIds };
    }

    const lectures = await Lecture.find(lectureMatch)
      .populate('course', 'title thumbnail')
      .sort({ createdAt: -1 })
      .lean();

    const lectureIds = lectures.map((l) => l._id);
    const submissions = await AssignmentSubmission.find({
      user: userId,
      lecture: { $in: lectureIds },
    })
      .select('lecture status grade maxMarks percentage passFail letterGrade submittedAt publishedAt lateSubmission')
      .lean();

    const submissionMap = new Map(submissions.map((s) => [s.lecture.toString(), s]));

    const items = lectures.map((lecture) => {
      const submission = submissionMap.get(lecture._id.toString());
      const assignmentConfig = lecture.assignment;
      const dueDate = assignmentConfig?.dueDate ? new Date(assignmentConfig.dueDate) : null;
      const now = new Date();
      const isOverdue = dueDate ? now > dueDate : false;

      let computedStatus: string;
      if (submission) {
        computedStatus = submission.status;
      } else if (isOverdue) {
        computedStatus = 'overdue';
      } else {
        computedStatus = 'assigned';
      }

      return {
        _id: lecture._id,
        title: lecture.title,
        course: lecture.course,
        dueDate,
        maxMarks: assignmentConfig?.totalMarks || 100,
        status: computedStatus,
        submission: submission
          ? {
              _id: submission._id,
              grade: submission.grade,
              maxMarks: submission.maxMarks,
              percentage: submission.percentage,
              passFail: submission.passFail,
              letterGrade: submission.letterGrade,
              submittedAt: submission.submittedAt,
              publishedAt: submission.publishedAt,
              lateSubmission: submission.lateSubmission,
            }
          : null,
      };
    });

    const filtered = status ? items.filter((item) => item.status === status) : items;
    const total = filtered.length;
    const skip = (page - 1) * limit;

    return {
      assignments: filtered.slice(skip, skip + limit),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getAssignmentDetail(userId: string, lectureId: string) {
    const lecture = await Lecture.findById(lectureId)
      .populate('course', 'title thumbnail instructor')
      .lean();

    if (!lecture || lecture.type !== 'assignment') {
      throw ApiError.notFound('Assignment not found');
    }

    const courseId = lecture.course._id?.toString() || lecture.course.toString();
    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (!enrollment) throw ApiError.forbidden('You are not enrolled in this course');

    const submission = await AssignmentSubmission.findOne({ user: userId, lecture: lectureId })
      .populate('gradedBy', 'name')
      .populate('publishedBy', 'name')
      .lean();

    const assignmentConfig = lecture.assignment;
    const dueDate = assignmentConfig?.dueDate ? new Date(assignmentConfig.dueDate) : null;
    const now = new Date();
    const isOverdue = dueDate ? now > dueDate : false;

    let status: string;
    if (submission) {
      status = submission.status;
    } else if (isOverdue) {
      status = 'overdue';
    } else {
      status = 'assigned';
    }

    return {
      lecture: {
        _id: lecture._id,
        title: lecture.title,
        course: lecture.course,
        assignment: assignmentConfig,
        resources: lecture.resources,
      },
      status,
      submission,
      canResubmit: submission?.status === 'returned_for_resubmission',
      canSubmit: !submission || submission.status === 'returned_for_resubmission',
    };
  }

  // ─── Certificate ─────────────────────────────────────────────
  async generateCertificate(userId: string, courseId: string): Promise<any> {
    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (!enrollment) throw ApiError.notFound('Not enrolled in this course');
    if (!enrollment.isCompleted) throw ApiError.badRequest('Course not yet completed');

    const existingCert = await Certificate.findOne({ user: userId, course: courseId });
    if (existingCert) return existingCert;

    const user = await User.findById(userId).lean();
    const course = await Course.findById(courseId)
      .populate('instructor', 'name')
      .populate('category', 'name')
      .lean();
    if (!user || !course) throw ApiError.notFound('User or Course not found');
    if (!course.isApproved) throw ApiError.badRequest('Course is not approved');
    if (course.status !== 'published') throw ApiError.badRequest('Course is not published');

    const certificateId = await generateCertificateId((course as any).category?.name || '');
    const issuedAt = new Date();
    const issuedAtStr = issuedAt.toISOString();

    const digitalSignature = generateCertificateSignature({
      certificateId,
      userId,
      courseId,
      issuedAt: issuedAtStr,
      version: 1,
    });

    const verifyUrl = getVerificationUrl(certificateId);
    const qrCodeUrl = await generateQrCodeDataUrl(verifyUrl);

    const instructorName = ((course as any).instructor as any)?.name || 'Instructor';
    const categoryName = ((course as any).category as any)?.name || '';
    const courseLevel = course.level || '';
    const courseDuration = course.totalDuration || 0;

    const pdfPath = await generateCertificatePdf({
      studentName: user.name,
      courseTitle: course.title,
      instructorName,
      certificateId,
      issuedAt,
      qrCodeDataUrl: qrCodeUrl,
    });

    const pdfFilename = `certificate-${certificateId}.pdf`;
    const pdfUrl = getCertificateUrl(pdfFilename);
    const certificateUrl = `${env.clientUrl}/certificate/${certificateId}`;

    try {
      return await withTransaction(async (session) => {
        const [certificate] = await Certificate.create([{
          user: userId,
          course: courseId,
          enrollment: enrollment._id,
          certificateId,
          qrCodeUrl,
          certificateUrl,
          pdfUrl,
          digitalSignature,
          status: 'active',
          version: 1,
          metadata: {
            categoryName,
            courseDuration,
            courseLevel,
            instructorName,
          },
          issuedAt,
        }], { session });

        await Enrollment.findByIdAndUpdate(enrollment._id, { certificateUrl: pdfUrl }, { session });

        const populated = await Certificate.findById(certificate._id)
          .populate('course', 'title')
          .lean();

        return populated;
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        const existing = await Certificate.findOne({ user: userId, course: courseId }).lean();
        if (existing) return existing;
      }
      throw error;
    }
  }

  async getCertificates(userId: string, page = 1, limit = 12): Promise<any> {
    const skip = (page - 1) * limit;
    const [certificates, total] = await Promise.all([
      Certificate.find({ user: userId, status: 'active' })
        .populate('course', 'title thumbnail instructor')
        .sort({ issuedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Certificate.countDocuments({ user: userId, status: 'active' }),
    ]);
    return { certificates, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async verifyCertificate(certificateId: string): Promise<any> {
    const cert = await Certificate.findOne({ certificateId })
      .populate('user', 'name email')
      .populate('course', 'title')
      .lean();
    if (!cert) throw ApiError.notFound('Certificate not found');

    const signatureValid = verifyCertificateSignature(
      {
        certificateId: cert.certificateId,
        userId: (cert.user as any)._id.toString(),
        courseId: (cert.course as any)._id.toString(),
        issuedAt: cert.issuedAt.toISOString(),
        version: cert.version || 1,
      },
      cert.digitalSignature,
    );

    const isRevoked = cert.status === 'revoked';

    await Certificate.updateOne({ _id: cert._id }, { $set: { verifiedAt: new Date() } });

    return {
      ...cert,
      signatureValid: signatureValid && !isRevoked,
      isRevoked,
      revokedAt: cert.revokedAt,
      revokedReason: cert.revokedReason,
    };
  }

  async downloadCertificate(userId: string, certificateId: string): Promise<{ filePath: string; filename: string; contentType: string }> {
    const cert = await Certificate.findOne({ certificateId }).lean();
    if (!cert) throw ApiError.notFound('Certificate not found');
    if (cert.user.toString() !== userId) throw ApiError.forbidden('Not your certificate');
    if (cert.status === 'revoked') throw ApiError.badRequest('Certificate has been revoked');

    await Certificate.updateOne({ _id: cert._id }, { $set: { downloadedAt: new Date() } });

    if (cert.pdfUrl) {
      const filename = `certificate-${certificateId}.pdf`;
      const filePath = getCertificateFilePath(filename);
      if (fs.existsSync(filePath)) {
        return { filePath, filename, contentType: 'application/pdf' };
      }
    }

    const [user, course] = await Promise.all([
      User.findById(cert.user).lean(),
      Course.findById(cert.course).populate('instructor', 'name').lean(),
    ]);

    const qrCodeDataUrl = cert.qrCodeUrl || undefined;
    const instructorName = (cert.metadata?.instructorName) || (course as any)?.instructor?.name || 'Instructor';

    const pdfPath = await generateCertificatePdf({
      studentName: user?.name || 'Student',
      courseTitle: (course as any)?.title || 'Course',
      instructorName,
      certificateId: cert.certificateId,
      issuedAt: cert.issuedAt,
      qrCodeDataUrl,
    });

    const pdfFilename = `certificate-${certificateId}.pdf`;
    return { filePath: pdfPath, filename: pdfFilename, contentType: 'application/pdf' };
  }

  // ─── Wishlist ─────────────────────────────────────────────────
  async toggleWishlist(userId: string, courseId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');

    const existing = await Wishlist.findOne({ user: userId, course: courseId });
    if (existing) {
      await existing.deleteOne();
      await cacheService.del(cacheKeys.wishlist(userId));
      return { wishlisted: false };
    }
    await Wishlist.create({ user: userId, course: courseId });
    await cacheService.del(cacheKeys.wishlist(userId));
    return { wishlisted: true };
  }

  async listWishlist(userId: string) {
    return cacheService.remember(
      cacheKeys.wishlist(userId),
      { ttl: CACHE_TTL.WISHLIST },
      async () => {
        const items = await Wishlist.find({ user: userId })
          .populate({
            path: 'course',
            select: 'title thumbnail price level instructor totalDuration averageRating totalReviews',
            populate: { path: 'instructor', select: 'name avatar' },
          })
          .sort({ createdAt: -1 })
          .lean();
        return items;
      }
    );
  }

  // ─── Order History ────────────────────────────────────────────
  async listMyPayments(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find({ user: userId })
        .populate('course', 'title thumbnail price')
        .populate('coupon', 'code discountType discountValue')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments({ user: userId }),
    ]);
    return { payments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPaymentById(paymentId: string, userId: string) {
    const payment = await Payment.findOne({ _id: paymentId, user: userId })
      .populate('course', 'title thumbnail price instructor')
      .populate('coupon', 'code discountType discountValue')
      .lean();
    if (!payment) throw ApiError.notFound('Payment not found');
    return payment;
  }

  // ─── Invoice ──────────────────────────────────────────────────
  async generateInvoice(paymentId: string, userId: string) {
    const payment = await this.getPaymentById(paymentId, userId);
    const user = await User.findById(userId).lean();
    if (!user) throw ApiError.notFound('User not found');

    const invoiceNumber = `INV-${payment.razorpayOrderId.slice(-10).toUpperCase()}`;
    const date = payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-IN') : 'N/A';
    const courseTitle = (payment.course as any)?.title || 'Course';
    const amount = payment.amount.toFixed(2);
    const discount = payment.discountAmount > 0 ? payment.discountAmount.toFixed(2) : '0.00';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Invoice ${invoiceNumber}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: auto; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; }
  .header h1 { color: #f97316; margin: 0; }
  .invoice-title { font-size: 24px; color: #333; }
  .details { display: flex; justify-content: space-between; margin: 20px 0; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
  th { background: #f97316; color: white; }
  .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
  .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="header">
    <h1>NextEra LMS</h1>
    <div class="invoice-title">INVOICE</div>
  </div>
  <div class="details">
    <div>
      <strong>Bill To:</strong>
      <p>${sanitizePlainText(user.name)}<br>${sanitizePlainText(user.email)}</p>
    </div>
    <div style="text-align:right">
      <strong>Invoice #:</strong> ${invoiceNumber}<br>
      <strong>Date:</strong> ${date}<br>
      <strong>Payment ID:</strong> ${payment.razorpayPaymentId || 'N/A'}
    </div>
  </div>
  <table>
    <tr><th>Description</th><th>Amount</th></tr>
    <tr><td>${sanitizePlainText(courseTitle)}</td><td>₹${amount}</td></tr>
    ${payment.discountAmount > 0 ? `<tr><td>Discount</td><td>-₹${discount}</td></tr>` : ''}
    <tr style="font-weight:bold"><td>Total</td><td>₹${amount}</td></tr>
  </table>
  <div class="footer">
    <p>NextEra LMS - Empowering Education</p>
    <p>Thank you for your purchase!</p>
  </div>
</body></html>`;

    return { html, invoiceNumber, filename: `invoice-${invoiceNumber}.html` };
  }

  // ─── Resources Download ───────────────────────────────────────
  async getLectureResources(lectureId: string, userId: string, courseId: string) {
    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (!enrollment) throw ApiError.forbidden('Not enrolled in this course');

    const lecture = await Lecture.findById(lectureId).lean();
    if (!lecture) throw ApiError.notFound('Lecture not found');

    return lecture.resources || [];
  }

  // ─── Notifications ────────────────────────────────────────────
  async listNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ user: userId }),
      Notification.countDocuments({ user: userId, isRead: false }),
    ]);
    return { notifications, total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markNotificationRead(notificationId: string, userId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) throw ApiError.notFound('Notification not found');
    return notification;
  }

  async markAllNotificationsRead(userId: string) {
    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
    return { success: true };
  }
}

export const studentService = new StudentService();
