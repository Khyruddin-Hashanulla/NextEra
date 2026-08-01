import { doubleCsrf } from 'csrf-csrf';
import { env } from './env';

export const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => env.csrfSecret,
  getSessionIdentifier: () => 'nextera-lms-csrf',
  cookieName: 'csrf-token',
  cookieOptions: {
    httpOnly: false,
    sameSite: 'strict',
    secure: env.nodeEnv === 'production',
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'] as string | undefined,
  skipCsrfProtection: (req) => {
    return (
      req.path === '/payments/webhook/razorpay' ||
      req.path === '/live-classes/webhook/zoom' ||
      req.path === '/auth/refresh'
    );
  },
  errorConfig: {
    statusCode: 403,
    message: 'Invalid CSRF token',
    code: 'CSRF_TOKEN_INVALID',
  },
});
