import { z } from 'zod';
import { FIELD_SIZES } from '../utils/validation';

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(FIELD_SIZES.NAME, 'Name cannot exceed 50 characters')
    .trim(),
  email: z.string().email('Invalid email address').max(FIELD_SIZES.EMAIL).toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(FIELD_SIZES.PASSWORD)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(FIELD_SIZES.EMAIL).toLowerCase().trim(),
  password: z.string().min(1, 'Password is required').max(FIELD_SIZES.PASSWORD),
});

export const sendOTPSchema = z.object({
  email: z.string().email('Invalid email address').max(FIELD_SIZES.EMAIL).toLowerCase().trim(),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address').max(FIELD_SIZES.EMAIL).toLowerCase().trim(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').max(FIELD_SIZES.EMAIL).toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required').max(FIELD_SIZES.TOKEN),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(FIELD_SIZES.PASSWORD)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required').max(FIELD_SIZES.TOKEN),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').max(FIELD_SIZES.TOKEN),
});
