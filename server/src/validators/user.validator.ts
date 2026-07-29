import { z } from 'zod';
import { FIELD_SIZES } from '../utils/validation';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(FIELD_SIZES.NAME).trim().optional(),
  bio: z.string().max(FIELD_SIZES.BIO).optional(),
  socialLinks: z
    .object({
      youtube: z.string().url().max(FIELD_SIZES.URL).or(z.literal('')).optional(),
      twitter: z.string().url().max(FIELD_SIZES.URL).or(z.literal('')).optional(),
      linkedin: z.string().url().max(FIELD_SIZES.URL).or(z.literal('')).optional(),
      github: z.string().url().max(FIELD_SIZES.URL).or(z.literal('')).optional(),
    })
    .optional(),
  avatar: z
    .object({
      url: z.string().max(FIELD_SIZES.URL),
      publicId: z.string().max(FIELD_SIZES.URL),
    })
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(FIELD_SIZES.PASSWORD),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(FIELD_SIZES.PASSWORD)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
