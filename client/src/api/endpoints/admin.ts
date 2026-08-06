import axiosInstance from '../axiosInstance';
import { ApiResponse } from '@/types/api';
import {
  DashboardStats, RevenueAnalytics, UserAnalytics, CourseAnalytics,
  Category, Coupon, Blog, NotificationItem, PlatformSettings,
  WalletData, CommissionSettings, WalletTransaction, PayoutItem,
  AdminCourse, SubscriptionPlan, ReviewItem, Banner, RefundRequest,
  SupportTicket, CertificateItem, FaqItem, EmailTemplate,
  AuditLogItem, SecurityLogItem, Backup, CmsPage, RolePermission,
  PaymentItem, StudentItem, WithdrawRequest, FeatureToggle,
  AdminAssignmentSubmission, AdminAssignmentsAnalytics, GradingLogEntry,
  InstructorApplication,
} from '@/types/admin';
import {
  RevenueDashboardData, RevenueSummary,
  InstructorSubscriptionPlan, InstructorSubscriptionStats,
  AffiliateItem, AffiliateStats,
  FeaturedPromotionItem, FeaturedPromotionStats,
} from '@/types/revenue';
import { LiveClassRecording } from '@/types/liveClass';

export const adminApi = {
  getDashboard: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<DashboardStats>>('/admin/dashboard', { signal }),

  getRevenueAnalytics: (startDate?: string, endDate?: string, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<RevenueAnalytics>>('/admin/analytics/revenue', { params: { startDate, endDate }, signal }),

  getUserAnalytics: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<UserAnalytics>>('/admin/analytics/users', { signal }),

  getCourseAnalytics: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<CourseAnalytics>>('/admin/analytics/courses', { signal }),

  listUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ users: any[]; pagination: any }>>('/admin/users', { params, signal }),

  getUserDetail: (id: string, signal?: AbortSignal) => axiosInstance.get<ApiResponse<any>>(`/admin/users/${id}`, { signal }),

  updateUserRole: (id: string, role: string, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<any>>(`/admin/users/${id}/role`, { role }, { signal }),

  updateUserStatus: (id: string, isActive: boolean, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<any>>(`/admin/users/${id}/status`, { isActive }, { signal }),

  deleteUser: (id: string, signal?: AbortSignal) => axiosInstance.delete<ApiResponse<null>>(`/admin/users/${id}`, { signal }),

  getPendingInstructors: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<any[]>>('/admin/instructors/pending', { signal }),

  getInstructorApplicationDetail: (id: string, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<InstructorApplication>>(`/admin/instructors/${id}`, { signal }),

  approveInstructor: (id: string, adminNote?: string, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<InstructorApplication>>(`/admin/instructors/${id}/approve`, { adminNote }, { signal }),

  rejectInstructor: (id: string, rejectionReason: string, signal?: AbortSignal) =>
    axiosInstance.delete<ApiResponse<InstructorApplication>>(`/admin/instructors/${id}`, { data: { rejectionReason }, signal }),

  listCategories: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<Category[]>>('/admin/categories', { signal }),

  createCategory: (data: Partial<Category>, signal?: AbortSignal) => axiosInstance.post<ApiResponse<Category>>('/admin/categories', data, { signal }),

  updateCategory: (id: string, data: Partial<Category>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<Category>>(`/admin/categories/${id}`, data, { signal }),

  deleteCategory: (id: string, signal?: AbortSignal) => axiosInstance.delete<ApiResponse<null>>(`/admin/categories/${id}`, { signal }),

  listBlogs: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ blogs: Blog[]; pagination: any }>>('/admin/blog', { params, signal }),

  createBlog: (data: Partial<Blog>, signal?: AbortSignal) => axiosInstance.post<ApiResponse<Blog>>('/admin/blog', data, { signal }),

  updateBlog: (id: string, data: Partial<Blog>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<Blog>>(`/admin/blog/${id}`, data, { signal }),

  deleteBlog: (id: string, signal?: AbortSignal) => axiosInstance.delete<ApiResponse<null>>(`/admin/blog/${id}`, { signal }),

  listCoupons: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ coupons: Coupon[]; pagination: any }>>('/admin/coupons', { params, signal }),

  createCoupon: (data: Partial<Coupon>, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<Coupon>>('/admin/coupons', data, { signal }),

  updateCoupon: (id: string, data: Partial<Coupon>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<Coupon>>(`/admin/coupons/${id}`, data, { signal }),

  deleteCoupon: (id: string, signal?: AbortSignal) => axiosInstance.delete<ApiResponse<null>>(`/admin/coupons/${id}`, { signal }),

  listNotifications: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ notifications: NotificationItem[]; pagination: any }>>('/admin/notifications', { params, signal }),

  createNotification: (data: { user: string; title: string; message: string; type?: string }, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<NotificationItem>>('/admin/notifications', data, { signal }),

  sendNotificationToAll: (data: { title: string; message: string; type?: string }, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<{ sentCount: number }>>('/admin/notifications/send-all', data, { signal }),

  deleteNotification: (id: string, signal?: AbortSignal) => axiosInstance.delete<ApiResponse<null>>(`/admin/notifications/${id}`, { signal }),

  getSettings: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<PlatformSettings>>('/admin/settings', { signal }),

  updateSettings: (data: Partial<PlatformSettings>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<PlatformSettings>>('/admin/settings', data, { signal }),

  getWallet: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<WalletData>>('/admin/wallet', { signal }),
  getWalletTransactions: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ payments: WalletTransaction[]; total: number; page: number; totalPages: number }>>('/admin/wallet/transactions', { params, signal }),
  getCommissionSettings: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<CommissionSettings>>('/admin/wallet/commission', { signal }),
  getAllPayouts: (params?: { page?: number; limit?: number; status?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ payouts: PayoutItem[]; summary: any; total: number; page: number; totalPages: number }>>('/admin/payouts', { params, signal }),
  processPayout: (id: string, signal?: AbortSignal) => axiosInstance.post<ApiResponse<PayoutItem>>(`/admin/payouts/${id}/process`, undefined, { signal }),
  processAllPendingPayouts: (signal?: AbortSignal) => axiosInstance.post<ApiResponse<{ success: number; failed: number; errors: string[] }>>('/admin/payouts/process-all', undefined, { signal }),

  listCourses: (params?: { page?: number; limit?: number; search?: string; status?: string; category?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ courses: AdminCourse[]; pagination: any }>>('/admin/courses', { params, signal }),
  getCourseDetail: (id: string, signal?: AbortSignal) => axiosInstance.get<ApiResponse<any>>(`/admin/courses/${id}`, { signal }),
  approveCourse: (id: string, signal?: AbortSignal) => axiosInstance.put<ApiResponse<any>>(`/admin/courses/${id}/approve`, undefined, { signal }),
  rejectCourse: (id: string, reason?: string, signal?: AbortSignal) => axiosInstance.put<ApiResponse<any>>(`/admin/courses/${id}/reject`, { reason }, { signal }),

  listSubscriptionPlans: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<SubscriptionPlan[]>>('/admin/subscriptions', { signal }),
  createSubscriptionPlan: (data: Partial<SubscriptionPlan>, signal?: AbortSignal) => axiosInstance.post<ApiResponse<SubscriptionPlan>>('/admin/subscriptions', data, { signal }),
  updateSubscriptionPlan: (id: string, data: Partial<SubscriptionPlan>, signal?: AbortSignal) => axiosInstance.put<ApiResponse<SubscriptionPlan>>(`/admin/subscriptions/${id}`, data, { signal }),
  deleteSubscriptionPlan: (id: string, signal?: AbortSignal) => axiosInstance.delete<ApiResponse<null>>(`/admin/subscriptions/${id}`, { signal }),

  listReviews: (params?: { page?: number; limit?: number; status?: string; courseId?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ reviews: ReviewItem[]; pagination: any }>>('/admin/reviews', { params, signal }),
  moderateReview: (id: string, status: string, adminNote?: string, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<ReviewItem>>(`/admin/reviews/${id}/moderate`, { status, adminNote }, { signal }),

  listBanners: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<Banner[]>>('/admin/banners', { signal }),
  createBanner: (data: Partial<Banner>, signal?: AbortSignal) => axiosInstance.post<ApiResponse<Banner>>('/admin/banners', data, { signal }),
  updateBanner: (id: string, data: Partial<Banner>, signal?: AbortSignal) => axiosInstance.put<ApiResponse<Banner>>(`/admin/banners/${id}`, data, { signal }),
  deleteBanner: (id: string, signal?: AbortSignal) => axiosInstance.delete<ApiResponse<null>>(`/admin/banners/${id}`, { signal }),

  listRefundRequests: (params?: { page?: number; limit?: number; status?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ refunds: RefundRequest[]; pagination: any }>>('/admin/refunds', { params, signal }),
  approveRefund: (id: string, adminNote?: string, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<RefundRequest>>(`/admin/refunds/${id}/approve`, { adminNote }, { signal }),
  rejectRefund: (id: string, adminNote?: string, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<RefundRequest>>(`/admin/refunds/${id}/reject`, { adminNote }, { signal }),
  issueRefund: (paymentId: string, data: { amount: number; reason: string; refundType?: string; adminNote?: string }, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<any>>(`/admin/payments/${paymentId}/refund`, data, { signal }),

  listSupportTickets: (params?: { page?: number; limit?: number; status?: string; priority?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ tickets: SupportTicket[]; pagination: any }>>('/admin/tickets', { params, signal }),
  getSupportTicket: (id: string, signal?: AbortSignal) => axiosInstance.get<ApiResponse<SupportTicket>>(`/admin/tickets/${id}`, { signal }),
  updateTicketStatus: (id: string, status: string, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<SupportTicket>>(`/admin/tickets/${id}/status`, { status }, { signal }),
  assignTicket: (id: string, signal?: AbortSignal) => axiosInstance.put<ApiResponse<SupportTicket>>(`/admin/tickets/${id}/assign`, undefined, { signal }),
  addTicketMessage: (id: string, message: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<SupportTicket>>(`/admin/tickets/${id}/message`, { message }, { signal }),

  listCertificates: (params?: { page?: number; limit?: number; search?: string; status?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ certificates: CertificateItem[]; pagination: any }>>('/admin/certificates', { params, signal }),
  revokeCertificate: (id: string, reason?: string, signal?: AbortSignal) =>
    axiosInstance.patch<ApiResponse<null>>(`/admin/certificates/${id}/revoke`, { reason }, { signal }),
  restoreCertificate: (id: string, signal?: AbortSignal) =>
    axiosInstance.patch<ApiResponse<null>>(`/admin/certificates/${id}/restore`, undefined, { signal }),

  listFaqs: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<FaqItem[]>>('/admin/faq', { signal }),
  createFaq: (data: Partial<FaqItem>, signal?: AbortSignal) => axiosInstance.post<ApiResponse<FaqItem>>('/admin/faq', data, { signal }),
  updateFaq: (id: string, data: Partial<FaqItem>, signal?: AbortSignal) => axiosInstance.put<ApiResponse<FaqItem>>(`/admin/faq/${id}`, data, { signal }),
  deleteFaq: (id: string, signal?: AbortSignal) => axiosInstance.delete<ApiResponse<null>>(`/admin/faq/${id}`, { signal }),

  listEmailTemplates: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<EmailTemplate[]>>('/admin/email-templates', { signal }),
  createEmailTemplate: (data: Partial<EmailTemplate>, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<EmailTemplate>>('/admin/email-templates', data, { signal }),
  updateEmailTemplate: (id: string, data: Partial<EmailTemplate>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<EmailTemplate>>(`/admin/email-templates/${id}`, data, { signal }),
  deleteEmailTemplate: (id: string, signal?: AbortSignal) => axiosInstance.delete<ApiResponse<null>>(`/admin/email-templates/${id}`, { signal }),

  listAuditLogs: (params?: {
    page?: number; limit?: number; action?: string;
    adminId?: string; resourceType?: string; search?: string;
    success?: string; startDate?: string; endDate?: string;
    sortBy?: string; sortOrder?: 'asc' | 'desc';
  }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ logs: AuditLogItem[]; pagination: any }>>('/admin/audit-logs', { params, signal }),
  listAuditActions: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<string[]>>('/admin/audit-actions', { signal }),
  listAuditResourceTypes: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<string[]>>('/admin/audit-resource-types', { signal }),
  listSecurityLogs: (params?: { page?: number; limit?: number; event?: string; severity?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ logs: SecurityLogItem[]; pagination: any }>>('/admin/security-logs', { params, signal }),

  listBackups: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<Backup[]>>('/admin/backups', { signal }),
  createBackup: (signal?: AbortSignal) => axiosInstance.post<ApiResponse<Backup>>('/admin/backups', undefined, { signal }),
  deleteBackup: (id: string, signal?: AbortSignal) => axiosInstance.delete<ApiResponse<null>>(`/admin/backups/${id}`, { signal }),

  listCmsPages: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<CmsPage[]>>('/admin/cms-pages', { signal }),
  createCmsPage: (data: Partial<CmsPage>, signal?: AbortSignal) => axiosInstance.post<ApiResponse<CmsPage>>('/admin/cms-pages', data, { signal }),
  updateCmsPage: (id: string, data: Partial<CmsPage>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<CmsPage>>(`/admin/cms-pages/${id}`, data, { signal }),
  deleteCmsPage: (id: string, signal?: AbortSignal) => axiosInstance.delete<ApiResponse<null>>(`/admin/cms-pages/${id}`, { signal }),

  listRolePermissions: (signal?: AbortSignal) => axiosInstance.get<ApiResponse<RolePermission[]>>('/admin/role-permissions', { signal }),
  createRolePermission: (data: Partial<RolePermission>, signal?: AbortSignal) => axiosInstance.post<ApiResponse<RolePermission>>('/admin/role-permissions', data, { signal }),
  updateRolePermission: (id: string, data: Partial<RolePermission>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<RolePermission>>(`/admin/role-permissions/${id}`, data, { signal }),

  listAllPayments: (params?: { page?: number; limit?: number; status?: string; type?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ payments: PaymentItem[]; pagination: any }>>('/admin/payments', { params, signal }),
  getPaymentDetail: (id: string, signal?: AbortSignal) => axiosInstance.get<ApiResponse<PaymentItem>>(`/admin/payments/${id}`, { signal }),

  listStudents: (params?: { page?: number; limit?: number; search?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ students: StudentItem[]; pagination: any }>>('/admin/students', { params, signal }),

  listWithdrawRequests: (params?: { page?: number; limit?: number; status?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ payouts: WithdrawRequest[]; pagination: any }>>('/admin/withdraw-requests', { params, signal }),

  getRevenueDashboard: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<RevenueDashboardData>>('/revenue/dashboard', { signal }),
  getRevenueSummary: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<RevenueSummary>>('/revenue/summary', { signal }),

  listInstructorSubscriptionPlans: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<InstructorSubscriptionPlan[]>>('/revenue/instructor-plans', { signal }),
  createInstructorSubscriptionPlan: (data: Partial<InstructorSubscriptionPlan>, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<InstructorSubscriptionPlan>>('/revenue/instructor-plans', data, { signal }),
  updateInstructorSubscriptionPlan: (id: string, data: Partial<InstructorSubscriptionPlan>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<InstructorSubscriptionPlan>>(`/revenue/instructor-plans/${id}`, data, { signal }),
  deleteInstructorSubscriptionPlan: (id: string, signal?: AbortSignal) =>
    axiosInstance.delete<ApiResponse<null>>(`/revenue/instructor-plans/${id}`, { signal }),
  getInstructorSubscriptionStats: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<InstructorSubscriptionStats>>('/revenue/instructor-plans/stats', { signal }),

  listAffiliates: (params?: { page?: number; limit?: number; search?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ affiliates: AffiliateItem[]; pagination: any }>>('/revenue/affiliates', { params, signal }),
  createAffiliate: (data: Partial<AffiliateItem>, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<AffiliateItem>>('/revenue/affiliates', data, { signal }),
  updateAffiliate: (id: string, data: Partial<AffiliateItem>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<AffiliateItem>>(`/revenue/affiliates/${id}`, data, { signal }),
  deleteAffiliate: (id: string, signal?: AbortSignal) =>
    axiosInstance.delete<ApiResponse<null>>(`/revenue/affiliates/${id}`, { signal }),
  getAffiliateStats: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<AffiliateStats>>('/revenue/affiliates/stats', { signal }),

  listFeaturedPromotions: (params?: { page?: number; limit?: number; status?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ promotions: FeaturedPromotionItem[]; pagination: any }>>('/revenue/promotions', { params, signal }),
  createFeaturedPromotion: (data: Partial<FeaturedPromotionItem>, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<FeaturedPromotionItem>>('/revenue/promotions', data, { signal }),
  updateFeaturedPromotion: (id: string, data: Partial<FeaturedPromotionItem>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<FeaturedPromotionItem>>(`/revenue/promotions/${id}`, data, { signal }),
  deleteFeaturedPromotion: (id: string, signal?: AbortSignal) =>
    axiosInstance.delete<ApiResponse<null>>(`/revenue/promotions/${id}`, { signal }),
  getFeaturedPromotionStats: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<FeaturedPromotionStats>>('/revenue/promotions/stats', { signal }),

  getFeatures: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<FeatureToggle[]>>('/admin/features', { signal }),
  updateFeature: (key: string, enabled: boolean, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<FeatureToggle>>(`/admin/features/${key}`, { enabled }, { signal }),
  seedFeatures: (signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<FeatureToggle[]>>('/admin/features/seed', undefined, { signal }),

  listAssignments: (params?: { page?: number; limit?: number; status?: string; search?: string; sort?: string; courseId?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ submissions: AdminAssignmentSubmission[]; pagination: any }>>('/admin/assignments', { params, signal }),
  getAssignmentAnalytics: (params?: { courseId?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<AdminAssignmentsAnalytics>>('/admin/assignments/analytics', { params, signal }),
  getGradingLogs: (params?: { page?: number; limit?: number; courseId?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ logs: GradingLogEntry[]; pagination: any }>>('/admin/assignments/grading-log', { params, signal }),
  getAssignmentSubmission: (id: string, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<AdminAssignmentSubmission>>(`/admin/assignments/${id}`, { signal }),
  overrideGrade: (id: string, data: {
    grade: number;
    maxMarks?: number;
    feedback?: string;
    privateNotes?: string;
    letterGrade?: string;
    customGradeScale?: string;
    rubric?: { criteria: string; maxPoints: number; obtainedPoints: number; comment?: string }[];
    gradedFiles?: { url: string; publicId: string; name: string }[];
  }, signal?: AbortSignal) =>
    axiosInstance.patch<ApiResponse<AdminAssignmentSubmission>>(`/admin/assignments/${id}/override`, data, { signal }),

  listRecordings: (params?: { page?: number; limit?: number; courseId?: string; instructorId?: string; status?: string; search?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ recordings: LiveClassRecording[]; pagination: any }>>('/admin/recordings', { params, signal }),
  getRecording: (id: string, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<LiveClassRecording>>(`/admin/recordings/${id}`, { signal }),
  syncRecording: (liveClassId: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<{ liveClassId: string; recordings: LiveClassRecording[] }>>('/admin/recordings/sync', { liveClassId }, { signal }),
  deleteRecording: (id: string, signal?: AbortSignal) =>
    axiosInstance.delete<ApiResponse<null>>(`/admin/recordings/${id}`, { signal }),
};
