import { http } from 'msw';
import { failure, success } from '../helpers';
import { unreadNotification, readNotification } from '@/test/fixtures';

export const notificationHandlers = [
  http.get('/api/v1/student/notifications', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return failure('Unauthorized', 401);
    return success({
      notifications: [unreadNotification, readNotification],
      unreadCount: 1,
      total: 2,
    });
  }),

  http.put('/api/v1/student/notifications/:id/read', ({ request, params }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return failure('Unauthorized', 401);
    return success({ ...unreadNotification, _id: params.id, read: true });
  }),

  http.put('/api/v1/student/notifications/read-all', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return failure('Unauthorized', 401);
    return success({ success: true });
  }),
];
