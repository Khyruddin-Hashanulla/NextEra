export interface InstructorApplicationUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface InstructorApplication {
  _id: string;
  user: InstructorApplicationUser;
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
  taxDetails?: { pan?: string; gst?: string };
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branch?: string;
    upiId?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: { _id: string; name: string; email: string };
  reviewedAt?: string;
  adminNote?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSettings {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  defaultUserRole: string;
  platformName: string;
  platformEmail: string;
  logo: { url: string; publicId: string };
  favicon: { url: string; publicId: string };
  metaDescription: string;
  currency: string;
  commissionPercentage: number;
  gstPercentage: number;
  minimumPayoutAmount: number;
  supportEmail: string;
  timezone: string;
  defaultInstructorPlan: string;
  refundWindowDays: number;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
}

export interface WalletData {
  totalRevenue: number;
  totalCommissionCollected: number;
  totalPayoutsMade: number;
  currentBalance: number;
  pendingPayouts: number;
}

export interface CommissionSettings {
  commissionRate: number;
  instructorRate: number;
}

export interface WalletTransaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface PayoutItem {
  _id: string;
  instructor: { _id: string; name: string; email: string };
  amount: number;
  commissionAmount: number;
  status: string;
  scheduledDate: string;
  completedDate?: string;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  isActive: boolean;
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUsage: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: { url: string; publicId: string };
  author: { _id: string; name: string };
  tags: string[];
  categories: string[];
  status: 'draft' | 'published';
  isFeatured: boolean;
  readCount: number;
  readingTime: number;
  seo: {
    metaTitle: string;
    metaDescription: string;
    canonicalUrl: string;
    ogImage: string;
  };
  publishedAt: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  audience: string;
  status: string;
  createdAt: string;
}

export interface CertificateItem {
  _id: string;
  certificateId: string;
  qrCodeUrl: string;
  certificateUrl: string;
  pdfUrl?: string;
  digitalSignature: string;
  status: 'active' | 'revoked';
  version: number;
  metadata?: {
    categoryName: string;
    courseDuration: number;
    courseLevel: string;
    instructorName: string;
  };
  user: { _id: string; name: string; email: string };
  course: { _id: string; title: string };
  issuedAt: string;
  downloadedAt?: string;
  verifiedAt?: string;
  revokedAt?: string;
  revokedReason?: string;
  restoredAt?: string;
}

export interface PaymentItem {
  _id: string;
  user: { _id: string; name: string; email: string };
  amount: number;
  type: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export interface StudentItem {
  _id: string;
  name: string;
  email: string;
  avatar: { url: string; publicId: string };
  enrolledCourses: number;
  completedCourses: number;
  joinedAt: string;
}

export interface WithdrawRequest {
  _id: string;
  instructor: { _id: string; name: string; email: string };
  amount: number;
  bankDetails: string;
  status: string;
  createdAt: string;
}

export interface FeatureToggle {
  _id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'general' | 'payment' | 'social' | 'ai' | 'communication' | 'security';
  updatedBy?: { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DashboardStats extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RevenueAnalytics extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UserAnalytics extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CourseAnalytics extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AdminCourse extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SubscriptionPlan extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ReviewItem extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Banner extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RefundRequest extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SupportTicket extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FaqItem extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EmailTemplate extends Record<string, any> {}
export interface AuditLogItem {
  _id: string;
  adminId: { _id: string; name: string; email: string; avatar?: { url: string } };
  adminName: string;
  adminEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  changedFields?: string[];
  requestMethod?: string;
  requestUrl?: string;
  route?: string;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  createdAt: string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SecurityLogItem extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Backup extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CmsPage extends Record<string, any> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RolePermission extends Record<string, any> {}

export interface AdminAssignmentSubmission {
  _id: string;
  user: { _id: string; name: string; email: string; avatar?: { url: string } };
  course: { _id: string; title: string };
  lecture: { _id: string; title: string; assignment?: any };
  content: string;
  files: { url: string; publicId: string; name: string }[];
  status: 'assigned' | 'submitted' | 'late_submission' | 'under_review' | 'graded' | 'returned_for_resubmission' | 'rejected';
  grade?: number;
  maxMarks?: number;
  percentage?: number;
  passFail?: 'pass' | 'fail';
  letterGrade?: string;
  customGradeScale?: string;
  rubric?: { criteria: string; maxPoints: number; obtainedPoints: number; comment?: string }[];
  feedback?: string;
  privateNotes?: string;
  gradedFiles?: { url: string; publicId: string; name: string }[];
  gradedBy?: { _id: string; name: string };
  publishedAt?: string;
  publishedBy?: { _id: string; name: string };
  submittedAt: string;
  gradedAt?: string;
  reviewedAt?: string;
  resubmittedAt?: string;
  resubmissionDeadline?: string;
  submissionVersion: number;
  lateSubmission: boolean;
  penaltyPercent: number;
  penaltyApplied: boolean;
  gradingHistory?: {
    grade: number;
    maxMarks: number;
    percentage: number;
    passFail: 'pass' | 'fail';
    letterGrade: string;
    customGradeScale?: string;
    feedback?: string;
    status: string;
    gradedBy: { _id: string; name: string };
    gradedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminAssignmentsAnalytics {
  total: number;
  byStatus: {
    submitted: number;
    lateSubmission: number;
    underReview: number;
    graded: number;
    returnedForResubmission: number;
    rejected: number;
  };
  gradingStats: {
    averageGrade: number;
    averagePercentage: number;
    passCount: number;
    failCount: number;
    passRate: number;
  };
}

export interface GradingLogEntry {
  submissionId: string;
  user: { _id: string; name: string; email: string };
  course: { _id: string; title: string };
  lecture: { _id: string; title: string };
  grade: number;
  maxMarks: number;
  percentage: number;
  passFail: 'pass' | 'fail';
  letterGrade: string;
  customGradeScale?: string;
  feedback?: string;
  status: string;
  gradedBy: { _id: string; name: string };
  gradedAt: string;
}
