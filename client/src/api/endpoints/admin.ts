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
} from '@/types/admin';
import {
  RevenueDashboardData, RevenueSummary,
  InstructorSubscriptionPlan, InstructorSubscriptionStats,
  AffiliateItem, AffiliateStats,
  FeaturedPromotionItem, FeaturedPromotionStats,
} from '@/types/revenue';

export const adminApi = {
  getDashboard: () => axiosInstance.get<ApiResponse<DashboardStats>>('/admin/dashboard'),

  getRevenueAnalytics: (startDate?: string, endDate?: string) =>
    axiosInstance.get<ApiResponse<RevenueAnalytics>>('/admin/analytics/revenue', { params: { startDate, endDate } }),

  getUserAnalytics: () => axiosInstance.get<ApiResponse<UserAnalytics>>('/admin/analytics/users'),

  getCourseAnalytics: () => axiosInstance.get<ApiResponse<CourseAnalytics>>('/admin/analytics/courses'),

  listUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    axiosInstance.get<ApiResponse<{ users: any[]; pagination: any }>>('/admin/users', { params }),

  getUserDetail: (id: string) => axiosInstance.get<ApiResponse<any>>(`/admin/users/${id}`),

  updateUserRole: (id: string, role: string) =>
    axiosInstance.put<ApiResponse<any>>(`/admin/users/${id}/role`, { role }),

  updateUserStatus: (id: string, isActive: boolean) =>
    axiosInstance.put<ApiResponse<any>>(`/admin/users/${id}/status`, { isActive }),

  deleteUser: (id: string) => axiosInstance.delete<ApiResponse<null>>(`/admin/users/${id}`),

  getPendingInstructors: () => axiosInstance.get<ApiResponse<any[]>>('/admin/instructors/pending'),

  approveInstructor: (id: string) => axiosInstance.put<ApiResponse<any>>(`/admin/instructors/${id}/approve`),

  rejectInstructor: (id: string) => axiosInstance.delete<ApiResponse<null>>(`/admin/instructors/${id}`),

  listCategories: () => axiosInstance.get<ApiResponse<Category[]>>('/admin/categories'),

  createCategory: (data: Partial<Category>) => axiosInstance.post<ApiResponse<Category>>('/admin/categories', data),

  updateCategory: (id: string, data: Partial<Category>) =>
    axiosInstance.put<ApiResponse<Category>>(`/admin/categories/${id}`, data),

  deleteCategory: (id: string) => axiosInstance.delete<ApiResponse<null>>(`/admin/categories/${id}`),

  listBlogs: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<ApiResponse<{ blogs: Blog[]; pagination: any }>>('/admin/blog', { params }),

  createBlog: (data: Partial<Blog>) => axiosInstance.post<ApiResponse<Blog>>('/admin/blog', data),

  updateBlog: (id: string, data: Partial<Blog>) =>
    axiosInstance.put<ApiResponse<Blog>>(`/admin/blog/${id}`, data),

  deleteBlog: (id: string) => axiosInstance.delete<ApiResponse<null>>(`/admin/blog/${id}`),

  listCoupons: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<ApiResponse<{ coupons: Coupon[]; pagination: any }>>('/admin/coupons', { params }),

  createCoupon: (data: Partial<Coupon>) =>
    axiosInstance.post<ApiResponse<Coupon>>('/admin/coupons', data),

  updateCoupon: (id: string, data: Partial<Coupon>) =>
    axiosInstance.put<ApiResponse<Coupon>>(`/admin/coupons/${id}`, data),

  deleteCoupon: (id: string) => axiosInstance.delete<ApiResponse<null>>(`/admin/coupons/${id}`),

  listNotifications: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<ApiResponse<{ notifications: NotificationItem[]; pagination: any }>>('/admin/notifications', { params }),

  createNotification: (data: { user: string; title: string; message: string; type?: string }) =>
    axiosInstance.post<ApiResponse<NotificationItem>>('/admin/notifications', data),

  sendNotificationToAll: (data: { title: string; message: string; type?: string }) =>
    axiosInstance.post<ApiResponse<{ sentCount: number }>>('/admin/notifications/send-all', data),

  deleteNotification: (id: string) => axiosInstance.delete<ApiResponse<null>>(`/admin/notifications/${id}`),

  getSettings: () => axiosInstance.get<ApiResponse<PlatformSettings>>('/admin/settings'),

  updateSettings: (data: Partial<PlatformSettings>) =>
    axiosInstance.put<ApiResponse<PlatformSettings>>('/admin/settings', data),

  // Wallet & Payouts
  getWallet: () => axiosInstance.get<ApiResponse<WalletData>>('/admin/wallet'),
  getWalletTransactions: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<ApiResponse<{ payments: WalletTransaction[]; total: number; page: number; totalPages: number }>>('/admin/wallet/transactions', { params }),
  getCommissionSettings: () => axiosInstance.get<ApiResponse<CommissionSettings>>('/admin/wallet/commission'),
  getAllPayouts: (params?: { page?: number; limit?: number; status?: string }) =>
    axiosInstance.get<ApiResponse<{ payouts: PayoutItem[]; summary: any; total: number; page: number; totalPages: number }>>('/admin/payouts', { params }),
  processPayout: (id: string) => axiosInstance.post<ApiResponse<PayoutItem>>(`/admin/payouts/${id}/process`),
  processAllPendingPayouts: () => axiosInstance.post<ApiResponse<{ success: number; failed: number; errors: string[] }>>('/admin/payouts/process-all'),

  // ─── Course Management ──────────────────────────────────────────
  listCourses: (params?: { page?: number; limit?: number; search?: string; status?: string; category?: string }) =>
    axiosInstance.get<ApiResponse<{ courses: AdminCourse[]; pagination: any }>>('/admin/courses', { params }),
  getCourseDetail: (id: string) => axiosInstance.get<ApiResponse<any>>(`/admin/courses/${id}`),
  approveCourse: (id: string) => axiosInstance.put<ApiResponse<any>>(`/admin/courses/${id}/approve`),
  rejectCourse: (id: string, reason?: string) => axiosInstance.put<ApiResponse<any>>(`/admin/courses/${id}/reject`, { reason }),

  // ─── Subscription Plans ─────────────────────────────────────────
  listSubscriptionPlans: () => axiosInstance.get<ApiResponse<SubscriptionPlan[]>>('/admin/subscriptions'),
  createSubscriptionPlan: (data: Partial<SubscriptionPlan>) => axiosInstance.post<ApiResponse<SubscriptionPlan>>('/admin/subscriptions', data),
  updateSubscriptionPlan: (id: string, data: Partial<SubscriptionPlan>) => axiosInstance.put<ApiResponse<SubscriptionPlan>>(`/admin/subscriptions/${id}`, data),
  deleteSubscriptionPlan: (id: string) => axiosInstance.delete<ApiResponse<null>>(`/admin/subscriptions/${id}`),

  // ─── Reviews Moderation ─────────────────────────────────────────
  listReviews: (params?: { page?: number; limit?: number; status?: string; courseId?: string }) =>
    axiosInstance.get<ApiResponse<{ reviews: ReviewItem[]; pagination: any }>>('/admin/reviews', { params }),
  moderateReview: (id: string, status: string, adminNote?: string) =>
    axiosInstance.put<ApiResponse<ReviewItem>>(`/admin/reviews/${id}/moderate`, { status, adminNote }),

  // ─── Banner Management ──────────────────────────────────────────
  listBanners: () => axiosInstance.get<ApiResponse<Banner[]>>('/admin/banners'),
  createBanner: (data: Partial<Banner>) => axiosInstance.post<ApiResponse<Banner>>('/admin/banners', data),
  updateBanner: (id: string, data: Partial<Banner>) => axiosInstance.put<ApiResponse<Banner>>(`/admin/banners/${id}`, data),
  deleteBanner: (id: string) => axiosInstance.delete<ApiResponse<null>>(`/admin/banners/${id}`),

  // ─── Refund Management ──────────────────────────────────────────
  listRefundRequests: (params?: { page?: number; limit?: number; status?: string }) =>
    axiosInstance.get<ApiResponse<{ refunds: RefundRequest[]; pagination: any }>>('/admin/refunds', { params }),
  approveRefund: (id: string, adminNote?: string) =>
    axiosInstance.put<ApiResponse<RefundRequest>>(`/admin/refunds/${id}/approve`, { adminNote }),
  rejectRefund: (id: string, adminNote?: string) =>
    axiosInstance.put<ApiResponse<RefundRequest>>(`/admin/refunds/${id}/reject`, { adminNote }),

  // ─── Support Tickets ────────────────────────────────────────────
  listSupportTickets: (params?: { page?: number; limit?: number; status?: string; priority?: string }) =>
    axiosInstance.get<ApiResponse<{ tickets: SupportTicket[]; pagination: any }>>('/admin/tickets', { params }),
  getSupportTicket: (id: string) => axiosInstance.get<ApiResponse<SupportTicket>>(`/admin/tickets/${id}`),
  updateTicketStatus: (id: string, status: string) =>
    axiosInstance.put<ApiResponse<SupportTicket>>(`/admin/tickets/${id}/status`, { status }),
  assignTicket: (id: string) => axiosInstance.put<ApiResponse<SupportTicket>>(`/admin/tickets/${id}/assign`),
  addTicketMessage: (id: string, message: string) =>
    axiosInstance.post<ApiResponse<SupportTicket>>(`/admin/tickets/${id}/message`, { message }),

  // ─── Certificates Management ────────────────────────────────────
  listCertificates: (params?: { page?: number; limit?: number; search?: string }) =>
    axiosInstance.get<ApiResponse<{ certificates: CertificateItem[]; pagination: any }>>('/admin/certificates', { params }),
  revokeCertificate: (id: string) => axiosInstance.delete<ApiResponse<null>>(`/admin/certificates/${id}`),

  // ─── FAQ ──────────────────────────────────────────────────────
  listFaqs: () => axiosInstance.get<ApiResponse<FaqItem[]>>('/admin/faq'),
  createFaq: (data: Partial<FaqItem>) => axiosInstance.post<ApiResponse<FaqItem>>('/admin/faq', data),
  updateFaq: (id: string, data: Partial<FaqItem>) => axiosInstance.put<ApiResponse<FaqItem>>(`/admin/faq/${id}`, data),
  deleteFaq: (id: string) => axiosInstance.delete<ApiResponse<null>>(`/admin/faq/${id}`),

  // ─── Email Templates ─────────────────────────────────────────
  listEmailTemplates: () => axiosInstance.get<ApiResponse<EmailTemplate[]>>('/admin/email-templates'),
  createEmailTemplate: (data: Partial<EmailTemplate>) =>
    axiosInstance.post<ApiResponse<EmailTemplate>>('/admin/email-templates', data),
  updateEmailTemplate: (id: string, data: Partial<EmailTemplate>) =>
    axiosInstance.put<ApiResponse<EmailTemplate>>(`/admin/email-templates/${id}`, data),
  deleteEmailTemplate: (id: string) => axiosInstance.delete<ApiResponse<null>>(`/admin/email-templates/${id}`),

  // ─── Audit & Security Logs ─────────────────────────────────────
  listAuditLogs: (params?: { page?: number; limit?: number; action?: string; userId?: string }) =>
    axiosInstance.get<ApiResponse<{ logs: AuditLogItem[]; pagination: any }>>('/admin/audit-logs', { params }),
  listSecurityLogs: (params?: { page?: number; limit?: number; event?: string; severity?: string }) =>
    axiosInstance.get<ApiResponse<{ logs: SecurityLogItem[]; pagination: any }>>('/admin/security-logs', { params }),

  // ─── Backups ──────────────────────────────────────────────────
  listBackups: () => axiosInstance.get<ApiResponse<Backup[]>>('/admin/backups'),
  createBackup: () => axiosInstance.post<ApiResponse<Backup>>('/admin/backups'),
  deleteBackup: (id: string) => axiosInstance.delete<ApiResponse<null>>(`/admin/backups/${id}`),

  // ─── CMS Pages ───────────────────────────────────────────────
  listCmsPages: () => axiosInstance.get<ApiResponse<CmsPage[]>>('/admin/cms-pages'),
  createCmsPage: (data: Partial<CmsPage>) => axiosInstance.post<ApiResponse<CmsPage>>('/admin/cms-pages', data),
  updateCmsPage: (id: string, data: Partial<CmsPage>) =>
    axiosInstance.put<ApiResponse<CmsPage>>(`/admin/cms-pages/${id}`, data),
  deleteCmsPage: (id: string) => axiosInstance.delete<ApiResponse<null>>(`/admin/cms-pages/${id}`),

  // ─── Role & Permission Management ────────────────────────────
  listRolePermissions: () => axiosInstance.get<ApiResponse<RolePermission[]>>('/admin/role-permissions'),
  createRolePermission: (data: Partial<RolePermission>) => axiosInstance.post<ApiResponse<RolePermission>>('/admin/role-permissions', data),
  updateRolePermission: (id: string, data: Partial<RolePermission>) =>
    axiosInstance.put<ApiResponse<RolePermission>>(`/admin/role-permissions/${id}`, data),

  // ─── Payment Management ─────────────────────────────────────
  listAllPayments: (params?: { page?: number; limit?: number; status?: string; type?: string }) =>
    axiosInstance.get<ApiResponse<{ payments: PaymentItem[]; pagination: any }>>('/admin/payments', { params }),
  getPaymentDetail: (id: string) => axiosInstance.get<ApiResponse<PaymentItem>>(`/admin/payments/${id}`),

  // ─── Student Management ─────────────────────────────────────
  listStudents: (params?: { page?: number; limit?: number; search?: string }) =>
    axiosInstance.get<ApiResponse<{ students: StudentItem[]; pagination: any }>>('/admin/students', { params }),

  // ─── Withdraw Requests ─────────────────────────────────────
  listWithdrawRequests: (params?: { page?: number; limit?: number; status?: string }) =>
    axiosInstance.get<ApiResponse<{ payouts: WithdrawRequest[]; pagination: any }>>('/admin/withdraw-requests', { params }),

  // ─── Revenue Module (Admin) ─────────────────────────────────
  getRevenueDashboard: () =>
    axiosInstance.get<ApiResponse<RevenueDashboardData>>('/revenue/dashboard'),
  getRevenueSummary: () =>
    axiosInstance.get<ApiResponse<RevenueSummary>>('/revenue/summary'),

  // Instructor Subscription Plans (Admin)
  listInstructorSubscriptionPlans: () =>
    axiosInstance.get<ApiResponse<InstructorSubscriptionPlan[]>>('/revenue/instructor-plans'),
  createInstructorSubscriptionPlan: (data: Partial<InstructorSubscriptionPlan>) =>
    axiosInstance.post<ApiResponse<InstructorSubscriptionPlan>>('/revenue/instructor-plans', data),
  updateInstructorSubscriptionPlan: (id: string, data: Partial<InstructorSubscriptionPlan>) =>
    axiosInstance.put<ApiResponse<InstructorSubscriptionPlan>>(`/revenue/instructor-plans/${id}`, data),
  deleteInstructorSubscriptionPlan: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/revenue/instructor-plans/${id}`),
  getInstructorSubscriptionStats: () =>
    axiosInstance.get<ApiResponse<InstructorSubscriptionStats>>('/revenue/instructor-plans/stats'),

  // Affiliates
  listAffiliates: (params?: { page?: number; limit?: number; search?: string }) =>
    axiosInstance.get<ApiResponse<{ affiliates: AffiliateItem[]; pagination: any }>>('/revenue/affiliates', { params }),
  createAffiliate: (data: Partial<AffiliateItem>) =>
    axiosInstance.post<ApiResponse<AffiliateItem>>('/revenue/affiliates', data),
  updateAffiliate: (id: string, data: Partial<AffiliateItem>) =>
    axiosInstance.put<ApiResponse<AffiliateItem>>(`/revenue/affiliates/${id}`, data),
  deleteAffiliate: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/revenue/affiliates/${id}`),
  getAffiliateStats: () =>
    axiosInstance.get<ApiResponse<AffiliateStats>>('/revenue/affiliates/stats'),

  // Featured Promotions
  listFeaturedPromotions: (params?: { page?: number; limit?: number; status?: string }) =>
    axiosInstance.get<ApiResponse<{ promotions: FeaturedPromotionItem[]; pagination: any }>>('/revenue/promotions', { params }),
  createFeaturedPromotion: (data: Partial<FeaturedPromotionItem>) =>
    axiosInstance.post<ApiResponse<FeaturedPromotionItem>>('/revenue/promotions', data),
  updateFeaturedPromotion: (id: string, data: Partial<FeaturedPromotionItem>) =>
    axiosInstance.put<ApiResponse<FeaturedPromotionItem>>(`/revenue/promotions/${id}`, data),
  deleteFeaturedPromotion: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/revenue/promotions/${id}`),
  getFeaturedPromotionStats: () =>
    axiosInstance.get<ApiResponse<FeaturedPromotionStats>>('/revenue/promotions/stats'),

  // ─── Feature Toggles ───────────────────────────────────────
  getFeatures: () =>
    axiosInstance.get<ApiResponse<FeatureToggle[]>>('/admin/features'),
  updateFeature: (key: string, enabled: boolean) =>
    axiosInstance.put<ApiResponse<FeatureToggle>>(`/admin/features/${key}`, { enabled }),
  seedFeatures: () =>
    axiosInstance.post<ApiResponse<FeatureToggle[]>>('/admin/features/seed'),
};
