import express, { Express } from 'express';
import request from 'supertest';
import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  refreshTokenLimiter,
  googleLoginLimiter,
  razorpayWebhookLimiter,
} from '../../../src/middlewares/rateLimiter.middleware';

function buildApp(limiter: (req: any, res: any, next: () => void) => void): Express {
  const app = express();
  app.use(express.json());
  app.use('/protected', limiter);
  app.post('/protected', (_req, res) => res.status(200).json({ ok: true }));
  return app;
}

describe('rate limiting (functional)', () => {
  it('blocks the 6th login attempt with 429 and rate-limit headers', async () => {
    const app = buildApp(loginLimiter as any);
    const body = { email: 'jane@example.com', password: 'StrongPass1' };

    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/protected').send(body);
      expect(res.status).toBe(200);
    }

    const limited = await request(app).post('/protected').send(body);
    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
    expect(limited.headers['ratelimit-policy']).toBeDefined();
  });

  it('allows up to 3 registrations before throttling', async () => {
    const app = buildApp(registerLimiter as any);
    const body = { name: 'Jane', email: 'jane@example.com', password: 'StrongPass1' };

    for (let i = 0; i < 3; i++) {
      const res = await request(app).post('/protected').send(body);
      expect(res.status).toBe(200);
    }

    const limited = await request(app).post('/protected').send(body);
    expect(limited.status).toBe(429);
  });

  it('keys forgot-password throttling by email + IP', async () => {
    const app = buildApp(forgotPasswordLimiter as any);

    for (let i = 0; i < 3; i++) {
      const res = await request(app).post('/protected').send({ email: 'alice@example.com' });
      expect(res.status).toBe(200);
    }

    const limited = await request(app).post('/protected').send({ email: 'alice@example.com' });
    expect(limited.status).toBe(429);

    const other = await request(app).post('/protected').send({ email: 'bob@example.com' });
    expect(other.status).toBe(200);
  });

  it('does not throttle the refresh limiter under normal volume', async () => {
    const app = buildApp(refreshTokenLimiter as any);

    const res = await request(app).post('/protected').send({ refreshToken: 'x' });
    expect(res.status).toBe(200);
    expect(res.headers['ratelimit-policy']).toBeDefined();
  });

  it('does not throttle the google login limiter under normal volume', async () => {
    const app = buildApp(googleLoginLimiter as any);

    const res = await request(app).post('/protected').send({ credential: 'x' });
    expect(res.status).toBe(200);
  });

  it('throttles the razorpay webhook past 200 requests per window', async () => {
    const app = buildApp(razorpayWebhookLimiter as any);

    for (let i = 0; i < 200; i++) {
      const res = await request(app).post('/protected').send({ event: 'payment.captured' });
      expect(res.status).toBe(200);
    }

    const limited = await request(app).post('/protected').send({ event: 'payment.captured' });
    expect(limited.status).toBe(429);
    expect(limited.headers['ratelimit-policy']).toBeDefined();
  });
});
