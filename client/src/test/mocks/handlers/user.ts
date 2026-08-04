import { http } from 'msw';
import { failure, success } from '../helpers';
import { buildUserWithRole } from '@/test/factories';

const me = buildUserWithRole('student', {
  _id: 'student-1',
  name: 'Student User',
  email: 'student@example.com',
  isEmailVerified: true,
});

export const userHandlers = [
  http.get('/api/v1/users/me', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return failure('Unauthorized', 401);
    return success(me);
  }),

  http.put('/api/v1/users/me', async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return failure('Unauthorized', 401);
    const body = (await request.json()) as { name?: string };
    return success({ ...me, ...body });
  }),

  http.put('/api/v1/users/me/password', async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return failure('Unauthorized', 401);
    const body = (await request.json()) as { currentPassword?: string };
    if (!body.currentPassword) return failure('Current password is required', 400);
    return success(null);
  }),
];
