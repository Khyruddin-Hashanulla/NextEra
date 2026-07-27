import { Router } from 'express';
import {
  getDashboard, listCourses, getCourseDetail, getMyCourses,
  initiatePayment, verifyPayment,
  updateProgress, getProgress, getWatchHistory,
  createNote, listNotes, updateNote, deleteNote,
  toggleBookmark, listBookmarks,
  createDiscussion, listDiscussions, replyToDiscussion,
  createReview, updateReview, listReviews,
  submitQuiz, getQuizAttempts,
  submitAssignment, getAssignments,
  generateCertificate, getCertificates, verifyCertificate,
  toggleWishlist, listWishlist,
  listMyPayments, getPaymentById, generateInvoice,
  getLectureResources,
  listNotifications, markNotificationRead, markAllNotificationsRead,
  listBundles, getBundleById, initiateBundlePayment, verifyBundlePayment,
  listSubscriptionPlans, getMySubscription, initiateSubscriptionPayment, verifySubscriptionPayment,
} from '../controllers/student.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  initiatePaymentSchema, verifyPaymentSchema, updateProgressSchema,
  createNoteSchema, updateNoteSchema, toggleBookmarkSchema,
  createDiscussionSchema, replyToDiscussionSchema, createReviewSchema,
  submitQuizSchema, submitAssignmentSchema,
} from '../validators/student.validator';
import { z } from 'zod';

const router = Router();

// Public
router.get('/courses', listCourses);
router.get('/courses/:id', getCourseDetail);
router.get('/certificates/verify/:certificateId', verifyCertificate);

// Protected - any authenticated user
router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/my-courses', getMyCourses);
router.get('/watch-history', getWatchHistory);

// Payment
router.post('/payments/initiate', validate(initiatePaymentSchema), initiatePayment);
router.post('/payments/verify', validate(verifyPaymentSchema), verifyPayment);

// Progress
router.put('/progress/:courseId', validate(updateProgressSchema), updateProgress);
router.get('/progress/:courseId', getProgress);

// Notes
router.post('/notes', validate(createNoteSchema), createNote);
router.get('/notes', listNotes);
router.put('/notes/:id', validate(updateNoteSchema), updateNote);
router.delete('/notes/:id', deleteNote);

// Bookmarks
router.post('/bookmarks', validate(toggleBookmarkSchema), toggleBookmark);
router.get('/bookmarks', listBookmarks);

// Discussion
router.post('/discussions', validate(createDiscussionSchema), createDiscussion);
router.get('/discussions/:courseId', listDiscussions);
router.post('/discussions/:id/reply', validate(replyToDiscussionSchema), replyToDiscussion);

// Reviews
router.post('/reviews', validate(createReviewSchema), createReview);
router.put('/reviews/:id', validate(createReviewSchema), updateReview);
router.get('/reviews/:courseId', listReviews);

// Quiz
router.post('/quiz', validate(submitQuizSchema), submitQuiz);
router.get('/quiz/:lectureId/attempts', getQuizAttempts);

// Assignment
router.post('/assignments', validate(submitAssignmentSchema), submitAssignment);
router.get('/assignments', getAssignments);

// Certificates
router.post('/certificates/:courseId', generateCertificate);
router.get('/certificates', getCertificates);

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
