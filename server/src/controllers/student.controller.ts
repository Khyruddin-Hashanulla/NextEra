import { Request, Response } from 'express';
import { studentService } from '../services/student.service';
import { quizService } from '../services/quiz.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';

// ─── Dashboard ─────────────────────────────────────────────────
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.getDashboard(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Dashboard data fetched', data));
});

// ─── Courses ───────────────────────────────────────────────────
export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  const { search, category, level, page, limit } = req.query as any;
  const data = await studentService.listCourses(search, category, level, Number(page) || 1, Number(limit) || 12);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Courses fetched', data));
});

export const getCourseDetail = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.getCourseWithCurriculum(req.params.id, req.currentUser?.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course details fetched', data));
});

// ─── Public Instructors ─────────────────────────────────────────
export const listInstructors = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.listInstructors();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Instructors fetched', data));
});

export const getInstructorProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.getInstructorProfile(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Instructor profile fetched', data));
});

// ─── Enrollment ────────────────────────────────────────────────
export const getMyCourses = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.getMyCourses(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Enrolled courses fetched', data));
});

// ─── Payment ───────────────────────────────────────────────────
export const initiatePayment = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, couponCode } = req.body;
  const data = await studentService.initiatePayment(req.currentUser!.userId, courseId, couponCode);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Payment initiated', data));
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const data = await studentService.verifyPayment(req.currentUser!.userId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Payment verified', data));
});

// ─── Progress ──────────────────────────────────────────────────
export const updateProgress = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { lectureId, position, completed, duration } = req.body;
  const data = await studentService.updateProgress(req.currentUser!.userId, courseId, lectureId, { position, completed, duration });
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Progress updated', data));
});

export const getProgress = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.getProgress(req.currentUser!.userId, req.params.courseId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Progress fetched', data));
});

export const getWatchHistory = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.getWatchHistory(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Watch history fetched', data));
});

// ─── Notes ─────────────────────────────────────────────────────
export const createNote = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.createNote(req.currentUser!.userId, req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Note created', data));
});

export const listNotes = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, lectureId } = req.query as any;
  const data = await studentService.listNotes(req.currentUser!.userId, courseId, lectureId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Notes fetched', data));
});

export const updateNote = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.updateNote(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Note updated', data));
});

export const deleteNote = asyncHandler(async (req: Request, res: Response) => {
  await studentService.deleteNote(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Note deleted', null));
});

// ─── Bookmarks ─────────────────────────────────────────────────
export const toggleBookmark = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, lectureId } = req.body;
  const data = await studentService.toggleBookmark(req.currentUser!.userId, courseId, lectureId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success(data.bookmarked ? 'Bookmarked' : 'Bookmark removed', data));
});

export const listBookmarks = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.query as any;
  const data = await studentService.listBookmarks(req.currentUser!.userId, courseId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Bookmarks fetched', data));
});

// ─── Discussion ────────────────────────────────────────────────
export const createDiscussion = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.createDiscussion(req.currentUser!.userId, req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Discussion created', data));
});

export const listDiscussions = asyncHandler(async (req: Request, res: Response) => {
  const { lectureId, page, limit } = req.query as any;
  const data = await studentService.listDiscussions(req.params.courseId, lectureId, Number(page) || 1, Number(limit) || 20);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Discussions fetched', data));
});

export const replyToDiscussion = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.replyToDiscussion(req.params.id, req.currentUser!.userId, req.body.content);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Reply added', data));
});

// ─── Reviews ───────────────────────────────────────────────────
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, rating, review } = req.body;
  const data = await studentService.createReview(req.currentUser!.userId, courseId, rating, review);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Review created', data));
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const { rating, review } = req.body;
  const data = await studentService.updateReview(req.params.id, rating, review);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Review updated', data));
});

export const listReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as any;
  const data = await studentService.listReviews(req.params.courseId, Number(page) || 1, Number(limit) || 10);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Reviews fetched', data));
});

// ─── Quiz ──────────────────────────────────────────────────────
export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, lectureId, answers } = req.body;
  const data = await studentService.submitQuiz(req.currentUser!.userId, courseId, lectureId, answers);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Quiz submitted', data));
});

export const getQuizAttempts = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.getQuizAttempts(req.currentUser!.userId, req.params.lectureId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Quiz attempts fetched', data));
});

// ─── Assignment ────────────────────────────────────────────────
export const getAssignments = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.query as any;
  const data = await studentService.getAssignmentSubmissions(req.currentUser!.userId, courseId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Assignments fetched', data));
});

export const getAssignmentsOverview = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, courseId, status } = req.query as any;
  const data = await studentService.getAssignmentsOverview(
    req.currentUser!.userId,
    Number(page) || 1,
    Number(limit) || 20,
    courseId,
    status
  );
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Assignments overview fetched', data));
});

export const getAssignmentDetail = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.getAssignmentDetail(req.currentUser!.userId, req.params.lectureId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Assignment details fetched', data));
});

export const submitAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { courseId, lectureId, content, files } = req.body;
  const data = await studentService.submitAssignment(
    req.currentUser!.userId,
    courseId,
    lectureId,
    content,
    files
  );
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Assignment submitted', data));
});

// ─── Certificate ───────────────────────────────────────────────
export const generateCertificate = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.generateCertificate(req.currentUser!.userId, req.params.courseId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Certificate generated', data));
});

export const getCertificates = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.getCertificates(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Certificates fetched', data));
});

export const verifyCertificate = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.verifyCertificate(req.params.certificateId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Certificate verified', data));
});

export const downloadCertificate = asyncHandler(async (req: Request, res: Response) => {
  const { filePath, filename, contentType } = await studentService.downloadCertificate(
    req.currentUser!.userId, req.params.certificateId
  );
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(HTTP_STATUS.OK).sendFile(filePath);
});

// ─── Wishlist ─────────────────────────────────────────────────
export const toggleWishlist = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.toggleWishlist(req.currentUser!.userId, req.body.courseId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success(data.wishlisted ? 'Added to wishlist' : 'Removed from wishlist', data));
});

export const listWishlist = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.listWishlist(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Wishlist fetched', data));
});

// ─── Retry Payment ─────────────────────────────────────────────
export const retryPayment = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.retryPayment(req.currentUser!.userId, req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Payment retry initiated', data));
});

// ─── Order History ─────────────────────────────────────────────
export const listMyPayments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as any;
  const data = await studentService.listMyPayments(req.currentUser!.userId, Number(page) || 1, Number(limit) || 10);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Payments fetched', data));
});

export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.getPaymentById(req.params.id, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Payment fetched', data));
});

// ─── Invoice ───────────────────────────────────────────────────
export const generateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.generateInvoice(req.params.paymentId, req.currentUser!.userId);
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="${data.filename}"`);
  res.status(HTTP_STATUS.OK).send(data.html);
});

// ─── Resources ─────────────────────────────────────────────────
export const getLectureResources = asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.query as any;
  const data = await studentService.getLectureResources(req.params.lectureId, req.currentUser!.userId, courseId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Resources fetched', data));
});

// ─── Notifications ─────────────────────────────────────────────
export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as any;
  const data = await studentService.listNotifications(req.currentUser!.userId, Number(page) || 1, Number(limit) || 20);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Notifications fetched', data));
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.markNotificationRead(req.params.id, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Notification marked as read', data));
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.markAllNotificationsRead(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('All notifications marked as read', data));
});

// ─── Bundles ───────────────────────────────────────────────────
export const listBundles = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query as any;
  const data = await studentService.listBundles(Number(page) || 1, Number(limit) || 12);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Bundles fetched', data));
});

export const getBundleById = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.getBundleById(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Bundle details fetched', data));
});

export const initiateBundlePayment = asyncHandler(async (req: Request, res: Response) => {
  const { bundleId, couponCode } = req.body;
  const data = await studentService.initiateBundlePayment(req.currentUser!.userId, bundleId, couponCode);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Bundle payment initiated', data));
});

export const verifyBundlePayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const data = await studentService.verifyBundlePayment(req.currentUser!.userId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Bundle payment verified', data));
});

// ─── Subscriptions ─────────────────────────────────────────────
export const listSubscriptionPlans = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.listSubscriptionPlans();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Subscription plans fetched', data));
});

export const getMySubscription = asyncHandler(async (req: Request, res: Response) => {
  const data = await studentService.getMySubscription(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Subscription fetched', data));
});

export const initiateSubscriptionPayment = asyncHandler(async (req: Request, res: Response) => {
  const { subscriptionId, couponCode } = req.body;
  const data = await studentService.initiateSubscriptionPayment(req.currentUser!.userId, subscriptionId, couponCode);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Subscription payment initiated', data));
});

export const verifySubscriptionPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const data = await studentService.verifySubscriptionPayment(req.currentUser!.userId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Subscription payment verified', data));
});
