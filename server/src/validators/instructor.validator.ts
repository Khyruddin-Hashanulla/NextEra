import { z } from 'zod';

export const applySchema = z.object({
  fullName: z.string().min(2).max(100).trim(),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  address: z.string().min(5).max(500),
  photo: z.object({ url: z.string(), publicId: z.string() }).optional(),
  resume: z.object({ url: z.string(), publicId: z.string() }).optional(),
  qualification: z.string().min(5).max(1000),
  experience: z.string().min(10).max(2000),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  portfolio: z.string().optional(),
  website: z.string().optional(),
  bio: z.string().max(500).optional(),
  teachingCategories: z.array(z.string()).min(1),
  demoVideo: z.object({ url: z.string(), publicId: z.string() }).optional(),
  identityProof: z.object({ url: z.string(), publicId: z.string() }).optional(),
  taxDetails: z.object({
    pan: z.string().optional(),
    gst: z.string().optional(),
  }).optional(),
  bankDetails: z.object({
    accountHolderName: z.string().min(1),
    accountNumber: z.string().min(1),
    ifscCode: z.string().min(1),
    bankName: z.string().min(1),
    branch: z.string().optional(),
    upiId: z.string().optional(),
  }),
});

export const createCouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase().trim(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(1),
  minAmount: z.number().min(0).optional(),
  maxUses: z.number().min(0).optional(),
  expiresAt: z.string().min(1),
  course: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateCouponSchema = z.object({
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().min(1).optional(),
  minAmount: z.number().min(0).optional(),
  maxUses: z.number().min(0).optional(),
  expiresAt: z.string().optional(),
  course: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const replyToReviewSchema = z.object({
  reply: z.string().min(1).max(2000),
});

export const createAnnouncementSchema = z.object({
  course: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  attachments: z.array(z.object({
    url: z.string(),
    publicId: z.string(),
    name: z.string(),
  })).optional(),
  sendEmail: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).trim().optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  avatar: z.object({ url: z.string(), publicId: z.string() }).optional(),
  socialLinks: z.object({
    youtube: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    portfolio: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  instructorProfile: z.object({
    qualification: z.string().optional(),
    experience: z.string().optional(),
    expertise: z.array(z.string()).optional(),
    resume: z.object({ url: z.string(), publicId: z.string() }).optional(),
    identityProof: z.object({ url: z.string(), publicId: z.string() }).optional(),
    demoVideo: z.object({ url: z.string(), publicId: z.string() }).optional(),
    taxDetails: z.object({ pan: z.string().optional(), gst: z.string().optional() }).optional(),
    bankDetails: z.object({
      accountHolderName: z.string().optional(),
      accountNumber: z.string().optional(),
      ifscCode: z.string().optional(),
      bankName: z.string().optional(),
      branch: z.string().optional(),
      upiId: z.string().optional(),
    }).optional(),
    teachingCategories: z.array(z.string()).optional(),
  }).optional(),
});

export const issueCertificateSchema = z.object({
  user: z.string().min(1),
  course: z.string().min(1),
});
