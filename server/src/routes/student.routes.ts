import { Router } from 'express';
import {
  getDashboard, listCourses, getCourseDetail, getMyCourses, enrollFreeCourse,
  listInstructors, getInstructorProfile,
  initiatePayment, verifyPayment, retryPayment,
  updateProgress, getProgress, getWatchHistory,
  createNote, listNotes, updateNote, deleteNote,
  toggleBookmark, listBookmarks,
  createDiscussion, listDiscussions, replyToDiscussion,
  createReview, updateReview, listReviews,
  submitAssignment, getAssignments, getAssignmentsOverview, getAssignmentDetail,
  generateCertificate, getCertificates, verifyCertificate, getCertificateQr, downloadCertificate,
  toggleWishlist, listWishlist,
  listMyPayments, getPaymentById, generateInvoice,
  getLectureResources,
  listNotifications, markNotificationRead, markAllNotificationsRead,
  listBundles, getBundleById, initiateBundlePayment, verifyBundlePayment,
  listSubscriptionPlans, getMySubscription, initiateSubscriptionPayment, verifySubscriptionPayment,
} from '../controllers/student.controller';
import {
  submitQuiz, getStudentQuizAttempts, startQuiz, getAttemptDetails, resumeQuiz, autoSubmitQuiz,
} from '../controllers/quiz.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';import { validate } from '../middlewares/validate.middleware';
import { audit, auditMiddleware } from '../middlewares/audit.middleware';
import {
  verifyNoteOwnership,
  verifyReviewOwnership,
} from '../middlewares/ownership.middleware';
import {
  initiatePaymentSchema, verifyPaymentSchema, updateProgressSchema,
  createNoteSchema, updateNoteSchema, toggleBookmarkSchema,
  createDiscussionSchema, replyToDiscussionSchema, createReviewSchema,
  submitQuizSchema, submitAssignmentSchema,
} from '../validators/student.validator';
import { assignmentsOverviewQuerySchema } from '../validators/assignment.validator';
import {
  startQuizSchema,
  resumeQuizSchema,
} from '../validators/quiz.validator';
import { z } from 'zod';

const router = Router();

// Public
router.get('/instructors', listInstructors);
router.get('/instructors/:id', getInstructorProfile);
router.get('/courses', listCourses);
router.get('/courses/:id', optionalAuthenticate, getCourseDetail);
router.get('/certificates/verify/:certificateId', verifyCertificate);
router.get('/certificates/verify/:certificateId/qr.png', getCertificateQr);

// Protected - any authenticated user
router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/my-courses', getMyCourses);
router.get('/watch-history', getWatchHistory);
router.post('/courses/:courseId/enroll-free', enrollFreeCourse);

// Payment
router.post('/payments/initiate', validate(initiatePaymentSchema), initiatePayment);
router.post('/payments/verify', validate(verifyPaymentSchema), verifyPayment);
router.post('/payments/:id/retry', retryPayment);

// Progress
router.put('/progress/:courseId', validate(updateProgressSchema), updateProgress);
router.get('/progress/:courseId', getProgress);

// Notes
router.post('/notes', validate(createNoteSchema), createNote);
router.get('/notes', listNotes);
router.put('/notes/:id', verifyNoteOwnership, validate(updateNoteSchema), updateNote);
router.delete('/notes/:id', verifyNoteOwnership, deleteNote);

// Bookmarks
router.post('/bookmarks', validate(toggleBookmarkSchema), toggleBookmark);
router.get('/bookmarks', listBookmarks);

// Discussion
router.post('/discussions', validate(createDiscussionSchema), createDiscussion);
router.get('/discussions/:courseId', listDiscussions);
router.post('/discussions/:id/reply', validate(replyToDiscussionSchema), replyToDiscussion);

// Reviews
router.post('/reviews', validate(createReviewSchema), createReview);
router.put('/reviews/:id', verifyReviewOwnership, validate(createReviewSchema), updateReview);
router.get('/reviews/:courseId', listReviews);

// Assignment
router.post('/assignments',
  audit({
    action: (req, body) => {
      const version = body?.data?.data?.submissionVersion ?? body?.data?.submissionVersion ?? 1;
      return version > 1 ? 'ASSIGNMENT_UPDATED' : 'ASSIGNMENT_SUBMITTED';
    },
    resourceType: 'AssignmentSubmission',
    resourceName: (req) => req.body.lectureId,
    getNewData: (_req, result) => result?.data?.data || result?.data || undefined,
  }),
  auditMiddleware,
  validate(submitAssignmentSchema),
  submitAssignment
);
router.get('/assignments', getAssignments);
router.get('/assignments/overview', validate(assignmentsOverviewQuerySchema, 'query'), getAssignmentsOverview);
router.get('/assignments/:lectureId', getAssignmentDetail);

// Quiz
router.post('/quiz/start', validate(startQuizSchema), startQuiz);
router.post('/quiz', validate(submitQuizSchema), submitQuiz);
router.post('/quiz/resume', validate(resumeQuizSchema), resumeQuiz);
router.get('/quiz/:lectureId/attempts', getStudentQuizAttempts);
router.get('/quiz/:attemptId/details', getAttemptDetails);
router.post('/quiz/auto-submit', validate(submitQuizSchema), autoSubmitQuiz);

// Certificates
router.post('/certificates/:courseId', generateCertificate);
router.get('/certificates', getCertificates);
router.get('/certificates/download/:certificateId', downloadCertificate);

// Wishlist
router.post('/wishlist', validate(z.object({ body: z.object({ courseId: z.string().min(1) }) })), toggleWishlist);
router.get('/wishlist', listWishlist);

// Order History
router.get('/payments', listMyPayments);
router.get('/payments/:id', getPaymentById);

// Invoice
router.get('/payments/:paymentId/invoice', generateInvoice);

// Resources
router.get('/resources/:lectureId', getLectureResources);

// Bundles
router.get('/bundles', listBundles);
router.get('/bundles/:id', getBundleById);
router.post('/bundles/payments/initiate', initiateBundlePayment);
router.post('/bundles/payments/verify', verifyBundlePayment);

// Subscriptions
router.get('/subscriptions/plans', listSubscriptionPlans);
router.get('/subscriptions/my', getMySubscription);
router.post('/subscriptions/payments/initiate', initiateSubscriptionPayment);
router.post('/subscriptions/payments/verify', verifySubscriptionPayment);

// Notifications
router.get('/notifications', listNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/read-all', markAllNotificationsRead);

export default router;
