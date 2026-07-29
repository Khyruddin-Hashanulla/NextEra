import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { DeviceInfo } from '../services/token.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { setRefreshTokenCookie, clearRefreshTokenCookie } from '../config/cookies';

function extractDeviceInfo(req: Request): DeviceInfo {
  return {
    userAgent: (req.headers['user-agent'] as string) || '',
    ip: req.ip || req.socket.remoteAddress || '',
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const { user } = await authService.register(name, email, password);
  res.status(HTTP_STATUS.CREATED).json(
    ApiResponse.created(MESSAGES.AUTH.REGISTER_SUCCESS, user)
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const deviceInfo = extractDeviceInfo(req);
  const { user, accessToken, refreshToken } = await authService.login(email, password, deviceInfo);

  setRefreshTokenCookie(res, refreshToken);

  res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(MESSAGES.AUTH.LOGIN_SUCCESS, {
      user,
      accessToken,
      refreshToken,
    })
  );
});

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { credential } = req.body;
  const deviceInfo = extractDeviceInfo(req);
  const { user, accessToken, refreshToken } = await authService.googleAuthWithCredential(credential, deviceInfo);

  setRefreshTokenCookie(res, refreshToken);

  res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(MESSAGES.AUTH.GOOGLE_AUTH_SUCCESS, {
      user,
      accessToken,
      refreshToken,
    })
  );
});

export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.sendVerificationOTP(email);
  res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(MESSAGES.AUTH.VERIFICATION_OTP_SENT, null)
  );
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  await authService.verifyEmail(email, otp);
  res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(MESSAGES.AUTH.EMAIL_VERIFIED, null)
  );
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json(
      ApiResponse.success(MESSAGES.ERROR.TOKEN_REQUIRED, null)
    );
    return;
  }

  const deviceInfo = extractDeviceInfo(req);
  const tokens = await authService.refreshToken(token, deviceInfo);

  setRefreshTokenCookie(res, tokens.refreshToken);

  res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(MESSAGES.AUTH.TOKEN_REFRESHED, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  );
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(MESSAGES.AUTH.PASSWORD_RESET_LINK_SENT, null)
  );
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(MESSAGES.AUTH.PASSWORD_RESET_SUCCESS, null)
  );
});

function extractAccessToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return undefined;
}

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (token && req.currentUser) {
    await authService.logout(token, req.currentUser.userId, extractAccessToken(req));
  }

  clearRefreshTokenCookie(res);
  res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(MESSAGES.AUTH.LOGOUT_SUCCESS, null)
  );
});

export const logoutAllDevices = asyncHandler(async (req: Request, res: Response) => {
  if (req.currentUser) {
    await authService.logoutAllDevices(req.currentUser.userId, extractAccessToken(req));
  }

  clearRefreshTokenCookie(res);
  res.status(HTTP_STATUS.OK).json(
    ApiResponse.success(MESSAGES.AUTH.LOGOUT_SUCCESS, null)
  );
});
