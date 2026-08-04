import express, { Express } from 'express';
import request from 'supertest';
import { authenticate } from '../../../src/middlewares/auth.middleware';
import { authorize } from '../../../src/middlewares/authorize.middleware';
import { generateAccessToken } from '../../../src/utils/generateToken';
import { User } from '../../../src/models/user.model';
import { RevokedToken } from '../../../src/models/revokedToken.model';
import { Role } from '../../../src/constants/roles';
import { MESSAGES } from '../../../src/constants/messages';

vi.mock('../../../src/models/user.model', () => ({
  User: { findById: vi.fn() },
}));

vi.mock('../../../src/models/revokedToken.model', () => ({
  RevokedToken: { findOne: vi.fn() },
}));

const userId = '507f1f77bcf86cd799439011';

function tokenFor(role: Role, version = 1): string {
  return generateAccessToken({ userId, email: `${role}@example.com`, role, tokenVersion: version });
}

function setupAuthenticatedUser(overrides: Partial<{ isActive: boolean; tokenVersion: number }> = {}): void {
  vi.mocked(User.findById as never).mockResolvedValue({
    _id: userId,
    isActive: true,
    tokenVersion: 1,
    ...overrides,
  });
  vi.mocked(RevokedToken.findOne as never).mockResolvedValue(null);
}

function buildApp(): Express {
  const app = express();
  app.get('/student-only', authenticate, authorize('student'), (_req, res) => res.status(200).json({ ok: true }));
  app.get(
    '/instructor-only',
    authenticate,
    authorize('instructor', 'admin'),
    (_req, res) => res.status(200).json({ ok: true }),
  );
  app.get('/admin-only', authenticate, authorize('admin'), (_req, res) => res.status(200).json({ ok: true }));

  app.use((err: any, _req: unknown, res: any, _next: unknown) => {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  });

  return app;
}

describe('RBAC + authentication at the route level', () => {
  const app = buildApp();

  beforeEach(() => vi.clearAllMocks());

  it('rejects requests without a bearer token', async () => {
    const res = await request(app).get('/student-only');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: MESSAGES.ERROR.TOKEN_REQUIRED });
  });

  it('rejects an invalid token', async () => {
    const res = await request(app).get('/student-only').set('Authorization', 'Bearer garbage');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: MESSAGES.ERROR.INVALID_TOKEN });
  });

  it('rejects a revoked token', async () => {
    setupAuthenticatedUser();
    vi.mocked(RevokedToken.findOne as never).mockResolvedValue({ jti: 'revoked-jti' });

    const res = await request(app).get('/student-only').set('Authorization', `Bearer ${tokenFor('student')}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe(MESSAGES.ERROR.SESSION_EXPIRED);
  });

  it('rejects an inactive user', async () => {
    setupAuthenticatedUser({ isActive: false });

    const res = await request(app).get('/student-only').set('Authorization', `Bearer ${tokenFor('student')}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe(MESSAGES.ERROR.UNAUTHORIZED);
  });

  it('rejects a stale token after the token version is bumped', async () => {
    setupAuthenticatedUser({ tokenVersion: 2 });

    const res = await request(app).get('/student-only').set('Authorization', `Bearer ${tokenFor('student', 1)}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe(MESSAGES.ERROR.SESSION_EXPIRED);
  });

  it('allows a student on a student-only route', async () => {
    setupAuthenticatedUser();
    const res = await request(app).get('/student-only').set('Authorization', `Bearer ${tokenFor('student')}`);

    expect(res.status).toBe(200);
  });

  it('denies a student on an instructor-only route (403)', async () => {
    setupAuthenticatedUser();
    const res = await request(app).get('/instructor-only').set('Authorization', `Bearer ${tokenFor('student')}`);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: MESSAGES.ERROR.FORBIDDEN });
  });

  it('denies a student on an admin-only route (403)', async () => {
    setupAuthenticatedUser();
    const res = await request(app).get('/admin-only').set('Authorization', `Bearer ${tokenFor('student')}`);

    expect(res.status).toBe(403);
  });

  it('denies an instructor on a student-only route (403)', async () => {
    setupAuthenticatedUser();
    const res = await request(app).get('/student-only').set('Authorization', `Bearer ${tokenFor('instructor')}`);

    expect(res.status).toBe(403);
  });

  it('allows an instructor on an instructor-only route', async () => {
    setupAuthenticatedUser();
    const res = await request(app).get('/instructor-only').set('Authorization', `Bearer ${tokenFor('instructor')}`);

    expect(res.status).toBe(200);
  });

  it('allows an admin on an instructor-only route', async () => {
    setupAuthenticatedUser();
    const res = await request(app).get('/instructor-only').set('Authorization', `Bearer ${tokenFor('admin')}`);

    expect(res.status).toBe(200);
  });

  it('allows an admin on an admin-only route', async () => {
    setupAuthenticatedUser();
    const res = await request(app).get('/admin-only').set('Authorization', `Bearer ${tokenFor('admin')}`);

    expect(res.status).toBe(200);
  });
});
