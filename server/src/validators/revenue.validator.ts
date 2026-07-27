import { z } from 'zod';

export const createInstructorSubscriptionPlanSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    type: z.enum(['free', 'paid']),
    price: z.number().min(0).default(0),
    durationDays: z.number().int().min(1).default(30),
    description: z.string().optional().default(''),
    features: z.object({
      freeCoursesLimit: z.number().int().min(0).optional().default(2),
      unlimitedCourses: z.boolean().optional().default(false),
      storageLimitMB: z.number().int().min(0).optional().default(500),
      advancedAnalytics: z.boolean().optional().default(false),
      coupons: z.boolean().optional().default(false),
      liveClasses: z.boolean().optional().default(false),
      featuredInstructor: z.boolean().optional().default(false),
      prioritySupport: z.boolean().optional().default(false),
      unlimitedStorage: z.boolean().optional().default(false),
      premiumMarketing: z.boolean().optional().default(false),
    }).optional(),
    status: z.enum(['active', 'inactive']).optional().default('active'),
    sortOrder: z.number().int().optional().default(0),
  }),
});

export const updateInstructorSubscriptionPlanSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    type: z.enum(['free', 'paid']).optional(),
    price: z.number().min(0).optional(),
    durationDays: z.number().int().min(1).optional(),
    description: z.string().optional(),
    features: z.object({
      freeCoursesLimit: z.number().int().min(0).optional(),
      unlimitedCourses: z.boolean().optional(),
      storageLimitMB: z.number().int().min(0).optional(),
      advancedAnalytics: z.boolean().optional(),
      coupons: z.boolean().optional(),
      liveClasses: z.boolean().optional(),
      featuredInstructor: z.boolean().optional(),
      prioritySupport: z.boolean().optional(),
      unlimitedStorage: z.boolean().optional(),
      premiumMarketing: z.boolean().optional(),
    }).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    sortOrder: z.number().int().optional(),
  }),
});

export const createAffiliateSchema = z.object({
  body: z.object({
    user: z.string().min(1, 'User ID is required'),
    code: z.string().min(3, 'Code must be at least 3 characters').max(20).transform((v) => v.toUpperCase()),
    commissionPercent: z.number().min(1).max(50).optional().default(10),
    payoutMethod: z.enum(['bank', 'paypal', 'upi']).optional().default('bank'),
    payoutDetails: z.object({
      bankAccount: z.string().optional(),
      bankIfsc: z.string().optional(),
      paypalEmail: z.string().email().optional().or(z.literal('')),
      upiId: z.string().optional(),
    }).optional(),
  }),
});

export const updateAffiliateSchema = z.object({
  body: z.object({
    commissionPercent: z.number().min(1).max(50).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    payoutMethod: z.enum(['bank', 'paypal', 'upi']).optional(),
    payoutDetails: z.object({
      bankAccount: z.string().optional(),
      bankIfsc: z.string().optional(),
      paypalEmail: z.string().email().optional().or(z.literal('')),
      upiId: z.string().optional(),
    }).optional(),
  }),
});

export const createFeaturedPromotionSchema = z.object({
  body: z.object({
    type: z.enum(['course', 'instructor']),
    course: z.string().optional(),
    instructor: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    price: z.number().min(0),
    position: z.number().int().optional().default(0),
    notes: z.string().optional(),
  }),
});

export const updateFeaturedPromotionSchema = z.object({
  body: z.object({
    type: z.enum(['course', 'instructor']).optional(),
    course: z.string().optional(),
    instructor: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    price: z.number().min(0).optional(),
    status: z.enum(['active', 'expired', 'cancelled']).optional(),
    position: z.number().int().optional(),
    notes: z.string().optional(),
  }),
});

export const purchaseInstructorSubscriptionSchema = z.object({
  body: z.object({
    planId: z.string().min(1, 'Plan ID is required'),
  }),
});
