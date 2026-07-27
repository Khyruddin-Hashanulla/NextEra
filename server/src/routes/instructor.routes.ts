import { Router } from 'express';
import {
  apply, getApplicationStatus, getDashboard, getRevenue, getMyPayouts,
  getAnalytics, getStudents, listCoupons, createCoupon, updateCoupon,
  deleteCoupon, getReviews, replyToReview, listAnnouncements, createAnnouncement,
  deleteAnnouncement, getProfile, updateProfile, getSubscriptionStatus,
  listCertificates, issueCertificate,
} from '../controllers/instructor.controller';
import {
  getInstructorRevenueDetail,
  getMyInstructorSubscription,
  purchaseInstructorSubscription,
  cancelMyInstructorSubscription,
} from '../controllers/revenue.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { ROLES } from '../constants/roles';
import {
  applySchema, createCouponSchema, updateCouponSchema,
  replyToReviewSchema, createAnnouncementSchema, updateProfileSchema,
  issueCertificateSchema,
} from '../validators/instructor.validator';
import { purchaseInstructorSubscriptionSchema } from '../validators/revenue.validator';

const router = Router();

router.use(authenticate);

router.post('/apply', validate(applySchema), apply);
router.get('/application-status', getApplicationStatus);

// Instructor-only routes
router.use(authorize(ROLES.INSTRUCTOR, ROLES.ADMIN));

router.get('/dashboard', getDashboard);
router.get('/revenue', getRevenue);
router.get('/analytics', getAnalytics);
router.get('/payouts', getMyPayouts);

// Students
router.get('/students', getStudents);

// Coupons
router.get('/coupons', listCoupons);
router.post('/coupons', validate(createCouponSchema), createCoupon);
router.put('/coupons/:id', validate(updateCouponSchema), updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Reviews
router.get('/reviews', getReviews);
router.post('/reviews/:id/reply', validate(replyToReviewSchema), replyToReview);

// Announcements
router.get('/announcements', listAnnouncements);
router.post('/announcements', validate(createAnnouncementSchema), createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// Profile
router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);

// Subscription (instructor's own platform subscription)
router.get('/subscription', getSubscriptionStatus);

// Instructor Subscription Plans (self-service)
router.get('/my-subscription', getMyInstructorSubscription);
router.post('/my-subscription/purchase', validate(purchaseInstructorSubscriptionSchema), purchaseInstructorSubscription);
router.post('/my-subscription/cancel', cancelMyInstructorSubscription);

// Revenue Detail
router.get('/revenue/detail', getInstructorRevenueDetail);

// Certificates
router.get('/certificates', listCertificates);
router.post('/certificates', validate(issueCertificateSchema), issueCertificate);

export default router;
