export interface StudentDashboard {
  totalCourses: number;
  completedCourses: number;
  inProgress: number;
  certificates: number;
  recentCourses: any[];
  enrollments: any[];
}

export interface EnrolledCourse {
  _id: string;
  user: string;
  course: {
    _id: string;
    title: string;
    thumbnail: { url: string; publicId: string };
    price: number;
    level: string;
    totalLectures: number;
    totalDuration: number;
    contentStatus?: 'IN_PROGRESS' | 'COMPLETED';
    instructor: { _id: string; name: string; avatar: { url: string } };
  };
  completionPercentage: number;
  isCompleted: boolean;
  lastWatchedLecture?: { _id: string; title: string; duration: number };
  enrolledAt: string;
}

export interface CourseDetail {
  course: any;
  curriculum: any[];
  isEnrolled: boolean;
  enrollment: any;
}

export interface WishlistItem {
  _id: string;
  user: string;
  course: {
    _id: string;
    title: string;
    thumbnail?: { url: string; publicId: string };
    price: number;
    level?: string;
    totalDuration?: number;
    averageRating?: number;
    totalReviews?: number;
    instructor?: { _id: string; name: string; avatar?: { url: string } };
  };
  createdAt: string;
}

export interface Note {
  _id: string;
  user: string;
  course: string;
  lecture: { _id: string; title: string };
  content: string;
  timestamp?: number;
  createdAt: string;
}

export interface Bookmark {
  _id: string;
  user: string;
  course: { _id: string; title: string };
  lecture: { _id: string; title: string; duration: number; type: string };
  createdAt: string;
}

export interface Discussion {
  _id: string;
  user: { _id: string; name: string; avatar: { url: string } };
  course: string;
  lecture?: string;
  title: string;
  content: string;
  replies: { user: { _id: string; name: string; avatar: { url: string } }; content: string; createdAt: string }[];
  createdAt: string;
}

export interface Review {
  _id: string;
  user: { _id: string; name: string; avatar: { url: string } };
  course: string;
  rating: number;
  review: string;
  createdAt: string;
}

export interface QuizAttempt {
  _id: string;
  user: string;
  course: string;
  lecture: string;
  answers: { question: string; selectedAnswer: string; isCorrect: boolean }[];
  score: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: string;
}

export type AssignmentStatus =
  | 'assigned'
  | 'submitted'
  | 'late_submission'
  | 'under_review'
  | 'graded'
  | 'returned_for_resubmission'
  | 'rejected'
  | 'overdue';

export interface AssignmentFile {
  url: string;
  publicId: string;
  name: string;
}

export interface AssignmentRubricItem {
  criteria: string;
  maxPoints: number;
  obtainedPoints: number;
  comment?: string;
}

export interface AssignmentGradingHistoryEntry {
  grade: number;
  maxMarks: number;
  percentage: number;
  passFail: 'pass' | 'fail';
  letterGrade: string;
  customGradeScale?: string;
  feedback?: string;
  status: AssignmentStatus;
  gradedBy: { _id: string; name: string };
  gradedAt: string;
}

export interface AssignmentSubmission {
  _id: string;
  user: string;
  course: string;
  lecture: { _id: string; title: string; assignment: any };
  content: string;
  files: AssignmentFile[];
  status: AssignmentStatus;
  grade?: number;
  maxMarks?: number;
  percentage?: number;
  passFail?: 'pass' | 'fail';
  letterGrade?: string;
  customGradeScale?: string;
  rubric?: AssignmentRubricItem[];
  feedback?: string;
  privateNotes?: string;
  gradedFiles?: AssignmentFile[];
  gradedBy?: { _id: string; name: string } | string;
  publishedAt?: string;
  publishedBy?: { _id: string; name: string } | string;
  submittedAt: string;
  gradedAt?: string;
  reviewedAt?: string;
  resubmittedAt?: string;
  resubmissionDeadline?: string;
  submissionVersion: number;
  lateSubmission: boolean;
  penaltyPercent: number;
  penaltyApplied: boolean;
  gradingHistory?: AssignmentGradingHistoryEntry[];
}

export interface AssignmentOverviewItem {
  _id: string;
  title: string;
  course: { _id: string; title: string; thumbnail: { url: string } };
  dueDate: string;
  maxMarks: number;
  status: AssignmentStatus;
  submission: {
    _id: string;
    grade?: number;
    maxMarks?: number;
    percentage?: number;
    passFail?: 'pass' | 'fail';
    letterGrade?: string;
    submittedAt: string;
    publishedAt?: string;
    lateSubmission: boolean;
  } | null;
}

export interface AssignmentOverviewResponse {
  assignments: AssignmentOverviewItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface AssignmentDetailResponse {
  lecture: {
    _id: string;
    title: string;
    course: { _id: string; title: string; thumbnail: { url: string }; instructor: { _id: string; name: string } };
    assignment: {
      title?: string;
      description?: string;
      totalMarks: number;
      passingMarks: number;
      dueDate?: string;
      allowLateSubmission: boolean;
      instructions?: string;
    };
    resources: { title: string; url: string; type: string }[];
  };
  status: AssignmentStatus;
  submission: AssignmentSubmission | null;
  canResubmit: boolean;
  canSubmit: boolean;
}

export interface Certificate {
  _id: string;
  user: string | { _id: string; name: string; email: string };
  course: { _id: string; title: string; instructor: { _id: string; name: string }; thumbnail?: string };
  certificateId: string;
  verificationUrl?: string;
  qrCodeUrl: string;
  certificateUrl: string;
  pdfUrl?: string;
  status: 'active' | 'revoked';
  version: number;
  metadata?: {
    categoryName: string;
    courseDuration: number;
    courseLevel: string;
    instructorName: string;
  };
  issuedAt: string;
  downloadedAt?: string;
  verifiedAt?: string;
  signatureValid?: boolean;
  isRevoked?: boolean;
  revokedAt?: string;
  revokedReason?: string;
}

export interface Bundle {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: { url: string; publicId: string };
  courses: {
    _id: string;
    title: string;
    thumbnail: { url: string };
    price: number;
    instructor: { _id: string; name: string; avatar: { url: string } };
    totalDuration: number;
    averageRating: number;
  }[];
  price: number;
  discountedPrice: number;
  totalDuration: number;
  totalLectures: number;
  level: string;
  tags: string[];
  status: 'draft' | 'review' | 'approved' | 'published' | 'rejected' | 'archived';
  totalEnrollments: number;
  createdAt: string;
}

export interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice: number;
  durationDays: number;
  features: string[];
  level: 'basic' | 'standard' | 'premium';
  status: 'active' | 'inactive';
  totalSubscribers: number;
}

export interface SubscriptionEnrollment {
  _id: string;
  user: string;
  subscription: SubscriptionPlan;
  razorpayOrderId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  autoRenew: boolean;
  createdAt: string;
}

export interface PlatformWallet {
  totalRevenue: number;
  totalCommissionCollected: number;
  totalPayoutsMade: number;
  currentBalance: number;
  pendingPayouts: number;
  lastUpdated: string;
}

export interface CommissionSettings {
  commissionPercent: number;
  platformCommission: number;
  totalRevenue: number;
  totalPayoutsMade: number;
  currentBalance: number;
  pendingPayouts: number;
}

export interface PayoutItem {
  _id: string;
  instructor: { _id: string; name: string; email: string; avatar: { url: string } };
  amount: number;
  commissionAmount: number;
  totalAmount: number;
  sourcePayment: { _id: string; amount: number; type: string; createdAt: string };
  sourceType: 'course' | 'bundle' | 'subscription';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  razorpayPayoutId?: string;
  utr?: string;
  scheduledDate: string;
  completedDate?: string;
  notes?: string;
  createdAt: string;
}
