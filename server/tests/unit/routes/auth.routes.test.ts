import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import authRoutes from '../../../src/routes/auth.routes';
import { errorHandler } from '../../../src/middlewares/errorHandler.middleware';
import { authService } from '../../../src/services/auth.service';
import { User } from '../../../src/models/user.model';
import { RevokedToken } from '../../../src/models/revokedToken.model';
import { generateAccessToken } from '../../../src/utils/generateToken';
import { ApiError } from '../../../src/utils/ApiError';
import { MESSAGES } from '../../../src/constants/messages';
import { HTTP_STATUS } from '../../../src/constants/httpStatus';

vi.mock('../../../src/services/auth.service', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    googleAuthWithCredential: vi.fn(),
    sendVerificationOTP: vi.fn(),
    verifyEmail: vi.fn(),
    refreshToken: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    logout: vi.fn(),
    logoutAllDevices: vi.fn(),
  },
}));

vi.mock('../../../src/middlewares/rateLimiter.middleware', () => ({
  loginLimiter: (req: unknown, res: unknown, next: () => void) => next(),
  registerLimiter: (req: unknown, res: unknown, next: () => void) => next(),
  forgotPasswordLimiter: (req: unknown, res: unknown, next: () => void) => next(),
  resetPasswordLimiter: (req: unknown, res: unknown, next: () => void) => next(),
  verifyEmailLimiter: (req: unknown, res: unknown, next: () => void) => next(),
  resendOTPLimiter: (req: unknown, res: unknown, next: () => void) => next(),
  refreshTokenLimiter: (req: unknown, res: unknown, next: () => void) => next(),
  googleLoginLimiter: (req: unknown, res: unknown, next: () => void) => next(),
}));

vi.mock('../../../src/models/user.model', () => ({
  User: { findById: vi.fn() },
}));

vi.mock('../../../src/models/revokedToken.model', () => ({
  RevokedToken: { findOne: vi.fn() },
}));

const service = vi.mocked(authService);

const userId = '507f1f77bcf86cd799439011';
const user = { _id: userId, name: 'Jane', email: 'jane@example.com', role: 'student' };
const accessToken = 'access-token';
const refreshTokenValue = 'refresh-token';

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

describe('auth routes (API-level)', () => {
  const app = buildApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('returns 201 and the created user on success', async () => {
      vi.mocked(service.register).mockResolvedValue({ user });
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Jane',
        email: 'jane@example.com',
        password: 'StrongPass1',
      });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body).toMatchObject({
        success: true,
        message: MESSAGES.AUTH.REGISTER_SUCCESS,
        data: { _id: userId },
      });
      expect(service.register).toHaveBeenCalledWith('Jane', 'jane@example.com', 'StrongPass1');
    });

    it('returns 409 when the email already exists', async () => {
      vi.mocked(service.register).mockRejectedValue(ApiError.conflict(MESSAGES.ERROR.EMAIL_EXISTS));
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Jane',
        email: 'jane@example.com',
        password: 'StrongPass1',
      });

      expect(res.status).toBe(HTTP_STATUS.CONFLICT);
      expect(res.body).toEqual({ success: false, message: MESSAGES.ERROR.EMAIL_EXISTS });
    });

    it('returns 400 for an invalid email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Jane',
        email: 'not-an-email',
        password: 'StrongPass1',
      });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email address');
      expect(service.register).not.toHaveBeenCalled();
    });

    it('returns 400 for a weak password', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Jane',
        email: 'jane@example.com',
        password: 'weakpass',
      });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/at least one (uppercase|lowercase) letter|at least one number/);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ email: 'jane@example.com' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const loginBody = { email: 'jane@example.com', password: 'StrongPass1' };

    it('returns 200 with tokens and a secure refresh cookie', async () => {
      vi.mocked(service.login).mockResolvedValue({ user, accessToken, refreshToken: refreshTokenValue });
      const res = await request(app).post('/api/v1/auth/login').send(loginBody);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body).toEqual({
        success: true,
        message: MESSAGES.AUTH.LOGIN_SUCCESS,
        data: { user, accessToken, refreshToken: refreshTokenValue },
      });

      const setCookie = res.headers['set-cookie'] as unknown as string[];
      const refreshCookie = setCookie.find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
      expect(refreshCookie).toContain('SameSite=Strict');
      expect(refreshCookie).toContain('Path=/api/v1/auth');
      expect(refreshCookie).toContain('Max-Age=604800');
      expect(refreshCookie).not.toContain('Secure');
    });

    it('returns 401 for invalid credentials', async () => {
      vi.mocked(service.login).mockRejectedValue(ApiError.unauthorized(MESSAGES.ERROR.INVALID_CREDENTIALS));
      const res = await request(app).post('/api/v1/auth/login').send(loginBody);

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body).toEqual({ success: false, message: MESSAGES.ERROR.INVALID_CREDENTIALS });
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('returns 401 for an unverified email', async () => {
      vi.mocked(service.login).mockRejectedValue(ApiError.unauthorized(MESSAGES.ERROR.EMAIL_NOT_VERIFIED));
      const res = await request(app).post('/api/v1/auth/login').send(loginBody);

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.message).toBe(MESSAGES.ERROR.EMAIL_NOT_VERIFIED);
    });

    it('returns 403 for a disabled account', async () => {
      vi.mocked(service.login).mockRejectedValue(ApiError.forbidden(MESSAGES.ERROR.ACCOUNT_DISABLED));
      const res = await request(app).post('/api/v1/auth/login').send(loginBody);

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.message).toBe(MESSAGES.ERROR.ACCOUNT_DISABLED);
    });

    it('returns 400 for a malformed email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'jane', password: 'StrongPass1' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(service.login).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('rotates tokens when the refresh token is in the cookie', async () => {
      const newAccess = 'new-access';
      const newRefresh = 'new-refresh';
      vi.mocked(service.refreshToken).mockResolvedValue({ accessToken: newAccess, refreshToken: newRefresh });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshTokenValue}`]);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body).toEqual({
        success: true,
        message: MESSAGES.AUTH.TOKEN_REFRESHED,
        data: { accessToken: newAccess, refreshToken: newRefresh },
      });
      const setCookie = res.headers['set-cookie'] as unknown as string[];
      expect(setCookie.find((c) => c.startsWith('refreshToken=new-refresh'))).toBeDefined();
    });

    it('accepts the refresh token in the request body', async () => {
      vi.mocked(service.refreshToken).mockResolvedValue({ accessToken, refreshToken: refreshTokenValue });
      const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: refreshTokenValue });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(service.refreshToken).toHaveBeenCalledWith(refreshTokenValue, expect.any(Object));
    });

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).post('/api/v1/auth/refresh');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body).toEqual({ success: true, message: MESSAGES.ERROR.TOKEN_REQUIRED, data: null });
      expect(service.refreshToken).not.toHaveBeenCalled();
    });

    it('returns 401 for an invalid refresh token', async () => {
      vi.mocked(service.refreshToken).mockRejectedValue(ApiError.unauthorized(MESSAGES.ERROR.INVALID_REFRESH_TOKEN));
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshTokenValue}`]);

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body).toEqual({ success: false, message: MESSAGES.ERROR.INVALID_REFRESH_TOKEN });
    });

    it('returns 401 with session expired on token reuse', async () => {
      vi.mocked(service.refreshToken).mockRejectedValue(ApiError.unauthorized(MESSAGES.ERROR.SESSION_EXPIRED));
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshTokenValue}`]);

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.message).toBe(MESSAGES.ERROR.SESSION_EXPIRED);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/v1/auth/logout');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body).toEqual({ success: false, message: MESSAGES.ERROR.TOKEN_REQUIRED });
      expect(service.logout).not.toHaveBeenCalled();
    });

    it('revokes the session and clears the cookie', async () => {
      const token = generateAccessToken({ userId, email: 'jane@example.com', role: 'student', tokenVersion: 1 });
      vi.mocked(User.findById as never).mockResolvedValue({ _id: userId, isActive: true, tokenVersion: 1 });
      vi.mocked(RevokedToken.findOne as never).mockResolvedValue(null);
      vi.mocked(service.logout).mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', [`refreshToken=${refreshTokenValue}`])
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body).toEqual({ success: true, message: MESSAGES.AUTH.LOGOUT_SUCCESS, data: null });
      expect(service.logout).toHaveBeenCalledWith(refreshTokenValue, userId, token);

      const setCookie = res.headers['set-cookie'] as unknown as string[];
      const clearedCookie = setCookie.find((c) => c.startsWith('refreshToken='));
      expect(clearedCookie).toContain('HttpOnly');
      expect(clearedCookie).toContain('SameSite=Strict');
      expect(clearedCookie).toContain('Path=/api/v1/auth');
      expect(clearedCookie).toMatch(/Expires=Thu, 01 Jan 1970/);
    });

    it('rejects an invalid bearer token', async () => {
      const res = await request(app).post('/api/v1/auth/logout').set('Authorization', 'Bearer garbage-token');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout-all', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/v1/auth/logout-all');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('revokes all sessions when authenticated', async () => {
      const token = generateAccessToken({ userId, email: 'jane@example.com', role: 'student', tokenVersion: 1 });
      vi.mocked(User.findById as never).mockResolvedValue({ _id: userId, isActive: true, tokenVersion: 1 });
      vi.mocked(RevokedToken.findOne as never).mockResolvedValue(null);
      vi.mocked(service.logoutAllDevices).mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body).toEqual({ success: true, message: MESSAGES.AUTH.LOGOUT_SUCCESS, data: null });
      expect(service.logoutAllDevices).toHaveBeenCalledWith(userId, token);
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('returns 200 even for an unknown email (no enumeration)', async () => {
      vi.mocked(service.forgotPassword).mockResolvedValue(undefined);
      const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'nobody@example.com' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body).toEqual({ success: true, message: MESSAGES.AUTH.PASSWORD_RESET_LINK_SENT, data: null });
    });

    it('returns 400 for an invalid email', async () => {
      const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'nope' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(service.forgotPassword).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('returns 200 on success', async () => {
      vi.mocked(service.resetPassword).mockResolvedValue(undefined);
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'reset-token', password: 'NewPass1' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body).toEqual({ success: true, message: MESSAGES.AUTH.PASSWORD_RESET_SUCCESS, data: null });
    });

    it('returns 400 for an invalid or expired token', async () => {
      vi.mocked(service.resetPassword).mockRejectedValue(ApiError.badRequest(MESSAGES.ERROR.INVALID_TOKEN));
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'stale-token', password: 'NewPass1' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body).toEqual({ success: false, message: MESSAGES.ERROR.INVALID_TOKEN });
    });

    it('returns 400 for a weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'reset-token', password: 'weak' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/send-otp', () => {
    it('returns 200 on success', async () => {
      vi.mocked(service.sendVerificationOTP).mockResolvedValue(undefined);
      const res = await request(app).post('/api/v1/auth/send-otp').send({ email: 'jane@example.com' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body).toEqual({ success: true, message: MESSAGES.AUTH.VERIFICATION_OTP_SENT, data: null });
    });

    it('returns 400 for an invalid email', async () => {
      const res = await request(app).post('/api/v1/auth/send-otp').send({ email: 'bad' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('POST /api/v1/auth/verify-email', () => {
    it('returns 200 with an auth session and a refresh cookie', async () => {
      const session = { user, accessToken, refreshToken: refreshTokenValue };
      vi.mocked(service.verifyEmail).mockResolvedValue(session);
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ email: 'jane@example.com', otp: '123456' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body).toEqual({
        success: true,
        message: MESSAGES.AUTH.EMAIL_VERIFIED,
        data: session,
      });

      const setCookie = res.headers['set-cookie'] as unknown as string[];
      const refreshCookie = setCookie.find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
    });

    it('returns 400 for an invalid OTP', async () => {
      vi.mocked(service.verifyEmail).mockRejectedValue(ApiError.badRequest(MESSAGES.ERROR.INVALID_OTP));
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ email: 'jane@example.com', otp: '111111' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.message).toBe(MESSAGES.ERROR.INVALID_OTP);
    });

    it('returns 400 for a malformed OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ email: 'jane@example.com', otp: '12' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(service.verifyEmail).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/google', () => {
    it('returns 200 with tokens and a refresh cookie', async () => {
      vi.mocked(service.googleAuthWithCredential).mockResolvedValue({
        user,
        accessToken,
        refreshToken: refreshTokenValue,
      });
      const res = await request(app).post('/api/v1/auth/google').send({ credential: 'google-id-token' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body).toMatchObject({ success: true, message: MESSAGES.AUTH.GOOGLE_AUTH_SUCCESS });
      const setCookie = res.headers['set-cookie'] as unknown as string[];
      expect(setCookie.find((c) => c.startsWith('refreshToken='))).toContain('HttpOnly');
    });

    it('returns 401 for an invalid credential', async () => {
      vi.mocked(service.googleAuthWithCredential).mockRejectedValue(
        ApiError.unauthorized(MESSAGES.ERROR.INVALID_TOKEN),
      );
      const res = await request(app).post('/api/v1/auth/google').send({ credential: 'bad-credential' });

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when the credential is missing', async () => {
      const res = await request(app).post('/api/v1/auth/google').send({});

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(service.googleAuthWithCredential).not.toHaveBeenCalled();
    });
  });
});
