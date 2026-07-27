import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayload } from '../interfaces/IUser';

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtAccessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
