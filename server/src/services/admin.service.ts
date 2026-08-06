import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { Course } from '../models/course.model';
import { InstructorApplication } from '../models/instructorApplication.model';
import { Enrollment } from '../models/enrollment.model';
import { Payment } from '../models/payment.model';
import { Payout } from '../models/payout.model';
import { PlatformWallet } from '../models/platformWallet.model';
import { Category } from '../models/category.model';
import { Coupon } from '../models/coupon.model';
import { Blog } from '../models/blog.model';
import { Notification } from '../models/notification.model';
import { PlatformSettings } from '../models/platformSettings.model';
import { Subscription } from '../models/subscription.model';
import { Review } from '../models/review.model';
import { Banner } from '../models/banner.model';
import { Refund } from '../models/refund.model';
import { SupportTicket } from '../models/supportTicket.model';
import { Certificate } from '../models/certificate.model';
import { Faq } from '../models/faq.model';
import { EmailTemplate } from '../models/emailTemplate.model';
import { AuditLog } from '../models/auditLog.model';
import { SecurityLog } from '../models/securityLog.model';
import { BackupLog } from '../models/backupLog.model';
import { CmsPage } from '../models/cmsPage.model';
import { RolePermission } from '../models/rolePermission.model';
import { ApiError } from '../utils/ApiError';
import { MESSAGES } from '../constants/messages';
import { ROLES } from '../constants/roles';
import { escapeRegex } from '../utils/escapeRegex';
import { withTransaction } from '../utils/transaction';
import { sendInstructorDecisionEmail } from '../utils/sendEmail';
import { paymentService } from './payment.service';
import { logger } from '../utils/logger';
import { cascadeDeleteService } from './cascadeDelete.service';
import { cacheService } from '../cache/cache.service';
import { cacheKeys, CACHE_TTL } from '../cache/cacheKeys';
import { cacheManager } from '../cache/cacheManager';

export class AdminService {
  async getDashboardStats() {
    return cacheService.remember(
      cacheKeys.adminDashboard(),
      { ttl: CACHE_TTL.ADMIN_DASHBOARD },
      async () => {
        const [userAgg, courseAgg, totalEnrollments, totalRevenue, recentUsers, recentPayments] = await Promise.all([
          User.aggregate([
            {
              $facet: {
                roles: [{ $group: { _id: '$role', count: { $sum: 1 } } }],
                total: [{ $count: 'count' }],
              },
            },
          ]),
          Course.aggregate([
            {
              $facet: {
                byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
                total: [{ $count: 'count' }],
              },
            },
          ]),
          Enrollment.countDocuments(),
          Payment.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
          User.find().sort({ createdAt: -1 }).limit(5).select('name email avatar role createdAt').lean(),
          Payment.find({ status: 'success' }).sort({ createdAt: -1 }).limit(5).populate('user', 'name email').lean(),
        ]);

        const roleCounts = new Map((userAgg[0]?.roles ?? []).map((r: any) => [r._id, r.count]));
        const statusCounts = new Map((courseAgg[0]?.byStatus ?? []).map((s: any) => [s._id, s.count]));

        return {
          users: {
            total: userAgg[0]?.total?.[0]?.count ?? 0,
            students: roleCounts.get(ROLES.STUDENT) ?? 0,
            instructors: roleCounts.get(ROLES.INSTRUCTOR) ?? 0,
            admins: roleCounts.get(ROLES.ADMIN) ?? 0,
          },
          courses: {
            total: courseAgg[0]?.total?.[0]?.count ?? 0,
            published: statusCounts.get('published') ?? 0,
            pending: statusCounts.get('review') ?? 0,
          },
          enrollments: totalEnrollments,
          revenue: totalRevenue[0]?.total || 0,
          recentUsers,
          recentPayments,
        };
      }
    );
  }

  async getRevenueAnalytics(startDate?: string, endDate?: string) {
    const match: any = { status: 'success' };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const revenue = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const total = revenue.reduce((sum, r) => sum + r.amount, 0);
    return { daily: revenue, total };
  }

  async getUserAnalytics() {
    return cacheService.remember(
      cacheKeys.adminUserAnalytics(),
      { ttl: CACHE_TTL.ADMIN_ANALYTICS },
      async () => {
        const [result] = await User.aggregate([
          {
            $facet: {
              userGrowth: [
                {
                  $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                  },
                },
                { $sort: { _id: 1 } },
              ],
              roleDistribution: [{ $group: { _id: '$role', count: { $sum: 1 } } }],
            },
          },
        ]);

        return { userGrowth: result?.userGrowth ?? [], roleDistribution: result?.roleDistribution ?? [] };
      }
    );
  }

  async getCourseAnalytics() {
    return cacheService.remember(
      cacheKeys.adminCourseAnalytics(),
      { ttl: CACHE_TTL.ADMIN_ANALYTICS },
      async () => {
        const courseStats = await Course.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]);

        const topCourses = await Course.find({ status: 'published' })
          .sort({ totalEnrollments: -1 })
          .limit(10)
          .populate('instructor', 'name')
          .lean();

        return { courseStats, topCourses };
      }
    );
  }

  async listUsers(page: number, limit: number, search?: string, role?: string) {
    const query: any = {};
    if (search) {
      const escaped = escapeRegex(search);
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }
    if (role) query.role = role;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    return {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getUserDetail(userId: string) {
    const user = await User.findById(userId).lean();
    if (!user) throw ApiError.notFound(MESSAGES.ERROR.USER_NOT_FOUND);

    const enrollments = await Enrollment.countDocuments({ user: userId });
    const courses = await Course.countDocuments({ instructor: userId });

    return { ...(user as any), enrollments, courses };
  }

  async updateUserRole(userId: string, role: string) {
    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).lean();
    if (!user) throw ApiError.notFound(MESSAGES.ERROR.USER_NOT_FOUND);
    await cacheManager.invalidateAdminCache();
    return user;
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true }).lean();
    if (!user) throw ApiError.notFound(MESSAGES.ERROR.USER_NOT_FOUND);
    await cacheManager.invalidateAdminCache();
    return user;
  }

  async deleteUser(userId: string, adminId: string) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound(MESSAGES.ERROR.USER_NOT_FOUND);
    if (user.role === ROLES.ADMIN) {
      throw ApiError.badRequest('Admins cannot be deleted. Use deactivation instead.');
    }
    await withTransaction(async (session) => {
      await cascadeDeleteService.deleteUser(userId, adminId, session);
    });
    await cacheManager.invalidateAdminCache();
  }

  async getPendingInstructors() {
    const applications = await InstructorApplication.find({ status: 'pending' })
      .populate('user', 'name email avatar isEmailVerified isActive isDeleted')
      .sort({ createdAt: -1 })
      .lean();

    return applications
      .filter((app: any) => app.user && app.user.isDeleted !== true)
      .map((app: any) => ({
        _id: app._id,
        userId: app.user._id,
        name: app.user.name,
        email: app.user.email,
        avatar: app.user.avatar,
        status: app.status,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      }));
  }

  async getInstructorApplicationDetail(applicationId: string) {
    const application = await InstructorApplication.findById(applicationId)
      .populate('user', 'name email avatar isEmailVerified isActive isDeleted')
      .populate('reviewedBy', 'name email')
      .lean();
    if (!application) throw ApiError.notFound('Instructor application not found');
    if ((application as any).user?.isDeleted) throw ApiError.notFound('Instructor application not found');
    return application;
  }

  async approveInstructor(applicationId: string, adminId: string, adminNote?: string) {
    const application = await InstructorApplication.findById(applicationId);
    if (!application) throw ApiError.notFound('Instructor application not found');
    if (application.status !== 'pending') {
      throw ApiError.conflict(`Application is already ${application.status}`);
    }

    const user = await User.findById(application.user);
    if (!user) throw ApiError.notFound(MESSAGES.ERROR.USER_NOT_FOUND);
    if (user.isDeleted) throw ApiError.badRequest('Cannot approve a deleted user');

    application.status = 'approved';
    application.reviewedBy = new mongoose.Types.ObjectId(adminId);
    application.reviewedAt = new Date();
    if (adminNote) application.adminNote = adminNote;

    user.role = ROLES.INSTRUCTOR;
    user.isActive = true;

    await user.save();
    await application.save();

    await cacheManager.invalidateAdminCache();
    await cacheManager.invalidateInstructorCache(application.user.toString());
    await this.notifyAndEmail(application, user, 'approved', adminNote);
    return application;
  }

  async rejectInstructor(applicationId: string, adminId: string, rejectionReason?: string) {
    const application = await InstructorApplication.findById(applicationId);
    if (!application) throw ApiError.notFound('Instructor application not found');
    if (application.status !== 'pending') {
      throw ApiError.conflict(`Application is already ${application.status}`);
    }

    const user = await User.findById(application.user);
    if (!user) throw ApiError.notFound(MESSAGES.ERROR.USER_NOT_FOUND);

    application.status = 'rejected';
    application.reviewedBy = new mongoose.Types.ObjectId(adminId);
    application.reviewedAt = new Date();
    application.rejectionReason = rejectionReason || '';
    await application.save();

    await cacheManager.invalidateAdminCache();
    await this.notifyAndEmail(application, user, 'rejected', rejectionReason);
    return application;
  }

  private async notifyAndEmail(
    application: any,
    user: any,
    status: 'approved' | 'rejected',
    reason?: string
  ): Promise<void> {
    const userName = user.name || application.fullName;
    try {
      await Notification.create({
        user: application.user,
        type: 'approval',
        title: status === 'approved' ? 'Instructor application approved' : 'Instructor application rejected',
        message:
          status === 'approved'
            ? `Congratulations ${userName}! Your instructor application has been approved. You can now access the instructor dashboard.`
            : `Your instructor application was not approved.${reason ? ` Reason: ${reason}` : ''}`,
        link: status === 'approved' ? '/instructor/dashboard' : '/instructor/apply',
      });
    } catch (error) {
      logger.error(`Failed to create instructor ${status} notification for user ${application.user}:`, error);
    }

    if (process.env.NODE_ENV !== 'test') {
      void sendInstructorDecisionEmail({
        email: application.email || user.email,
        name: userName,
        status,
        reason,
      }).catch((error) => {
        logger.error(`Failed to send instructor ${status} email to ${application.email || user.email}:`, error);
      });
    }
  }

  async listCategories() {
    return Category.find().sort({ name: 1 }).lean();
  }

  async createCategory(data: { name: string; description?: string; icon?: string }) {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const category = await Category.create({ ...data, slug });
    await cacheManager.invalidateCourseCache();
    return category;
  }

  async updateCategory(id: string, data: { name?: string; description?: string; icon?: string; isActive?: boolean }) {
    const update: any = { ...data };
    if (data.name) {
      update.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    const category = await Category.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!category) throw ApiError.notFound('Category not found');
    await cacheManager.invalidateCourseCache();
    return category;
  }

  async deleteCategory(id: string) {
    const category = await Category.findByIdAndDelete(id);
    if (!category) throw ApiError.notFound('Category not found');
    await cacheManager.invalidateCourseCache();
  }

  async listBlogs(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [blogs, total] = await Promise.all([
      Blog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('author', 'name').lean(),
      Blog.countDocuments(),
    ]);
    return { blogs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async createBlog(data: {
    title: string; content: string; excerpt?: string; tags?: string[];
    featuredImage?: { url: string; publicId: string }; status?: string; author: string;
  }) {
    const slug = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const blogData: any = { ...data, slug };
    if (data.status === 'published') blogData.publishedAt = new Date();
    const blog = await Blog.create(blogData);
    await cacheManager.invalidateBlogCache(slug);
    await cacheManager.invalidateAdminCache();
    return blog;
  }

  async updateBlog(id: string, data: any) {
    if (data.title) {
      data.slug = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    if (data.status === 'published' && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    const blog = await Blog.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
    if (!blog) throw ApiError.notFound('Blog not found');
    await cacheManager.invalidateBlogCache(blog.slug);
    await cacheManager.invalidateAdminCache();
    return blog;
  }

  async deleteBlog(id: string) {
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) throw ApiError.notFound('Blog not found');
    await cacheManager.invalidateBlogCache(blog.slug);
    await cacheManager.invalidateAdminCache();
  }

  async listCoupons(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [coupons, total] = await Promise.all([
      Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('createdBy', 'name email').lean(),
      Coupon.countDocuments(),
    ]);
    return { coupons, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async createCoupon(data: {
    code: string; discountType: 'percentage' | 'fixed'; discountValue: number;
    minAmount?: number; maxUses?: number; expiresAt: string; createdBy: string;
  }) {
    const existing = await Coupon.findOne({ code: data.code.toUpperCase() });
    if (existing) throw ApiError.conflict('Coupon code already exists');
    return Coupon.create({ ...data, code: data.code.toUpperCase(), createdBy: data.createdBy });
  }

  async updateCoupon(id: string, data: any) {
    const coupon = await Coupon.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
    if (!coupon) throw ApiError.notFound('Coupon not found');
    return coupon;
  }

  async deleteCoupon(id: string) {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) throw ApiError.notFound('Coupon not found');
  }

  async listNotifications(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      Notification.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email').lean(),
      Notification.countDocuments(),
    ]);
    return { notifications, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async createNotification(data: { user: string; title: string; message: string; type?: string; link?: string }) {
    return Notification.create(data);
  }

  async sendNotificationToAll(data: { title: string; message: string; type?: string }) {
    const users = await User.find({ isActive: true }).select('_id').lean();
    const notifications = users.map((u) => ({
      user: u._id,
      title: data.title,
      message: data.message,
      type: data.type || 'system',
    }));
    await Notification.insertMany(notifications);
    return { sentCount: users.length };
  }

  async deleteNotification(id: string) {
    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) throw ApiError.notFound('Notification not found');
  }

  async getSettings() {
    let settings = await PlatformSettings.findOne().lean();
    if (!settings) {
      settings = await PlatformSettings.create({}) as any;
    }
    return settings;
  }

  async updateSettings(data: any, userId: string) {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({ ...data, updatedBy: userId });
    } else {
      Object.assign(settings, data, { updatedBy: userId });
      await settings.save();
    }
    return settings;
  }

  // ─── Course Management ───────────────────────────────────────
  async listCourses(page: number, limit: number, search?: string, status?: string, category?: string) {
    const query: any = {};
    if (search) {
      const escaped = escapeRegex(search);
      query.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { 'meta.seoTitle': { $regex: escaped, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (category) query.category = category;

    const skip = (page - 1) * limit;
    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate('instructor', 'name email avatar')
        .populate('category', 'name')
        .lean(),
      Course.countDocuments(query),
    ]);
    return { courses, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getCourseDetail(courseId: string): Promise<any> {
    const course = await Course.findById(courseId)
      .populate('instructor', 'name email avatar bio')
      .populate('category', 'name slug')
      .lean();
    if (!course) throw ApiError.notFound('Course not found');

    const enrollments = await Enrollment.countDocuments({ course: courseId });
    const revenue = await Payment.aggregate([
      { $match: { course: course._id, status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return { ...course, totalEnrollments: enrollments, totalRevenue: revenue[0]?.total || 0 };
  }

  async approveCourse(courseId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status !== 'review') throw ApiError.badRequest('Course must be in review status to approve');
    course.status = 'approved';
    await course.save();
    return course;
  }

  async rejectCourse(courseId: string, reason?: string) {
    const course = await Course.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status !== 'review') throw ApiError.badRequest('Course must be in review status to reject');
    course.status = 'rejected';
    course.rejectionReason = reason || '';
    await course.save();
    return course;
  }

  // ─── Subscription Plans ──────────────────────────────────────
  async listSubscriptionPlans() {
    return Subscription.find().sort({ price: 1 }).lean();
  }

  async createSubscriptionPlan(data: {
    name: string; price: number; discountedPrice?: number;
    durationDays: number; features: string[]; level: 'basic' | 'standard' | 'premium';
    status?: 'active' | 'inactive';
  }) {
    return Subscription.create(data);
  }

  async updateSubscriptionPlan(id: string, data: any) {
    const plan = await Subscription.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
    if (!plan) throw ApiError.notFound('Subscription plan not found');
    return plan;
  }

  async deleteSubscriptionPlan(id: string) {
    const plan = await Subscription.findByIdAndDelete(id);
    if (!plan) throw ApiError.notFound('Subscription plan not found');
  }

  // ─── Reviews Moderation ──────────────────────────────────────
  async listReviews(page: number, limit: number, status?: string, courseId?: string) {
    const query: any = {};
    if (status) query.status = status;
    if (courseId) query.course = courseId;

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate('user', 'name email avatar')
        .populate('course', 'title')
        .lean(),
      Review.countDocuments(query),
    ]);
    return { reviews, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async moderateReview(reviewId: string, status: 'approved' | 'rejected', adminNote?: string) {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status, adminNote },
      { new: true }
    );
    if (!review) throw ApiError.notFound('Review not found');
    return review;
  }

  // ─── Banner Management ──────────────────────────────────────
  async listBanners() {
    return Banner.find().sort({ order: 1 }).lean();
  }

  async createBanner(data: {
    title: string; subtitle?: string; image: { url: string; publicId: string };
    link?: string; position: string; order?: number;
  }) {
    return Banner.create(data);
  }

  async updateBanner(id: string, data: any) {
    const banner = await Banner.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
    if (!banner) throw ApiError.notFound('Banner not found');
    return banner;
  }

  async deleteBanner(id: string) {
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) throw ApiError.notFound('Banner not found');
  }

  // ─── Refund Management ──────────────────────────────────────
  async listRefundRequests(page: number, limit: number, status?: string) {
    const query: any = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [refunds, total] = await Promise.all([
      Refund.find(query)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate('user', 'name email')
        .populate('payment')
        .populate('course', 'title')
        .populate('bundle', 'title')
        .lean(),
      Refund.countDocuments(query),
    ]);
    return { refunds, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async approveRefund(refundId: string, adminId: string, adminNote?: string) {
    const refund = await Refund.findById(refundId).populate('payment');
    if (!refund) throw ApiError.notFound('Refund request not found');
    if (refund.status !== 'pending') throw ApiError.badRequest('Refund is not in pending status');

    const payment = refund.payment as any;
    const isFullRefund = refund.refundType === 'full' || refund.amount >= payment.amount;

    return paymentService.processRefundPayment(
      payment._id.toString(),
      refund.amount,
      refund.reason,
      refund.refundType || 'full',
      adminId,
      adminNote
    );
  }

  async rejectRefund(refundId: string, adminId: string, adminNote?: string) {
    const refund = await Refund.findByIdAndUpdate(
      refundId,
      { status: 'rejected', processedBy: adminId, processedAt: new Date(), adminNote },
      { new: true }
    );
    if (!refund) throw ApiError.notFound('Refund request not found');
    return refund;
  }

  // ─── Support Tickets ────────────────────────────────────────
  async listSupportTickets(page: number, limit: number, status?: string, priority?: string) {
    const query: any = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip).limit(limit)
        .populate('user', 'name email avatar')
        .populate('assignedTo', 'name email')
        .lean(),
      SupportTicket.countDocuments(query),
    ]);
    return { tickets, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getSupportTicket(ticketId: string) {
    const ticket = await SupportTicket.findById(ticketId)
      .populate('user', 'name email avatar')
      .populate('assignedTo', 'name email')
      .populate('messages.sender', 'name avatar')
      .lean();
    if (!ticket) throw ApiError.notFound('Support ticket not found');
    return ticket;
  }

  async updateTicketStatus(ticketId: string, status: string) {
    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { status },
      { new: true }
    );
    if (!ticket) throw ApiError.notFound('Support ticket not found');
    return ticket;
  }

  async assignTicket(ticketId: string, adminId: string) {
    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { assignedTo: adminId, status: 'in_progress' },
      { new: true }
    );
    if (!ticket) throw ApiError.notFound('Support ticket not found');
    return ticket;
  }

  async addTicketMessage(ticketId: string, senderId: string, message: string) {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) throw ApiError.notFound('Support ticket not found');
    ticket.messages.push({ sender: senderId as any, message, createdAt: new Date() } as any);
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      ticket.status = 'in_progress';
    }
    await ticket.save();
    return ticket;
  }

  // ─── Certificates Management ────────────────────────────────
  async listCertificates(page: number, limit: number, search?: string, status?: string) {
    const query: any = {};
    if (search) {
      const escaped = escapeRegex(search);
      const users = await User.find({
        $or: [
          { name: { $regex: escaped, $options: 'i' } },
          { email: { $regex: escaped, $options: 'i' } },
        ],
      }).select('_id').lean();
      query.user = { $in: users.map((u) => u._id) };
    }
    if (status && ['active', 'revoked'].includes(status)) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const [certificates, total] = await Promise.all([
      Certificate.find(query)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate('user', 'name email')
        .populate('course', 'title')
        .lean(),
      Certificate.countDocuments(query),
    ]);
    return { certificates, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async revokeCertificate(certificateId: string, reason?: string) {
    const cert = await Certificate.findById(certificateId);
    if (!cert) throw ApiError.notFound('Certificate not found');
    if (cert.status === 'revoked') throw ApiError.conflict('Certificate is already revoked');

    cert.status = 'revoked';
    cert.revokedAt = new Date();
    if (reason) cert.revokedReason = reason;
    await cert.save();
  }

  async restoreCertificate(certificateId: string) {
    const cert = await Certificate.findById(certificateId);
    if (!cert) throw ApiError.notFound('Certificate not found');
    if (cert.status !== 'revoked') throw ApiError.conflict('Certificate is not revoked');

    cert.status = 'active';
    cert.restoredAt = new Date();
    cert.revokedAt = undefined;
    cert.revokedReason = undefined;
    await cert.save();
  }

  // ─── FAQ ─────────────────────────────────────────────────────
  async listFaqs() {
    return Faq.find().sort({ category: 1, order: 1 }).lean();
  }

  async createFaq(data: { question: string; answer: string; category?: string; order?: number }) {
    return Faq.create(data);
  }

  async updateFaq(id: string, data: any) {
    const faq = await Faq.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
    if (!faq) throw ApiError.notFound('FAQ not found');
    return faq;
  }

  async deleteFaq(id: string) {
    const faq = await Faq.findByIdAndDelete(id);
    if (!faq) throw ApiError.notFound('FAQ not found');
  }

  // ─── Email Templates ─────────────────────────────────────────
  async listEmailTemplates() {
    return EmailTemplate.find().sort({ category: 1, name: 1 }).lean();
  }

  async createEmailTemplate(data: {
    name: string; slug: string; subject: string; body: string;
    variables?: string[]; category?: string;
  }) {
    return EmailTemplate.create(data);
  }

  async updateEmailTemplate(id: string, data: any) {
    const template = await EmailTemplate.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
    if (!template) throw ApiError.notFound('Email template not found');
    return template;
  }

  async deleteEmailTemplate(id: string) {
    const template = await EmailTemplate.findByIdAndDelete(id);
    if (!template) throw ApiError.notFound('Email template not found');
  }

  // ─── Audit Logs ─────────────────────────────────────────────
  async listAuditLogs(page: number, limit: number, action?: string, userId?: string) {
    const query: any = {};
    if (action) query.action = action;
    if (userId) query.user = userId;

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate('user', 'name email')
        .lean(),
      AuditLog.countDocuments(query),
    ]);
    return { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  // ─── Security Logs ───────────────────────────────────────────
  async listSecurityLogs(page: number, limit: number, event?: string, severity?: string) {
    const query: any = {};
    if (event) query.event = event;
    if (severity) query.severity = severity;

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      SecurityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate('user', 'name email')
        .lean(),
      SecurityLog.countDocuments(query),
    ]);
    return { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  // ─── Backup & Restore ───────────────────────────────────────
  async listBackups() {
    return BackupLog.find().sort({ createdAt: -1 }).lean();
  }

  async createBackup(createdBy?: string) {
    const backup = await BackupLog.create({
      fileName: `backup-${new Date().toISOString().split('T')[0]}.json`,
      fileSize: 0,
      type: 'full',
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      createdBy,
    });
    return backup;
  }

  async deleteBackup(id: string) {
    const backup = await BackupLog.findByIdAndDelete(id);
    if (!backup) throw ApiError.notFound('Backup not found');
  }

  // ─── CMS Pages ──────────────────────────────────────────────
  async listCmsPages() {
    return CmsPage.find().sort({ title: 1 }).lean();
  }

  async createCmsPage(data: {
    title: string; slug: string; content: string;
    metaTitle?: string; metaDescription?: string; layout?: string;
  }) {
    return CmsPage.create(data);
  }

  async updateCmsPage(id: string, data: any) {
    if (data.status === 'published' && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    const page = await CmsPage.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
    if (!page) throw ApiError.notFound('CMS page not found');
    return page;
  }

  async deleteCmsPage(id: string) {
    const page = await CmsPage.findByIdAndDelete(id);
    if (!page) throw ApiError.notFound('CMS page not found');
  }

  // ─── Role & Permission Management ───────────────────────────
  async listRolePermissions() {
    return RolePermission.find().sort({ role: 1 }).lean();
  }

  async createRolePermission(data: {
    role: string; permissions: { module: string; actions: string[] }[]; description?: string; isDefault?: boolean;
  }) {
    return RolePermission.create(data);
  }

  async updateRolePermission(id: string, data: any) {
    const rp = await RolePermission.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
    if (!rp) throw ApiError.notFound('Role permission not found');
    return rp;
  }

  // ─── Payment Management ─────────────────────────────────────
  async listAllPayments(page: number, limit: number, status?: string, type?: string) {
    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate('user', 'name email')
        .populate('course', 'title')
        .populate('bundle', 'title')
        .populate('subscription', 'name')
        .lean(),
      Payment.countDocuments(query),
    ]);
    return { payments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getPaymentDetail(paymentId: string) {
    const payment = await Payment.findById(paymentId)
      .populate('user', 'name email')
      .populate('course', 'title')
      .populate('bundle', 'title')
      .populate('subscription', 'name')
      .lean();
    if (!payment) throw ApiError.notFound('Payment not found');
    return payment;
  }

  // ─── Student Management ─────────────────────────────────────
  async listStudents(page: number, limit: number, search?: string): Promise<any> {
    const query: any = { role: ROLES.STUDENT };
    if (search) {
      const escaped = escapeRegex(search);
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [students, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    const studentIds = students.map((s) => s._id);
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { user: { $in: studentIds } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
    ]);
    const enrollmentMap = new Map(enrollmentCounts.map((e) => [e._id.toString(), e.count]));

    const enriched = students.map((s) => ({
      ...s,
      totalEnrollments: enrollmentMap.get(s._id.toString()) ?? 0,
    }));

    return {
      students: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // ─── Withdraw Requests ─────────────────────────────────────
  async listWithdrawRequests(page: number, limit: number, status?: string): Promise<any> {
    const { Payout } = require('../models/payout.model');
    const query: any = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [payouts, total] = await Promise.all([
      Payout.find(query)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .populate('instructor', 'name email avatar')
        .lean(),
      Payout.countDocuments(query),
    ]);
    return { payouts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}

export const adminService = new AdminService();
