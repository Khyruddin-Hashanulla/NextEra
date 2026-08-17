import { http } from 'msw';
import { jsonResponse, success, failure, networkError, delayedHandlers } from './helpers';
import { authHandlers } from './handlers/auth';
import { userHandlers } from './handlers/user';
import { courseHandlers } from './handlers/course';
import { categoryHandlers } from './handlers/category';
import { blogHandlers } from './handlers/blog';
import { notificationHandlers } from './handlers/notification';
import { paymentHandlers, failureHandlers, networkErrorHandlers } from './handlers/payment';
import { instructorHandlers } from './handlers/instructor';

export const baseHandlers = [
  http.get('/api/v1/csrf-token', () => {
    return success({ csrfToken: 'test-csrf-token' });
  }),
  http.get('/api/v1/health', () => {
    return success({ status: 'ok', timestamp: new Date().toISOString() });
  }),
  ...authHandlers,
  ...userHandlers,
  ...courseHandlers,
  ...categoryHandlers,
  ...blogHandlers,
  ...notificationHandlers,
  ...paymentHandlers,
  ...instructorHandlers,
];

export {
  jsonResponse,
  success,
  failure,
  networkError,
  delayedHandlers,
  authHandlers,
  userHandlers,
  courseHandlers,
  blogHandlers,
  notificationHandlers,
  paymentHandlers,
  instructorHandlers,
  failureHandlers,
  networkErrorHandlers,
};
