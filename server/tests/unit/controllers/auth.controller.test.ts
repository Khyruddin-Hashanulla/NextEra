import { authService } from '../../../src/services/auth.service';
import {
  register,
  login,
  googleAuth,
  sendOTP,
  verifyEmail,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  logoutAllDevices,
} from '../../../src/controllers/auth.controller';
import { ApiError } from '../../../src/utils/ApiError';
import { MESSAGES } from '../../../src/constants/messages';
import { HTTP_STATUS } from '../../../src/constants/httpStatus';
import { mockRequest, mockResponse, mockNext, MockResponse } from '../../helpers/requestHelpers';

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

const service = vi.mocked(authService);

const user = { _id: '507f1f77bcf86cd799439011', name: 'Jane', email: 'jane@example.com', role: 'student' };
const accessToken = 'access-token';
const refreshTokenValue = 'refresh-token';

const deviceInfo = { userAgent: 'vitest', ip: '127.0.0.1' };

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('auth.controller', () => {
  let res: MockResponse;

  beforeEach(() => {
    res = mockResponse();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('returns 201 with the created user', async () => {
      vi.mocked(service.register).mockResolvedValue({ user });
      const req = mockRequest({ body: { name: 'Jane', email: 'jane@example.com', password: 'StrongPass1' } });

      await register(req, res as never, vi.fn());

      expect(service.register).toHaveBeenCalledWith('Jane', 'jane@example.com', 'StrongPass1');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: MESSAGES.AUTH.REGISTER_SUCCESS,
        data: user,
      });
    });

    it('forwards errors from the service to next', async () => {
      const error = ApiError.conflict(MESSAGES.ERROR.EMAIL_EXISTS);
      vi.mocked(service.register).mockRejectedValue(error);
      const next = mockNext();
      const req = mockRequest({ body: { name: 'Jane', email: 'jane@example.com', password: 'StrongPass1' } });

      await register(req, res as never, next);
      await flushMicrotasks();

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns 200 with tokens and sets the refresh cookie', async () => {
      vi.mocked(service.login).mockResolvedValue({ user, accessToken, refreshToken: refreshTokenValue });
      const req = mockRequest({
        body: { email: 'jane@example.com', password: 'StrongPass1' },
        headers: { 'user-agent': 'vitest' },
        ip: '127.0.0.1',
      });

      await login(req, res as never, vi.fn());

      expect(service.login).toHaveBeenCalledWith('jane@example.com', 'StrongPass1', deviceInfo);
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', refreshTokenValue, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: MESSAGES.AUTH.LOGIN_SUCCESS,
        data: { user, accessToken, refreshToken: refreshTokenValue },
      });
    });

    it('forwards invalid-credentials errors to next', async () => {
      const error = ApiError.unauthorized(MESSAGES.ERROR.INVALID_CREDENTIALS);
      vi.mocked(service.login).mockRejectedValue(error);
      const next = mockNext();

      await login(mockRequest({ ip: '127.0.0.1' }) as never, res as never, next);
      await flushMicrotasks();

      expect(next).toHaveBeenCalledWith(error);
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe('googleAuth', () => {
    it('returns 200 with tokens and sets the refresh cookie', async () => {
      vi.mocked(service.googleAuthWithCredential).mockResolvedValue({
        user,
        accessToken,
        refreshToken: refreshTokenValue,
      });
      const req = mockRequest({
        body: { credential: 'google-id-token' },
        headers: { 'user-agent': 'vitest' },
        ip: '127.0.0.1',
      });

      await googleAuth(req, res as never, vi.fn());

      expect(service.googleAuthWithCredential).toHaveBeenCalledWith('google-id-token', deviceInfo);
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', refreshTokenValue, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: MESSAGES.AUTH.GOOGLE_AUTH_SUCCESS,
        data: { user, accessToken, refreshToken: refreshTokenValue },
      });
    });

    it('forwards invalid-credential errors to next', async () => {
      const error = ApiError.unauthorized(MESSAGES.ERROR.INVALID_TOKEN);
      vi.mocked(service.googleAuthWithCredential).mockRejectedValue(error);
      const next = mockNext();

      await googleAuth(mockRequest({ ip: '127.0.0.1' }) as never, res as never, next);
      await flushMicrotasks();

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('sendOTP', () => {
    it('returns 200 with a null payload', async () => {
      await sendOTP(mockRequest({ body: { email: 'jane@example.com' } }) as never, res as never, vi.fn());

      expect(service.sendVerificationOTP).toHaveBeenCalledWith('jane@example.com');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: MESSAGES.AUTH.VERIFICATION_OTP_SENT,
        data: null,
      });
    });
  });

  describe('verifyEmail', () => {
    it('marks verified, returns tokens and sets the refresh cookie', async () => {
      vi.mocked(service.verifyEmail).mockResolvedValue({ user, accessToken, refreshToken: refreshTokenValue });
      const req = mockRequest({
        body: { email: 'jane@example.com', otp: '123456' },
        headers: { 'user-agent': 'vitest' },
        ip: '127.0.0.1',
      });

      await verifyEmail(req, res as never, vi.fn());

      expect(service.verifyEmail).toHaveBeenCalledWith('jane@example.com', '123456', deviceInfo);
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', refreshTokenValue, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: MESSAGES.AUTH.EMAIL_VERIFIED,
        data: { user, accessToken, refreshToken: refreshTokenValue },
      });
    });

    it('forwards invalid-otp errors to next', async () => {
      const error = ApiError.badRequest(MESSAGES.ERROR.INVALID_OTP);
      vi.mocked(service.verifyEmail).mockRejectedValue(error);
      const next = mockNext();

      await verifyEmail(mockRequest({ ip: '127.0.0.1' }) as never, res as never, next);
      await flushMicrotasks();

      expect(next).toHaveBeenCalledWith(error);
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('returns 401 when no token is present', async () => {
      await refreshToken(mockRequest() as never, res as never, vi.fn());

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: MESSAGES.ERROR.TOKEN_REQUIRED,
        data: null,
      });
      expect(service.refreshToken).not.toHaveBeenCalled();
    });

    it('reads the token from the refresh cookie and rotates it', async () => {
      const newAccess = 'new-access';
      const newRefresh = 'new-refresh';
      vi.mocked(service.refreshToken).mockResolvedValue({ accessToken: newAccess, refreshToken: newRefresh });
      const req = mockRequest({
        cookies: { refreshToken: refreshTokenValue },
        headers: { 'user-agent': 'vitest' },
        ip: '127.0.0.1',
      });

      await refreshToken(req, res as never, vi.fn());

      expect(service.refreshToken).toHaveBeenCalledWith(refreshTokenValue, deviceInfo);
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', newRefresh, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: MESSAGES.AUTH.TOKEN_REFRESHED,
        data: { accessToken: newAccess, refreshToken: newRefresh },
      });
    });

    it('reads the token from the request body as a fallback', async () => {
      vi.mocked(service.refreshToken).mockResolvedValue({ accessToken, refreshToken: refreshTokenValue });

      await refreshToken(
        mockRequest({ body: { refreshToken: refreshTokenValue }, ip: '127.0.0.1' }) as never,
        res as never,
        vi.fn(),
      );

      expect(service.refreshToken).toHaveBeenCalledWith(refreshTokenValue, expect.any(Object));
    });

    it('forwards refresh-failure errors to next', async () => {
      const error = ApiError.unauthorized(MESSAGES.ERROR.INVALID_REFRESH_TOKEN);
      vi.mocked(service.refreshToken).mockRejectedValue(error);
      const next = mockNext();

      await refreshToken(
        mockRequest({ cookies: { refreshToken: refreshTokenValue }, ip: '127.0.0.1' }) as never,
        res as never,
        next,
      );
      await flushMicrotasks();

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('forgotPassword', () => {
    it('returns 200 with a null payload', async () => {
      await forgotPassword(mockRequest({ body: { email: 'jane@example.com' } }) as never, res as never, vi.fn());

      expect(service.forgotPassword).toHaveBeenCalledWith('jane@example.com');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: MESSAGES.AUTH.PASSWORD_RESET_LINK_SENT,
        data: null,
      });
    });
  });

  describe('resetPassword', () => {
    it('returns 200 on success', async () => {
      await resetPassword(
        mockRequest({ body: { token: 'reset-token', password: 'NewPass1' } }) as never,
        res as never,
        vi.fn(),
      );

      expect(service.resetPassword).toHaveBeenCalledWith('reset-token', 'NewPass1');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: MESSAGES.AUTH.PASSWORD_RESET_SUCCESS,
        data: null,
      });
    });

    it('forwards invalid-token errors to next', async () => {
      const error = ApiError.badRequest(MESSAGES.ERROR.INVALID_TOKEN);
      vi.mocked(service.resetPassword).mockRejectedValue(error);
      const next = mockNext();

      await resetPassword(
        mockRequest({ body: { token: 'bad', password: 'NewPass1' } }) as never,
        res as never,
        next,
      );
      await flushMicrotasks();

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('logout', () => {
    it('revokes the session and clears the cookie', async () => {
      const req = mockRequest({
        cookies: { refreshToken: refreshTokenValue },
        headers: { authorization: `Bearer ${accessToken}` },
        currentUser: { userId: user._id, email: user.email, role: 'student' },
      });

      await logout(req, res as never, vi.fn());

      expect(service.logout).toHaveBeenCalledWith(refreshTokenValue, user._id, accessToken);
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: MESSAGES.AUTH.LOGOUT_SUCCESS,
        data: null,
      });
    });

    it('skips service revocation when no refresh token is present', async () => {
      await logout(mockRequest() as never, res as never, vi.fn());

      expect(service.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    it('revokes the session with no access token when only a cookie is present', async () => {
      const req = mockRequest({
        cookies: { refreshToken: refreshTokenValue },
        currentUser: { userId: user._id, email: user.email, role: 'student' },
      });

      await logout(req, res as never, vi.fn());

      expect(service.logout).toHaveBeenCalledWith(refreshTokenValue, user._id, undefined);
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });
  });

  describe('logoutAllDevices', () => {
    it('revokes all sessions and clears the cookie', async () => {
      const req = mockRequest({
        headers: { authorization: `Bearer ${accessToken}` },
        currentUser: { userId: user._id, email: user.email, role: 'student' },
      });

      await logoutAllDevices(req, res as never, vi.fn());

      expect(service.logoutAllDevices).toHaveBeenCalledWith(user._id, accessToken);
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    it('still clears the cookie when no user is authenticated', async () => {
      await logoutAllDevices(mockRequest() as never, res as never, vi.fn());

      expect(service.logoutAllDevices).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
    });
  });
});
