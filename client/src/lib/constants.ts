export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  OAUTH_CALLBACK: '/auth/callback',
  DASHBOARD: '/dashboard',
  COURSES: '/courses',
  COURSE_DETAIL: (id: string) => `/courses/${id}`,
  COURSE_PLAYER: (id: string) => `/courses/${id}/learn`,
  INSTRUCTOR_DASHBOARD: '/instructor',
  INSTRUCTOR_CREATE_COURSE: '/instructor/courses/create',
  INSTRUCTOR_EDIT_COURSE: (id: string) => `/instructor/courses/${id}/edit`,
  ADMIN_DASHBOARD: '/admin',
} as const;

export const ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
} as const;
