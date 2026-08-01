export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

export const ROUTES = {
  // Public
  HOME: '/',
  COURSES: '/courses',
  COURSE_DETAIL: (id: string) => `/courses/${id}`,
  BUNDLES: '/bundles',
  BUNDLE_DETAIL: (id: string) => `/bundles/${id}`,
  BLOG: '/blog',
  BLOG_DETAIL: (slug: string) => `/blog/${slug}`,
  PRICING: '/pricing',
  ABOUT: '/about',
  CONTACT: '/contact',
  FAQ: '/faq',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  CERTIFICATE_VERIFY: (certificateId: string) => `/certificates/verify/${certificateId}`,

  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  OAUTH_CALLBACK: '/auth/callback',

  // Student
  DASHBOARD: '/student',
  STUDENT_DASHBOARD: '/student',
  STUDENT_COURSES: '/student/my-courses',
  STUDENT_COURSE_PLAYER: (courseId: string) => `/student/courses/${courseId}/learn`,
  STUDENT_LIVE_CLASSES: '/student/live-classes',
  STUDENT_QUIZZES: '/student/quizzes',
  STUDENT_ASSIGNMENTS: '/student/assignments',
  STUDENT_ASSIGNMENT_DETAIL: (lectureId: string) => `/student/assignments/${lectureId}`,
  STUDENT_CERTIFICATES: '/student/certificates',
  STUDENT_NOTES: '/student/notes',
  STUDENT_WISHLIST: '/student/wishlist',
  STUDENT_ORDERS: '/student/orders',
  STUDENT_NOTIFICATIONS: '/student/notifications',
  STUDENT_STUDY_REMINDERS: '/student/study-reminders',
  STUDENT_SUBSCRIPTIONS: '/student/subscriptions',
  STUDENT_BUNDLES: '/student/bundles',
  STUDENT_CODING: '/student/coding',
  STUDENT_CODING_SOLVE: (slug: string) => `/student/coding/${slug}`,
  STUDENT_AI_ASSISTANT: '/student/ai-assistant',
  STUDENT_PROFILE: '/student/profile',

  // Instructor
  INSTRUCTOR_DASHBOARD: '/instructor',
  INSTRUCTOR_COURSES: '/instructor/courses',
  INSTRUCTOR_CREATE_COURSE: '/instructor/courses/create',
  INSTRUCTOR_EDIT_COURSE: (id: string) => `/instructor/courses/${id}/edit`,
  INSTRUCTOR_ANALYTICS: '/instructor/analytics',
  INSTRUCTOR_STUDENTS: '/instructor/students',
  INSTRUCTOR_REVENUE: '/instructor/revenue',
  INSTRUCTOR_PAYOUTS: '/instructor/payouts',
  INSTRUCTOR_LIVE_CLASSES: '/instructor/live-classes',
  INSTRUCTOR_COUPONS: '/instructor/coupons',
  INSTRUCTOR_REVIEWS: '/instructor/reviews',
  INSTRUCTOR_ANNOUNCEMENTS: '/instructor/announcements',
  INSTRUCTOR_CERTIFICATES: '/instructor/certificates',
  INSTRUCTOR_SUBSCRIPTION: '/instructor/subscription',
  INSTRUCTOR_PROFILE: '/instructor/profile',
  INSTRUCTOR_ASSIGNMENTS: '/instructor/assignments',
  INSTRUCTOR_ASSIGNMENT_SUBMISSIONS: (lectureId: string) => `/instructor/assignments/${lectureId}/submissions`,
  INSTRUCTOR_ASSIGNMENT_SUBMISSION_DETAIL: (submissionId: string) => `/instructor/assignments/submissions/${submissionId}`,

  // Admin
  ADMIN_DASHBOARD: '/admin',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_USERS: '/admin/users',
  ADMIN_INSTRUCTORS: '/admin/instructors',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_BLOG: '/admin/blog',
  ADMIN_COUPONS: '/admin/coupons',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_WALLET: '/admin/wallet',
  ADMIN_PAYOUTS: '/admin/payouts',
  ADMIN_REFUNDS: '/admin/refunds',
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_TICKETS: '/admin/tickets',
  ADMIN_CERTIFICATES: '/admin/certificates',
  ADMIN_ASSIGNMENTS: '/admin/assignments',
  ADMIN_ASSIGNMENT_DETAIL: (id: string) => `/admin/assignments/${id}`,
  ADMIN_RECORDINGS: '/admin/recordings',
  ADMIN_BANNERS: '/admin/banners',
  ADMIN_FAQ: '/admin/faq',
  ADMIN_EMAIL_TEMPLATES: '/admin/email-templates',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_FEATURE_TOGGLES: '/admin/feature-toggles',
  ADMIN_CMS_PAGES: '/admin/cms-pages',
  ADMIN_ROLE_PERMISSIONS: '/admin/role-permissions',
  ADMIN_SUBSCRIPTION_PLANS: '/admin/subscription-plans',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_SECURITY_LOGS: '/admin/security-logs',
  ADMIN_BACKUPS: '/admin/backups',
  ADMIN_WITHDRAWALS: '/admin/withdrawals',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_INSTRUCTOR_PLANS: '/admin/instructor-plans',
  ADMIN_REVENUE: '/admin/revenue',
  ADMIN_PROMOTIONS: '/admin/promotions',
  ADMIN_AFFILIATES: '/admin/affiliates',
} as const;

export const ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
} as const;

export const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export const COURSE_STATUS = ['draft', 'published', 'archived'] as const;

export const ENROLLMENT_STATUS = ['active', 'completed', 'expired', 'cancelled'] as const;
export const PAYMENT_STATUS = ['pending', 'success', 'failed', 'refunded'] as const;

export const QUERY_KEYS = {
  auth: {
    user: ['auth', 'user'] as const,
    session: ['auth', 'session'] as const,
  },
  courses: {
    list: (params?: Record<string, unknown>) => ['courses', params] as const,
    detail: (id: string) => ['courses', id] as const,
    instructor: (id: string) => ['courses', 'instructor', id] as const,
  },
  bundles: {
    list: (params?: Record<string, unknown>) => ['bundles', params] as const,
    detail: (id: string) => ['bundles', id] as const,
  },
  blog: {
    list: (params?: Record<string, unknown>) => ['blog', params] as const,
    detail: (slug: string) => ['blog', slug] as const,
    categories: () => ['blog', 'categories'] as const,
  },
  student: {
    dashboard: () => ['student', 'dashboard'] as const,
    enrollments: (params?: Record<string, unknown>) => ['student', 'enrollments', params] as const,
    certificates: () => ['student', 'certificates'] as const,
    notes: (courseId?: string) => ['student', 'notes', courseId] as const,
    wishlist: () => ['student', 'wishlist'] as const,
    orders: (params?: Record<string, unknown>) => ['student', 'orders', params] as const,
    notifications: (params?: Record<string, unknown>) => ['student', 'notifications', params] as const,
    studyReminders: () => ['student', 'study-reminders'] as const,
    subscriptions: () => ['student', 'subscriptions'] as const,
    codingProblems: (params?: Record<string, unknown>) => ['student', 'coding', params] as const,
  },
  instructor: {
    dashboard: () => ['instructor', 'dashboard'] as const,
    courses: (params?: Record<string, unknown>) => ['instructor', 'courses', params] as const,
    analytics: (courseId?: string) => ['instructor', 'analytics', courseId] as const,
    students: (courseId?: string) => ['instructor', 'students', courseId] as const,
    revenue: (params?: Record<string, unknown>) => ['instructor', 'revenue', params] as const,
    payouts: () => ['instructor', 'payouts'] as const,
    coupons: (courseId?: string) => ['instructor', 'coupons', courseId] as const,
  },
  admin: {
    dashboard: () => ['admin', 'dashboard'] as const,
    users: (params?: Record<string, unknown>) => ['admin', 'users', params] as const,
    instructors: (params?: Record<string, unknown>) => ['admin', 'instructors', params] as const,
    courses: (params?: Record<string, unknown>) => ['admin', 'courses', params] as const,
    analytics: (params?: Record<string, unknown>) => ['admin', 'analytics', params] as const,
    revenue: (params?: Record<string, unknown>) => ['admin', 'revenue', params] as const,
    featureToggles: () => ['admin', 'feature-toggles'] as const,
  },
  liveClasses: {
    list: (params?: Record<string, unknown>) => ['live-classes', params] as const,
    detail: (id: string) => ['live-classes', id] as const,
  },
  ai: {
    chat: (sessionId?: string) => ['ai', 'chat', sessionId] as const,
  },
} as const;

export const STORAGE_KEYS = {
  theme: 'theme',
  sidebarCollapsed: 'sidebarCollapsed',
  onboardingComplete: 'onboardingComplete',
  lastVisitedCourse: 'lastVisitedCourse',
  chatHistory: 'chatHistory',
} as const;

export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1400,
} as const;

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
