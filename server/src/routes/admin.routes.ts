import { Router } from 'express';
import {
  getDashboardStats,
  getRevenueAnalytics,
  getUserAnalytics,
  getCourseAnalytics,
  listUsers,
  getUserDetail,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getPendingInstructors,
  approveInstructor,
  rejectInstructor,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  listNotifications,
  createNotification,
  sendNotificationToAll,
  deleteNotification,
  getSettings,
  updateSettings,
  getWallet,
  getCommissionSettings,
  getWalletTransactions,
  getAllPayouts,
  processPayout,
  processAllPendingPayouts,
  listCourses,
  getCourseDetail,
  approveCourse,
  rejectCourse,
  listSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  listReviews,
  moderateReview,
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  listRefundRequests,
  approveRefund,
  rejectRefund,
  listSupportTickets,
  getSupportTicket,
  updateTicketStatus,
  assignTicket,
  addTicketMessage,
  listCertificates,
  revokeCertificate,
  listFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  listEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  listAuditLogs,
  listSecurityLogs,
  listBackups,
  createBackup,
  deleteBackup,
  listCmsPages,
  createCmsPage,
  updateCmsPage,
  deleteCmsPage,
  listRolePermissions,
  createRolePermission,
  updateRolePermission,
  listAllPayments,
  getPaymentDetail,
  listStudents,
  listWithdrawRequests,
  getFeatures,
  updateFeature,
  seedFeatures,
} from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { ROLES } from '../constants/roles';
import {
  updateUserRoleSchema,
  updateUserStatusSchema,
  createCategorySchema,
  updateCategorySchema,
  createBlogSchema,
  updateBlogSchema,
  createCouponSchema,
  updateCouponSchema,
  createNotificationSchema,
  sendBulkNotificationSchema,
  updateSettingsSchema,
  rejectCourseSchema,
  moderateReviewSchema,
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
  createBannerSchema,
  updateBannerSchema,
  processRefundSchema,
  updateTicketStatusSchema,
  addTicketMessageSchema,
  createFaqSchema,
  updateFaqSchema,
  createEmailTemplateSchema,
  updateEmailTemplateSchema,
  createCmsPageSchema,
  updateCmsPageSchema,
  createRolePermissionSchema,
  updateRolePermissionSchema,
} from '../validators/admin.validator';

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// Dashboard & Analytics
router.get('/dashboard', getDashboardStats);
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/analytics/users', getUserAnalytics);
router.get('/analytics/courses', getCourseAnalytics);

// User Management
router.get('/users', listUsers);
router.get('/users/:id', getUserDetail);
router.put('/users/:id/role', validate(updateUserRoleSchema), updateUserRole);
router.put('/users/:id/status', validate(updateUserStatusSchema), updateUserStatus);
router.delete('/users/:id', deleteUser);

// Instructor Approval
router.get('/instructors/pending', getPendingInstructors);
router.put('/instructors/:id/approve', approveInstructor);
router.delete('/instructors/:id', rejectInstructor);

// Categories
router.get('/categories', listCategories);
router.post('/categories', validate(createCategorySchema), createCategory);
router.put('/categories/:id', validate(updateCategorySchema), updateCategory);
router.delete('/categories/:id', deleteCategory);

// Blog
router.get('/blog', listBlogs);
router.post('/blog', validate(createBlogSchema), createBlog);
router.put('/blog/:id', validate(updateBlogSchema), updateBlog);
router.delete('/blog/:id', deleteBlog);

// Coupons
router.get('/coupons', listCoupons);
router.post('/coupons', validate(createCouponSchema), createCoupon);
router.put('/coupons/:id', validate(updateCouponSchema), updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Notifications
router.get('/notifications', listNotifications);
router.post('/notifications', validate(createNotificationSchema), createNotification);
router.post('/notifications/send-all', validate(sendBulkNotificationSchema), sendNotificationToAll);
router.delete('/notifications/:id', deleteNotification);

// Settings
router.get('/settings', getSettings);
router.put('/settings', validate(updateSettingsSchema), updateSettings);

// Wallet & Payouts
router.get('/wallet', getWallet);
router.get('/wallet/transactions', getWalletTransactions);
router.get('/wallet/commission', getCommissionSettings);
router.get('/payouts', getAllPayouts);
router.post('/payouts/:id/process', processPayout);
router.post('/payouts/process-all', processAllPendingPayouts);

// Course Management
router.get('/courses', listCourses);
router.get('/courses/:id', getCourseDetail);
router.put('/courses/:id/approve', approveCourse);
router.put('/courses/:id/reject', validate(rejectCourseSchema), rejectCourse);

// Subscription Plans
router.get('/subscriptions', listSubscriptionPlans);
router.post('/subscriptions', validate(createSubscriptionPlanSchema), createSubscriptionPlan);
router.put('/subscriptions/:id', validate(updateSubscriptionPlanSchema), updateSubscriptionPlan);
router.delete('/subscriptions/:id', deleteSubscriptionPlan);

// Reviews Moderation
router.get('/reviews', listReviews);
router.put('/reviews/:id/moderate', validate(moderateReviewSchema), moderateReview);

// Banner Management
router.get('/banners', listBanners);
router.post('/banners', validate(createBannerSchema), createBanner);
router.put('/banners/:id', validate(updateBannerSchema), updateBanner);
router.delete('/banners/:id', deleteBanner);

// Refund Management
router.get('/refunds', listRefundRequests);
router.put('/refunds/:id/approve', validate(processRefundSchema), approveRefund);
router.put('/refunds/:id/reject', validate(processRefundSchema), rejectRefund);

// Support Tickets
router.get('/tickets', listSupportTickets);
router.get('/tickets/:id', getSupportTicket);
router.put('/tickets/:id/status', validate(updateTicketStatusSchema), updateTicketStatus);
router.put('/tickets/:id/assign', assignTicket);
router.post('/tickets/:id/message', validate(addTicketMessageSchema), addTicketMessage);

// Certificates Management
router.get('/certificates', listCertificates);
router.delete('/certificates/:id', revokeCertificate);

// FAQ
router.get('/faq', listFaqs);
router.post('/faq', validate(createFaqSchema), createFaq);
router.put('/faq/:id', validate(updateFaqSchema), updateFaq);
router.delete('/faq/:id', deleteFaq);

// Email Templates
router.get('/email-templates', listEmailTemplates);
router.post('/email-templates', validate(createEmailTemplateSchema), createEmailTemplate);
router.put('/email-templates/:id', validate(updateEmailTemplateSchema), updateEmailTemplate);
router.delete('/email-templates/:id', deleteEmailTemplate);

// Audit Logs
router.get('/audit-logs', listAuditLogs);

// Security Logs
router.get('/security-logs', listSecurityLogs);

// Backup & Restore
router.get('/backups', listBackups);
router.post('/backups', createBackup);
router.delete('/backups/:id', deleteBackup);

// CMS Pages
router.get('/cms-pages', listCmsPages);
router.post('/cms-pages', validate(createCmsPageSchema), createCmsPage);
router.put('/cms-pages/:id', validate(updateCmsPageSchema), updateCmsPage);
router.delete('/cms-pages/:id', deleteCmsPage);

// Role & Permission Management
router.get('/role-permissions', listRolePermissions);
router.post('/role-permissions', validate(createRolePermissionSchema), createRolePermission);
router.put('/role-permissions/:id', validate(updateRolePermissionSchema), updateRolePermission);

// Payment Management
router.get('/payments', listAllPayments);
router.get('/payments/:id', getPaymentDetail);

// Student Management
router.get('/students', listStudents);

// Withdraw Requests
router.get('/withdraw-requests', listWithdrawRequests);

// Feature Toggles
router.get('/features', getFeatures);
router.put('/features/:key', updateFeature);
router.post('/features/seed', seedFeatures);

export default router;
