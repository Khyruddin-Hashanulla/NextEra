import { CookieOptions, Response } from 'express';
import { env } from './env';

export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function getBaseCookieOptions(): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
  };
  if (env.cookieDomain) {
    options.domain = env.cookieDomain;
  }
  return options;
}

function getSetRefreshTokenCookieOptions(): CookieOptions {
  return {
    ...getBaseCookieOptions(),
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
  };
}

export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getSetRefreshTokenCookieOptions());
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getBaseCookieOptions());
}
