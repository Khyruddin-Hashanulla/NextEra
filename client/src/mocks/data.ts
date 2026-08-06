import type {
  MockBlogPost, MockCertificate, MockCourse, MockCoupon, MockInstructor, MockInstructorApplication,
  MockAnalytics, MockCourseCategory, MockLiveClass, MockNotification, MockOrder, MockProgress, MockRevenue, MockReview, MockSection, MockStudent, MockWalletTransaction,
} from './types';

const image = (seed: string) => ({ url: `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=900&q=80`, publicId: seed });

export const mockStudents: MockStudent[] = [
  { _id: 'student-01', name: 'Aarav Mehta', email: 'aarav.mehta@example.com', avatar: image('photo-1534528741775-53994a69daeb'), role: 'student', joinedAt: '2025-01-12T09:30:00Z', isActive: true },
  { _id: 'student-02', name: 'Ananya Iyer', email: 'ananya.iyer@example.com', avatar: image('photo-1494790108377-be9c29b29330'), role: 'student', joinedAt: '2025-02-05T09:30:00Z', isActive: true },
  { _id: 'student-03', name: 'Rohan Kapoor', email: 'rohan.kapoor@example.com', avatar: image('photo-1500648767791-00dcc994a43e'), role: 'student', joinedAt: '2024-12-22T09:30:00Z', isActive: true },
  { _id: 'student-04', name: 'Meera Nair', email: 'meera.nair@example.com', avatar: image('photo-1544005313-94ddf0286df2'), role: 'student', joinedAt: '2025-03-14T09:30:00Z', isActive: false },
];

export const mockInstructors: MockInstructor[] = [
  { _id: 'instructor-01', name: 'Priya Sharma', email: 'priya.sharma@example.com', avatar: image('photo-1573496359142-b8d87734a5a2'), bio: 'Frontend architect helping teams build accessible, high-performance web applications.', specialties: ['React', 'TypeScript', 'Design Systems'], totalCourses: 8, totalStudents: 18420, averageRating: 4.9, totalReviews: 3241 },
  { _id: 'instructor-02', name: 'Daniel Kim', email: 'daniel.kim@example.com', avatar: image('photo-1560250097-0b93528c311a'), bio: 'Data engineer and educator with a passion for practical machine learning.', specialties: ['Python', 'Machine Learning', 'SQL'], totalCourses: 6, totalStudents: 12780, averageRating: 4.8, totalReviews: 2187 },
  { _id: 'instructor-03', name: 'Fatima Rahman', email: 'fatima.rahman@example.com', avatar: image('photo-1580489944761-15a19d654956'), bio: 'Product leader teaching research-led product strategy and delivery.', specialties: ['Product Management', 'UX Research'], totalCourses: 4, totalStudents: 8460, averageRating: 4.7, totalReviews: 1328 },
];

const curriculum = (prefix: string): MockSection[] => [
  { _id: `${prefix}-section-01`, title: 'Getting Started', totalDuration: 42, lectures: [{ _id: `${prefix}-lecture-01`, title: 'Welcome and course roadmap', type: 'video' as const, duration: 12, isFree: true }, { _id: `${prefix}-lecture-02`, title: 'Set up your workspace', type: 'video' as const, duration: 18, isFree: true }, { _id: `${prefix}-lecture-03`, title: 'Knowledge check', type: 'quiz' as const, duration: 12, isFree: false }] },
  { _id: `${prefix}-section-02`, title: 'Core Concepts', totalDuration: 78, lectures: [{ _id: `${prefix}-lecture-04`, title: 'Patterns that scale', type: 'video' as const, duration: 28, isFree: false }, { _id: `${prefix}-lecture-05`, title: 'Hands-on walkthrough', type: 'article' as const, duration: 22, isFree: false }, { _id: `${prefix}-lecture-06`, title: 'Build a production feature', type: 'video' as const, duration: 28, isFree: false }] },
];

const courseSeed: Array<[string, string, string, string, string, number, number, boolean, MockCourse['level'], number]> = [
  ['course-01', 'Modern React Architecture', 'modern-react-architecture', 'Build maintainable React applications with TypeScript, React Query, and a scalable feature architecture.', 'Development', 3499, 20, true, 'beginner', 0],
  ['course-02', 'Practical Machine Learning', 'practical-machine-learning', 'Train, evaluate, and deploy useful machine learning models with Python.', 'Data Science', 4299, 15, true, 'intermediate', 1],
  ['course-03', 'Product Management Foundations', 'product-management-foundations', 'Turn customer insights into product decisions and measurable outcomes.', 'Business', 2999, 0, false, 'beginner', 2],
  ['course-04', 'Advanced TypeScript Patterns', 'advanced-typescript-patterns', 'Master type-safe APIs, generics, and patterns for large TypeScript codebases.', 'Development', 3799, 25, true, 'advanced', 0],
  ['course-05', 'SQL for Analytics', 'sql-for-analytics', 'Write reliable SQL queries and communicate insights with confidence.', 'Data Science', 2499, 0, false, 'beginner', 1],
  ['course-06', 'UX Research in Practice', 'ux-research-in-practice', 'Plan interviews, synthesize findings, and make product teams more customer-focused.', 'Design', 3199, 10, false, 'intermediate', 2],
  ['course-07', 'Node.js API Design', 'nodejs-api-design', 'Design secure, observable Node.js APIs that are pleasant to maintain.', 'Development', 3999, 10, false, 'intermediate', 0],
  ['course-08', 'Python Automation Lab', 'python-automation-lab', 'Automate common workflows with Python, files, APIs, and scheduled tasks.', 'Development', 2799, 0, false, 'beginner', 1],
  ['course-09', 'Metrics That Matter', 'metrics-that-matter', 'Choose product metrics that guide clear and ethical decisions.', 'Business', 2699, 0, false, 'beginner', 2],
  ['course-10', 'React Performance Clinic', 'react-performance-clinic', 'Profile, diagnose, and optimize slow React interfaces.', 'Development', 3599, 15, false, 'advanced', 0],
  ['course-11', 'Data Storytelling', 'data-storytelling', 'Turn analysis into crisp narratives that persuade stakeholders.', 'Data Science', 2899, 0, false, 'intermediate', 1],
  ['course-12', 'Design Systems Essentials', 'design-systems-essentials', 'Create a durable design-system foundation for product teams.', 'Design', 3299, 20, false, 'intermediate', 2],
] ;

export const mockCourses: MockCourse[] = courseSeed.map(([id, title, slug, description, category, price, discount, featured, level, instructorIndex], index) => {
  const sections = curriculum(id);
  return {
    _id: id, title, slug, shortDescription: description, description: `${description} Includes practical projects, downloadable resources, and feedback-oriented exercises.`, thumbnail: image(`photo-${1516321318423 + index}-f06f85e504b3`), instructor: mockInstructors[instructorIndex], category: { _id: category.toLowerCase().split(' ').join('-'), name: category }, level, language: 'English', price, pricing: { originalPrice: price, discountPercent: discount, hasDiscount: discount > 0, gstPercent: 18, gstInclusive: true }, totalDuration: 8 + index, totalLectures: sections.flatMap((section) => section.lectures).length, totalSections: sections.length, totalEnrollments: 720 + index * 317, averageRating: Number((4.6 + (index % 4) / 10).toFixed(1)), totalReviews: 112 + index * 49, featured, status: 'published', tags: [category, level, 'Career Growth'], requirements: ['A laptop with an internet connection', 'Curiosity and a willingness to practise'], whatYouWillLearn: ['Build real-world confidence', 'Apply durable professional workflows', 'Create portfolio-ready work'], certificateSettings: { enabled: true, template: 'standard', issueAutomatically: true }, curriculum: sections, createdAt: `2025-0${(index % 6) + 1}-10T08:00:00Z`, updatedAt: '2026-06-18T12:00:00Z',
  };
});

export const mockCategories: MockCourseCategory[] = ['Development', 'Data Science', 'Business', 'Design'].map((name) => ({ _id: name.toLowerCase().split(' ').join('-'), name, slug: name.toLowerCase().split(' ').join('-'), courseCount: mockCourses.filter((course) => course.category.name === name).length }));

export const mockReviews: MockReview[] = [
  { _id: 'review-01', courseId: 'course-01', student: mockStudents[0], rating: 5, review: 'The architecture examples were immediately useful in my day-to-day work.', status: 'published', createdAt: '2026-06-09T10:00:00Z' },
  { _id: 'review-02', courseId: 'course-01', student: mockStudents[1], rating: 5, review: 'Clear explanations and the projects are genuinely portfolio quality.', status: 'published', createdAt: '2026-06-14T10:00:00Z' },
  { _id: 'review-03', courseId: 'course-02', student: mockStudents[2], rating: 4, review: 'A practical, well-paced introduction with excellent notebooks.', status: 'published', createdAt: '2026-05-22T10:00:00Z' },
];

export const mockBlogs: MockBlogPost[] = Array.from({ length: 12 }, (_, index) => ({ _id: `blog-${index + 1}`, title: ['How to Build a Sustainable Study Habit', 'React Performance: A Practical Field Guide', 'From Metrics to Meaningful Product Decisions'][index % 3] + (index > 2 ? `, Part ${index - 1}` : ''), slug: `learning-insight-${index + 1}`, excerpt: 'Practical guidance from experienced educators for building better learning and product habits.', content: 'This is realistic development content used to validate blog layouts, pagination, reading states, and typography.', featuredImage: image(`photo-${1499750310107 + index}-5fef28a66643`), author: mockInstructors[index % mockInstructors.length], categories: [index % 2 ? 'Engineering' : 'Learning'], tags: ['Career', 'Learning', index % 2 ? 'React' : 'Productivity'], status: 'published', isFeatured: index < 3, readCount: 840 + index * 173, readingTime: 4 + (index % 5), publishedAt: `2026-0${(index % 6) + 1}-1${index % 9}T10:00:00Z`, createdAt: `2026-0${(index % 6) + 1}-10T10:00:00Z` }));

export const mockNotifications: MockNotification[] = [
  { _id: 'notification-01', title: 'New lesson available', message: 'Module two of Modern React Architecture is ready to continue.', type: 'course', isRead: false, createdAt: '2026-07-24T08:30:00Z' },
  { _id: 'notification-02', title: 'Payment confirmed', message: 'Your enrollment in Practical Machine Learning is confirmed.', type: 'payment', isRead: true, createdAt: '2026-07-20T10:20:00Z' },
  { _id: 'notification-03', title: 'Scheduled maintenance', message: 'The platform will be briefly unavailable on Sunday at 02:00 UTC.', type: 'system', isRead: false, createdAt: '2026-07-18T12:00:00Z' },
];

export const mockOrders: MockOrder[] = mockCourses.slice(0, 4).map((course, index) => ({ _id: `order-${index + 1}`, course: { _id: course._id, title: course.title, thumbnail: course.thumbnail }, amount: course.price * (1 - course.pricing.discountPercent / 100), status: index === 3 ? 'refunded' : 'paid', paymentMethod: index % 2 ? 'UPI' : 'Credit Card', createdAt: `2026-0${index + 3}-12T10:30:00Z` }));
export const mockCertificates: MockCertificate[] = mockCourses.slice(0, 2).map((course, index) => ({ _id: `certificate-${index + 1}`, certificateId: `NXT-2026-${String(3410 + index)}`, course: { _id: course._id, title: course.title }, student: mockStudents[0], issuedAt: `2026-0${index + 5}-20T10:00:00Z`, status: 'active' }));
export const mockCoupons: MockCoupon[] = [{ _id: 'coupon-01', code: 'WELCOME20', discountType: 'percentage', discountValue: 20, usageCount: 146, maxUsage: 500, status: 'active', validUntil: '2026-12-31T23:59:59Z' }, { _id: 'coupon-02', code: 'DATA500', discountType: 'fixed', discountValue: 500, usageCount: 68, maxUsage: 100, status: 'active', validUntil: '2026-09-30T23:59:59Z' }];
export const mockLiveClasses: MockLiveClass[] = [{ _id: 'live-01', title: 'React architecture office hours', course: { _id: 'course-01', title: 'Modern React Architecture' }, instructor: mockInstructors[0], scheduledAt: '2026-07-30T14:00:00Z', duration: 60, status: 'scheduled', attendeeCount: 64 }, { _id: 'live-02', title: 'Model evaluation workshop', course: { _id: 'course-02', title: 'Practical Machine Learning' }, instructor: mockInstructors[1], scheduledAt: '2026-07-26T10:00:00Z', duration: 90, status: 'completed', attendeeCount: 41 }];
export const mockWalletTransactions: MockWalletTransaction[] = [{ _id: 'transaction-01', type: 'credit', amount: 284900, description: 'Course enrollment settlements', createdAt: '2026-07-24T10:00:00Z' }, { _id: 'transaction-02', type: 'debit', amount: 84500, description: 'Instructor payouts', createdAt: '2026-07-22T10:00:00Z' }, { _id: 'transaction-03', type: 'credit', amount: 126400, description: 'Subscription renewals', createdAt: '2026-07-18T10:00:00Z' }];
export const mockInstructorApplications: MockInstructorApplication[] = [
  {
    _id: 'application-01',
    user: { _id: 'instructor-03', name: 'Fatima Rahman', email: 'fatima.rahman@example.com', avatar: image('photo-1580489944761-15a19d654956').url, isEmailVerified: true, isActive: true, isDeleted: false },
    fullName: 'Fatima Rahman',
    email: 'fatima.rahman@example.com',
    phone: '+91 98765 43210',
    address: 'Hitech City, Hyderabad, India',
    photo: image('photo-1580489944761-15a19d654956'),
    resume: image('photo-1586281380349-632531db7ed4'),
    qualification: 'M.Tech in Computer Science',
    experience: 'Six years of industry experience in product teams and three years teaching product management.',
    linkedin: 'https://linkedin.com/in/fatima-rahman',
    github: 'https://github.com/fatima-rahman',
    portfolio: 'https://fatima-rahman.dev',
    website: 'https://fatima-rahman.dev',
    bio: 'Product leader teaching research-led product strategy and delivery.',
    teachingCategories: ['Product Management', 'UX Research'],
    demoVideo: { url: 'https://example.com/demo-video.mp4', publicId: 'demo-video-01' },
    identityProof: image('photo-1513364776144-60967b0f800f'),
    taxDetails: { pan: 'ABCDE1234F', gst: '36ABCDE1234F1Z5' },
    bankDetails: {
      accountHolderName: 'Fatima Rahman',
      accountNumber: '50100234567890',
      ifscCode: 'HDFC0001234',
      bankName: 'HDFC Bank',
      branch: 'Hitech City',
      upiId: 'fatima@hdfcbank',
    },
    status: 'pending',
    createdAt: '2026-07-16T11:00:00Z',
    updatedAt: '2026-07-16T11:00:00Z',
  },
];
export const mockProgress: MockProgress[] = [{ _id: 'progress-01', studentId: 'student-01', courseId: 'course-01', completedLectureIds: ['course-01-lecture-01', 'course-01-lecture-02', 'course-01-lecture-03', 'course-01-lecture-04'], percentage: 78, lastAccessedAt: '2026-07-24T09:30:00Z' }, { _id: 'progress-02', studentId: 'student-01', courseId: 'course-02', completedLectureIds: ['course-02-lecture-01', 'course-02-lecture-02'], percentage: 43, lastAccessedAt: '2026-07-21T15:10:00Z' }];
export const mockRevenue: MockRevenue[] = [{ period: '2026-02', grossRevenue: 176000, refunds: 8400, platformFees: 17600, netRevenue: 150000 }, { period: '2026-03', grossRevenue: 208000, refunds: 7200, platformFees: 20800, netRevenue: 180000 }, { period: '2026-04', grossRevenue: 192000, refunds: 9600, platformFees: 19200, netRevenue: 163200 }, { period: '2026-05', grossRevenue: 246000, refunds: 12300, platformFees: 24600, netRevenue: 209100 }, { period: '2026-06', grossRevenue: 269000, refunds: 8100, platformFees: 26900, netRevenue: 234000 }, { period: '2026-07', grossRevenue: 284900, refunds: 11400, platformFees: 28490, netRevenue: 245010 }];
export const mockAnalytics: MockAnalytics[] = [{ period: '2026-02', newEnrollments: 522, activeLearners: 4120, courseCompletionRate: 65, averageSessionMinutes: 38 }, { period: '2026-03', newEnrollments: 618, activeLearners: 4480, courseCompletionRate: 67, averageSessionMinutes: 41 }, { period: '2026-04', newEnrollments: 574, activeLearners: 4735, courseCompletionRate: 68, averageSessionMinutes: 40 }, { period: '2026-05', newEnrollments: 732, activeLearners: 5120, courseCompletionRate: 70, averageSessionMinutes: 43 }, { period: '2026-06', newEnrollments: 810, activeLearners: 5890, courseCompletionRate: 71, averageSessionMinutes: 44 }, { period: '2026-07', newEnrollments: 862, activeLearners: 6450, courseCompletionRate: 72, averageSessionMinutes: 46 }];
