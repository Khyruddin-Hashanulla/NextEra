import { ApiError } from '../../../src/utils/ApiError';
import { MESSAGES } from '../../../src/constants/messages';
import { authenticate } from '../../../src/middlewares/auth.middleware';
import { verifyAccessToken } from '../../../src/utils/generateToken';
import { User as UserModel } from '../../../src/models/user.model';
import { RevokedToken } from '../../../src/models/revokedToken.model';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

vi.mock('../../../src/utils/generateToken', () => ({
  verifyAccessToken: vi.fn(),
}));

vi.mock('../../../src/models/user.model', () => ({
  User: { findById: vi.fn() },
}));

vi.mock('../../../src/models/revokedToken.model', () => ({
  RevokedToken: { findOne: vi.fn() },
}));

const decoded = {
  userId: '507f1f77bcf86cd799439011',
  role: 'student' as const,
  email: 'student@example.com',
  jti: 'jti-123',
  tokenVersion: 1,
};

const userDoc = {
  _id: decoded.userId,
  isActive: true,
  tokenVersion: 1,
};

describe('authenticate middleware', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a missing authorization header', async () => {
    const { res, next } = runAuth(mockRequest({ headers: {} }));
    expect(next).toHaveBeenCalledOnce();
    const err = next.mock.calls[0][0] as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe(MESSAGES.ERROR.TOKEN_REQUIRED);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects a non-Bearer header', async () => {
    const { next } = runAuth(mockRequest({ headers: { authorization: 'Basic abc' } }));
    expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError);
  });

  it('rejects an invalid token', async () => {
    vi.mocked(verifyAccessToken).mockImplementation(() => {
      throw new Error('bad signature');
    });
    const { next } = runAuth(mockRequest({ headers: { authorization: 'Bearer abc' } }));
    const err = next.mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe(MESSAGES.ERROR.INVALID_TOKEN);
  });

  it('rejects a user that no longer exists', async () => {
    vi.mocked(verifyAccessToken).mockReturnValue(decoded);
    vi.mocked(UserModel.findById as never).mockResolvedValue(null);
    const { next, promise } = runAuth(authRequest());
    await promise;
    const err = next.mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe(MESSAGES.ERROR.UNAUTHORIZED);
  });

  it('rejects an inactive user', async () => {
    vi.mocked(verifyAccessToken).mockReturnValue(decoded);
    vi.mocked(UserModel.findById as never).mockResolvedValue({ ...userDoc, isActive: false });
    const { next, promise } = runAuth(authRequest());
    await promise;
    const err = next.mock.calls[0][0] as ApiError;
    expect(err.message).toBe(MESSAGES.ERROR.UNAUTHORIZED);
  });

  it('rejects a revoked jti', async () => {
    vi.mocked(verifyAccessToken).mockReturnValue(decoded);
    vi.mocked(UserModel.findById as never).mockResolvedValue(userDoc);
    vi.mocked(RevokedToken.findOne as never).mockResolvedValue({ _id: 'revoked' });
    const { next, promise } = runAuth(authRequest());
    await promise;
    const err = next.mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe(MESSAGES.ERROR.SESSION_EXPIRED);
  });

  it('rejects a stale token version', async () => {
    vi.mocked(verifyAccessToken).mockReturnValue({ ...decoded, tokenVersion: 1 });
    vi.mocked(UserModel.findById as never).mockResolvedValue({ ...userDoc, tokenVersion: 2 });
    vi.mocked(RevokedToken.findOne as never).mockResolvedValue(null);
    const { next, promise } = runAuth(authRequest());
    await promise;
    const err = next.mock.calls[0][0] as ApiError;
    expect(err.message).toBe(MESSAGES.ERROR.SESSION_EXPIRED);
  });

  it('does not check token version when absent on the token', async () => {
    const { tokenVersion, ...noVersion } = decoded;
    vi.mocked(verifyAccessToken).mockReturnValue(noVersion);
    vi.mocked(UserModel.findById as never).mockResolvedValue(userDoc);
    vi.mocked(RevokedToken.findOne as never).mockResolvedValue(null);
    const { req, next, promise } = runAuth(authRequest());
    await promise;
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeUndefined();
    expect(req.currentUser).toEqual(noVersion);
  });

  it('skips the revocation check when the token has no jti', async () => {
    const { jti, ...noJti } = decoded;
    vi.mocked(verifyAccessToken).mockReturnValue(noJti);
    vi.mocked(UserModel.findById as never).mockResolvedValue(userDoc);
    vi.mocked(RevokedToken.findOne as never).mockResolvedValue(null);
    const { req, next, promise } = runAuth(authRequest());
    await promise;
    expect(RevokedToken.findOne).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeUndefined();
    expect(req.currentUser).toEqual(noJti);
  });

  it('sets currentUser and proceeds on success', async () => {
    vi.mocked(verifyAccessToken).mockReturnValue(decoded);
    vi.mocked(UserModel.findById as never).mockResolvedValue(userDoc);
    vi.mocked(RevokedToken.findOne as never).mockResolvedValue(null);
    const { req, next, promise } = runAuth(authRequest());
    await promise;
    expect(UserModel.findById).toHaveBeenCalledWith(decoded.userId);
    expect(RevokedToken.findOne).toHaveBeenCalledWith({ jti: 'jti-123' });
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeUndefined();
    expect(req.currentUser).toEqual(decoded);
  });

  function authRequest() {
    return mockRequest({ headers: { authorization: 'Bearer real-token' } });
  }

  function runAuth(req: ReturnType<typeof mockRequest>) {
    const res = mockResponse();
    const next = mockNext();
    const promise = authenticate(req, res as never, next);
    return { req, res, next, promise };
  }
});
