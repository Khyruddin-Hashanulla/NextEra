import { User } from '../models/user.model';
import { Session } from '../models/session.model';
import { RevokedToken } from '../models/revokedToken.model';
import { TokenPayload } from '../interfaces/IUser';
import { generateAccessToken, generateOpaqueRefreshToken, hashRefreshToken } from '../utils/generateToken';
import { ApiError } from '../utils/ApiError';
import { MESSAGES } from '../constants/messages';
import { logger } from '../utils/logger';

export interface DeviceInfo {
  userAgent: string;
  ip: string;
}

const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export class TokenService {
  async generateTokens(
    userId: string,
    email: string,
    role: string,
    deviceInfo: DeviceInfo
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await User.findById(userId);
    const payload: TokenPayload = {
      userId,
      email,
      role: role as TokenPayload['role'],
      tokenVersion: user?.tokenVersion ?? 0,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateOpaqueRefreshToken();
    const hashedToken = hashRefreshToken(refreshToken);

    await Session.create({
      userId,
      refreshTokenHash: hashedToken,
      userAgent: deviceInfo.userAgent,
      ipAddress: deviceInfo.ip,
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
    });

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(
    token: string,
    deviceInfo: DeviceInfo
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const hashedToken = hashRefreshToken(token);

    const session = await Session.findOneAndDelete({
      refreshTokenHash: hashedToken,
      expiresAt: { $gt: new Date() },
      isRevoked: false,
    });

    if (!session) {
      const existing = await Session.findOne({ refreshTokenHash: hashedToken });
      if (existing) {
        await Session.updateMany({ userId: existing.userId, isRevoked: false }, { isRevoked: true });
        logger.warn('Refresh token reuse detected — all sessions revoked', {
          userId: existing.userId.toString(),
          sessionId: existing._id.toString(),
          event: 'refresh_token_reuse',
          timestamp: new Date().toISOString(),
        });
        throw ApiError.unauthorized(MESSAGES.ERROR.SESSION_EXPIRED);
      }

      throw ApiError.unauthorized(MESSAGES.ERROR.INVALID_REFRESH_TOKEN);
    }

    const user = await User.findById(session.userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized(MESSAGES.ERROR.UNAUTHORIZED);
    }

    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    };
    const accessToken = generateAccessToken(payload);
    const newRefreshToken = generateOpaqueRefreshToken();
    const newHashedToken = hashRefreshToken(newRefreshToken);

    await Session.create({
      userId: user._id,
      refreshTokenHash: newHashedToken,
      userAgent: deviceInfo.userAgent,
      ipAddress: deviceInfo.ip,
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
    });

    logger.info('Refresh token rotated', {
      userId: user._id.toString(),
      sessionId: session._id.toString(),
      event: 'refresh_success',
      timestamp: new Date().toISOString(),
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async revokeSession(token: string, userId: string): Promise<void> {
    const hashedToken = hashRefreshToken(token);
    const session = await Session.findOneAndUpdate(
      { refreshTokenHash: hashedToken, userId, isRevoked: false },
      { isRevoked: true }
    );
    if (session) {
      logger.info('Session logged out', {
        userId,
        sessionId: session._id.toString(),
        event: 'logout',
        timestamp: new Date().toISOString(),
      });
    }
  }

  async revokeAllSessions(userId: string): Promise<void> {
    const result = await Session.updateMany({ userId, isRevoked: false }, { isRevoked: true });
    logger.info('All sessions revoked', {
      userId,
      count: result.modifiedCount,
      event: 'logout_all',
      timestamp: new Date().toISOString(),
    });
  }

  async revokeAccessToken(jti: string, userId: string, expiresAt: Date): Promise<void> {
    await RevokedToken.create({ jti, userId, expiresAt });
    logger.info('Access token revoked', {
      userId,
      event: 'token_revoked',
    });
  }

  async revokeAllAccessTokens(userId: string): Promise<void> {
    const user = await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } }, { new: true });
    if (user) {
      logger.info('All access tokens revoked for user', {
        userId,
        newTokenVersion: user.tokenVersion,
        event: 'all_tokens_revoked',
      });
    }
  }
}

export const tokenService = new TokenService();
