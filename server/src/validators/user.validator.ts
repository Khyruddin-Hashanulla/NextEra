import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).trim().optional(),
  bio: z.string().max(500).optional(),
  socialLinks: z
    .object({
      youtube: z.string().url().or(z.literal('')).optional(),
      twitter: z.string().url().or(z.literal('')).optional(),
      linkedin: z.string().url().or(z.literal('')).optional(),
      github: z.string().url().or(z.literal('')).optional(),
    })
    .optional(),
  avatar: z
    .object({
      url: z.string(),
      publicId: z.string(),
    })
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
