import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';
import axios from 'axios';
import { mockConfig } from './config';
import {
  mockBlogs,
  mockCertificates,
  mockCategories,
  mockCoupons,
  mockCourses,
  mockForumCategories,
  mockForumTopics,
  mockInstructorApplications,
  mockInstructors,
  mockLiveClasses,
  mockNotifications,
  mockOrders,
  mockReviews,
  mockStudents,
  mockWalletTransactions,
} from './data';
import type { MockScenario, MockForumTopic } from './types';

type Query = Record<string, unknown>;
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const unwrap = (value: unknown) => ({ success: true, data: value });

/**
 * Instructor financial, analytics and student modules must always reflect the
 * real database. These endpoints bypass the mock adapter (even in dev) and are
 * sent to the actual API so dashboards never render fabricated numbers.
 */
const BYPASS_MOCK = Symbol('bypass-mock');
const INSTRUCTOR_REAL_API = /^\/instructor\/(dashboard|revenue|analytics|students|payouts|assignments)(\/|$)/;
const STUDENT_WISHLIST_REAL_API = /^\/student\/wishlist(\/|$)/;
const page = <T>(items: T[], query: Query = {}) => {
  const current = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 12);
  const start = (current - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    pagination: {
      page: current,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
      pages: Math.ceil(items.length / limit),
    },
  };
};
const queryOf = (config: AxiosRequestConfig): Query => (config.params as Query | undefined) ?? {};
const requestUrl = (config: AxiosRequestConfig) => (config.url?.split('?')[0] ?? '').replace(/^\/api\/v1/, '');
const scenarioOf = (config: AxiosRequestConfig): MockScenario =>
  (queryOf(config).__mockScenario as MockScenario | undefined) ?? mockConfig.scenario;

const parseBody = (config: AxiosRequestConfig): Record<string, unknown> =>
  typeof config.data === 'string'
    ? (JSON.parse(config.data || '{}') as Record<string, unknown>)
    : ((config.data ?? {}) as Record<string, unknown>);

const mockForumList: MockForumTopic[] = [...mockForumTopics];

const coursesFor = (query: Query) => {
  const search = String(query.search ?? '').toLowerCase();
  const category = String(query.category ?? '');
  const level = String(query.level ?? '');
  const featured = String(query.featured ?? '') === 'true';
  const sort = String(query.sort ?? '');
  const filtered = mockCourses
    .filter(
      (course) =>
        !search || `${course.title} ${course.description} ${course.instructor.name}`.toLowerCase().includes(search)
    )
    .filter((course) => !category || course.category.name === category || course.category._id === category)
    .filter((course) => !level || course.level === level)
    .filter((course) => !featured || course.featured)
    .sort((a, b) =>
      sort === 'price-low'
        ? a.price - b.price
        : sort === 'rating'
          ? b.averageRating - a.averageRating
          : b.totalEnrollments - a.totalEnrollments
    );
  const result = page(filtered, query);
  return { courses: result.items, pagination: result.pagination };
};

const dashboard = {
  totalEnrolledCourses: 4,
  completedCourses: 2,
  certificatesEarned: 2,
  totalLearningHours: 37.5,
  recentCourses: mockCourses.slice(0, 4).map((course, index) => ({
    ...course,
    progress: [78, 43, 100, 12][index],
    lastAccessedAt: '2026-07-24T09:30:00Z',
  })),
  upcomingClasses: mockLiveClasses.filter((item) => item.status === 'scheduled'),
};
const adminDashboard = {
  totalUsers: 12840,
  totalStudents: 12114,
  totalInstructors: 326,
  totalCourses: mockCourses.length,
  totalRevenue: 1842600,
  monthlyRevenue: 284900,
  pendingPayouts: 84500,
  recentUsers: mockStudents,
  recentCourses: mockCourses.slice(0, 5),
  revenueByMonth: [
    { month: 'Feb', revenue: 176000 },
    { month: 'Mar', revenue: 208000 },
    { month: 'Apr', revenue: 192000 },
    { month: 'May', revenue: 246000 },
    { month: 'Jun', revenue: 269000 },
    { month: 'Jul', revenue: 284900 },
  ],
};
function response(config: AxiosRequestConfig, data: unknown, status = 200): AxiosResponse {
  return { data, status, statusText: 'OK', headers: {}, config: config as InternalAxiosRequestConfig };
}

function route(config: AxiosRequestConfig): unknown {
  const url = requestUrl(config);
  const method = config.method?.toLowerCase() ?? 'get';
  const query = queryOf(config);
  if (INSTRUCTOR_REAL_API.test(url)) return BYPASS_MOCK;
  if (STUDENT_WISHLIST_REAL_API.test(url)) return BYPASS_MOCK;
  if (url === '/student/dashboard') return { data: dashboard };
  if (url === '/student/courses') return { data: coursesFor(query) };
  if (url === '/student/instructors')
    return {
      data: mockInstructors.map((instructor) => ({
        _id: instructor._id,
        name: instructor.name,
        email: instructor.email,
        avatar: instructor.avatar.url,
        bio: instructor.bio,
        title: '',
        experience: instructor.experience,
        specialties: instructor.specialties,
        rating: instructor.averageRating,
        coursesCount: instructor.totalCourses,
        studentsCount: instructor.totalStudents,
        totalReviews: instructor.totalReviews,
      })),
    };
  if (/^\/student\/instructors\/[^/]+$/.test(url)) {
    const instructor = mockInstructors.find((item) => item._id === url.split('/').pop());
    if (!instructor) return { data: null };
    return {
      data: {
        _id: instructor._id,
        name: instructor.name,
        email: instructor.email,
        phone: '+91 98765 43210',
        address: 'Bengaluru, India',
        avatar: instructor.avatar,
        bio: instructor.bio,
        socialLinks: { youtube: '', twitter: '', linkedin: '', github: '', portfolio: '', website: '' },
        instructorProfile: {
          qualification: 'B.Tech in Computer Science',
          experience: instructor.experience,
          expertise: instructor.specialties,
          teachingCategories: instructor.specialties,
          resume: { url: 'https://example.com/resume.pdf', publicId: 'resume-01' },
          demoVideo: { url: 'https://example.com/intro.mp4', publicId: 'demo-01' },
          completedCourses: instructor.totalCourses,
          totalStudents: instructor.totalStudents,
          rating: instructor.averageRating,
        },
        specialties: instructor.specialties,
        totalCourses: instructor.totalCourses,
        totalStudents: instructor.totalStudents,
        totalReviews: instructor.totalReviews,
        averageRating: instructor.averageRating,
        createdAt: '2025-03-10T08:00:00Z',
      },
    };
  }
  if (url.startsWith('/student/courses/')) {
    const course = mockCourses.find((item) => item._id === url.split('/').pop() || item.slug === url.split('/').pop());
    if (!course) return { data: null };
    return { data: { course, curriculum: course.curriculum, isEnrolled: true, enrollment: { progress: 78 } } };
  }
  if (url === '/student/my-courses') return { data: dashboard.recentCourses };
  if (url === '/student/certificates') return { data: mockCertificates };
  if (url.startsWith('/student/certificates/verify/'))
    return {
      data: mockCertificates.find((item) => item.certificateId === url.split('/').pop()) ?? mockCertificates[0],
    };
  if (url === '/student/notifications')
    return {
      data: {
        notifications: mockNotifications,
        unreadCount: mockNotifications.filter((item) => !item.isRead).length,
        total: mockNotifications.length,
      },
    };
  if (url === '/student/announcements')
    return {
      data: {
        announcements: [
          {
            _id: 'announcement-01',
            course: { _id: 'course-01', title: 'Mock Course' },
            instructor: 'instructor-01',
            title: 'Welcome to the course',
            message: 'This is a sample announcement from the mock adapter.',
            attachments: [],
            sendEmail: false,
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      },
    };
  if (url === '/student/payments')
    return { data: { payments: mockOrders, total: mockOrders.length, page: 1, totalPages: 1 } };
  if (url === '/student/reviews')
    return { data: { reviews: mockReviews, pagination: page(mockReviews, query).pagination } };
  if (url === '/student/bundles') return { data: { bundles: [], total: 0, page: 1, totalPages: 0 } };
  if (url === '/student/subscriptions/plans')
    return {
      data: [
        {
          _id: 'subscription-01',
          name: 'Career Pro',
          price: 999,
          durationDays: 30,
          features: ['All core courses', 'Monthly live class'],
          level: 'pro',
          status: 'active',
        },
      ],
    };
  if (url === '/blogs') {
    const result = page(
      mockBlogs.filter(
        (item) => !query.search || item.title.toLowerCase().includes(String(query.search).toLowerCase())
      ),
      query
    );
    return { blogs: result.items, pagination: result.pagination };
  }
  if (url === '/blogs/featured') return { blogs: mockBlogs.filter((item) => item.isFeatured) };
  if (url === '/blogs/categories')
    return {
      categories: [
        { _id: 'engineering', name: 'Engineering', slug: 'engineering' },
        { _id: 'learning', name: 'Learning', slug: 'learning' },
      ],
    };
  if (/^\/blogs\/[^/]+$/.test(url))
    return { data: mockBlogs.find((item) => item.slug === url.split('/').pop()) ?? mockBlogs[0] };
  if (url === '/bookmarks')
    return { blogs: mockBlogs.slice(0, 3), pagination: page(mockBlogs.slice(0, 3), query).pagination };
  if (url === '/admin/dashboard') return unwrap(adminDashboard);
  if (url === '/admin/users') {
    const result = page(mockStudents, query);
    return unwrap({ users: result.items, pagination: result.pagination });
  }
  if (url === '/admin/students') {
    const result = page(mockStudents, query);
    return unwrap({ students: result.items, pagination: result.pagination });
  }
  if (url === '/admin/instructors/pending')
    return unwrap(mockInstructorApplications.filter((app) => app.status === 'pending'));
  if (/^\/admin\/instructors\/[^/]+$/.test(url) && method === 'get')
    return unwrap(mockInstructorApplications.find((app) => app._id === url.split('/').pop()) ?? null);
  if (url === '/admin/categories') return unwrap(mockCategories);
  if (url === '/categories') return unwrap(mockCategories);
  if (url === '/admin/courses') {
    const result = page(mockCourses, query);
    return unwrap({ courses: result.items, pagination: result.pagination });
  }
  if (url === '/admin/blog') {
    const result = page(mockBlogs, query);
    return unwrap({ blogs: result.items, pagination: result.pagination });
  }
  if (url === '/admin/coupons') {
    const result = page(mockCoupons, query);
    return unwrap({ coupons: result.items, pagination: result.pagination });
  }
  if (url === '/admin/notifications')
    return unwrap({ notifications: mockNotifications, pagination: page(mockNotifications, query).pagination });
  if (url === '/admin/wallet')
    return unwrap({
      balance: 486800,
      totalRevenue: 1842600,
      totalPayouts: 1355800,
      pendingPayouts: 84500,
      transactions: mockWalletTransactions,
    });
  if (url === '/admin/wallet/transactions')
    return unwrap({ transactions: mockWalletTransactions, total: mockWalletTransactions.length, page: 1, totalPages: 1 });
  if (url === '/admin/payouts')
    return unwrap({ payouts: [], summary: { pending: 84500, processed: 1355800 }, total: 0, page: 1, totalPages: 0 });
  if (url === '/admin/reviews')
    return unwrap({ reviews: mockReviews, pagination: page(mockReviews, query).pagination });
  if (url === '/admin/certificates')
    return unwrap({ certificates: mockCertificates, pagination: page(mockCertificates, query).pagination });
  if (url === '/admin/analytics/revenue')
    return unwrap({
      totalRevenue: adminDashboard.totalRevenue,
      monthlyRevenue: adminDashboard.revenueByMonth,
      conversionRate: 4.8,
    });
  if (url === '/admin/analytics/users')
    return unwrap({ totalUsers: adminDashboard.totalUsers, newUsers: 812, activeUsers: 6450 });
  if (url === '/admin/analytics/courses')
    return unwrap({ totalCourses: mockCourses.length, publishedCourses: mockCourses.length, completionRate: 68 });
  if (url === '/courses/instructor')
    return unwrap(mockCourses.filter((course) => course.instructor._id === 'instructor-01'));
  if (/^\/courses\/[^/]+\/curriculum$/.test(url)) return unwrap(mockCourses[0].curriculum);
  if (url === '/instructor/application-status')
    return unwrap({ applied: true, status: 'pending', application: mockInstructorApplications[0] });
  if (url === '/instructor/apply') return unwrap(mockInstructorApplications[0]);
  if (url === '/instructor/notifications')
    return unwrap({
      notifications: mockNotifications,
      total: mockNotifications.length,
      unreadCount: mockNotifications.filter((item) => !item.isRead).length,
    });
  if (url.endsWith('/instructor/notifications/read-all')) return unwrap({ success: true });
  if (/^\/instructor\/notifications\/[^/]+\/read$/.test(url)) return unwrap(mockNotifications[0]);
  if (url === '/live-classes/instructor' || url === '/live-classes/student')
    return unwrap({ classes: mockLiveClasses, pagination: page(mockLiveClasses, query).pagination });
  if (url === '/live-classes/instructor/recordings' || url === '/live-classes/student/recordings')
    return unwrap({ recordings: [], pagination: page([], query).pagination });
  if (url.endsWith('/auth/login') && method === 'post')
    return {
      data: {
        user: mockStudents[0],
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      },
    };
  if (url === '/csrf-token' && method === 'get') return unwrap({ csrfToken: 'mock-csrf-token' });
  if (url.endsWith('/auth/register') && method === 'post')
    return {
      data: {
        ...mockStudents[0],
        _id: 'mock-new-user',
        name: JSON.parse(typeof config.data === 'string' ? config.data || '{}' : '{}').name || 'New User',
        email: JSON.parse(typeof config.data === 'string' ? config.data || '{}' : '{}').email || 'new@example.com',
      },
    };
  if (url.endsWith('/users/me') && method === 'get') return { data: mockStudents[0] };
  if (url === '/forum' && method === 'get') {
    const search = String(query.search ?? '').toLowerCase();
    const category = String(query.category ?? '');
    const solved = query.solved;
    const instructor = String(query.instructor ?? '') === 'true';
    let topics = mockForumList
      .filter((topic) => !search || `${topic.title} ${topic.content}`.toLowerCase().includes(search))
      .filter((topic) => !category || topic.category === category)
      .filter((topic) => solved === undefined || String(topic.isSolved) === String(solved))
      .filter((topic) => !instructor || topic.author.role === 'instructor');
    const sort = String(query.sort ?? 'latest');
    topics = [...topics].sort((a, b) => {
      if (sort === 'active') return b.updatedAt.localeCompare(a.updatedAt);
      if (sort === 'viewed') return b.views - a.views;
      if (sort === 'discussed') return b.replyCount - a.replyCount;
      if (sort === 'trending') return b.likeCount + b.replyCount * 2 - (a.likeCount + a.replyCount * 2);
      return b.createdAt.localeCompare(a.createdAt);
    });
    const result = page(topics, query);
    return { discussions: result.items, pagination: result.pagination };
  }
  if (url === '/forum/categories' && method === 'get')
    return {
      categories: mockForumCategories.map((category) => ({
        ...category,
        count: mockForumList.filter((topic) => topic.category === category.slug).length,
      })),
    };
  if (url === '/forum/stats' && method === 'get')
    return {
      stats: {
        members: 245,
        discussions: mockForumList.length,
        replies: mockForumList.reduce((total, topic) => total + topic.replyCount, 0),
      },
    };
  if (/^\/forum\/[^/]+\/replies\/[^/]+$/.test(url) && method === 'delete') {
    const id = url.split('/')[2];
    const replyId = url.split('/')[4];
    const topic = mockForumList.find((item) => item._id === id);
    if (topic) {
      topic.replies = (topic.replies ?? []).filter((reply) => reply._id !== replyId);
      topic.replyCount = topic.replies.length;
      topic.updatedAt = new Date().toISOString();
    }
    return unwrap({ success: true });
  }
  if (/^\/forum\/[^/]+\/reply$/.test(url) && method === 'post') {
    const id = url.split('/')[2];
    const body = parseBody(config);
    const topic = mockForumList.find((item) => item._id === id);
    if (topic) {
      topic.replies = [
        ...(topic.replies ?? []),
        {
          _id: 'mock-reply-' + Date.now(),
          author: { _id: mockStudents[0]._id, name: mockStudents[0].name, avatar: mockStudents[0].avatar, role: 'student' },
          content: String(body.content ?? ''),
          createdAt: new Date().toISOString(),
          isBestAnswer: false,
        },
      ];
      topic.replyCount = topic.replies.length;
      topic.updatedAt = new Date().toISOString();
    }
    return { topic };
  }
  if (/^\/forum\/[^/]+\/like$/.test(url) && method === 'post') {
    const topic = mockForumList.find((item) => item._id === url.split('/')[2]);
    if (topic) {
      topic.likedByMe = !topic.likedByMe;
      topic.likeCount = topic.likeCount + (topic.likedByMe ? 1 : -1);
    }
    return { liked: topic?.likedByMe ?? false, likeCount: topic?.likeCount ?? 0 };
  }
  if (/^\/forum\/[^/]+\/solved$/.test(url) && method === 'patch') {
    const topic = mockForumList.find((item) => item._id === url.split('/')[2]);
    if (topic) topic.isSolved = Boolean(parseBody(config).solved);
    return { topic };
  }
  if (/^\/forum\/[^/]+\/pin$/.test(url) && method === 'patch') {
    const topic = mockForumList.find((item) => item._id === url.split('/')[2]);
    if (topic) topic.isPinned = Boolean(parseBody(config).pinned);
    return { topic };
  }
  if (/^\/forum\/[^/]+\/lock$/.test(url) && method === 'patch') {
    const topic = mockForumList.find((item) => item._id === url.split('/')[2]);
    if (topic) topic.isLocked = Boolean(parseBody(config).locked);
    return { topic };
  }
  if (/^\/forum\/[^/]+\/best-answer$/.test(url) && method === 'patch') {
    const topic = mockForumList.find((item) => item._id === url.split('/')[2]);
    const replyId = String(parseBody(config).replyId ?? '');
    if (topic) {
      topic.bestReplyId = replyId;
      topic.replies = (topic.replies ?? []).map((reply) => ({ ...reply, isBestAnswer: reply._id === replyId }));
      topic.isSolved = true;
    }
    return { topic };
  }
  if (/^\/forum\/[^/]+$/.test(url) && method === 'delete') {
    const id = url.split('/').pop();
    const index = mockForumList.findIndex((topic) => topic._id === id);
    if (index >= 0) mockForumList.splice(index, 1);
    return unwrap({ success: true });
  }
  if (/^\/forum\/[^/]+$/.test(url) && method === 'get') {
    const topic = mockForumList.find((item) => item._id === url.split('/').pop());
    if (topic) topic.views += 1;
    return topic ? { topic } : { topic: mockForumList[0] };
  }
  if (url === '/forum' && method === 'post') {
    const body = parseBody(config);
    const now = new Date().toISOString();
    const newTopic: MockForumTopic = {
      _id: 'mock-topic-' + Date.now(),
      author: { _id: mockStudents[0]._id, name: mockStudents[0].name, avatar: mockStudents[0].avatar, role: 'student' },
      category: String(body.category ?? 'general'),
      categoryName: mockForumCategories.find((c) => c.slug === body.category)?.name ?? 'General',
      title: String(body.title ?? ''),
      content: String(body.content ?? ''),
      tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
      views: 0,
      likeCount: 0,
      likedByMe: false,
      replyCount: 0,
      isPinned: false,
      isLocked: false,
      isSolved: false,
      replies: [],
      createdAt: now,
      updatedAt: now,
    };
    mockForumList.unshift(newTopic);
    return { topic: newTopic };
  }
  if (method === 'post' || method === 'put' || method === 'delete')
    return unwrap({
      ...(typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data),
      _id: 'mock-updated-record',
    });
  return unwrap([]);
}

export const mockAdapter: AxiosAdapter = async (config) => {
  if (scenarioOf(config) === 'error')
    throw new AxiosError('Mock network error. Set VITE_MOCK_SCENARIO=success to recover.', 'ERR_NETWORK', config);
  const data = route(config);
  if (data === BYPASS_MOCK) {
    const defaultAdapter = axios.getAdapter(axios.defaults.adapter);
    return defaultAdapter(config);
  }
  await wait(mockConfig.latencyMs);
  return response(config, scenarioOf(config) === 'empty' ? unwrap([]) : data);
};
