import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { paymentService } from '../services/payment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';
import * as featureToggleService from '../services/featureToggle.service';
import { auditService } from '../services/audit.service';

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Dashboard stats fetched', stats));
});

export const getRevenueAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as any;
  const data = await adminService.getRevenueAnalytics(startDate, endDate);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Revenue analytics fetched', data));
});

export const getUserAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.getUserAnalytics();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('User analytics fetched', data));
});

export const getCourseAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.getCourseAnalytics();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course analytics fetched', data));
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const role = req.query.role as string;
  const data = await adminService.listUsers(page, limit, search, role);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Users fetched', data));
});

export const getUserDetail = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.getUserDetail(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('User detail fetched', data));
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body;
  const data = await adminService.updateUserRole(req.params.id, role);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('User role updated', data));
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body;
  const data = await adminService.updateUserStatus(req.params.id, isActive);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('User status updated', data));
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const adminId = (req as any).user._id;
  await adminService.deleteUser(req.params.id, adminId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('User deleted', null));
});

export const getPendingInstructors = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.getPendingInstructors();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Pending instructors fetched', data));
});

export const getInstructorApplicationDetail = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.getInstructorApplicationDetail(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Instructor application detail fetched', data));
});

export const approveInstructor = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.currentUser!.userId;
  const { adminNote } = req.body as { adminNote?: string };
  const data = await adminService.approveInstructor(req.params.id, adminId, adminNote);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Instructor approved', data));
});

export const rejectInstructor = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.currentUser!.userId;
  const { rejectionReason } = req.body as { rejectionReason?: string };
  const data = await adminService.rejectInstructor(req.params.id, adminId, rejectionReason);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Instructor rejected', data));
});

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listCategories();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Categories fetched', data));
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.createCategory(req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Category created', data));
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.updateCategory(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Category updated', data));
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteCategory(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Category deleted', null));
});

export const listBlogs = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const data = await adminService.listBlogs(page, limit);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Blogs fetched', data));
});

export const createBlog = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.createBlog({ ...req.body, author: req.currentUser!.userId });
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Blog created', data));
});

export const updateBlog = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.updateBlog(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Blog updated', data));
});

export const deleteBlog = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteBlog(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Blog deleted', null));
});

export const listCoupons = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const data = await adminService.listCoupons(page, limit);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Coupons fetched', data));
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.createCoupon({ ...req.body, createdBy: req.currentUser!.userId });
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Coupon created', data));
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.updateCoupon(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Coupon updated', data));
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteCoupon(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Coupon deleted', null));
});

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const data = await adminService.listNotifications(page, limit);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Notifications fetched', data));
});

export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.createNotification(req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Notification created', data));
});

export const sendNotificationToAll = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.sendNotificationToAll(req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Notifications sent', data));
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteNotification(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Notification deleted', null));
});

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.getSettings();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Settings fetched', data));
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.updateSettings(req.body, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Settings updated', data));
});

// ─── Wallet & Payouts ──────────────────────────────────────────
export const getWallet = asyncHandler(async (_req: Request, res: Response) => {
  const data = await paymentService.getWallet();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Wallet fetched', data));
});

export const getCommissionSettings = asyncHandler(async (_req: Request, res: Response) => {
  const data = await paymentService.getCommissionSettings();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Commission settings fetched', data));
});

export const getWalletTransactions = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const data = await paymentService.getWalletTransactions(page, limit);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Wallet transactions fetched', data));
});

export const getAllPayouts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const data = await paymentService.getAllPayouts(page, limit, status);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Payouts fetched', data));
});

export const processPayout = asyncHandler(async (req: Request, res: Response) => {
  const data = await paymentService.processPayout(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Payout processed', data));
});

export const processAllPendingPayouts = asyncHandler(async (_req: Request, res: Response) => {
  const data = await paymentService.processAllPendingPayouts();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Pending payouts processed', data));
});

// ─── Course Management ──────────────────────────────────────────
export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const status = req.query.status as string;
  const category = req.query.category as string;
  const data = await adminService.listCourses(page, limit, search, status, category);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Courses fetched', data));
});

export const getCourseDetail = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.getCourseDetail(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course detail fetched', data));
});

export const approveCourse = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.approveCourse(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course approved', data));
});

export const rejectCourse = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const data = await adminService.rejectCourse(req.params.id, reason);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course rejected', data));
});

// ─── Subscription Plans ─────────────────────────────────────────
export const listSubscriptionPlans = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listSubscriptionPlans();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Subscription plans fetched', data));
});

export const createSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.createSubscriptionPlan(req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Subscription plan created', data));
});

export const updateSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.updateSubscriptionPlan(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Subscription plan updated', data));
});

export const deleteSubscriptionPlan = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteSubscriptionPlan(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Subscription plan deleted', null));
});

// ─── Reviews Moderation ─────────────────────────────────────────
export const listReviews = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const courseId = req.query.courseId as string;
  const data = await adminService.listReviews(page, limit, status, courseId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Reviews fetched', data));
});

export const moderateReview = asyncHandler(async (req: Request, res: Response) => {
  const { status, adminNote } = req.body;
  const data = await adminService.moderateReview(req.params.id, status, adminNote);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Review moderated', data));
});

// ─── Banner Management ──────────────────────────────────────────
export const listBanners = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listBanners();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Banners fetched', data));
});

export const createBanner = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.createBanner(req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Banner created', data));
});

export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.updateBanner(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Banner updated', data));
});

export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteBanner(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Banner deleted', null));
});

// ─── Refund Management ──────────────────────────────────────────
export const listRefundRequests = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const data = await adminService.listRefundRequests(page, limit, status);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Refund requests fetched', data));
});

export const approveRefund = asyncHandler(async (req: Request, res: Response) => {
  const { adminNote } = req.body;
  const data = await adminService.approveRefund(req.params.id, req.currentUser!.userId, adminNote);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Refund approved', data));
});

export const rejectRefund = asyncHandler(async (req: Request, res: Response) => {
  const { adminNote } = req.body;
  const data = await adminService.rejectRefund(req.params.id, req.currentUser!.userId, adminNote);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Refund rejected', data));
});

export const issueRefund = asyncHandler(async (req: Request, res: Response) => {
  const { amount, reason, refundType, adminNote } = req.body;
  const data = await paymentService.processRefundPayment(
    req.params.id,
    amount,
    reason,
    refundType || 'full',
    req.currentUser!.userId,
    adminNote
  );
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Refund processed', data));
});

// ─── Support Tickets ────────────────────────────────────────────
export const listSupportTickets = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const priority = req.query.priority as string;
  const data = await adminService.listSupportTickets(page, limit, status, priority);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Support tickets fetched', data));
});

export const getSupportTicket = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.getSupportTicket(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Support ticket fetched', data));
});

export const updateTicketStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const data = await adminService.updateTicketStatus(req.params.id, status);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Ticket status updated', data));
});

export const assignTicket = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.assignTicket(req.params.id, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Ticket assigned', data));
});

export const addTicketMessage = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;
  const data = await adminService.addTicketMessage(req.params.id, req.currentUser!.userId, message);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Message added', data));
});

// ─── Certificates Management ────────────────────────────────────
export const listCertificates = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const status = req.query.status as string;
  const data = await adminService.listCertificates(page, limit, search, status);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Certificates fetched', data));
});

export const revokeCertificate = asyncHandler(async (req: Request, res: Response) => {
  const reason = req.body.reason as string | undefined;
  await adminService.revokeCertificate(req.params.id, reason);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Certificate revoked', null));
});

export const restoreCertificate = asyncHandler(async (req: Request, res: Response) => {
  await adminService.restoreCertificate(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Certificate restored', null));
});

// ─── FAQ ──────────────────────────────────────────────────────
export const listFaqs = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listFaqs();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('FAQs fetched', data));
});

export const createFaq = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.createFaq(req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('FAQ created', data));
});

export const updateFaq = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.updateFaq(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('FAQ updated', data));
});

export const deleteFaq = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteFaq(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('FAQ deleted', null));
});

// ─── Email Templates ─────────────────────────────────────────
export const listEmailTemplates = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listEmailTemplates();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Email templates fetched', data));
});

export const createEmailTemplate = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.createEmailTemplate(req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Email template created', data));
});

export const updateEmailTemplate = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.updateEmailTemplate(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Email template updated', data));
});

export const deleteEmailTemplate = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteEmailTemplate(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Email template deleted', null));
});

// ─── Audit Logs ──────────────────────────────────────────────
export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const action = req.query.action as string;
  const adminId = req.query.adminId as string;
  const resourceType = req.query.resourceType as string;
  const search = req.query.search as string;
  const success = req.query.success as string | undefined;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
  const data = await auditService.search({
    page, limit, action, adminId, resourceType, search,
    success: success !== undefined ? success === 'true' : undefined,
    startDate, endDate, sortBy, sortOrder,
  });
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Audit logs fetched', data));
});

export const listAuditActions = asyncHandler(async (_req: Request, res: Response) => {
  const actions = await auditService.getActions();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Audit actions fetched', actions));
});

export const listAuditResourceTypes = asyncHandler(async (_req: Request, res: Response) => {
  const types = await auditService.getResourceTypes();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Audit resource types fetched', types));
});

// ─── Security Logs ───────────────────────────────────────────
export const listSecurityLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const event = req.query.event as string;
  const severity = req.query.severity as string;
  const data = await adminService.listSecurityLogs(page, limit, event, severity);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Security logs fetched', data));
});

// ─── Backup & Restore ────────────────────────────────────────
export const listBackups = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listBackups();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Backups fetched', data));
});

export const createBackup = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.createBackup(req.currentUser?.userId);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Backup created', data));
});

export const deleteBackup = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteBackup(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Backup deleted', null));
});

// ─── CMS Pages ───────────────────────────────────────────────
export const listCmsPages = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listCmsPages();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('CMS pages fetched', data));
});

export const createCmsPage = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.createCmsPage(req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('CMS page created', data));
});

export const updateCmsPage = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.updateCmsPage(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('CMS page updated', data));
});

export const deleteCmsPage = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteCmsPage(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('CMS page deleted', null));
});

// ─── Role & Permission Management ────────────────────────────
export const listRolePermissions = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.listRolePermissions();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Role permissions fetched', data));
});

export const createRolePermission = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.createRolePermission(req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Role permission created', data));
});

export const updateRolePermission = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.updateRolePermission(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Role permission updated', data));
});

// ─── Payment Management ─────────────────────────────────────
export const listAllPayments = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const type = req.query.type as string;
  const data = await adminService.listAllPayments(page, limit, status, type);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Payments fetched', data));
});

export const getPaymentDetail = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.getPaymentDetail(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Payment detail fetched', data));
});

// ─── Student Management ─────────────────────────────────────
export const listStudents = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const data = await adminService.listStudents(page, limit, search);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Students fetched', data));
});

// ─── Withdraw Requests ─────────────────────────────────────
export const listWithdrawRequests = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const data = await adminService.listWithdrawRequests(page, limit, status);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Withdraw requests fetched', data));
});

// ─── Feature Toggles ─────────────────────────────────────
export const getFeatures = asyncHandler(async (_req: Request, res: Response) => {
  const features = await featureToggleService.getAllFeatures();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Features fetched', features));
});

export const updateFeature = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  const { enabled } = req.body;
  const feature = await featureToggleService.updateFeature(key, enabled, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Feature updated', feature));
});

export const seedFeatures = asyncHandler(async (_req: Request, res: Response) => {
  const features = await featureToggleService.bulkSeedFeatures();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Features seeded', features));
});
