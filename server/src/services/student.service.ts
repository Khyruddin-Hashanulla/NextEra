import crypto from 'crypto';
import { User } from '../models/user.model';
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
import { env } from '../config/env';
import { generateCertificateSignature, generateQrCodeDataUrl, verifyCertificateSignature } from '../utils/certificate';
import { logger } from '../utils/logger';
import { paymentService } from './payment.service';

const RAZORPAY_KEY_ID = env.razorpayKeyId;
const RAZORPAY_KEY_SECRET = env.razorpayKeySecret;

export class StudentService {
  // ─── Dashboard ───────────────────────────────────────────────
  async getDashboard(userId: string) {
    const enrollments = await Enrollment.find({ user: userId })
      .populate('course', 'title thumbnail price level totalLectures totalDuration')
      .sort({ enrolledAt: -1 })
      .lean();

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter((e) => e.isCompleted).length;
    const inProgress = enrollments.filter((e) => !e.isCompleted && e.completionPercentage > 0).length;

    const certificates = await Certificate.find({ user: userId }).countDocuments();

    const recentCourses = enrollments.slice(0, 5);

    return { totalCourses, completedCourses, inProgress, certificates, recentCourses, enrollments };
  }

  // ─── Course Catalog ──────────────────────────────────────────
  async listCourses(search?: string, category?: string, level?: string, page = 1, limit = 12) {
    const filter: any = { status: 'published', isApproved: true };
    if (search) filter.title = { $regex: search, $options: 'i' };
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

    if (course.status !== 'published' && !userId) {
      throw ApiError.notFound('Course not found');
    }

    const sections = await Section.find({ course: courseId }).sort({ order: 1 }).lean();
    const sectionIds = sections.map((s) => s._id);
    const lectures = await Lecture.find({ section: { $in: sectionIds } }).sort({ order: 1 }).lean();

    const curriculum = sections.map((section) => ({
      ...section,
      lectures: lectures.filter((l) => l.section.toString() === section._id.toString()),
    }));

    let enrollment = null;
    let isEnrolled = false;
    if (userId) {
      enrollment = await Enrollment.findOne({ user: userId, course: courseId }).lean();
      isEnrolled = !!enrollment;
    }

    return { course, curriculum, isEnrolled, enrollment };
  }

  // ─── Payment & Enrollment ────────────────────────────────────
  async initiatePayment(userId: string, courseId: string, couponCode?: string) {
    return paymentService.initiateCoursePayment(userId, courseId, couponCode);
  }

  async verifyPayment(userId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    return paymentService.verifyCoursePayment(userId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
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

  async updateNote(noteId: string, userId: string, data: { content: string; timestamp?: number }) {
    const note = await Note.findOneAndUpdate({ _id: noteId, user: userId }, { $set: data }, { new: true });
    if (!note) throw ApiError.notFound('Note not found');
    return note;
  }

  async deleteNote(noteId: string, userId: string) {
    const note = await Note.findOneAndDelete({ _id: noteId, user: userId });
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

    const newReview = await Review.create({ user: userId, course: courseId, rating, review });
    await this.updateCourseRatings(courseId);
    return newReview;
  }

  async updateReview(reviewId: string, userId: string, rating: number, review?: string) {
    const updated = await Review.findOneAndUpdate(
      { _id: reviewId, user: userId },
      { $set: { rating, review } },
      { new: true }
    );
    if (!updated) throw ApiError.notFound('Review not found');
    await this.updateCourseRatings(updated.course.toString());
    return updated;
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

  private async updateCourseRatings(courseId: string) {
    const stats = await Review.aggregate([
      { $match: { course: courseId as any } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      await Course.findByIdAndUpdate(courseId, {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
      });
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
    const lecture = await Lecture.findById(lectureId);
    if (!lecture || lecture.type !== 'assignment') {
      throw ApiError.badRequest('This lecture is not an assignment');
    }

    const existing = await AssignmentSubmission.findOne({ user: userId, lecture: lectureId });
    if (existing) throw ApiError.conflict('You have already submitted this assignment');

    const submission = await AssignmentSubmission.create({
      user: userId,
      course: courseId,
      lecture: lectureId,
      content: content || '',
      files: files || [],
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

  // ─── Certificate ─────────────────────────────────────────────
  async generateCertificate(userId: string, courseId: string): Promise<any> {
    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (!enrollment) throw ApiError.notFound('Not enrolled in this course');
    if (!enrollment.isCompleted) throw ApiError.badRequest('Course not yet completed');

    const existingCert = await Certificate.findOne({ user: userId, course: courseId });
    if (existingCert) return existingCert;

    const user = await User.findById(userId);
    const course = await Course.findById(courseId);
    if (!user || !course) throw ApiError.notFound('User or Course not found');

    const certificateId = `CERT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const verifyUrl = `${env.clientUrl}/certificates/verify/${certificateId}`;

    const digitalSignature = generateCertificateSignature({
      certificateId,
      userId,
      courseId,
      issuedAt: new Date().toISOString(),
    });

    const qrCodeUrl = generateQrCodeDataUrl(verifyUrl);

    const certificateUrl = `${env.clientUrl}/certificates/${certificateId}?signature=${digitalSignature.slice(0, 16)}`;

    const certificate = await Certificate.create({
      user: userId,
      course: courseId,
      enrollment: enrollment._id,
      certificateId,
      qrCodeUrl,
      certificateUrl,
      digitalSignature,
    });

    await Enrollment.findByIdAndUpdate(enrollment._id, { certificateUrl });

    return certificate;
  }

  async getCertificates(userId: string): Promise<any> {
    const certs = await Certificate.find({ user: userId })
      .populate('course', 'title instructor')
      .sort({ issuedAt: -1 })
      .lean();
    return certs;
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
        userId: cert.user._id.toString(),
        courseId: cert.course._id.toString(),
        issuedAt: cert.issuedAt.toISOString(),
      },
      cert.digitalSignature,
    );

    return { ...cert, signatureValid };
  }

  // ─── Wishlist ─────────────────────────────────────────────────
  async toggleWishlist(userId: string, courseId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');

    const existing = await Wishlist.findOne({ user: userId, course: courseId });
    if (existing) {
      await existing.deleteOne();
      return { wishlisted: false };
    }
    await Wishlist.create({ user: userId, course: courseId });
    return { wishlisted: true };
  }

  async listWishlist(userId: string) {
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
      <p>${user.name}<br>${user.email}</p>
    </div>
    <div style="text-align:right">
      <strong>Invoice #:</strong> ${invoiceNumber}<br>
      <strong>Date:</strong> ${date}<br>
      <strong>Payment ID:</strong> ${payment.razorpayPaymentId || 'N/A'}
    </div>
  </div>
  <table>
    <tr><th>Description</th><th>Amount</th></tr>
    <tr><td>${courseTitle}</td><td>₹${amount}</td></tr>
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
