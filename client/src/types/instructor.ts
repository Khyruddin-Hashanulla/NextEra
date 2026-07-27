export interface VideoSource {
  source: 'youtube' | 'vimeo' | 'bunny' | 's3' | 'direct' | 'none';
  url: string;
  videoId: string;
  provider: string;
  thumbnailUrl: string;
  playbackRate: number;
  qualities: string[];
}

export interface LectureAttachment {
  url: string;
  publicId: string;
  name: string;
  type: string;
  size: number;
}

export interface LectureAssignment {
  question: string;
  instructions: string;
  dueDate?: string;
  totalMarks: number;
  passingMarks: number;
  allowLateSubmission: boolean;
  lateSubmissionDays: number;
  penaltyPercent: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  marks: number;
}

export interface LectureQuiz {
  timeLimit: number;
  passingScore: number;
  maxAttempts: number;
  showResults: boolean;
  randomizeQuestions: boolean;
  questions: QuizQuestion[];
}

export interface CoursePricing {
  originalPrice: number;
  discountPercent: number;
  hasDiscount: boolean;
  gstPercent: number;
  gstInclusive: boolean;
}

export interface IntroVideo {
  source: 'youtube' | 'vimeo' | 'bunny' | 's3' | 'direct' | 'none';
  url: string;
  videoId: string;
  posterUrl: string;
}

export interface CertificateSettings {
  enabled: boolean;
  template: string;
  issueAutomatically: boolean;
  passingCriteria: 'completion' | 'quiz_score';
  minimumQuizScore: number;
}

export interface CourseMeta {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: { url: string; publicId: string };
  introVideo: IntroVideo;
  welcomeMessage: string;
  congratulationMessage: string;
  pricing: CoursePricing;
  price: number;
  category: { _id: string; name: string } | string;
  instructor: { _id: string; name: string; email: string; avatar: { url: string } };
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  language: string;
  prerequisites: string;
  benefits: string;
  requirements: string[];
  tags: string[];
  whatYouWillLearn: string[];
  visibility: 'public' | 'private';
  courseType: 'paid' | 'free' | 'draft' | 'private';
  status: 'draft' | 'review' | 'published' | 'archived';
  isApproved: boolean;
  featured: boolean;
  badge: string;
  totalDuration: number;
  totalLectures: number;
  totalSections: number;
  totalResources: number;
  averageRating: number;
  totalReviews: number;
  totalEnrollments: number;
  certificateSettings: CertificateSettings;
  meta: CourseMeta;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  _id: string;
  course: string;
  title: string;
  description: string;
  objective: string;
  order: number;
  totalLectures: number;
  totalDuration: number;
  lectures?: Lecture[];
  createdAt: string;
}

export interface Lecture {
  _id: string;
  section: string;
  course: string;
  title: string;
  slug: string;
  description: string;
  type: 'video' | 'article' | 'assignment' | 'quiz';
  duration: number;
  videoSource: VideoSource;
  videoUrl: { url: string; publicId: string };
  articleContent: string;
  resources: { url: string; publicId: string; name: string; type: string; size: number }[];
  attachments: LectureAttachment[];
  sourceCode: { url: string; publicId: string; name: string; size: number };
  practiceFiles: LectureAttachment[];
  notes: string;
  assignment: LectureAssignment;
  quiz: LectureQuiz;
  order: number;
  isFree: boolean;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstructorDashboard {
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  totalStudents: number;
  totalRevenue: number;
  totalDuration: number;
  recentCourses: Course[];
}

export interface InstructorRevenue {
  daily: { _id: string; amount: number; count: number }[];
  total: number;
  perCourse: { courseTitle: string; amount: number; enrollments: number }[];
}

export interface InstructorApplication {
  _id: string;
  qualification: string;
  experience: string;
  expertise: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface PayoutSummary {
  totalPaid: number;
  totalPending: number;
  totalOverall: number;
}

export interface InstructorPayout {
  _id: string;
  instructor: string;
  amount: number;
  commissionAmount: number;
  totalAmount: number;
  sourcePayment: { _id: string; amount: number; createdAt: string };
  sourceType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  razorpayPayoutId?: string;
  utr?: string;
  scheduledDate: string;
  completedDate?: string;
  notes?: string;
  createdAt: string;
}

export interface InstructorPayoutsResponse {
  payouts: InstructorPayout[];
  summary: PayoutSummary;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── New Instructor Feature Types ──────────────────────────────

export interface InstructorAnalytics {
  totalStudents: number;
  totalEnrollments: number;
  totalRevenue: number;
  averageRating: number;
  totalCourses: number;
  enrollmentTrend: { _id: string; count: number }[];
  revenueTrend: { _id: string; amount: number }[];
  topCourses: { _id: string; title: string; enrollments: number; revenue: number }[];
}

export interface InstructorStudent {
  _id: string;
  name: string;
  email: string;
  avatar: { url: string };
  courseTitle: string;
  enrollmentDate: string;
  progress: number;
  completedLectures: number;
  totalLectures: number;
}

export interface InstructorCoupon {
  _id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minAmount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  course?: { _id: string; title: string };
  createdAt: string;
}

export interface InstructorReview {
  _id: string;
  user: { _id: string; name: string; email: string; avatar: { url: string } };
  course: { _id: string; title: string };
  rating: number;
  review: string;
  instructorReply?: { reply: string; repliedAt: string };
  createdAt: string;
}

export interface Announcement {
  _id: string;
  course: { _id: string; title: string };
  instructor: string;
  title: string;
  message: string;
  attachments: { url: string; publicId: string; name: string }[];
  sendEmail: boolean;
  createdAt: string;
}

export interface InstructorProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: { url: string; publicId: string };
  bio: string;
  socialLinks: {
    youtube: string;
    twitter: string;
    linkedin: string;
    github: string;
    portfolio: string;
    website: string;
  };
  instructorProfile: {
    qualification: string;
    experience: string;
    expertise: string[];
    resume: { url: string; publicId: string };
    identityProof: { url: string; publicId: string };
    demoVideo: { url: string; publicId: string };
    taxDetails: { pan: string; gst: string };
    bankDetails: {
      accountHolderName: string;
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      branch: string;
      upiId: string;
    };
    teachingCategories: string[];
    completedCourses: number;
    totalStudents: number;
    totalEarnings: number;
    rating: number;
    subscriptionStatus: string;
    subscriptionExpiry?: string;
  };
}

export interface InstructorCertificate {
  _id: string;
  user: { _id: string; name: string; email: string };
  course: { _id: string; title: string };
  certificateId: string;
  certificateUrl?: string;
  createdAt: string;
}

export interface SubscriptionStatus {
  subscriptionStatus: string;
  subscriptionExpiry: string | null;
}
