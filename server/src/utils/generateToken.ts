import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayload } from '../interfaces/IUser';

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtAccessSecret) as TokenPayload;
};

export const generateOpaqueRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

export const hashRefreshToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
