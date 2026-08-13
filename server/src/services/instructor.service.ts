import { InstructorApplication } from '../models/instructorApplication.model';
import { Course } from '../models/course.model';
import { Enrollment } from '../models/enrollment.model';
import { Payment } from '../models/payment.model';
import { User } from '../models/user.model';
import { Announcement } from '../models/announcement.model';
import { Notification } from '../models/notification.model';
import { Review } from '../models/review.model';
import { Certificate } from '../models/certificate.model';
import { Coupon } from '../models/coupon.model';
import { ApiError } from '../utils/ApiError';
import { ROLES } from '../constants/roles';
import { escapeRegex } from '../utils/escapeRegex';
import { generateCertificateId } from '../utils/certificateIdGenerator';
import {
  generateCertificateSignature,
  generateQrCodePngBuffer,
  getQrCodeImageUrl,
  getVerificationUrl,
} from '../utils/certificate';
import { generateCertificatePdf, getCertificateUrl } from '../utils/pdfGenerator';
import { sendEmail } from '../utils/sendEmail';
import { subscriptionPermissionService } from './subscriptionPermission.service';
import { entitlementService } from './entitlement.service';
import { Types } from 'mongoose';
import { cacheService } from '../cache/cache.service';
import { cacheKeys, CACHE_TTL } from '../cache/cacheKeys';
import { cacheManager } from '../cache/cacheManager';

export interface InstructorDashboardData {
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  totalStudents: number;
  totalRevenue: number;
  totalDuration: number;
  recentCourses: any[];
}

interface CourseFacetStats {
  totalCourses: number;
  publishedCourses: number;
  totalDuration: number;
}

interface CourseFacetResult {
  stats: CourseFacetStats[];
  courseIds: { _id: Types.ObjectId }[];
  recentCourses: any[];
}

interface EnrollmentStatsResult {
  _id: null;
  total: number;
  students: Types.ObjectId[];
}

interface RevenueStatsResult {
  _id: null;
  total: number;
}

export function clearInstructorDashboardCache(userId: string): void {
  void cacheService.del(cacheKeys.instructorDashboard(userId));
}

export function clearInstructorCache(userId: string): void {
  void cacheManager.invalidateInstructorCache(userId);
}

export class InstructorService {
  async apply(
    userId: string,
    data: {
      fullName: string;
      email: string;
      phone: string;
      address: string;
      photo?: { url: string; publicId: string };
      resume?: { url: string; publicId: string };
      qualification: string;
      experience: string;
      linkedin?: string;
      github?: string;
      portfolio?: string;
      website?: string;
      bio?: string;
      teachingCategories?: string[];
      demoVideo?: { url: string; publicId: string };
      identityProof?: { url: string; publicId: string };
      taxDetails?: { pan: string; gst: string };
      bankDetails?: {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        branch: string;
        upiId: string;
      };
    }
  ) {
    const existing = await InstructorApplication.findOne({ user: userId });
    if (existing) {
      if (existing.status === 'pending') throw ApiError.conflict('Application already pending');
      if (existing.status === 'approved') {
        // An approval only grants access while the account is still an
        // instructor. If an admin revoked the role, allow the user to reapply.
        const user = await User.findById(userId).select('role').lean();
        if (user?.role === ROLES.INSTRUCTOR) throw ApiError.conflict('You are already an instructor');
      }
      Object.assign(existing, data, { status: 'pending' });
      return existing.save();
    }
    return InstructorApplication.create({ user: userId, ...data });
  }

  async getApplicationStatus(userId: string) {
    const app = await InstructorApplication.findOne({ user: userId });
    if (!app) return { applied: false };
    return { applied: true, status: app.status, application: app };
  }

  async getDashboard(userId: string): Promise<InstructorDashboardData> {
    return cacheService.remember(cacheKeys.instructorDashboard(userId), { ttl: CACHE_TTL.INSTRUCTOR_DASHBOARD }, () =>
      this.buildDashboard(userId)
    );
  }

  private async buildDashboard(userId: string): Promise<InstructorDashboardData> {
    const instructorId = new Types.ObjectId(userId);

    const [courseResult] = await Course.aggregate<CourseFacetResult>([
      { $match: { instructor: instructorId } },
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                totalCourses: { $sum: 1 },
                publishedCourses: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
                totalDuration: { $sum: { $ifNull: ['$totalDuration', 0] } },
              },
            },
          ],
          courseIds: [{ $project: { _id: 1 } }],
          recentCourses: [{ $sort: { createdAt: -1 } }, { $limit: 5 }],
        },
      },
    ]);

    const stats = courseResult?.stats?.[0];
    const courseIds = (courseResult?.courseIds ?? []).map((c) => c._id);

    const [enrollmentResult, revenueResult] = await Promise.all([
      Enrollment.aggregate<EnrollmentStatsResult>([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: null, total: { $sum: 1 }, students: { $addToSet: '$user' } } },
      ]),
      Payment.aggregate<RevenueStatsResult>([
        { $match: { status: 'success', 'commissionSplits.instructor': instructorId as any } },
        { $unwind: '$commissionSplits' },
        { $match: { 'commissionSplits.instructor': instructorId as any } },
        { $group: { _id: null, total: { $sum: '$commissionSplits.instructorShare' } } },
      ]),
    ]);

    return {
      totalCourses: stats?.totalCourses ?? 0,
      publishedCourses: stats?.publishedCourses ?? 0,
      totalEnrollments: enrollmentResult[0]?.total ?? 0,
      totalStudents: enrollmentResult[0]?.students?.length ?? 0,
      totalRevenue: revenueResult[0]?.total ?? 0,
      totalDuration: stats?.totalDuration ?? 0,
      recentCourses: courseResult?.recentCourses ?? [],
    };
  }

  async getRevenue(instructorId: string, startDate?: string, endDate?: string) {
    return cacheService.remember(
      cacheKeys.instructorRevenue(instructorId, startDate, endDate),
      { ttl: CACHE_TTL.INSTRUCTOR_REVENUE },
      async () => {
        const courses = await Course.find({ instructor: instructorId }).select('_id title').lean();

        const match: any = { status: 'success', 'commissionSplits.instructor': instructorId };
        if (startDate || endDate) {
          match.createdAt = {};
          if (startDate) match.createdAt.$gte = new Date(startDate);
          if (endDate) match.createdAt.$lte = new Date(endDate);
        }

        const [result] = await Payment.aggregate([
          {
            $facet: {
              daily: [
                { $match: match },
                { $unwind: '$commissionSplits' },
                { $match: { 'commissionSplits.instructor': instructorId } },
                {
                  $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    amount: { $sum: '$commissionSplits.instructorShare' },
                    count: { $sum: 1 },
                  },
                },
                { $sort: { _id: 1 } },
              ],
              perCourse: [
                { $match: match },
                { $unwind: '$commissionSplits' },
                { $match: { 'commissionSplits.instructor': instructorId } },
                { $group: { _id: '$course', amount: { $sum: '$commissionSplits.instructorShare' }, count: { $sum: 1 } } },
              ],
            },
          },
        ]);

        const revenue = result?.daily ?? [];
        const perCourse = result?.perCourse ?? [];

        const courseRevenue = perCourse.map((p: any) => {
          const course = courses.find((c: any) => c._id.toString() === p._id.toString());
          return {
            _id: course?._id,
            courseTitle: course?.title || 'Unknown',
            amount: p.amount,
            enrollments: p.count,
          };
        });

        const total = revenue.reduce((sum: number, r: any) => sum + r.amount, 0);
        return { daily: revenue, total, perCourse: courseRevenue };
      }
    );
  }

  async getAnalytics(instructorId: string) {
    return cacheService.remember(
      cacheKeys.instructorAnalytics(instructorId),
      { ttl: CACHE_TTL.INSTRUCTOR_ANALYTICS },
      async () => {
        await subscriptionPermissionService.requireAdvancedAnalyticsPermission(instructorId);
        const courseIds = (await Course.find({ instructor: instructorId }).select('_id').lean()).map((c: any) => c._id);

        const [enrollmentResult, revenueTrend, topCourses, courseRevenue, ratingResult] = await Promise.all([
          Enrollment.aggregate([
            { $match: { course: { $in: courseIds } } },
            {
              $facet: {
                stats: [{ $group: { _id: null, total: { $sum: 1 }, students: { $addToSet: '$user' } } }],
                enrollmentTrend: [
                  {
                    $group: {
                      _id: { $dateToString: { format: '%Y-%m', date: '$enrolledAt' } },
                      count: { $sum: 1 },
                    },
                  },
                  { $sort: { _id: 1 } },
                ],
                studentGrowth: [
                  {
                    $group: {
                      _id: { $dateToString: { format: '%Y-%m', date: '$enrolledAt' } },
                      newStudents: { $addToSet: '$user' },
                    },
                  },
                  { $sort: { _id: 1 } },
                ],
              },
            },
          ]),
          Payment.aggregate([
            { $match: { status: 'success', 'commissionSplits.instructor': instructorId as any } },
            { $unwind: '$commissionSplits' },
            { $match: { 'commissionSplits.instructor': instructorId as any } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                amount: { $sum: '$commissionSplits.instructorShare' },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ]),
          Course.find({ instructor: instructorId })
            .sort({ totalEnrollments: -1 })
            .limit(10)
            .select('title totalEnrollments averageRating price totalRevenue')
            .lean(),
          Payment.aggregate([
            { $match: { status: 'success', 'commissionSplits.instructor': instructorId as any } },
            { $unwind: '$commissionSplits' },
            { $match: { 'commissionSplits.instructor': instructorId as any } },
            {
              $group: {
                _id: '$course',
                revenue: { $sum: '$commissionSplits.instructorShare' },
                enrollments: { $sum: 1 },
              },
            },
          ]),
          Review.aggregate([
            { $match: { course: { $in: courseIds } } },
            { $group: { _id: null, averageRating: { $avg: '$rating' } } },
          ]),
        ]);

        const enrollmentStats = enrollmentResult[0]?.stats?.[0];
        const totalRevenue = revenueTrend.reduce((sum: number, r: any) => sum + r.amount, 0);

        const enrollmentTrend = enrollmentResult[0]?.enrollmentTrend ?? [];
        const studentGrowth = enrollmentResult[0]?.studentGrowth ?? [];

        let cumulativeStudents = 0;
        const growth = studentGrowth.map((s: any) => {
          cumulativeStudents += s.newStudents.length;
          return { month: s._id, newStudents: s.newStudents.length, totalStudents: cumulativeStudents };
        });

        const totalViews = topCourses.reduce((sum: number, c: any) => sum + (c.totalEnrollments || 0), 0);

        const revenueByCourse = new Map((courseRevenue ?? []).map((r: any) => [r._id?.toString(), r]));
        const topPerformingCourses = (topCourses ?? [])
          .map((c: any) => ({
            _id: c._id,
            title: c.title,
            enrollments: revenueByCourse.get(c._id.toString())?.enrollments || c.totalEnrollments || 0,
            revenue: revenueByCourse.get(c._id.toString())?.revenue || 0,
          }))
          .sort((a: any, b: any) => (b.revenue || 0) - (a.revenue || 0))
          .slice(0, 10);

        return {
          totalViews,
          totalStudents: enrollmentStats?.students?.length ?? 0,
          totalEnrollments: enrollmentStats?.total ?? 0,
          totalRevenue,
          averageRating: Math.round((ratingResult?.[0]?.averageRating ?? 0) * 10) / 10,
          totalCourses: courseIds.length,
          enrollmentTrend,
          revenueTrend,
          studentGrowth: growth,
          topPerformingCourses,
        };
      }
    );
  }

  async getStudents(
    instructorId: string,
    { page = 1, limit = 10, search }: { page?: number; limit?: number; search?: string }
  ) {
    const courseIds = (await Course.find({ instructor: instructorId }).select('_id').lean()).map((c: any) => c._id);

    const match: any = { course: { $in: courseIds } };
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: escapeRegex(search), $options: 'i' } },
          { email: { $regex: escapeRegex(search), $options: 'i' } },
        ],
      })
        .select('_id')
        .lean();
      match.user = { $in: users.map((u) => u._id) };
    }

    const skip = (page - 1) * limit;
    const [enrollments, total] = await Promise.all([
      Enrollment.find(match)
        .populate('user', 'name email avatar')
        .populate('course', 'title')
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Enrollment.countDocuments(match),
    ]);

    const students = enrollments.map((e: any) => ({
      _id: e._id,
      user: e.user,
      course: e.course,
      enrolledAt: e.enrolledAt,
      progress: e.completionPercentage,
      isCompleted: e.isCompleted,
    }));

    return {
      students,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async listCoupons(instructorId: string, { page = 1, limit = 10 }: { page?: number; limit?: number }) {
    const skip = (page - 1) * limit;
    const [coupons, total] = await Promise.all([
      Coupon.find({ createdBy: instructorId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Coupon.countDocuments({ createdBy: instructorId }),
    ]);

    return {
      coupons,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async createCoupon(
    instructorId: string,
    data: {
      code: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      minAmount?: number;
      maxUses?: number;
      expiresAt: Date;
      course?: string;
      isActive?: boolean;
    }
  ) {
    await subscriptionPermissionService.requireCouponPermission(instructorId);
    if (data.isActive !== false) {
      const { used, limit } = await entitlementService.getActiveCouponCount(instructorId);
      if (limit > 0 && used >= limit) {
        throw ApiError.forbidden(
          `You have reached the maximum of ${limit} active coupons on your plan. Deactivate an existing coupon or upgrade your instructor plan.`,
          'COUPON_LIMIT_REACHED'
        );
      }
    }
    return Coupon.create({ ...data, createdBy: instructorId });
  }

  async updateCoupon(
    couponId: string,
    data: {
      code?: string;
      discountType?: 'percentage' | 'fixed';
      discountValue?: number;
      minAmount?: number;
      maxUses?: number;
      expiresAt?: Date;
      course?: string;
      isActive?: boolean;
    }
  ) {
    const coupon = await Coupon.findById(couponId);
    if (!coupon) throw ApiError.notFound('Coupon not found');
    Object.assign(coupon, data);
    return coupon.save();
  }

  async deleteCoupon(couponId: string) {
    const coupon = await Coupon.findByIdAndDelete(couponId);
    if (!coupon) throw ApiError.notFound('Coupon not found');
    return { deleted: true };
  }

  async getReviews(instructorId: string, { page = 1, limit = 10 }: { page?: number; limit?: number }) {
    const courseIds = (await Course.find({ instructor: instructorId }).select('_id').lean()).map((c: any) => c._id);

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find({ course: { $in: courseIds } })
        .populate('user', 'name email avatar')
        .populate('course', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ course: { $in: courseIds } }),
    ]);

    return {
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async replyToReview(instructorId: string, reviewId: string, reply: string) {
    const review = await Review.findById(reviewId).populate('course', 'instructor');
    if (!review) throw ApiError.notFound('Review not found');
    const course = review.course as any;
    if (!course || course.instructor.toString() !== instructorId) {
      throw ApiError.forbidden('This review does not belong to your course');
    }
    review.instructorReply = reply;
    return review.save();
  }

  async listAnnouncements(instructorId: string, { page = 1, limit = 10 }: { page?: number; limit?: number }) {
    const skip = (page - 1) * limit;
    const [announcements, total] = await Promise.all([
      Announcement.find({ instructor: instructorId })
        .populate('course', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Announcement.countDocuments({ instructor: instructorId }),
    ]);

    return {
      announcements,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async createAnnouncement(
    instructorId: string,
    data: {
      course: string;
      title: string;
      message: string;
      attachments?: { url: string; publicId: string; name: string }[];
      sendEmail?: boolean;
    }
  ) {
    const course = await Course.findOne({ _id: data.course, instructor: instructorId });
    if (!course) throw ApiError.notFound('Course not found or not owned by you');

    const announcement = await Announcement.create({ ...data, instructor: instructorId });

    const enrolledUsers = await Enrollment.find({
      course: course._id,
      user: { $ne: instructorId },
    }).select('user').lean();
    const recipients = enrolledUsers.map((e) => e.user);

    if (recipients.length > 0) {
      await Notification.insertMany(
        recipients.map((userId) => ({
          user: userId,
          course: course._id,
          announcement: announcement._id,
          title: data.title,
          message: data.message,
          type: 'course',
          link: '/student/announcements',
        }))
      );
    }

    if (data.sendEmail && recipients.length > 0) {
      this.sendAnnouncementEmails(recipients, course, data).catch(() => {});
    }

    return announcement;
  }

  private async sendAnnouncementEmails(
    recipientIds: Types.ObjectId[],
    course: { _id: Types.ObjectId; title: string },
    data: { title: string; message: string }
  ): Promise<void> {
    const users = await User.find({ _id: { $in: recipientIds }, isActive: true })
      .select('name email')
      .lean();
    if (users.length === 0) return;

    const subject = `${data.title} - ${course.title}`;
    const text = [data.title, '', data.message, '', `Course: ${course.title}`, 'View on NextEra LMS'].join('\n');
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">${data.title}</h2>
        <p>${data.message}</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">Course: ${course.title}</p>
      </div>
    `;

    await Promise.allSettled(users.map((u) => sendEmail({ to: u.email, subject, text, html })));
  }

  async deleteAnnouncement(announcementId: string) {
    const announcement = await Announcement.findByIdAndDelete(announcementId);
    if (!announcement) throw ApiError.notFound('Announcement not found');
    await Notification.deleteMany({ announcement: announcement._id });
    return { deleted: true };
  }

  // ─── Notifications (instructor inbox) ────────────────────────
  async listNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ user: userId }),
      Notification.countDocuments({ user: userId, isRead: false }),
    ]);
    return { notifications, total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markNotificationRead(notificationId: string, userId: string) {
    if (!Types.ObjectId.isValid(notificationId)) throw ApiError.badRequest('Invalid notification id');
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) throw ApiError.notFound('Notification not found');
    return notification;
  }

  async markAllNotificationsRead(userId: string) {
    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      bio?: string;
      phone?: string;
      address?: string;
      socialLinks?: {
        youtube?: string;
        twitter?: string;
        linkedin?: string;
        github?: string;
        portfolio?: string;
        website?: string;
      };
      avatar?: { url: string; publicId: string };
      instructorProfile?: {
        qualification?: string;
        experience?: string;
        expertise?: string[];
        resume?: { url: string; publicId: string };
        identityProof?: { url: string; publicId: string };
        demoVideo?: { url: string; publicId: string };
        taxDetails?: { pan: string; gst: string };
        bankDetails?: {
          accountHolderName: string;
          accountNumber: string;
          ifscCode: string;
          bankName: string;
          branch: string;
          upiId: string;
        };
        teachingCategories?: string[];
      };
    }
  ) {
    const user = await User.findByIdAndUpdate(userId, { $set: data }, { new: true, runValidators: true });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    const { uploadService } = await import('../services/upload.service');
    const result = await uploadService.uploadImage(file);

    // Persist the avatar URL to the user document
    await User.findByIdAndUpdate(
      userId,
      {
        $set: { avatar: { url: result.url, publicId: result.publicId } },
      },
      { new: true }
    );

    return result;
  }

  async getSubscriptionStatus(userId: string) {
    const user = await User.findById(userId)
      .select('instructorProfile.subscriptionStatus instructorProfile.subscriptionExpiry')
      .lean();
    if (!user) throw ApiError.notFound('User not found');
    return {
      subscriptionStatus: user.instructorProfile?.subscriptionStatus || 'none',
      subscriptionExpiry: user.instructorProfile?.subscriptionExpiry || null,
    };
  }

  async listCertificates(instructorId: string, { page = 1, limit = 10 }: { page?: number; limit?: number }) {
    const courseIds = (await Course.find({ instructor: instructorId }).select('_id').lean()).map((c: any) => c._id);

    const skip = (page - 1) * limit;
    const [certificates, total] = await Promise.all([
      Certificate.find({ course: { $in: courseIds } })
        .populate('user', 'name email avatar')
        .populate('course', 'title')
        .sort({ issuedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Certificate.countDocuments({ course: { $in: courseIds } }),
    ]);

    return {
      certificates,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async issueCertificate(instructorId: string, data: { userId: string; courseId: string; enrollmentId: string }) {
    const course = await Course.findOne({ _id: data.courseId, instructor: instructorId })
      .populate('category', 'name')
      .lean();
    if (!course) throw ApiError.notFound('Course not found or not owned by you');

    const view = await entitlementService.getEntitlementView(instructorId);
    if (!view.entitlements.certificates.enabled) {
      throw ApiError.forbidden(
        'Certificates are available on Growth and higher plans. Upgrade your instructor plan to issue certificates.',
        'CERTIFICATE_NOT_ALLOWED'
      );
    }

    const enrollment = await Enrollment.findOne({ _id: data.enrollmentId, user: data.userId, course: data.courseId });
    if (!enrollment) throw ApiError.notFound('Enrollment not found');

    const existing = await Certificate.findOne({ enrollment: data.enrollmentId });
    if (existing) throw ApiError.conflict('Certificate already issued for this enrollment');

    const [user, instructor] = await Promise.all([
      User.findById(data.userId).lean(),
      User.findById(instructorId).select('name').lean(),
    ]);
    if (!user) throw ApiError.notFound('User not found');
    const instructorName = instructor?.name || 'Instructor';
    const categoryName = (course as any).category?.name || '';
    const courseLevel = course.level || '';
    const courseDuration = course.totalDuration || 0;

    const certificateId = await generateCertificateId(categoryName);
    const issuedAt = new Date();
    const issuedAtStr = issuedAt.toISOString();

    const digitalSignature = generateCertificateSignature({
      certificateId,
      userId: data.userId,
      courseId: data.courseId,
      issuedAt: issuedAtStr,
      version: 1,
    });

    const verificationUrl = getVerificationUrl(certificateId);
    const qrCodeImageUrl = getQrCodeImageUrl(certificateId);
    const qrCodeData = await generateQrCodePngBuffer(verificationUrl);

    await generateCertificatePdf({
      studentName: user.name,
      courseTitle: course.title,
      instructorName,
      courseLevel,
      categoryName,
      courseDuration,
      certificateId,
      issuedAt,
      verificationUrl,
      qrCodeData,
    });

    const pdfFilename = `certificate-${certificateId}.pdf`;
    const pdfUrl = getCertificateUrl(pdfFilename);
    const certificateUrl = verificationUrl;

    try {
      return await Certificate.create({
        user: data.userId,
        course: data.courseId,
        enrollment: data.enrollmentId,
        certificateId,
        verificationUrl,
        qrCodeUrl: qrCodeImageUrl,
        certificateUrl,
        pdfUrl,
        digitalSignature,
        status: 'active',
        version: 1,
        metadata: {
          categoryName,
          courseDuration,
          courseLevel,
          instructorName,
        },
        issuedAt,
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        const cert = await Certificate.findOne({ enrollment: data.enrollmentId }).lean();
        if (cert) return cert;
      }
      throw error;
    }
  }
}

export const instructorService = new InstructorService();
