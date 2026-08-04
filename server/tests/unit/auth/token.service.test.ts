import { ApiError } from '../../../src/utils/ApiError';
import { MESSAGES } from '../../../src/constants/messages';
import { TokenService } from '../../../src/services/token.service';
import { User } from '../../../src/models/user.model';
import { Session } from '../../../src/models/session.model';
import { RevokedToken } from '../../../src/models/revokedToken.model';
import {
  generateAccessToken,
  generateOpaqueRefreshToken,
  hashRefreshToken,
} from '../../../src/utils/generateToken';

vi.mock('../../../src/models/user.model', () => ({
  User: { findById: vi.fn(), findByIdAndUpdate: vi.fn() },
}));

vi.mock('../../../src/models/session.model', () => ({
  Session: {
    create: vi.fn(),
    findOneAndDelete: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock('../../../src/models/revokedToken.model', () => ({
  RevokedToken: { create: vi.fn() },
}));

vi.mock('../../../src/utils/generateToken', () => ({
  generateAccessToken: vi.fn(),
  generateOpaqueRefreshToken: vi.fn(),
  hashRefreshToken: vi.fn(),
}));

const service = new TokenService();
const deviceInfo = { userAgent: 'vitest', ip: '127.0.0.1' };

describe('generateTokens', () => {
  afterEach(() => vi.clearAllMocks());

  it('creates a session and returns rotated tokens', async () => {
    vi.mocked(User.findById as never).mockResolvedValue({ tokenVersion: 3 });
    vi.mocked(generateAccessToken).mockReturnValue('access-1');
    vi.mocked(generateOpaqueRefreshToken).mockReturnValue('refresh-1');
    vi.mocked(hashRefreshToken).mockReturnValue('hashed-1');

    const result = await service.generateTokens('u1', 'a@b.com', 'student', deviceInfo);

    expect(result).toEqual({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    expect(generateAccessToken).toHaveBeenCalledWith({
      userId: 'u1',
      email: 'a@b.com',
      role: 'student',
      tokenVersion: 3,
    });
    expect(Session.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        refreshTokenHash: 'hashed-1',
        userAgent: 'vitest',
        ipAddress: '127.0.0.1',
      }),
    );
  });

  it('defaults tokenVersion to 0 when the user is missing', async () => {
    vi.mocked(User.findById as never).mockResolvedValue(null);
    vi.mocked(generateOpaqueRefreshToken).mockReturnValue('refresh-1');
    await service.generateTokens('u1', 'a@b.com', 'student', deviceInfo);
    expect(generateAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({ tokenVersion: 0 }),
    );
  });
});

describe('refreshAccessToken', () => {
  afterEach(() => vi.clearAllMocks());

  const session = {
    _id: { toString: () => 's1' },
    userId: 'u1',
    refreshTokenHash: 'hashed',
  };

  it('rotates the session for a valid refresh token', async () => {
    vi.mocked(hashRefreshToken).mockReturnValue('hashed');
    vi.mocked(Session.findOneAndDelete as never).mockResolvedValue(session);
    vi.mocked(User.findById as never).mockResolvedValue({
      _id: { toString: () => 'u1' },
      email: 'a@b.com',
      role: 'student',
      isActive: true,
      tokenVersion: 2,
    });
    vi.mocked(generateAccessToken).mockReturnValue('access-2');
    vi.mocked(generateOpaqueRefreshToken).mockReturnValue('refresh-2');
    vi.mocked(hashRefreshToken).mockReturnValueOnce('hashed').mockReturnValue('hashed-2');

    const result = await service.refreshAccessToken('token', deviceInfo);

    expect(result).toEqual({ accessToken: 'access-2', refreshToken: 'refresh-2' });
    expect(Session.findOneAndDelete).toHaveBeenCalledWith({
      refreshTokenHash: 'hashed',
      expiresAt: { $gt: expect.any(Date) },
      isRevoked: false,
    });
    expect(Session.create).toHaveBeenCalledWith(
      expect.objectContaining({ refreshTokenHash: 'hashed-2', userAgent: 'vitest' }),
    );
  });

  it('throws SESSION_EXPIRED and revokes sessions on reuse detection', async () => {
    vi.mocked(hashRefreshToken).mockReturnValue('hashed');
    vi.mocked(Session.findOneAndDelete as never).mockResolvedValue(null);
    vi.mocked(Session.findOne as never).mockResolvedValue({
      _id: { toString: () => 's2' },
      userId: { toString: () => 'u2' },
    });

    await expect(service.refreshAccessToken('reused', deviceInfo)).rejects.toMatchObject({
      statusCode: 401,
      message: MESSAGES.ERROR.SESSION_EXPIRED,
    });
    expect(Session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ isRevoked: false }),
      { isRevoked: true },
    );
  });

  it('throws INVALID_REFRESH_TOKEN when no session exists', async () => {
    vi.mocked(hashRefreshToken).mockReturnValue('hashed');
    vi.mocked(Session.findOneAndDelete as never).mockResolvedValue(null);
    vi.mocked(Session.findOne as never).mockResolvedValue(null);

    await expect(service.refreshAccessToken('unknown', deviceInfo)).rejects.toMatchObject({
      statusCode: 401,
      message: MESSAGES.ERROR.INVALID_REFRESH_TOKEN,
    });
  });

  it('throws UNAUTHORIZED when the user is gone or inactive', async () => {
    vi.mocked(hashRefreshToken).mockReturnValue('hashed');
    vi.mocked(Session.findOneAndDelete as never).mockResolvedValue(session);
    vi.mocked(User.findById as never).mockResolvedValue(null);

    await expect(service.refreshAccessToken('token', deviceInfo)).rejects.toMatchObject({
      statusCode: 401,
      message: MESSAGES.ERROR.UNAUTHORIZED,
    });
  });

  it('defaults tokenVersion to 0 when the user has no version', async () => {
    vi.mocked(hashRefreshToken).mockReturnValue('hashed');
    vi.mocked(Session.findOneAndDelete as never).mockResolvedValue(session);
    vi.mocked(User.findById as never).mockResolvedValue({
      _id: { toString: () => 'u1' },
      email: 'a@b.com',
      role: 'student',
      isActive: true,
    });
    vi.mocked(generateAccessToken).mockReturnValue('access-3');
    vi.mocked(generateOpaqueRefreshToken).mockReturnValue('refresh-3');

    await service.refreshAccessToken('token', deviceInfo);

    expect(generateAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({ tokenVersion: 0 }),
    );
  });
});

describe('revokeSession / revokeAllSessions / revokeAccessToken / revokeAllAccessTokens', () => {
  afterEach(() => vi.clearAllMocks());

  it('revokes a single session by refresh token hash', async () => {
    vi.mocked(hashRefreshToken).mockReturnValue('hashed');
    vi.mocked(Session.findOneAndUpdate as never).mockResolvedValue({ _id: { toString: () => 's1' } });
    await service.revokeSession('token', 'u1');
    expect(Session.findOneAndUpdate).toHaveBeenCalledWith(
      { refreshTokenHash: 'hashed', userId: 'u1', isRevoked: false },
      { isRevoked: true },
    );
  });

  it('revokes all non-revoked sessions for a user', async () => {
    vi.mocked(Session.updateMany as never).mockResolvedValue({ modifiedCount: 2 });
    await service.revokeAllSessions('u1');
    expect(Session.updateMany).toHaveBeenCalledWith(
      { userId: 'u1', isRevoked: false },
      { isRevoked: true },
    );
  });

  it('creates a RevokedToken entry for an access token', async () => {
    const expires = new Date();
    await service.revokeAccessToken('jti-1', 'u1', expires);
    expect(RevokedToken.create).toHaveBeenCalledWith({ jti: 'jti-1', userId: 'u1', expiresAt: expires });
  });

  it('increments tokenVersion to revoke all access tokens', async () => {
    vi.mocked(User.findByIdAndUpdate as never).mockResolvedValue({ tokenVersion: 4 });
    await service.revokeAllAccessTokens('u1');
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'u1',
      { $inc: { tokenVersion: 1 } },
      { new: true },
    );
  });

  it('still resolves when the user is missing for revokeAllAccessTokens', async () => {
    vi.mocked(User.findByIdAndUpdate as never).mockResolvedValue(null);
    await expect(service.revokeAllAccessTokens('u1')).resolves.toBeUndefined();
  });
});

describe('error typing', () => {
  it('exposes ApiError-typed failures', async () => {
    vi.mocked(hashRefreshToken).mockReturnValue('hashed');
    vi.mocked(Session.findOneAndDelete as never).mockResolvedValue(null);
    vi.mocked(Session.findOne as never).mockResolvedValue(null);
    try {
      await service.refreshAccessToken('x', deviceInfo);
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
    }
  });
});
