import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  role: z.enum(['student', 'instructor', 'admin']),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(50).trim(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(50).trim().optional(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createBlogSchema = z.object({
  title: z.string().min(5).max(200).trim(),
  content: z.string().min(10),
  excerpt: z.string().max(300).optional(),
  tags: z.array(z.string()).optional(),
  featuredImage: z.object({ url: z.string(), publicId: z.string() }).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export const updateBlogSchema = z.object({
  title: z.string().min(5).max(200).trim().optional(),
  content: z.string().min(10).optional(),
  excerpt: z.string().max(300).optional(),
  tags: z.array(z.string()).optional(),
  featuredImage: z.object({ url: z.string(), publicId: z.string() }).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export const createCouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase().trim(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(1),
  minAmount: z.number().min(0).optional(),
  maxUses: z.number().min(0).optional(),
  expiresAt: z.string().min(1, 'Expiry date is required'),
});

export const updateCouponSchema = z.object({
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().min(1).optional(),
  minAmount: z.number().min(0).optional(),
  maxUses: z.number().min(0).optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createNotificationSchema = z.object({
  user: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(['system', 'course', 'payment', 'enrollment', 'approval']).optional(),
  link: z.string().optional(),
});

export const sendBulkNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(['system', 'course', 'payment', 'enrollment', 'approval']).optional(),
});

export const updateSettingsSchema = z.object({
  platformName: z.string().min(1).max(100).optional(),
  platformEmail: z.string().email().optional(),
  logo: z.object({ url: z.string(), publicId: z.string() }).optional(),
  favicon: z.object({ url: z.string(), publicId: z.string() }).optional(),
  metaDescription: z.string().max(500).optional(),
  maintenanceMode: z.boolean().optional(),
  allowRegistration: z.boolean().optional(),
  defaultUserRole: z.enum(['student', 'instructor']).optional(),
  currency: z.string().length(3).optional(),
  socialLinks: z.object({
    youtube: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
});

// ─── Course Management ──────────────────────────────────────────
export const rejectCourseSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});

export const moderateReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNote: z.string().max(500).optional(),
});

// ─── Subscription Plans ─────────────────────────────────────────
export const createSubscriptionPlanSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  price: z.number().min(0),
  discountedPrice: z.number().min(0).optional(),
  durationDays: z.number().min(1),
  features: z.array(z.string()),
  level: z.enum(['basic', 'standard', 'premium']),
  status: z.enum(['active', 'inactive']).optional(),
});

export const updateSubscriptionPlanSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  price: z.number().min(0).optional(),
  discountedPrice: z.number().min(0).optional(),
  durationDays: z.number().min(1).optional(),
  features: z.array(z.string()).optional(),
  level: z.enum(['basic', 'standard', 'premium']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

// ─── Banner ─────────────────────────────────────────────────────
export const createBannerSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  subtitle: z.string().max(500).optional(),
  image: z.object({ url: z.string(), publicId: z.string() }),
  link: z.string().optional(),
  position: z.enum(['hero', 'sidebar', 'promo', 'footer']),
  order: z.number().int().min(0).optional(),
});

export const updateBannerSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  subtitle: z.string().max(500).optional(),
  image: z.object({ url: z.string(), publicId: z.string() }).optional(),
  link: z.string().optional(),
  position: z.enum(['hero', 'sidebar', 'promo', 'footer']).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// ─── Refund ─────────────────────────────────────────────────────
export const processRefundSchema = z.object({
  adminNote: z.string().max(500).optional(),
});

// ─── Support Tickets ────────────────────────────────────────────
export const updateTicketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
});

export const addTicketMessageSchema = z.object({
  message: z.string().min(1).max(5000),
});

// ─── FAQ ────────────────────────────────────────────────────────
export const createFaqSchema = z.object({
  question: z.string().min(1).max(500).trim(),
  answer: z.string().min(1),
  category: z.string().max(100).optional(),
  order: z.number().int().min(0).optional(),
});

export const updateFaqSchema = z.object({
  question: z.string().min(1).max(500).trim().optional(),
  answer: z.string().min(1).optional(),
  category: z.string().max(100).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ─── Email Templates ────────────────────────────────────────────
export const createEmailTemplateSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  slug: z.string().min(1).max(200).trim(),
  subject: z.string().min(1),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
  category: z.enum(['auth', 'notification', 'marketing', 'transactional']).optional(),
});

export const updateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  category: z.enum(['auth', 'notification', 'marketing', 'transactional']).optional(),
  isActive: z.boolean().optional(),
});

// ─── CMS Pages ──────────────────────────────────────────────────
export const createCmsPageSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  slug: z.string().min(1).max(200).trim(),
  content: z.string().min(1),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  layout: z.enum(['default', 'full_width', 'sidebar']).optional(),
});

export const updateCmsPageSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  slug: z.string().min(1).max(200).trim().optional(),
  content: z.string().min(1).optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  published: z.boolean().optional(),
  layout: z.enum(['default', 'full_width', 'sidebar']).optional(),
});

// ─── Role & Permission ──────────────────────────────────────────
export const createRolePermissionSchema = z.object({
  role: z.enum(['admin', 'instructor', 'student']),
  permissions: z.array(
    z.object({
      module: z.string(),
      actions: z.array(z.enum(['create', 'read', 'update', 'delete'])),
    })
  ),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
});

export const updateRolePermissionSchema = z.object({
  permissions: z.array(
    z.object({
      module: z.string(),
      actions: z.array(z.enum(['create', 'read', 'update', 'delete'])),
    })
  ).optional(),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
});
