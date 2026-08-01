import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request } from 'express';
import { env } from '../config/env';

const standardMessage = {
  success: false,
  message: 'Too many requests. Please try again later.',
};

const defaultKeyGenerator = (req: Request): string => req.ip || 'unknown';

function emailIpKeyGenerator(req: Request): string {
  const ip = req.ip || 'unknown';
  const email = (req.body?.email as string) || '';
  return `${email}_${ip}`;
}

function createAuthLimiter(
  windowMs: number,
  max: number,
  keyGenerator?: (req: Request) => string,
): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    max,
    message: standardMessage,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || defaultKeyGenerator,
  });
}

export const globalRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  message: standardMessage,
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = createAuthLimiter(15 * 60 * 1000, 5);
export const registerLimiter = createAuthLimiter(60 * 60 * 1000, 3);
export const forgotPasswordLimiter = createAuthLimiter(60 * 60 * 1000, 3, emailIpKeyGenerator);
export const resetPasswordLimiter = createAuthLimiter(60 * 60 * 1000, 5);
export const verifyEmailLimiter = createAuthLimiter(60 * 60 * 1000, 5);
export const resendOTPLimiter = createAuthLimiter(15 * 60 * 1000, 3);
export const refreshTokenLimiter = createAuthLimiter(15 * 60 * 1000, 20);
export const googleLoginLimiter = createAuthLimiter(15 * 60 * 1000, 10);
export const zoomWebhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: standardMessage,
  standardHeaders: true,
  legacyHeaders: false,
});
