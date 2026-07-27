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

export interface AssignmentSubmission {
  _id: string;
  user: string;
  course: string;
  lecture: { _id: string; title: string; assignment: any };
  content: string;
  files: { url: string; publicId: string; name: string }[];
  status: 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
  submittedAt: string;
}

export interface Certificate {
  _id: string;
  user: string;
  course: { _id: string; title: string; instructor: { _id: string; name: string } };
  certificateId: string;
  qrCodeUrl: string;
  certificateUrl: string;
  issuedAt: string;
}

export interface Bundle {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: { url: string; publicId: string };
  courses: { _id: string; title: string; thumbnail: { url: string }; price: number; instructor: { _id: string; name: string; avatar: { url: string } }; totalDuration: number; averageRating: number }[];
  price: number;
  discountedPrice: number;
  totalDuration: number;
  totalLectures: number;
  level: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
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
