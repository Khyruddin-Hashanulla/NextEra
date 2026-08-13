import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/user.model';
import { OTPStore } from '../models/otpStore.model';
import { tokenService, DeviceInfo } from './token.service';
import { emailService } from './email.service';
import { ApiError } from '../utils/ApiError';
import { MESSAGES } from '../constants/messages';
import { generateOTP, verifyAccessToken } from '../utils/generateToken';
import { IUserResponse } from '../interfaces/IUser';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const googleClient = new OAuth2Client(env.googleClientId);

export class AuthService {
  private sanitizeUser(user: any): IUserResponse {
    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      socialLinks: user.socialLinks,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };
  }

  async register(name: string, email: string, password: string): Promise<{ user: IUserResponse }> {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw ApiError.conflict(MESSAGES.ERROR.EMAIL_EXISTS);
    }

    const user = await User.create({ name, email: email.toLowerCase(), password });

    return { user: this.sanitizeUser(user) };
  }

  async sendVerificationOTP(email: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.isEmailVerified) {
      return;
    }

    await OTPStore.deleteMany({ email: email.toLowerCase(), purpose: 'email_verification' });

    const otp = generateOTP();
    await OTPStore.create({
      email: email.toLowerCase(),
      otp,
      purpose: 'email_verification',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    emailService.sendVerificationOTP(email, otp).catch((err) => {
      logger.error(`Failed to send verification email to ${email}:`, err);
    });
  }

  async verifyEmail(
    email: string,
    otp: string,
    deviceInfo: DeviceInfo
  ): Promise<{ user: IUserResponse; accessToken: string; refreshToken: string }> {
    const otpRecord = await OTPStore.findOne({
      email: email.toLowerCase(),
      otp,
      purpose: 'email_verification',
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      throw ApiError.badRequest(MESSAGES.ERROR.INVALID_OTP);
    }

    const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { isEmailVerified: true }, { new: true });

    if (!user) {
      throw ApiError.badRequest(MESSAGES.ERROR.INVALID_OTP);
    }

    if (!user.isActive) {
      throw ApiError.forbidden(MESSAGES.ERROR.ACCOUNT_DISABLED);
    }

    await OTPStore.deleteMany({ email: email.toLowerCase(), purpose: 'email_verification' });

    const tokens = await tokenService.generateTokens(user._id.toString(), user.email, user.role, deviceInfo);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(
    email: string,
    password: string,
    deviceInfo: DeviceInfo
  ): Promise<{ user: IUserResponse; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      throw ApiError.unauthorized(MESSAGES.ERROR.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw ApiError.forbidden(MESSAGES.ERROR.ACCOUNT_DISABLED);
    }

    if (!user.isEmailVerified) {
      throw ApiError.unauthorized(MESSAGES.ERROR.EMAIL_NOT_VERIFIED);
    }

    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      logger.warn('Attempted login on locked account', {
        email: user.email,
        userId: user._id.toString(),
        lockLevel: user.lockLevel,
        lockedUntil: user.accountLockedUntil,
        ip: deviceInfo.ip,
      });
      throw ApiError.tooManyRequests(MESSAGES.ERROR.ACCOUNT_LOCKED);
    }

    if (user.accountLockedUntil && user.accountLockedUntil <= new Date()) {
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = undefined;
    }

    if (!user.password) {
      user.failedLoginAttempts += 1;
      user.lastFailedLogin = new Date();
      user.lastFailedLoginIp = deviceInfo.ip;
      await this.applyAccountLock(user);
      throw ApiError.unauthorized(MESSAGES.ERROR.INVALID_CREDENTIALS);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      user.lastFailedLogin = new Date();
      user.lastFailedLoginIp = deviceInfo.ip;
      await this.applyAccountLock(user);
      throw ApiError.unauthorized(MESSAGES.ERROR.INVALID_CREDENTIALS);
    }

    if (user.failedLoginAttempts > 0 || user.lockLevel > 0 || user.accountLockedUntil) {
      logger.info('Account unlocked after successful login', {
        email: user.email,
        userId: user._id.toString(),
        previousLockLevel: user.lockLevel,
        ip: deviceInfo.ip,
      });
    }

    user.failedLoginAttempts = 0;
    user.accountLockedUntil = undefined;
    user.lockLevel = 0;
    user.lastFailedLogin = undefined;
    user.lastFailedLoginIp = undefined;
    await user.save();

    const tokens = await tokenService.generateTokens(user._id.toString(), user.email, user.role, deviceInfo);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async applyAccountLock(user: any): Promise<void> {
    const LOCK_THRESHOLD = 5;
    const LOCK_DURATIONS = [15, 30, 60, 1440];

    if (user.failedLoginAttempts >= LOCK_THRESHOLD) {
      const level = Math.min(user.lockLevel, LOCK_DURATIONS.length - 1);
      const lockMinutes = LOCK_DURATIONS[level];
      user.accountLockedUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
      user.lockLevel += 1;
      user.failedLoginAttempts = 0;

      logger.warn('Account locked due to multiple failed attempts', {
        email: user.email,
        userId: user._id.toString(),
        lockLevel: user.lockLevel,
        lockDurationMinutes: lockMinutes,
        lockedUntil: user.accountLockedUntil,
        ip: user.lastFailedLoginIp,
      });
    }

    await user.save();
  }

  async googleAuth(
    profile: any,
    deviceInfo: DeviceInfo
  ): Promise<{ user: IUserResponse; accessToken: string; refreshToken: string }> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw ApiError.badRequest('Google account must have an email address');
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      if (!user.googleId) {
        user.googleId = profile.id;
        user.isEmailVerified = true;
        await user.save();
      }
    } else {
      user = await User.create({
        name: profile.displayName || email.split('@')[0],
        email: email.toLowerCase(),
        googleId: profile.id,
        isEmailVerified: true,
        avatar: {
          url: profile.photos?.[0]?.value || '',
          publicId: '',
        },
      });
    }

    if (!user.isActive) {
      throw ApiError.forbidden(MESSAGES.ERROR.ACCOUNT_DISABLED);
    }

    const tokens = await tokenService.generateTokens(user._id.toString(), user.email, user.role, deviceInfo);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async googleAuthWithCredential(
    credential: string,
    deviceInfo: DeviceInfo
  ): Promise<{ user: IUserResponse; accessToken: string; refreshToken: string }> {
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env.googleClientId,
      });
    } catch {
      throw ApiError.unauthorized('Invalid Google credential');
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw ApiError.badRequest('Google account must have an email address');
    }

    const email = payload.email;
    const name = payload.name || email.split('@')[0];
    const avatarUrl = payload.picture || '';

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      if (!user.googleId) {
        user.googleId = payload.sub;
        user.isEmailVerified = true;
        if (!user.avatar.url) {
          user.avatar = { url: avatarUrl, publicId: '' };
        }
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId: payload.sub,
        isEmailVerified: true,
        avatar: { url: avatarUrl, publicId: '' },
      });
    }

    if (!user.isActive) {
      throw ApiError.forbidden(MESSAGES.ERROR.ACCOUNT_DISABLED);
    }

    const tokens = await tokenService.generateTokens(user._id.toString(), user.email, user.role, deviceInfo);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(token: string, userId: string, accessToken?: string): Promise<void> {
    await tokenService.revokeSession(token, userId);

    if (accessToken) {
      try {
        const decoded = verifyAccessToken(accessToken) as any;
        if (decoded.jti && decoded.exp) {
          await tokenService.revokeAccessToken(decoded.jti, userId, new Date(decoded.exp * 1000));
        }
      } catch {
        // Invalid access token – skip revocation
      }
    }
  }

  async logoutAllDevices(userId: string, accessToken?: string): Promise<void> {
    await tokenService.revokeAllSessions(userId);
    await tokenService.revokeAllAccessTokens(userId);

    if (accessToken) {
      try {
        const decoded = verifyAccessToken(accessToken) as any;
        if (decoded.jti && decoded.exp) {
          await tokenService.revokeAccessToken(decoded.jti, userId, new Date(decoded.exp * 1000));
        }
      } catch {
        // Invalid access token – skip revocation
      }
    }
  }

  async refreshToken(token: string, deviceInfo: DeviceInfo): Promise<{ accessToken: string; refreshToken: string }> {
    return tokenService.refreshAccessToken(token, deviceInfo);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendPasswordReset(email, resetToken);
    } catch (_error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      throw ApiError.internal(MESSAGES.ERROR.INTERNAL_ERROR);
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      throw ApiError.badRequest(MESSAGES.ERROR.INVALID_TOKEN);
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
  }
}

export const authService = new AuthService();
