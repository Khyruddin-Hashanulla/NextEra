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
import {
  getInstructorAssignments,
  getInstructorAssignmentStats,
  getLectureSubmissions,
  getSubmissionDetail,
  updateSubmissionStatus,
  gradeSubmission,
  returnForResubmission,
} from '../controllers/assignment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { requireSubscription, requireFeaturePermission } from '../middlewares/subscription.middleware';
import { subscriptionPermissionService } from '../services/subscriptionPermission.service';
import { validate } from '../middlewares/validate.middleware';
import { audit, auditMiddleware } from '../middlewares/audit.middleware';
import { ROLES } from '../constants/roles';
import {
  verifyCouponOwnership,
  verifyAnnouncementOwnership,
} from '../middlewares/ownership.middleware';
import {
  applySchema, createCouponSchema, updateCouponSchema,
  replyToReviewSchema, createAnnouncementSchema, updateProfileSchema,
  issueCertificateSchema,
} from '../validators/instructor.validator';
import {
  gradeSubmissionSchema,
  updateSubmissionStatusSchema,
  returnForResubmissionSchema,
  submissionsListQuerySchema,
} from '../validators/assignment.validator';
import { purchaseInstructorSubscriptionSchema } from '../validators/revenue.validator';

const router = Router();

router.use(authenticate);

router.post('/apply', validate(applySchema), apply);
router.get('/application-status', getApplicationStatus);

// Instructor-only routes
router.use(authorize(ROLES.INSTRUCTOR, ROLES.ADMIN));
router.use(auditMiddleware);

router.get('/dashboard', getDashboard);
router.get('/revenue', getRevenue);
router.get('/analytics', requireFeaturePermission(
  (info) => subscriptionPermissionService.canAccessAdvancedAnalytics(info),
  'Advanced analytics', 'Pro'
), getAnalytics);
router.get('/payouts', getMyPayouts);

// Students
router.get('/students', getStudents);

// Coupons
router.get('/coupons', listCoupons);
router.post('/coupons', requireFeaturePermission(
  (info) => subscriptionPermissionService.canUseCoupons(info),
  'Coupons', 'Pro'
), validate(createCouponSchema), createCoupon);
router.put('/coupons/:id', requireFeaturePermission(
  (info) => subscriptionPermissionService.canUseCoupons(info),
  'Coupons', 'Pro'
), verifyCouponOwnership, validate(updateCouponSchema), updateCoupon);
router.delete('/coupons/:id', verifyCouponOwnership, deleteCoupon);

// Reviews
router.get('/reviews', getReviews);
router.post('/reviews/:id/reply', validate(replyToReviewSchema), replyToReview);

// Announcements
router.get('/announcements', listAnnouncements);
router.post('/announcements', validate(createAnnouncementSchema), createAnnouncement);
router.delete('/announcements/:id', verifyAnnouncementOwnership, deleteAnnouncement);

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

// Assignments
router.get('/assignments', getInstructorAssignments);
router.get('/assignments/stats', getInstructorAssignmentStats);
router.get('/assignments/:lectureId/submissions', validate(submissionsListQuerySchema, 'query'), getLectureSubmissions);
router.get('/assignments/submissions/:submissionId', getSubmissionDetail);
router.patch('/assignments/submissions/:submissionId/status', validate(updateSubmissionStatusSchema), updateSubmissionStatus);
router.patch('/assignments/submissions/:submissionId/grade', audit({
  action: 'ASSIGNMENT_GRADED',
  resourceType: 'AssignmentSubmission',
  resourceId: (req) => req.params.submissionId,
  getPreviousData: async (req) => {
    const model = (await import('../models/assignmentSubmission.model')).AssignmentSubmission;
    return (await model.findById(req.params.submissionId).lean()) || undefined;
  },
}), validate(gradeSubmissionSchema), gradeSubmission);
router.patch('/assignments/submissions/:submissionId/return', audit({
  action: 'ASSIGNMENT_RETURNED',
  resourceType: 'AssignmentSubmission',
  resourceId: (req) => req.params.submissionId,
  getPreviousData: async (req) => {
    const model = (await import('../models/assignmentSubmission.model')).AssignmentSubmission;
    return (await model.findById(req.params.submissionId).lean()) || undefined;
  },
}), validate(returnForResubmissionSchema), returnForResubmission);

export default router;
