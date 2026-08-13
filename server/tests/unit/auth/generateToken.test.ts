import jwt from 'jsonwebtoken';
import { env } from '../../../src/config/env';
import {
  generateAccessToken,
  verifyAccessToken,
  generateOpaqueRefreshToken,
  hashRefreshToken,
  generateOTP,
} from '../../../src/utils/generateToken';

const payload = {
  userId: '507f1f77bcf86cd799439011',
  role: 'student' as const,
  email: 'student@example.com',
  tokenVersion: 1,
};

describe('generateAccessToken', () => {
  it('produces a JWT containing the payload and a jti', () => {
    const token = generateAccessToken(payload);
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe('student');
    expect(decoded.email).toBe('student@example.com');
    expect(decoded.tokenVersion).toBe(1);
    expect(typeof decoded.jti).toBe('string');
    expect(decoded.jti).toHaveLength(36);
  });

  it('signs each token with a unique jti', () => {
    const a = generateAccessToken(payload);
    const b = generateAccessToken(payload);
    expect(jwt.decode(a)).not.toEqual(jwt.decode(b));
  });

  it('sets an expiry on the token', () => {
    const token = generateAccessToken(payload);
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    expect(decoded.exp).toBeGreaterThan(decoded.iat as number);
  });
});

describe('verifyAccessToken', () => {
  it('verifies a valid token and returns the payload', () => {
    const token = generateAccessToken(payload);
    expect(verifyAccessToken(token)).toMatchObject({
      userId: payload.userId,
      role: 'student',
      email: 'student@example.com',
    });
  });

  it('throws for a token signed with a different secret', () => {
    const forged = jwt.sign({ userId: 'x', role: 'student', email: 'x' }, 'wrong-secret', {
      expiresIn: '15m',
    });
    expect(() => verifyAccessToken(forged)).toThrow();
  });

  it('throws for an expired token', () => {
    const expired = jwt.sign({ userId: 'x', role: 'student', email: 'x' }, env.jwtAccessSecret, { expiresIn: '-10s' });
    expect(() => verifyAccessToken(expired)).toThrow();
  });

  it('throws for garbage input', () => {
    expect(() => verifyAccessToken('not-a-token')).toThrow();
  });
});

describe('generateOpaqueRefreshToken', () => {
  it('returns a 64-byte hex string (128 chars)', () => {
    const token = generateOpaqueRefreshToken();
    expect(token).toMatch(/^[a-f0-9]{128}$/);
  });

  it('produces unique tokens', () => {
    expect(generateOpaqueRefreshToken()).not.toBe(generateOpaqueRefreshToken());
  });
});

describe('hashRefreshToken', () => {
  it('returns a 64-char sha256 hex digest', () => {
    const digest = hashRefreshToken('my-refresh-token');
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic', () => {
    expect(hashRefreshToken('token')).toBe(hashRefreshToken('token'));
  });

  it('differs across tokens', () => {
    expect(hashRefreshToken('token-a')).not.toBe(hashRefreshToken('token-b'));
  });
});

describe('generateOTP', () => {
  it('returns a 6-digit numeric string', () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
      const num = Number(otp);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });
});

describe('env integration', () => {
  it('has secrets configured for tests', () => {
    expect(env.jwtAccessSecret).toBeTruthy();
    expect(env.jwtRefreshSecret).toBeTruthy();
    expect(env.certificateSecret).toBeTruthy();
  });
});
