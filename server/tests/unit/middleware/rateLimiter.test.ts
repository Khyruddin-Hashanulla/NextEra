import {
  globalRateLimiter,
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  verifyEmailLimiter,
  resendOTPLimiter,
  refreshTokenLimiter,
  googleLoginLimiter,
  zoomWebhookLimiter,
} from '../../../src/middlewares/rateLimiter.middleware';
import { env } from '../../../src/config/env';

vi.mock('express-rate-limit', () => ({
  default: vi.fn((options) => options),
}));

describe('rateLimiter middleware', () => {
  it('creates a global rate limiter with env window and max', () => {
    expect(globalRateLimiter).toEqual(
      expect.objectContaining({
        windowMs: env.rateLimitWindowMs,
        max: env.rateLimitMax,
        message: { success: false, message: 'Too many requests. Please try again later.' },
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
  });

  it('creates a login limiter with 5 requests per 15 minutes', () => {
    expect(loginLimiter.windowMs).toBe(15 * 60 * 1000);
    expect(loginLimiter.max).toBe(5);
  });

  it('creates a register limiter with 3 requests per hour', () => {
    expect(registerLimiter.windowMs).toBe(60 * 60 * 1000);
    expect(registerLimiter.max).toBe(3);
  });

  it('uses an email-ip key generator for the forgot password limiter', () => {
    const key = forgotPasswordLimiter.keyGenerator({ ip: '1.2.3.4', body: { email: 'a@b.com' } } as any);
    expect(key).toBe('a@b.com_1.2.3.4');
  });

  it('handles missing ip and email in the key generator', () => {
    const key = forgotPasswordLimiter.keyGenerator({ body: {} } as any);
    expect(key).toBe('_unknown');
  });

  it('uses the default ip key generator for other limiters', () => {
    expect(resetPasswordLimiter.keyGenerator({ ip: '9.9.9.9' } as any)).toBe('9.9.9.9');
    expect(resetPasswordLimiter.keyGenerator({} as any)).toBe('unknown');
  });

  it('creates the remaining limiters with correct windows', () => {
    expect(verifyEmailLimiter.windowMs).toBe(60 * 60 * 1000);
    expect(resendOTPLimiter.windowMs).toBe(15 * 60 * 1000);
    expect(refreshTokenLimiter.windowMs).toBe(15 * 60 * 1000);
    expect(googleLoginLimiter.windowMs).toBe(15 * 60 * 1000);
    expect(zoomWebhookLimiter.windowMs).toBe(15 * 60 * 1000);
    expect(zoomWebhookLimiter.max).toBe(100);
  });
});
