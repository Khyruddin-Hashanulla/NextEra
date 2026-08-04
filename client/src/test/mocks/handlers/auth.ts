import { http } from 'msw';
import { failure, jsonResponse, success } from '../helpers';
import { buildUserWithRole } from '@/test/factories';
import { TOKEN_KEYS } from '@/lib/constants';

const baseUser = buildUserWithRole('student', {
  _id: 'student-1',
  name: 'Student User',
  email: 'student@example.com',
  isEmailVerified: true,
});

const authPayload = (user: unknown = baseUser) => ({
  success: true,
  data: {
    user,
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  },
});

export const authHandlers = [
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    if (!body.email) return failure('Invalid credentials', 401);
    if (body.email === 'unverified@example.com') {
      return failure('Please verify your email before logging in.', 403);
    }
    if (body.email === 'locked@example.com') {
      return failure(
        'Your account is temporarily locked due to multiple failed login attempts. Please try again later.',
        423
      );
    }
    return jsonResponse(authPayload());
  }),

  http.post('/api/v1/auth/register', async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    if (!body.email) return failure('Email is required', 400);
    return success(baseUser);
  }),

  http.post('/api/v1/auth/google', () => jsonResponse(authPayload())),

  http.post('/api/v1/auth/send-otp', async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    if (!body.email) return failure('Email is required', 400);
    return success(null);
  }),

  http.post('/api/v1/auth/verify-email', async ({ request }) => {
    const body = (await request.json()) as { otp?: string };
    if (body.otp === '000000') return failure('Invalid OTP', 400);
    return jsonResponse(authPayload());
  }),

  http.post('/api/v1/auth/forgot-password', async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    if (!body.email) return failure('Email is required', 400);
    return success(null);
  }),

  http.post('/api/v1/auth/reset-password', async ({ request }) => {
    const body = (await request.json()) as { password?: string };
    if (!body.password) return failure('Password is required', 400);
    return success(null);
  }),

  http.post('/api/v1/auth/logout', () => success(null)),

  http.post('/api/v1/auth/refresh', async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string };
    if (!body.refreshToken) return failure('Refresh token required', 401);
    return jsonResponse({
      success: true,
      data: {
        accessToken: 'refreshed-access-token',
        refreshToken: 'refreshed-refresh-token',
      },
    });
  }),
];

export function authHeadersWithToken(headers: Headers) {
  const token = headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return false;
  return token !== TOKEN_KEYS.ACCESS_TOKEN;
}
