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
  issueRefund,
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
  listAuditActions,
  listAuditResourceTypes,
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
import { audit, auditMiddleware, previousDataLoader } from '../middlewares/audit.middleware';
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
  issueRefundSchema,
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
import { User } from '../models/user.model';
import { Category } from '../models/category.model';
import { Blog } from '../models/blog.model';
import { Coupon } from '../models/coupon.model';
import { Banner } from '../models/banner.model';
import { Faq } from '../models/faq.model';
import { EmailTemplate } from '../models/emailTemplate.model';
import { CmsPage } from '../models/cmsPage.model';
import { RolePermission } from '../models/rolePermission.model';
import { Subscription } from '../models/subscription.model';
import { PlatformSettings } from '../models/platformSettings.model';
import { Course } from '../models/course.model';

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));
router.use(auditMiddleware);

// Dashboard & Analytics (read-only, no audit)
router.get('/dashboard', getDashboardStats);
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/analytics/users', getUserAnalytics);
router.get('/analytics/courses', getCourseAnalytics);

// User Management
router.get('/users', listUsers);
router.get('/users/:id', getUserDetail);
router.put('/users/:id/role',
  audit({ action: 'ROLE_CHANGED', resourceType: 'User', getPreviousData: previousDataLoader(User) }),
  validate(updateUserRoleSchema), updateUserRole);
router.put('/users/:id/status',
  audit({ action: 'USER_UPDATED', resourceType: 'User', getPreviousData: previousDataLoader(User) }),
  validate(updateUserStatusSchema), updateUserStatus);
router.delete('/users/:id',
  audit({ action: 'USER_DELETED', resourceType: 'User', getPreviousData: previousDataLoader(User) }),
  deleteUser);

// Instructor Approval
router.get('/instructors/pending', getPendingInstructors);
router.put('/instructors/:id/approve',
  audit({ action: 'INSTRUCTOR_APPROVED', resourceType: 'User', getPreviousData: previousDataLoader(User) }),
  approveInstructor);
router.delete('/instructors/:id',
  audit({ action: 'INSTRUCTOR_REJECTED', resourceType: 'User', getPreviousData: previousDataLoader(User) }),
  rejectInstructor);

// Categories
router.get('/categories', listCategories);
router.post('/categories',
  audit({ action: 'CATEGORY_CREATED', resourceType: 'Category' }),
  validate(createCategorySchema), createCategory);
router.put('/categories/:id',
  audit({ action: 'CATEGORY_UPDATED', resourceType: 'Category', getPreviousData: previousDataLoader(Category) }),
  validate(updateCategorySchema), updateCategory);
router.delete('/categories/:id',
  audit({ action: 'CATEGORY_DELETED', resourceType: 'Category', getPreviousData: previousDataLoader(Category) }),
  deleteCategory);

// Blog
router.get('/blog', listBlogs);
router.post('/blog',
  audit({ action: 'BLOG_CREATED', resourceType: 'Blog' }),
  validate(createBlogSchema), createBlog);
router.put('/blog/:id',
  audit({ action: 'BLOG_UPDATED', resourceType: 'Blog', getPreviousData: previousDataLoader(Blog) }),
  validate(updateBlogSchema), updateBlog);
router.delete('/blog/:id',
  audit({ action: 'BLOG_DELETED', resourceType: 'Blog', getPreviousData: previousDataLoader(Blog) }),
  deleteBlog);

// Coupons
router.get('/coupons', listCoupons);
router.post('/coupons',
  audit({ action: 'COUPON_CREATED', resourceType: 'Coupon' }),
  validate(createCouponSchema), createCoupon);
router.put('/coupons/:id',
  audit({ action: 'COUPON_UPDATED', resourceType: 'Coupon', getPreviousData: previousDataLoader(Coupon) }),
  validate(updateCouponSchema), updateCoupon);
router.delete('/coupons/:id',
  audit({ action: 'COUPON_DELETED', resourceType: 'Coupon', getPreviousData: previousDataLoader(Coupon) }),
  deleteCoupon);

// Notifications
router.get('/notifications', listNotifications);
router.post('/notifications',
  audit({ action: 'NOTIFICATION_CREATED', resourceType: 'Notification' }),
  validate(createNotificationSchema), createNotification);
router.post('/notifications/send-all',
  audit({ action: 'NOTIFICATION_CREATED', resourceType: 'Notification' }),
  validate(sendBulkNotificationSchema), sendNotificationToAll);
router.delete('/notifications/:id',
  audit({ action: 'NOTIFICATION_DELETED', resourceType: 'Notification', getPreviousData: previousDataLoader(User) }),
  deleteNotification);

// Settings
router.get('/settings', getSettings);
router.put('/settings',
  audit({ action: 'SETTINGS_UPDATED', resourceType: 'PlatformSettings', getPreviousData: previousDataLoader(PlatformSettings) }),
  validate(updateSettingsSchema), updateSettings);

// Wallet & Payouts
router.get('/wallet', getWallet);
router.get('/wallet/transactions', getWalletTransactions);
router.get('/wallet/commission', getCommissionSettings);
router.get('/payouts', getAllPayouts);
router.post('/payouts/:id/process',
  audit({ action: 'PAYOUT_APPROVED', resourceType: 'Payout', getPreviousData: async (req: any) => { return undefined; } }),
  processPayout);
router.post('/payouts/process-all',
  audit({ action: 'PAYOUT_APPROVED', resourceType: 'Payout' }),
  processAllPendingPayouts);

// Course Management
router.get('/courses', listCourses);
router.get('/courses/:id', getCourseDetail);
router.put('/courses/:id/approve',
  audit({ action: 'COURSE_APPROVED', resourceType: 'Course', getPreviousData: previousDataLoader(Course) }),
  approveCourse);
router.put('/courses/:id/reject',
  audit({ action: 'COURSE_REJECTED', resourceType: 'Course', getPreviousData: previousDataLoader(Course) }),
  validate(rejectCourseSchema), rejectCourse);

// Subscription Plans
router.get('/subscriptions', listSubscriptionPlans);
router.post('/subscriptions',
  audit({ action: 'SUBSCRIPTION_PLAN_CREATED', resourceType: 'SubscriptionPlan' }),
  validate(createSubscriptionPlanSchema), createSubscriptionPlan);
router.put('/subscriptions/:id',
  audit({ action: 'SUBSCRIPTION_PLAN_UPDATED', resourceType: 'SubscriptionPlan', getPreviousData: previousDataLoader(Subscription) }),
  validate(updateSubscriptionPlanSchema), updateSubscriptionPlan);
router.delete('/subscriptions/:id',
  audit({ action: 'SUBSCRIPTION_PLAN_DELETED', resourceType: 'SubscriptionPlan', getPreviousData: previousDataLoader(Subscription) }),
  deleteSubscriptionPlan);

// Reviews Moderation
router.get('/reviews', listReviews);
router.put('/reviews/:id/moderate',
  audit({ action: 'REVIEW_MODERATED', resourceType: 'Review' }),
  validate(moderateReviewSchema), moderateReview);

// Banner Management
router.get('/banners', listBanners);
router.post('/banners',
  audit({ action: 'BANNER_CREATED', resourceType: 'Banner' }),
  validate(createBannerSchema), createBanner);
router.put('/banners/:id',
  audit({ action: 'BANNER_UPDATED', resourceType: 'Banner', getPreviousData: previousDataLoader(Banner) }),
  validate(updateBannerSchema), updateBanner);
router.delete('/banners/:id',
  audit({ action: 'BANNER_DELETED', resourceType: 'Banner', getPreviousData: previousDataLoader(Banner) }),
  deleteBanner);

// Refund Management
router.get('/refunds', listRefundRequests);
router.put('/refunds/:id/approve',
  audit({ action: 'REFUND_APPROVED', resourceType: 'Refund' }),
  validate(processRefundSchema), approveRefund);
router.put('/refunds/:id/reject',
  audit({ action: 'REFUND_REJECTED', resourceType: 'Refund' }),
  validate(processRefundSchema), rejectRefund);
router.post('/payments/:id/refund',
  audit({ action: 'REFUND_APPROVED', resourceType: 'Payment' }),
  validate(issueRefundSchema), issueRefund);

// Support Tickets
router.get('/tickets', listSupportTickets);
router.get('/tickets/:id', getSupportTicket);
router.put('/tickets/:id/status',
  audit({ action: 'SUPPORT_TICKET_UPDATED', resourceType: 'SupportTicket' }),
  validate(updateTicketStatusSchema), updateTicketStatus);
router.put('/tickets/:id/assign',
  audit({ action: 'SUPPORT_TICKET_UPDATED', resourceType: 'SupportTicket' }),
  assignTicket);
router.post('/tickets/:id/message',
  audit({ action: 'SUPPORT_TICKET_UPDATED', resourceType: 'SupportTicket' }),
  validate(addTicketMessageSchema), addTicketMessage);

// Certificates Management
router.get('/certificates', listCertificates);
router.delete('/certificates/:id',
  audit({ action: 'CERTIFICATE_REVOKED', resourceType: 'Certificate' }),
  revokeCertificate);

// FAQ
router.get('/faq', listFaqs);
router.post('/faq',
  audit({ action: 'FAQ_CREATED', resourceType: 'Faq' }),
  validate(createFaqSchema), createFaq);
router.put('/faq/:id',
  audit({ action: 'FAQ_UPDATED', resourceType: 'Faq', getPreviousData: previousDataLoader(Faq) }),
  validate(updateFaqSchema), updateFaq);
router.delete('/faq/:id',
  audit({ action: 'FAQ_DELETED', resourceType: 'Faq', getPreviousData: previousDataLoader(Faq) }),
  deleteFaq);

// Email Templates
router.get('/email-templates', listEmailTemplates);
router.post('/email-templates',
  audit({ action: 'EMAIL_TEMPLATE_CREATED', resourceType: 'EmailTemplate' }),
  validate(createEmailTemplateSchema), createEmailTemplate);
router.put('/email-templates/:id',
  audit({ action: 'EMAIL_TEMPLATE_UPDATED', resourceType: 'EmailTemplate', getPreviousData: previousDataLoader(EmailTemplate) }),
  validate(updateEmailTemplateSchema), updateEmailTemplate);
router.delete('/email-templates/:id',
  audit({ action: 'EMAIL_TEMPLATE_DELETED', resourceType: 'EmailTemplate', getPreviousData: previousDataLoader(EmailTemplate) }),
  deleteEmailTemplate);

// Audit Logs
router.get('/audit-logs', listAuditLogs);
router.get('/audit-actions', listAuditActions);
router.get('/audit-resource-types', listAuditResourceTypes);

// Security Logs
router.get('/security-logs', listSecurityLogs);

// Backup & Restore
router.get('/backups', listBackups);
router.post('/backups',
  audit({ action: 'BACKUP_STARTED', resourceType: 'Backup' }),
  createBackup);
router.delete('/backups/:id',
  audit({ action: 'BACKUP_DELETED', resourceType: 'Backup' }),
  deleteBackup);

// CMS Pages
router.get('/cms-pages', listCmsPages);
router.post('/cms-pages',
  audit({ action: 'CMS_CREATED', resourceType: 'CmsPage' }),
  validate(createCmsPageSchema), createCmsPage);
router.put('/cms-pages/:id',
  audit({ action: 'CMS_UPDATED', resourceType: 'CmsPage', getPreviousData: previousDataLoader(CmsPage) }),
  validate(updateCmsPageSchema), updateCmsPage);
router.delete('/cms-pages/:id',
  audit({ action: 'CMS_DELETED', resourceType: 'CmsPage', getPreviousData: previousDataLoader(CmsPage) }),
  deleteCmsPage);

// Role & Permission Management
router.get('/role-permissions', listRolePermissions);
router.post('/role-permissions',
  audit({ action: 'ROLE_PERMISSION_CREATED', resourceType: 'RolePermission' }),
  validate(createRolePermissionSchema), createRolePermission);
router.put('/role-permissions/:id',
  audit({ action: 'ROLE_PERMISSION_UPDATED', resourceType: 'RolePermission', getPreviousData: previousDataLoader(RolePermission) }),
  validate(updateRolePermissionSchema), updateRolePermission);

// Payment Management (read-only for now)
router.get('/payments', listAllPayments);
router.get('/payments/:id', getPaymentDetail);

// Student Management (read-only)
router.get('/students', listStudents);

// Withdraw Requests (read-only)
router.get('/withdraw-requests', listWithdrawRequests);

// Feature Toggles
router.get('/features', getFeatures);
router.put('/features/:key',
  audit({ action: 'FEATURE_TOGGLE_CHANGED', resourceType: 'FeatureToggle' }),
  updateFeature);
router.post('/features/seed',
  audit({ action: 'FEATURE_TOGGLE_CHANGED', resourceType: 'FeatureToggle' }),
  seedFeatures);

export default router;
