import { z } from 'zod';
import { FIELD_SIZES, ARRAY_LIMITS } from '../utils/validation';

export const applySchema = z.object({
  fullName: z.string().min(2).max(FIELD_SIZES.NAME).trim(),
  email: z.string().email().max(FIELD_SIZES.EMAIL),
  phone: z.string().min(10).max(FIELD_SIZES.PHONE),
  address: z.string().min(5).max(FIELD_SIZES.ADDRESS),
  photo: z.object({ url: z.string().max(FIELD_SIZES.URL), publicId: z.string().max(FIELD_SIZES.URL) }).optional(),
  resume: z.object({ url: z.string().max(FIELD_SIZES.URL), publicId: z.string().max(FIELD_SIZES.URL) }).optional(),
  qualification: z.string().min(5).max(FIELD_SIZES.QUALIFICATION),
  experience: z.string().min(10).max(FIELD_SIZES.EXPERIENCE),
  linkedin: z.string().max(FIELD_SIZES.URL).optional(),
  github: z.string().max(FIELD_SIZES.URL).optional(),
  portfolio: z.string().max(FIELD_SIZES.URL).optional(),
  website: z.string().max(FIELD_SIZES.URL).optional(),
  bio: z.string().max(FIELD_SIZES.BIO).optional(),
  teachingCategories: z.array(z.string().max(FIELD_SIZES.URL)).min(1).max(ARRAY_LIMITS.CATEGORIES),
  demoVideo: z.object({ url: z.string().max(FIELD_SIZES.URL), publicId: z.string().max(FIELD_SIZES.URL) }).optional(),
  identityProof: z.object({ url: z.string().max(FIELD_SIZES.URL), publicId: z.string().max(FIELD_SIZES.URL) }).optional(),
  taxDetails: z.object({
    pan: z.string().max(FIELD_SIZES.NAME).optional(),
    gst: z.string().max(FIELD_SIZES.NAME).optional(),
  }).optional(),
  bankDetails: z.object({
    accountHolderName: z.string().min(1).max(FIELD_SIZES.NAME),
    accountNumber: z.string().min(1).max(FIELD_SIZES.NAME),
    ifscCode: z.string().min(1).max(FIELD_SIZES.NAME),
    bankName: z.string().min(1).max(FIELD_SIZES.NAME),
    branch: z.string().max(FIELD_SIZES.NAME).optional(),
    upiId: z.string().max(FIELD_SIZES.NAME).optional(),
  }),
});

export const createCouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase().trim(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(1).max(1000000),
  minAmount: z.number().min(0).max(1000000).optional(),
  maxUses: z.number().min(0).max(1000000).optional(),
  expiresAt: z.string().min(1).max(FIELD_SIZES.TIMESTAMP),
  course: z.string().max(FIELD_SIZES.URL).optional(),
  isActive: z.boolean().optional(),
});

export const updateCouponSchema = z.object({
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().min(1).max(1000000).optional(),
  minAmount: z.number().min(0).max(1000000).optional(),
  maxUses: z.number().min(0).max(1000000).optional(),
  expiresAt: z.string().max(FIELD_SIZES.TIMESTAMP).optional(),
  course: z.string().max(FIELD_SIZES.URL).optional(),
  isActive: z.boolean().optional(),
});

export const replyToReviewSchema = z.object({
  reply: z.string().min(1).max(FIELD_SIZES.REPLY),
});

export const createAnnouncementSchema = z.object({
  course: z.string().min(1).max(FIELD_SIZES.URL),
  title: z.string().min(1).max(FIELD_SIZES.TITLE),
  message: z.string().min(1).max(FIELD_SIZES.ANNOUNCEMENT),
  attachments: z.array(z.object({
    url: z.string().max(FIELD_SIZES.URL),
    publicId: z.string().max(FIELD_SIZES.URL),
    name: z.string().max(FIELD_SIZES.TITLE),
  })).max(ARRAY_LIMITS.ATTACHMENTS_PER_LECTURE).optional(),
  sendEmail: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(FIELD_SIZES.NAME).trim().optional(),
  bio: z.string().max(FIELD_SIZES.BIO).optional(),
  phone: z.string().max(FIELD_SIZES.PHONE).optional(),
  address: z.string().max(FIELD_SIZES.ADDRESS).optional(),
  avatar: z.object({ url: z.string().max(FIELD_SIZES.URL), publicId: z.string().max(FIELD_SIZES.URL) }).optional(),
  socialLinks: z.object({
    youtube: z.string().max(FIELD_SIZES.URL).optional(),
    twitter: z.string().max(FIELD_SIZES.URL).optional(),
    linkedin: z.string().max(FIELD_SIZES.URL).optional(),
    github: z.string().max(FIELD_SIZES.URL).optional(),
    portfolio: z.string().max(FIELD_SIZES.URL).optional(),
    website: z.string().max(FIELD_SIZES.URL).optional(),
  }).optional(),
  instructorProfile: z.object({
    qualification: z.string().max(FIELD_SIZES.QUALIFICATION).optional(),
    experience: z.string().max(FIELD_SIZES.EXPERIENCE).optional(),
    expertise: z.array(z.string().max(FIELD_SIZES.NAME)).max(ARRAY_LIMITS.EXPERTISE).optional(),
    resume: z.object({ url: z.string().max(FIELD_SIZES.URL), publicId: z.string().max(FIELD_SIZES.URL) }).optional(),
    identityProof: z.object({ url: z.string().max(FIELD_SIZES.URL), publicId: z.string().max(FIELD_SIZES.URL) }).optional(),
    demoVideo: z.object({ url: z.string().max(FIELD_SIZES.URL), publicId: z.string().max(FIELD_SIZES.URL) }).optional(),
    taxDetails: z.object({ pan: z.string().max(FIELD_SIZES.NAME).optional(), gst: z.string().max(FIELD_SIZES.NAME).optional() }).optional(),
    bankDetails: z.object({
      accountHolderName: z.string().max(FIELD_SIZES.NAME).optional(),
      accountNumber: z.string().max(FIELD_SIZES.NAME).optional(),
      ifscCode: z.string().max(FIELD_SIZES.NAME).optional(),
      bankName: z.string().max(FIELD_SIZES.NAME).optional(),
      branch: z.string().max(FIELD_SIZES.NAME).optional(),
      upiId: z.string().max(FIELD_SIZES.NAME).optional(),
    }).optional(),
    teachingCategories: z.array(z.string().max(FIELD_SIZES.URL)).max(ARRAY_LIMITS.CATEGORIES).optional(),
  }).optional(),
});

export const issueCertificateSchema = z.object({
  user: z.string().min(1).max(FIELD_SIZES.URL),
  course: z.string().min(1).max(FIELD_SIZES.URL),
});
