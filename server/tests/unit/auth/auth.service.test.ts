import { ApiError } from '../../../src/utils/ApiError';
import { MESSAGES } from '../../../src/constants/messages';
import { authService } from '../../../src/services/auth.service';
import { User } from '../../../src/models/user.model';
import { OTPStore } from '../../../src/models/otpStore.model';
import { tokenService } from '../../../src/services/token.service';
import { emailService } from '../../../src/services/email.service';
import { generateOTP, verifyAccessToken } from '../../../src/utils/generateToken';
import { ROLES } from '../../../src/constants/roles';
import { buildUserDoc, studentUser, unverifiedUser, lockedUser } from '../../fixtures/users';

const oauthState = vi.hoisted(() => ({ instances: [] as any[] }));

vi.mock('../../../src/models/user.model', () => ({
  User: { findOne: vi.fn(), create: vi.fn(), findOneAndUpdate: vi.fn() },
}));

vi.mock('../../../src/models/otpStore.model', () => ({
  OTPStore: { create: vi.fn(), deleteMany: vi.fn(), findOne: vi.fn() },
}));

vi.mock('../../../src/services/token.service', () => ({
  tokenService: {
    generateTokens: vi.fn(),
    revokeSession: vi.fn(),
    revokeAccessToken: vi.fn(),
    revokeAllSessions: vi.fn(),
    revokeAllAccessTokens: vi.fn(),
    refreshAccessToken: vi.fn(),
  },
}));

vi.mock('../../../src/services/email.service', () => ({
  emailService: {
    sendVerificationOTP: vi.fn().mockResolvedValue(undefined),
    sendPasswordReset: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/utils/generateToken', () => ({
  generateOTP: vi.fn(),
  verifyAccessToken: vi.fn(),
}));

vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    constructor() {
      oauthState.instances.push(this);
    }
    verifyIdToken = vi.fn();
  },
}));

const deviceInfo = { userAgent: 'vitest', ip: '127.0.0.1' };

function getGoogleClient(): { verifyIdToken: ReturnType<typeof vi.fn> } {
  return oauthState.instances[0];
}

function mockFindOneUser(user: unknown): void {
  const query = Promise.resolve(user) as unknown as Promise<unknown> & {
    select: ReturnType<typeof vi.fn>;
  };
  query.select = vi.fn().mockReturnValue(Promise.resolve(user));
  vi.mocked(User.findOne as never).mockReturnValue(query);
}

beforeEach(() => {
  vi.mocked(emailService.sendVerificationOTP).mockResolvedValue(undefined);
  vi.mocked(emailService.sendPasswordReset).mockResolvedValue(undefined);
});

describe('register', () => {
  afterEach(() => vi.clearAllMocks());

  it('rejects an existing email', async () => {
    vi.mocked(User.findOne as never).mockResolvedValue(studentUser);
    await expect(authService.register('Jane', 'student@example.com', 'StrongPass1')).rejects.toMatchObject({
      statusCode: 409,
      message: MESSAGES.ERROR.EMAIL_EXISTS,
    });
    expect(User.create).not.toHaveBeenCalled();
  });

  it('creates a user without sending an OTP email', async () => {
    vi.mocked(User.findOne as never).mockResolvedValue(null);
    vi.mocked(User.create as never).mockResolvedValue(buildUserDoc({ email: 'new@example.com' }));

    const result = await authService.register('Jane', 'NEW@Example.com', 'StrongPass1');

    expect(User.create).toHaveBeenCalledWith({ name: 'Jane', email: 'new@example.com', password: 'StrongPass1' });
    expect(OTPStore.create).not.toHaveBeenCalled();
    expect(emailService.sendVerificationOTP).not.toHaveBeenCalled();
    expect(result.user.email).toBe('new@example.com');
  });
});

describe('sendVerificationOTP', () => {
  afterEach(() => vi.clearAllMocks());

  it('does nothing for unknown or already-verified users', async () => {
    vi.mocked(User.findOne as never).mockResolvedValue(null);
    await authService.sendVerificationOTP('x@y.com');
    expect(OTPStore.deleteMany).not.toHaveBeenCalled();
    expect(emailService.sendVerificationOTP).not.toHaveBeenCalled();
  });

  it('clears old OTPs, creates a new one and emails it', async () => {
    vi.mocked(User.findOne as never).mockResolvedValue(unverifiedUser);
    vi.mocked(generateOTP).mockReturnValue('111111');
    await authService.sendVerificationOTP('unverified@example.com');
    expect(OTPStore.deleteMany).toHaveBeenCalledWith({
      email: 'unverified@example.com',
      purpose: 'email_verification',
    });
    expect(OTPStore.create).toHaveBeenCalledWith(expect.objectContaining({ otp: '111111' }));
    expect(emailService.sendVerificationOTP).toHaveBeenCalled();
  });
});

describe('verifyEmail', () => {
  afterEach(() => vi.clearAllMocks());

  it('rejects an invalid or expired OTP', async () => {
    vi.mocked(OTPStore.findOne as never).mockResolvedValue(null);
    await expect(authService.verifyEmail('a@b.com', '000000', deviceInfo)).rejects.toMatchObject({
      statusCode: 400,
      message: MESSAGES.ERROR.INVALID_OTP,
    });
  });

  it('rejects when the user cannot be found', async () => {
    vi.mocked(OTPStore.findOne as never).mockResolvedValue({ email: 'a@b.com', otp: '123456' });
    vi.mocked(User.findOneAndUpdate as never).mockResolvedValue(null);
    await expect(authService.verifyEmail('a@b.com', '123456', deviceInfo)).rejects.toMatchObject({
      statusCode: 400,
      message: MESSAGES.ERROR.INVALID_OTP,
    });
  });

  it('rejects a disabled account', async () => {
    vi.mocked(OTPStore.findOne as never).mockResolvedValue({ email: 'a@b.com', otp: '123456' });
    vi.mocked(User.findOneAndUpdate as never).mockResolvedValue(buildUserDoc({ email: 'a@b.com', isActive: false }));
    await expect(authService.verifyEmail('a@b.com', '123456', deviceInfo)).rejects.toMatchObject({
      statusCode: 403,
      message: MESSAGES.ERROR.ACCOUNT_DISABLED,
    });
  });

  it('marks the email verified and creates an auth session', async () => {
    vi.mocked(OTPStore.findOne as never).mockResolvedValue({ email: 'a@b.com', otp: '123456' });
    vi.mocked(User.findOneAndUpdate as never).mockResolvedValue(buildUserDoc({ email: 'a@b.com' }));
    vi.mocked(tokenService.generateTokens as never).mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const result = await authService.verifyEmail('a@b.com', '123456', deviceInfo);

    expect(User.findOneAndUpdate).toHaveBeenCalledWith({ email: 'a@b.com' }, { isEmailVerified: true }, { new: true });
    expect(OTPStore.deleteMany).toHaveBeenCalledWith({ email: 'a@b.com', purpose: 'email_verification' });
    expect(tokenService.generateTokens).toHaveBeenCalledWith(
      '65f1a1b2c3d4e5f6a7b8c9d0',
      'a@b.com',
      ROLES.STUDENT,
      deviceInfo
    );
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
  });
});

describe('login', () => {
  afterEach(() => vi.clearAllMocks());

  it('rejects unknown credentials', async () => {
    mockFindOneUser(null);
    await expect(authService.login('a@b.com', 'pw', deviceInfo)).rejects.toMatchObject({
      statusCode: 401,
      message: MESSAGES.ERROR.INVALID_CREDENTIALS,
    });
  });

  it('rejects disabled accounts', async () => {
    mockFindOneUser(buildUserDoc({ isActive: false }));
    await expect(authService.login('a@b.com', 'pw', deviceInfo)).rejects.toMatchObject({
      statusCode: 403,
      message: MESSAGES.ERROR.ACCOUNT_DISABLED,
    });
  });

  it('rejects unverified emails', async () => {
    mockFindOneUser(unverifiedUser);
    await expect(authService.login('unverified@example.com', 'pw', deviceInfo)).rejects.toMatchObject({
      statusCode: 401,
      message: MESSAGES.ERROR.EMAIL_NOT_VERIFIED,
    });
  });

  it('rejects logins while the account is locked', async () => {
    mockFindOneUser(lockedUser);
    await expect(authService.login('locked@example.com', 'pw', deviceInfo)).rejects.toMatchObject({
      statusCode: 429,
      message: MESSAGES.ERROR.ACCOUNT_LOCKED,
    });
  });

  it('resets failed attempts once the lock has expired', async () => {
    const user = buildUserDoc({
      accountLockedUntil: new Date(Date.now() - 1000),
      failedLoginAttempts: 3,
      password: 'hashed',
      comparePassword: async () => true,
    });
    mockFindOneUser(user);
    vi.mocked(tokenService.generateTokens).mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });

    await authService.login('a@b.com', 'correct', deviceInfo);

    expect(user.failedLoginAttempts).toBe(0);
    expect(user.accountLockedUntil).toBeUndefined();
    expect(user.save).toHaveBeenCalled();
  });

  it('increments failed attempts and locks the account at the threshold', async () => {
    const user = buildUserDoc({
      failedLoginAttempts: 4,
      password: 'hashed',
      comparePassword: async () => false,
    });
    mockFindOneUser(user);

    await expect(authService.login('a@b.com', 'wrong', deviceInfo)).rejects.toMatchObject({
      statusCode: 401,
      message: MESSAGES.ERROR.INVALID_CREDENTIALS,
    });

    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockLevel).toBe(1);
    expect(user.accountLockedUntil).toBeInstanceOf(Date);
    const expectedLock = new Date(Date.now() + 15 * 60 * 1000).getTime();
    expect((user.accountLockedUntil as Date).getTime()).toBeCloseTo(expectedLock, -3);
    expect(user.save).toHaveBeenCalled();
  });

  it('increments failed attempts below the lock threshold', async () => {
    const user = buildUserDoc({ password: 'hashed', comparePassword: async () => false });
    mockFindOneUser(user);

    await expect(authService.login('a@b.com', 'wrong', deviceInfo)).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(user.failedLoginAttempts).toBe(1);
    expect(user.lockLevel).toBe(0);
    expect(user.accountLockedUntil).toBeUndefined();
  });

  it('returns tokens and a sanitized user on success', async () => {
    const user = buildUserDoc({
      email: 'a@b.com',
      password: 'hashed',
      createdAt: new Date('2026-01-01'),
    });
    user.comparePassword = async () => true;
    mockFindOneUser(user);
    vi.mocked(tokenService.generateTokens).mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });

    const result = await authService.login('a@b.com', 'correct', deviceInfo);

    expect(result).toEqual({
      user: expect.objectContaining({ email: 'a@b.com', role: 'student' }),
      accessToken: 'at',
      refreshToken: 'rt',
    });
    expect(tokenService.generateTokens).toHaveBeenCalledWith(
      expect.any(String),
      'a@b.com',
      expect.any(String),
      deviceInfo
    );
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockLevel).toBe(0);
    expect(user.save).toHaveBeenCalled();
  });
});

describe('googleAuth', () => {
  afterEach(() => vi.clearAllMocks());

  it('rejects profiles without an email', async () => {
    await expect(authService.googleAuth({}, deviceInfo)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Google account must have an email address',
    });
  });

  it('links googleId to an existing user', async () => {
    const user = buildUserDoc({ googleId: undefined });
    vi.mocked(User.findOne as never).mockResolvedValue(user);
    vi.mocked(tokenService.generateTokens).mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });

    await authService.googleAuth(
      { emails: [{ value: 'test.user@example.com' }], id: 'g-1', displayName: 'Test' },
      deviceInfo
    );

    expect(user.googleId).toBe('g-1');
    expect(user.isEmailVerified).toBe(true);
    expect(user.save).toHaveBeenCalled();
  });

  it('creates a new user when none exists', async () => {
    const newUser = buildUserDoc({ email: 'new@example.com' });
    vi.mocked(User.findOne as never).mockResolvedValue(null);
    vi.mocked(User.create as never).mockResolvedValue(newUser);
    vi.mocked(tokenService.generateTokens).mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });

    const result = await authService.googleAuth(
      {
        emails: [{ value: 'new@example.com' }],
        id: 'g-2',
        displayName: 'New User',
        photos: [{ value: 'https://p.com/a.png' }],
      },
      deviceInfo
    );

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@example.com', googleId: 'g-2', isEmailVerified: true })
    );
    expect(result.accessToken).toBe('at');
  });

  it('rejects disabled accounts after linking', async () => {
    const user = buildUserDoc({ googleId: undefined, isActive: false });
    vi.mocked(User.findOne as never).mockResolvedValue(user);
    await expect(
      authService.googleAuth({ emails: [{ value: 'test.user@example.com' }], id: 'g-1' }, deviceInfo)
    ).rejects.toMatchObject({ statusCode: 403, message: MESSAGES.ERROR.ACCOUNT_DISABLED });
  });
});

describe('googleAuthWithCredential', () => {
  afterEach(() => vi.clearAllMocks());

  it('rejects invalid Google credentials', async () => {
    getGoogleClient().verifyIdToken.mockRejectedValue(new Error('invalid'));
    await expect(authService.googleAuthWithCredential('bad', deviceInfo)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid Google credential',
    });
  });

  it('authenticates a new user via ID token', async () => {
    getGoogleClient().verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: 'google@example.com',
        name: 'Google User',
        picture: 'https://p.com/g.png',
        sub: 'g-sub-1',
      }),
    });
    const newUser = buildUserDoc({ email: 'google@example.com' });
    vi.mocked(User.findOne as never).mockResolvedValue(null);
    vi.mocked(User.create as never).mockResolvedValue(newUser);
    vi.mocked(tokenService.generateTokens).mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });

    const result = await authService.googleAuthWithCredential('valid-credential', deviceInfo);

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ googleId: 'g-sub-1', avatar: { url: 'https://p.com/g.png', publicId: '' } })
    );
    expect(result.accessToken).toBe('at');
  });

  it('rejects tickets without an email', async () => {
    getGoogleClient().verifyIdToken.mockResolvedValue({ getPayload: () => ({ sub: 'g' }) });
    await expect(authService.googleAuthWithCredential('cred', deviceInfo)).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

describe('logout / logoutAllDevices', () => {
  afterEach(() => vi.clearAllMocks());

  it('revokes the refresh session and the access token jti', async () => {
    vi.mocked(verifyAccessToken).mockReturnValue({ jti: 'jti-1', exp: 9999999999, userId: 'u1' } as never);
    await authService.logout('refresh', 'u1', 'access');
    expect(tokenService.revokeSession).toHaveBeenCalledWith('refresh', 'u1');
    expect(tokenService.revokeAccessToken).toHaveBeenCalledWith('jti-1', 'u1', expect.any(Date));
  });

  it('skips access token revocation for invalid tokens', async () => {
    vi.mocked(verifyAccessToken).mockImplementation(() => {
      throw new Error('expired');
    });
    await authService.logout('refresh', 'u1', 'access');
    expect(tokenService.revokeSession).toHaveBeenCalled();
    expect(tokenService.revokeAccessToken).not.toHaveBeenCalled();
  });

  it('revokes all sessions and all access tokens', async () => {
    await authService.logoutAllDevices('u1');
    expect(tokenService.revokeAllSessions).toHaveBeenCalledWith('u1');
    expect(tokenService.revokeAllAccessTokens).toHaveBeenCalledWith('u1');
  });
});

describe('refreshToken', () => {
  it('delegates to tokenService.refreshAccessToken', async () => {
    vi.mocked(tokenService.refreshAccessToken).mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });
    await expect(authService.refreshToken('rt', deviceInfo)).resolves.toEqual({
      accessToken: 'at',
      refreshToken: 'rt',
    });
  });
});

describe('forgotPassword', () => {
  afterEach(() => vi.clearAllMocks());

  it('silently returns for unknown users', async () => {
    vi.mocked(User.findOne as never).mockResolvedValue(null);
    await expect(authService.forgotPassword('a@b.com')).resolves.toBeUndefined();
    expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('stores a hashed reset token and emails the raw token', async () => {
    const user = buildUserDoc();
    vi.mocked(User.findOne as never).mockResolvedValue(user);

    await authService.forgotPassword('a@b.com');

    expect(user.resetPasswordToken).toMatch(/^[a-f0-9]{64}$/);
    expect(user.resetPasswordExpire).toBeInstanceOf(Date);
    expect(user.save).toHaveBeenCalledWith({ validateBeforeSave: false });
    expect(emailService.sendPasswordReset).toHaveBeenCalledWith('a@b.com', expect.any(String));
    expect(emailService.sendPasswordReset.mock.calls[0][1]).toMatch(/^[a-f0-9]{64}$/);
  });

  it('reverts the token and throws when the email fails', async () => {
    const user = buildUserDoc();
    vi.mocked(User.findOne as never).mockResolvedValue(user);
    vi.mocked(emailService.sendPasswordReset).mockRejectedValue(new Error('smtp down'));

    await expect(authService.forgotPassword('a@b.com')).rejects.toMatchObject({
      statusCode: 500,
      message: MESSAGES.ERROR.INTERNAL_ERROR,
    });
    expect(user.resetPasswordToken).toBeUndefined();
    expect(user.resetPasswordExpire).toBeUndefined();
  });
});

describe('resetPassword', () => {
  afterEach(() => vi.clearAllMocks());

  it('rejects invalid or expired tokens', async () => {
    vi.mocked(User.findOne as never).mockResolvedValue(null);
    await expect(authService.resetPassword('bad', 'StrongPass1')).rejects.toMatchObject({
      statusCode: 400,
      message: MESSAGES.ERROR.INVALID_TOKEN,
    });
  });

  it('resets the password and clears the token fields', async () => {
    const user = buildUserDoc();
    vi.mocked(User.findOne as never).mockResolvedValue(user);

    await authService.resetPassword('valid-token', 'NewStrong1');

    expect(user.password).toBe('NewStrong1');
    expect(user.resetPasswordToken).toBeUndefined();
    expect(user.resetPasswordExpire).toBeUndefined();
    expect(user.save).toHaveBeenCalled();
  });
});

describe('error typing', () => {
  it('exposes ApiError instances', async () => {
    mockFindOneUser(null);
    try {
      await authService.login('a@b.com', 'pw', deviceInfo);
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
    }
  });
});
