import { z } from 'zod';
import { FIELD_SIZES, ARRAY_LIMITS } from '../utils/validation';

export const updateUserRoleSchema = z.object({
  role: z.enum(['student', 'instructor', 'admin']),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(FIELD_SIZES.TITLE).trim(),
  description: z.string().max(FIELD_SIZES.SHORT_DESCRIPTION).optional(),
  icon: z.string().max(FIELD_SIZES.URL).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(FIELD_SIZES.TITLE).trim().optional(),
  description: z.string().max(FIELD_SIZES.SHORT_DESCRIPTION).optional(),
  icon: z.string().max(FIELD_SIZES.URL).optional(),
  isActive: z.boolean().optional(),
});

export const createBlogSchema = z.object({
  title: z.string().min(5).max(FIELD_SIZES.TITLE).trim(),
  content: z.string().min(10).max(FIELD_SIZES.CONTENT),
  excerpt: z.string().max(FIELD_SIZES.SHORT_DESCRIPTION).optional(),
  tags: z.array(z.string().max(FIELD_SIZES.NAME)).max(ARRAY_LIMITS.TAGS).optional(),
  featuredImage: z.object({
    url: z.string().max(FIELD_SIZES.URL),
    publicId: z.string().max(FIELD_SIZES.URL),
  }).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export const updateBlogSchema = z.object({
  title: z.string().min(5).max(FIELD_SIZES.TITLE).trim().optional(),
  content: z.string().min(10).max(FIELD_SIZES.CONTENT).optional(),
  excerpt: z.string().max(FIELD_SIZES.SHORT_DESCRIPTION).optional(),
  tags: z.array(z.string().max(FIELD_SIZES.NAME)).max(ARRAY_LIMITS.TAGS).optional(),
  featuredImage: z.object({
    url: z.string().max(FIELD_SIZES.URL),
    publicId: z.string().max(FIELD_SIZES.URL),
  }).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export const createCouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase().trim(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(1).max(1000000),
  minAmount: z.number().min(0).max(1000000).optional(),
  maxUses: z.number().min(0).max(1000000).optional(),
  expiresAt: z.string().min(1, 'Expiry date is required').max(FIELD_SIZES.TIMESTAMP),
});

export const updateCouponSchema = z.object({
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().min(1).max(1000000).optional(),
  minAmount: z.number().min(0).max(1000000).optional(),
  maxUses: z.number().min(0).max(1000000).optional(),
  expiresAt: z.string().max(FIELD_SIZES.TIMESTAMP).optional(),
  isActive: z.boolean().optional(),
});

export const createNotificationSchema = z.object({
  user: z.string().min(1).max(FIELD_SIZES.URL),
  title: z.string().min(1).max(FIELD_SIZES.TITLE),
  message: z.string().min(1).max(FIELD_SIZES.MESSAGE),
  type: z.enum(['system', 'course', 'payment', 'enrollment', 'approval']).optional(),
  link: z.string().max(FIELD_SIZES.LINK).optional(),
});

export const sendBulkNotificationSchema = z.object({
  title: z.string().min(1).max(FIELD_SIZES.TITLE),
  message: z.string().min(1).max(FIELD_SIZES.MESSAGE),
  type: z.enum(['system', 'course', 'payment', 'enrollment', 'approval']).optional(),
});

export const updateSettingsSchema = z.object({
  platformName: z.string().min(1).max(FIELD_SIZES.PLATFORM_NAME).optional(),
  platformEmail: z.string().email().max(FIELD_SIZES.EMAIL).optional(),
  logo: z.object({
    url: z.string().max(FIELD_SIZES.URL),
    publicId: z.string().max(FIELD_SIZES.URL),
  }).optional(),
  favicon: z.object({
    url: z.string().max(FIELD_SIZES.URL),
    publicId: z.string().max(FIELD_SIZES.URL),
  }).optional(),
  metaDescription: z.string().max(FIELD_SIZES.SHORT_DESCRIPTION).optional(),
  maintenanceMode: z.boolean().optional(),
  allowRegistration: z.boolean().optional(),
  defaultUserRole: z.enum(['student', 'instructor']).optional(),
  currency: z.string().length(FIELD_SIZES.CURRENCY).optional(),
  commissionPercentage: z.number().min(0).max(100).optional(),
  gstPercentage: z.number().min(0).max(100).optional(),
  minimumPayoutAmount: z.number().min(0).max(10000000).optional(),
  supportEmail: z.string().email().max(FIELD_SIZES.EMAIL).optional(),
  timezone: z.string().max(FIELD_SIZES.NAME).optional(),
  defaultInstructorPlan: z.string().max(FIELD_SIZES.URL).optional(),
  refundWindowDays: z.number().min(0).max(365).optional(),
  socialLinks: z.object({
    youtube: z.string().max(FIELD_SIZES.URL).optional(),
    twitter: z.string().max(FIELD_SIZES.URL).optional(),
    linkedin: z.string().max(FIELD_SIZES.URL).optional(),
    instagram: z.string().max(FIELD_SIZES.URL).optional(),
  }).optional(),
});

export const rejectCourseSchema = z.object({
  reason: z.string().min(1).max(FIELD_SIZES.REASON).optional(),
});

export const moderateReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNote: z.string().max(FIELD_SIZES.ADMIN_NOTE).optional(),
});

export const createSubscriptionPlanSchema = z.object({
  name: z.string().min(1).max(FIELD_SIZES.TITLE).trim(),
  price: z.number().min(0).max(10000000),
  discountedPrice: z.number().min(0).max(10000000).optional(),
  durationDays: z.number().min(1).max(36500),
  features: z.array(z.string().max(FIELD_SIZES.SHORT_DESCRIPTION)).max(ARRAY_LIMITS.FEATURES),
  level: z.enum(['basic', 'standard', 'premium']),
  status: z.enum(['active', 'inactive']).optional(),
});

export const updateSubscriptionPlanSchema = z.object({
  name: z.string().min(1).max(FIELD_SIZES.TITLE).trim().optional(),
  price: z.number().min(0).max(10000000).optional(),
  discountedPrice: z.number().min(0).max(10000000).optional(),
  durationDays: z.number().min(1).max(36500).optional(),
  features: z.array(z.string().max(FIELD_SIZES.SHORT_DESCRIPTION)).max(ARRAY_LIMITS.FEATURES).optional(),
  level: z.enum(['basic', 'standard', 'premium']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const createBannerSchema = z.object({
  title: z.string().min(1).max(FIELD_SIZES.TITLE).trim(),
  subtitle: z.string().max(FIELD_SIZES.SHORT_DESCRIPTION).optional(),
  image: z.object({
    url: z.string().max(FIELD_SIZES.URL),
    publicId: z.string().max(FIELD_SIZES.URL),
  }),
  link: z.string().max(FIELD_SIZES.LINK).optional(),
  position: z.enum(['hero', 'sidebar', 'promo', 'footer']),
  order: z.number().int().min(0).max(1000).optional(),
});

export const updateBannerSchema = z.object({
  title: z.string().min(1).max(FIELD_SIZES.TITLE).trim().optional(),
  subtitle: z.string().max(FIELD_SIZES.SHORT_DESCRIPTION).optional(),
  image: z.object({
    url: z.string().max(FIELD_SIZES.URL),
    publicId: z.string().max(FIELD_SIZES.URL),
  }).optional(),
  link: z.string().max(FIELD_SIZES.LINK).optional(),
  position: z.enum(['hero', 'sidebar', 'promo', 'footer']).optional(),
  order: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().max(FIELD_SIZES.TIMESTAMP).optional(),
  endDate: z.string().max(FIELD_SIZES.TIMESTAMP).optional(),
});

export const processRefundSchema = z.object({
  adminNote: z.string().max(FIELD_SIZES.ADMIN_NOTE).optional(),
});

export const issueRefundSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive').max(10000000),
    reason: z.enum([
      'student_request', 'duplicate_payment', 'fraud',
      'course_removed', 'admin_decision', 'technical_error',
    ], { message: 'Invalid refund reason' }),
    refundType: z.enum(['full', 'partial']).default('full'),
    adminNote: z.string().max(FIELD_SIZES.ADMIN_NOTE).optional(),
  }),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
});

export const addTicketMessageSchema = z.object({
  message: z.string().min(1).max(FIELD_SIZES.MESSAGE),
});

export const createFaqSchema = z.object({
  question: z.string().min(1).max(FIELD_SIZES.QUESTION).trim(),
  answer: z.string().min(1).max(FIELD_SIZES.CONTENT),
  category: z.string().max(FIELD_SIZES.NAME).optional(),
  order: z.number().int().min(0).max(1000).optional(),
});

export const updateFaqSchema = z.object({
  question: z.string().min(1).max(FIELD_SIZES.QUESTION).trim().optional(),
  answer: z.string().min(1).max(FIELD_SIZES.CONTENT).optional(),
  category: z.string().max(FIELD_SIZES.NAME).optional(),
  order: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const createEmailTemplateSchema = z.object({
  name: z.string().min(1).max(FIELD_SIZES.TITLE).trim(),
  slug: z.string().min(1).max(FIELD_SIZES.SLUG).trim(),
  subject: z.string().min(1).max(FIELD_SIZES.MESSAGE),
  body: z.string().min(1).max(FIELD_SIZES.CONTENT),
  variables: z.array(z.string().max(FIELD_SIZES.NAME)).max(ARRAY_LIMITS.VARIABLES).optional(),
  category: z.enum(['auth', 'notification', 'marketing', 'transactional']).optional(),
});

export const updateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(FIELD_SIZES.TITLE).trim().optional(),
  subject: z.string().min(1).max(FIELD_SIZES.MESSAGE).optional(),
  body: z.string().min(1).max(FIELD_SIZES.CONTENT).optional(),
  variables: z.array(z.string().max(FIELD_SIZES.NAME)).max(ARRAY_LIMITS.VARIABLES).optional(),
  category: z.enum(['auth', 'notification', 'marketing', 'transactional']).optional(),
  isActive: z.boolean().optional(),
});

export const createCmsPageSchema = z.object({
  title: z.string().min(1).max(FIELD_SIZES.TITLE).trim(),
  slug: z.string().min(1).max(FIELD_SIZES.SLUG).trim(),
  content: z.string().min(1).max(FIELD_SIZES.CONTENT),
  metaTitle: z.string().max(FIELD_SIZES.TITLE).optional(),
  metaDescription: z.string().max(FIELD_SIZES.SHORT_DESCRIPTION).optional(),
  layout: z.enum(['default', 'full_width', 'sidebar']).optional(),
});

export const updateCmsPageSchema = z.object({
  title: z.string().min(1).max(FIELD_SIZES.TITLE).trim().optional(),
  slug: z.string().min(1).max(FIELD_SIZES.SLUG).trim().optional(),
  content: z.string().min(1).max(FIELD_SIZES.CONTENT).optional(),
  metaTitle: z.string().max(FIELD_SIZES.TITLE).optional(),
  metaDescription: z.string().max(FIELD_SIZES.SHORT_DESCRIPTION).optional(),
  published: z.boolean().optional(),
  layout: z.enum(['default', 'full_width', 'sidebar']).optional(),
});

export const createRolePermissionSchema = z.object({
  role: z.enum(['admin', 'instructor', 'student']),
  permissions: z.array(
    z.object({
      module: z.string().min(1).max(FIELD_SIZES.NAME),
      actions: z.array(z.enum(['create', 'read', 'update', 'delete'])),
    })
  ).max(ARRAY_LIMITS.PERMISSIONS),
  description: z.string().max(FIELD_SIZES.ADMIN_NOTE).optional(),
  isDefault: z.boolean().optional(),
});

export const updateRolePermissionSchema = z.object({
  permissions: z.array(
    z.object({
      module: z.string().min(1).max(FIELD_SIZES.NAME),
      actions: z.array(z.enum(['create', 'read', 'update', 'delete'])),
    })
  ).max(ARRAY_LIMITS.PERMISSIONS).optional(),
  description: z.string().max(FIELD_SIZES.ADMIN_NOTE).optional(),
  isDefault: z.boolean().optional(),
});
