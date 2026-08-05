import { describe, expect, it } from 'vitest';
import {
  API_BASE_URL,
  TOKEN_KEYS,
  ROUTES,
  ROLES,
  getDashboardRoute,
  getProfileRoute,
  getSettingsRoute,
  getMyCoursesRoute,
  COURSE_LEVELS,
  COURSE_STATUS,
  ENROLLMENT_STATUS,
  PAYMENT_STATUS,
  QUERY_KEYS,
  STORAGE_KEYS,
  BREAKPOINTS,
  DEFAULT_PAGE_SIZE,
  MAX_FILE_SIZE,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
} from '@/lib/constants';

describe('constants', () => {
  it('uses the default API base url', () => {
    expect(API_BASE_URL).toBe('/api/v1');
  });

  it('exposes token storage keys', () => {
    expect(TOKEN_KEYS.ACCESS_TOKEN).toBe('accessToken');
    expect(TOKEN_KEYS.REFRESH_TOKEN).toBe('refreshToken');
  });

  it('builds route builders', () => {
    expect(ROUTES.COURSE_DETAIL('c1')).toBe('/courses/c1');
    expect(ROUTES.BUNDLE_DETAIL('b1')).toBe('/bundles/b1');
    expect(ROUTES.BLOG_DETAIL('slug')).toBe('/blog/slug');
    expect(ROUTES.CERTIFICATE_VERIFY('cert1')).toBe('/certificates/verify/cert1');
    expect(ROUTES.STUDENT_COURSE_PLAYER('c1')).toBe('/student/courses/c1/learn');
    expect(ROUTES.STUDENT_ASSIGNMENT_DETAIL('l1')).toBe('/student/assignments/l1');
    expect(ROUTES.STUDENT_CODING_SOLVE('two-sum')).toBe('/student/coding/two-sum');
    expect(ROUTES.INSTRUCTOR_EDIT_COURSE('c1')).toBe('/instructor/courses/c1/edit');
    expect(ROUTES.INSTRUCTOR_ASSIGNMENT_SUBMISSIONS('l1')).toBe('/instructor/assignments/l1/submissions');
    expect(ROUTES.INSTRUCTOR_ASSIGNMENT_SUBMISSION_DETAIL('s1')).toBe('/instructor/assignments/submissions/s1');
    expect(ROUTES.ADMIN_ASSIGNMENT_DETAIL('a1')).toBe('/admin/assignments/a1');
  });

  it('exposes static route constants', () => {
    expect(ROUTES.LOGIN).toBe('/auth/login');
    expect(ROUTES.STUDENT_DASHBOARD).toBe('/student');
    expect(ROUTES.INSTRUCTOR_DASHBOARD).toBe('/instructor');
    expect(ROUTES.ADMIN_DASHBOARD).toBe('/admin');
  });

  it('defines roles', () => {
    expect(ROLES.STUDENT).toBe('student');
    expect(ROLES.INSTRUCTOR).toBe('instructor');
    expect(ROLES.ADMIN).toBe('admin');
  });

  it('maps roles to dashboard routes', () => {
    expect(getDashboardRoute(ROLES.ADMIN)).toBe('/admin');
    expect(getDashboardRoute(ROLES.INSTRUCTOR)).toBe('/instructor');
    expect(getDashboardRoute(ROLES.STUDENT)).toBe('/student');
    expect(getDashboardRoute(undefined)).toBe('/student');
  });

  it('maps roles to profile routes', () => {
    expect(getProfileRoute(ROLES.ADMIN)).toBe(ROUTES.ADMIN_SETTINGS);
    expect(getProfileRoute(ROLES.INSTRUCTOR)).toBe('/instructor/profile');
    expect(getProfileRoute(ROLES.STUDENT)).toBe('/student/profile');
    expect(getProfileRoute(undefined)).toBe('/student/profile');
  });

  it('maps roles to settings routes', () => {
    expect(getSettingsRoute(ROLES.ADMIN)).toBe(ROUTES.ADMIN_SETTINGS);
    expect(getSettingsRoute(ROLES.INSTRUCTOR)).toBe('/instructor/profile');
    expect(getSettingsRoute(ROLES.STUDENT)).toBe('/student/profile');
    expect(getSettingsRoute(undefined)).toBe('/student/profile');
  });

  it('maps roles to my courses routes', () => {
    expect(getMyCoursesRoute(ROLES.ADMIN)).toBe(ROUTES.ADMIN_COURSES);
    expect(getMyCoursesRoute(ROLES.INSTRUCTOR)).toBe('/instructor/courses');
    expect(getMyCoursesRoute(ROLES.STUDENT)).toBe('/student/my-courses');
    expect(getMyCoursesRoute(undefined)).toBe('/student/my-courses');
  });

  it('defines levels and statuses', () => {
    expect(COURSE_LEVELS).toContain('beginner');
    expect(COURSE_STATUS).toContain('published');
    expect(ENROLLMENT_STATUS).toContain('active');
    expect(PAYMENT_STATUS).toContain('refunded');
  });

  it('builds query keys', () => {
    expect(QUERY_KEYS.auth.user).toEqual(['auth', 'user']);
    expect(QUERY_KEYS.auth.session).toEqual(['auth', 'session']);
    expect(QUERY_KEYS.courses.list({ page: 1 })).toEqual(['courses', { page: 1 }]);
    expect(QUERY_KEYS.courses.detail('c1')).toEqual(['courses', 'c1']);
    expect(QUERY_KEYS.courses.instructor('i1')).toEqual(['courses', 'instructor', 'i1']);
    expect(QUERY_KEYS.bundles.list()).toEqual(['bundles', undefined]);
    expect(QUERY_KEYS.bundles.detail('b1')).toEqual(['bundles', 'b1']);
    expect(QUERY_KEYS.blog.list()).toEqual(['blog', undefined]);
    expect(QUERY_KEYS.blog.detail('slug')).toEqual(['blog', 'slug']);
    expect(QUERY_KEYS.blog.categories()).toEqual(['blog', 'categories']);
    expect(QUERY_KEYS.student.dashboard()).toEqual(['student', 'dashboard']);
    expect(QUERY_KEYS.student.enrollments()).toEqual(['student', 'enrollments', undefined]);
    expect(QUERY_KEYS.student.certificates()).toEqual(['student', 'certificates']);
    expect(QUERY_KEYS.student.notes('c1')).toEqual(['student', 'notes', 'c1']);
    expect(QUERY_KEYS.student.wishlist()).toEqual(['student', 'wishlist']);
    expect(QUERY_KEYS.student.orders()).toEqual(['student', 'orders', undefined]);
    expect(QUERY_KEYS.student.notifications({ page: 1 })).toEqual(['student', 'notifications', { page: 1 }]);
    expect(QUERY_KEYS.student.studyReminders()).toEqual(['student', 'study-reminders']);
    expect(QUERY_KEYS.student.subscriptions()).toEqual(['student', 'subscriptions']);
    expect(QUERY_KEYS.student.codingProblems()).toEqual(['student', 'coding', undefined]);
    expect(QUERY_KEYS.instructor.dashboard()).toEqual(['instructor', 'dashboard']);
    expect(QUERY_KEYS.instructor.courses()).toEqual(['instructor', 'courses', undefined]);
    expect(QUERY_KEYS.instructor.analytics('c1')).toEqual(['instructor', 'analytics', 'c1']);
    expect(QUERY_KEYS.instructor.students('c1')).toEqual(['instructor', 'students', 'c1']);
    expect(QUERY_KEYS.instructor.revenue()).toEqual(['instructor', 'revenue', undefined]);
    expect(QUERY_KEYS.instructor.payouts()).toEqual(['instructor', 'payouts']);
    expect(QUERY_KEYS.instructor.coupons('c1')).toEqual(['instructor', 'coupons', 'c1']);
    expect(QUERY_KEYS.admin.dashboard()).toEqual(['admin', 'dashboard']);
    expect(QUERY_KEYS.admin.users()).toEqual(['admin', 'users', undefined]);
    expect(QUERY_KEYS.admin.instructors()).toEqual(['admin', 'instructors', undefined]);
    expect(QUERY_KEYS.admin.courses()).toEqual(['admin', 'courses', undefined]);
    expect(QUERY_KEYS.admin.analytics()).toEqual(['admin', 'analytics', undefined]);
    expect(QUERY_KEYS.admin.revenue()).toEqual(['admin', 'revenue', undefined]);
    expect(QUERY_KEYS.admin.featureToggles()).toEqual(['admin', 'feature-toggles']);
    expect(QUERY_KEYS.liveClasses.list()).toEqual(['live-classes', undefined]);
    expect(QUERY_KEYS.liveClasses.detail('lc1')).toEqual(['live-classes', 'lc1']);
    expect(QUERY_KEYS.ai.chat('s1')).toEqual(['ai', 'chat', 's1']);
    expect(QUERY_KEYS.ai.chat()).toEqual(['ai', 'chat', undefined]);
  });

  it('exposes storage keys and misc constants', () => {
    expect(STORAGE_KEYS.theme).toBe('theme');
    expect(BREAKPOINTS.md).toBe(768);
    expect(DEFAULT_PAGE_SIZE).toBe(12);
    expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    expect(ACCEPTED_IMAGE_TYPES).toContain('image/jpeg');
    expect(ACCEPTED_VIDEO_TYPES).toContain('video/mp4');
  });
});
