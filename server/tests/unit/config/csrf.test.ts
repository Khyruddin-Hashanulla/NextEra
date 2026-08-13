import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { generateCsrfToken, doubleCsrfProtection } from '../../../src/config/csrf';

function buildApp(): Express {
  const app = express();
  app.use(cookieParser());
  app.use(doubleCsrfProtection);

  app.get('/test', (_req, res) => res.status(200).json({ ok: true }));
  app.post('/test', (_req, res) => res.status(200).json({ ok: true }));
  app.post('/auth/refresh', (_req, res) => res.status(200).json({ ok: true }));
  app.post('/payments/webhook/razorpay', (_req, res) => res.status(200).json({ ok: true }));
  app.post('/live-classes/webhook/zoom', (_req, res) => res.status(200).json({ ok: true }));

  app.use((err: any, _req: unknown, res: any, _next: unknown) => {
    res.status(err.statusCode || 403).json({ message: err.message, code: err.code });
  });

  return app;
}

describe('config/csrf', () => {
  const app = buildApp();

  it('ignores safe methods (GET)', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('skips protection for the refresh endpoint', async () => {
    const res = await request(app).post('/auth/refresh');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('skips protection for the razorpay webhook', async () => {
    const res = await request(app).post('/payments/webhook/razorpay');
    expect(res.status).toBe(200);
  });

  it('skips protection for the zoom webhook', async () => {
    const res = await request(app).post('/live-classes/webhook/zoom');
    expect(res.status).toBe(200);
  });

  it('rejects a POST without a CSRF token', async () => {
    const res = await request(app).post('/test');

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      message: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID',
    });
  });

  it('rejects a POST with a mismatched CSRF token', async () => {
    const res = await request(app).post('/test').set('Cookie', ['csrf-token=token-a']).set('X-CSRF-Token', 'token-b');

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CSRF_TOKEN_INVALID');
  });

  it('accepts a POST with a valid CSRF token pair', async () => {
    const token = generateCsrfToken({ cookies: {}, headers: {} } as never, { cookie: vi.fn() } as never);
    const res = await request(app)
      .post('/test')
      .set('Cookie', [`csrf-token=${token}`])
      .set('X-CSRF-Token', token);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('generates unique CSRF tokens and sets the cookie', () => {
    const firstRes = { cookie: vi.fn() };
    const tokenA = generateCsrfToken({ cookies: {}, headers: {} } as never, firstRes as never);
    const tokenB = generateCsrfToken({ cookies: {}, headers: {} } as never, { cookie: vi.fn() } as never);

    expect(tokenA).toMatch(/^[a-f0-9]+\.[a-f0-9]+$/);
    expect(tokenB).not.toBe(tokenA);
    expect(firstRes.cookie).toHaveBeenCalledWith('csrf-token', tokenA, expect.any(Object));
  });

  it('reuses an existing valid CSRF cookie instead of rotating it', () => {
    const existing = generateCsrfToken({ cookies: {}, headers: {} } as never, { cookie: vi.fn() } as never);
    const res = { cookie: vi.fn() };

    const reused = generateCsrfToken({ cookies: { 'csrf-token': existing }, headers: {} } as never, res as never);

    expect(reused).toBe(existing);
    expect(res.cookie).toHaveBeenCalledWith('csrf-token', existing, expect.any(Object));
  });
});
