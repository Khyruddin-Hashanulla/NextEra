export type MockScenario = 'success' | 'empty' | 'error';

export interface MockImage {
  url: string;
  publicId: string;
}

export interface MockStudent {
  _id: string;
  name: string;
  email: string;
  avatar: MockImage;
  role: 'student';
  joinedAt: string;
  isActive: boolean;
}

export interface MockInstructor {
  _id: string;
  name: string;
  email: string;
  avatar: MockImage;
  bio: string;
  specialties: string[];
  experience: string;
  totalCourses: number;
  totalStudents: number;
  averageRating: number;
  totalReviews: number;
}

export interface MockLecture {
  _id: string;
  title: string;
  type: 'video' | 'article' | 'quiz';
  duration: number;
  isFree: boolean;
}

export interface MockSection {
  _id: string;
  title: string;
  totalDuration: number;
  lectures: MockLecture[];
}

export interface MockCourse {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnail: MockImage;
  instructor: MockInstructor;
  category: { _id: string; name: string };
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  price: number;
  pricing: {
    originalPrice: number;
    discountPercent: number;
    hasDiscount: boolean;
    gstPercent: number;
    gstInclusive: boolean;
  };
  totalDuration: number;
  totalLectures: number;
  totalSections: number;
  totalEnrollments: number;
  averageRating: number;
  totalReviews: number;
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  requirements: string[];
  whatYouWillLearn: string[];
  certificateSettings: { enabled: boolean; template: string; issueAutomatically: boolean };
  curriculum: MockSection[];
  createdAt: string;
  updatedAt: string;
}

export interface MockCourseCategory {
  _id: string;
  name: string;
  slug: string;
  courseCount: number;
}

export interface MockProgress {
  _id: string;
  studentId: string;
  courseId: string;
  completedLectureIds: string[];
  percentage: number;
  lastAccessedAt: string;
}

export interface MockReview {
  _id: string;
  courseId: string;
  student: Pick<MockStudent, '_id' | 'name' | 'avatar'>;
  rating: number;
  review: string;
  status: 'published' | 'pending';
  createdAt: string;
}

export interface MockBlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: MockImage;
  author: Pick<MockInstructor, '_id' | 'name' | 'email' | 'avatar' | 'bio'>;
  categories: string[];
  tags: string[];
  status: 'published';
  isFeatured: boolean;
  readCount: number;
  readingTime: number;
  publishedAt: string;
  createdAt: string;
}

export interface MockForumAuthor {
  _id: string;
  name: string;
  avatar: MockImage;
  role: 'student' | 'instructor' | 'admin';
}

export interface MockForumReply {
  _id: string;
  author: MockForumAuthor;
  content: string;
  createdAt: string;
  isBestAnswer: boolean;
}

export interface MockForumTopic {
  _id: string;
  author: MockForumAuthor;
  category: string;
  categoryName: string;
  title: string;
  content: string;
  tags: string[];
  views: number;
  likeCount: number;
  likedByMe: boolean;
  replyCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  bestReplyId?: string | null;
  replies?: MockForumReply[];
  createdAt: string;
  updatedAt: string;
}

export interface MockForumCategory {
  slug: string;
  name: string;
  count: number;
}

export interface MockNotification {
  _id: string;
  title: string;
  message: string;
  type: 'course' | 'payment' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface MockOrder {
  _id: string;
  course: Pick<MockCourse, '_id' | 'title' | 'thumbnail'>;
  amount: number;
  status: 'paid' | 'pending' | 'refunded';
  paymentMethod: string;
  createdAt: string;
}

export interface MockCertificate {
  _id: string;
  certificateId: string;
  course: Pick<MockCourse, '_id' | 'title'>;
  student: Pick<MockStudent, '_id' | 'name' | 'email'>;
  issuedAt: string;
  status: 'active' | 'revoked';
}

export interface MockCoupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  usageCount: number;
  maxUsage: number;
  status: 'active' | 'inactive';
  validUntil: string;
}

export interface MockLiveClass {
  _id: string;
  title: string;
  course: Pick<MockCourse, '_id' | 'title'>;
  instructor: Pick<MockInstructor, '_id' | 'name'>;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'live' | 'completed';
  attendeeCount: number;
}

export interface MockWalletTransaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  createdAt: string;
}

export interface MockRevenue {
  period: string;
  grossRevenue: number;
  refunds: number;
  platformFees: number;
  netRevenue: number;
}

export interface MockAnalytics {
  period: string;
  newEnrollments: number;
  activeLearners: number;
  courseCompletionRate: number;
  averageSessionMinutes: number;
}

export interface MockInstructorApplication {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar: string;
    isEmailVerified: boolean;
    isActive: boolean;
    isDeleted: boolean;
  };
  fullName: string;
  email: string;
  phone: string;
  address: string;
  photo: { url: string; publicId: string };
  resume: { url: string; publicId: string };
  qualification: string;
  experience: string;
  linkedin: string;
  github: string;
  portfolio: string;
  website: string;
  bio: string;
  teachingCategories: string[];
  demoVideo: { url: string; publicId: string };
  identityProof: { url: string; publicId: string };
  taxDetails: { pan: string; gst: string };
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch: string;
    upiId: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: { _id: string; name: string; email: string };
  reviewedAt?: string;
  adminNote?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}
