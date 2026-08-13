import { z } from 'zod';
import { FIELD_SIZES } from '../utils/validation';

/**
 * Structured plan entitlements (source of truth for enforcement). Mirrors
 * IPlanEntitlements in instructorSubscriptionPlan.model.ts. All sections are
 * optional so partial edits only touch the sections sent.
 */
export const planEntitlementsSchema = z.object({
  courses: z
    .object({
      canCreateFree: z.boolean().optional(),
      canCreatePaid: z.boolean().optional(),
      maxCreationCount: z.number().int().min(0).optional(),
      creationWindowDays: z.number().int().min(1).max(3650).optional(),
      maxPublishedCourses: z.number().int().min(0).optional(),
      unlimitedCreationMode: z.boolean().optional(),
      highCreationCap: z.number().int().min(0).optional(),
    })
    .optional(),
  students: z
    .object({
      maxStudents: z.number().int().min(0).optional(),
    })
    .optional(),
  revenue: z
    .object({
      enabled: z.boolean().optional(),
      commissionPercent: z.number().min(0).max(100).optional(),
      instructorSharePercent: z.number().min(0).max(100).optional(),
    })
    .optional(),
  storage: z
    .object({
      videoGB: z.number().min(0).optional(),
      materialGB: z.number().min(0).optional(),
      recordingGB: z.number().min(0).optional(),
      maxVideoFileSizeMB: z.number().int().min(0).optional(),
      unlimited: z.boolean().optional(),
    })
    .optional(),
  certificates: z
    .object({
      enabled: z.boolean().optional(),
      qrVerification: z.boolean().optional(),
    })
    .optional(),
  liveClasses: z
    .object({
      enabled: z.boolean().optional(),
      monthlyLimit: z.number().int().min(0).optional(),
      maxDurationMinutes: z.number().int().min(0).optional(),
      recording: z.boolean().optional(),
    })
    .optional(),
  analytics: z
    .object({
      basic: z.boolean().optional(),
      advanced: z.boolean().optional(),
      revenue: z.boolean().optional(),
      export: z.boolean().optional(),
    })
    .optional(),
  marketing: z
    .object({
      coupons: z.boolean().optional(),
      maxActiveCoupons: z.number().int().min(0).optional(),
      bundles: z.boolean().optional(),
      instructorSubscriptions: z.boolean().optional(),
      affiliate: z.boolean().optional(),
      affiliatePayout: z.boolean().optional(),
    })
    .optional(),
  support: z
    .object({
      level: z.enum(['none', 'email', 'priority', 'dedicated']).optional(),
    })
    .optional(),
});

export const createInstructorSubscriptionPlanSchema = z
  .object({
    body: z.object({
      name: z.string().min(1, 'Name is required').max(FIELD_SIZES.NAME),
      code: z
        .string()
        .trim()
        .max(50)
        .optional()
        .transform((v) => (v?.trim() ? v.trim().toUpperCase() : undefined)),
      type: z.enum(['free', 'paid']),
      price: z.number().min(0).max(10000000).default(0),
      discountPrice: z.number().min(0).max(10000000).optional().default(0),
      durationDays: z.number().int().min(1).max(36500).default(30),
      description: z.string().max(FIELD_SIZES.DESCRIPTION).optional().default(''),
      features: z
        .object({
          freeCoursesLimit: z.number().int().min(0).max(10000).optional().default(2),
          unlimitedCourses: z.boolean().optional().default(false),
          storageLimitMB: z.number().int().min(0).max(1000000).optional().default(500),
          advancedAnalytics: z.boolean().optional().default(false),
          coupons: z.boolean().optional().default(false),
          liveClasses: z.boolean().optional().default(false),
          featuredInstructor: z.boolean().optional().default(false),
          prioritySupport: z.boolean().optional().default(false),
          unlimitedStorage: z.boolean().optional().default(false),
          premiumMarketing: z.boolean().optional().default(false),
        })
        .optional(),
      entitlements: planEntitlementsSchema.optional(),
      status: z.enum(['active', 'inactive']).optional().default('active'),
      isDefaultForFree: z.boolean().optional().default(false),
      sortOrder: z.number().int().max(1000).optional().default(0),
    }),
  })
  .superRefine((val, ctx) => {
    const { type, price } = val.body;
    if (type === 'paid' && price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['body', 'price'],
        message: 'Paid plans require a price greater than 0.',
      });
    }
    if (type === 'free' && price > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['body', 'price'],
        message: 'Free plans cannot have a price.',
      });
    }
  });

export const updateInstructorSubscriptionPlanSchema = z
  .object({
    body: z.object({
      name: z.string().min(1).max(FIELD_SIZES.NAME).optional(),
      code: z
        .string()
        .trim()
        .max(50)
        .optional()
        .transform((v) => (v?.trim() ? v.trim().toUpperCase() : undefined)),
      type: z.enum(['free', 'paid']).optional(),
      price: z.number().min(0).max(10000000).optional(),
      discountPrice: z.number().min(0).max(10000000).optional(),
      durationDays: z.number().int().min(1).max(36500).optional(),
      description: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
      features: z
        .object({
          freeCoursesLimit: z.number().int().min(0).max(10000).optional(),
          unlimitedCourses: z.boolean().optional(),
          storageLimitMB: z.number().int().min(0).max(1000000).optional(),
          advancedAnalytics: z.boolean().optional(),
          coupons: z.boolean().optional(),
          liveClasses: z.boolean().optional(),
          featuredInstructor: z.boolean().optional(),
          prioritySupport: z.boolean().optional(),
          unlimitedStorage: z.boolean().optional(),
          premiumMarketing: z.boolean().optional(),
        })
        .optional(),
      entitlements: planEntitlementsSchema.optional(),
      status: z.enum(['active', 'inactive']).optional(),
      isDefaultForFree: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    }),
  })
  .superRefine((val, ctx) => {
    const { type, price } = val.body;
    if (type === 'paid' && typeof price === 'number' && price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['body', 'price'],
        message: 'Paid plans require a price greater than 0.',
      });
    }
    if (type === 'free' && typeof price === 'number' && price > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['body', 'price'],
        message: 'Free plans cannot have a price.',
      });
    }
  });

export const createAffiliateSchema = z.object({
  body: z.object({
    user: z.string().min(1, 'User ID is required').max(FIELD_SIZES.URL),
    code: z
      .string()
      .min(3, 'Code must be at least 3 characters')
      .max(20)
      .transform((v) => v.toUpperCase()),
    commissionPercent: z.number().min(1).max(50).optional().default(10),
    payoutMethod: z.enum(['bank', 'paypal', 'upi']).optional().default('bank'),
    payoutDetails: z
      .object({
        bankAccount: z.string().max(FIELD_SIZES.NAME).optional(),
        bankIfsc: z.string().max(FIELD_SIZES.NAME).optional(),
        paypalEmail: z.string().email().max(FIELD_SIZES.EMAIL).optional().or(z.literal('')),
        upiId: z.string().max(FIELD_SIZES.NAME).optional(),
      })
      .optional(),
  }),
});

export const updateAffiliateSchema = z.object({
  body: z.object({
    commissionPercent: z.number().min(1).max(50).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    payoutMethod: z.enum(['bank', 'paypal', 'upi']).optional(),
    payoutDetails: z
      .object({
        bankAccount: z.string().max(FIELD_SIZES.NAME).optional(),
        bankIfsc: z.string().max(FIELD_SIZES.NAME).optional(),
        paypalEmail: z.string().email().max(FIELD_SIZES.EMAIL).optional().or(z.literal('')),
        upiId: z.string().max(FIELD_SIZES.NAME).optional(),
      })
      .optional(),
  }),
});

export const createFeaturedPromotionSchema = z.object({
  body: z.object({
    type: z.enum(['course', 'instructor']),
    course: z.string().max(FIELD_SIZES.URL).optional(),
    instructor: z.string().max(FIELD_SIZES.URL).optional(),
    startDate: z.string().min(1, 'Start date is required').max(FIELD_SIZES.TIMESTAMP),
    endDate: z.string().min(1, 'End date is required').max(FIELD_SIZES.TIMESTAMP),
    price: z.number().min(0).max(10000000),
    position: z.number().int().max(1000).optional().default(0),
    notes: z.string().max(FIELD_SIZES.ADMIN_NOTE).optional(),
  }),
});

export const updateFeaturedPromotionSchema = z.object({
  body: z.object({
    type: z.enum(['course', 'instructor']).optional(),
    course: z.string().max(FIELD_SIZES.URL).optional(),
    instructor: z.string().max(FIELD_SIZES.URL).optional(),
    startDate: z.string().max(FIELD_SIZES.TIMESTAMP).optional(),
    endDate: z.string().max(FIELD_SIZES.TIMESTAMP).optional(),
    price: z.number().min(0).max(10000000).optional(),
    status: z.enum(['active', 'expired', 'cancelled']).optional(),
    position: z.number().int().optional(),
    notes: z.string().max(FIELD_SIZES.ADMIN_NOTE).optional(),
  }),
});

export const subscribeInstructorSubscriptionSchema = z.object({
  body: z.object({
    planId: z.string().min(1, 'Plan ID is required').max(FIELD_SIZES.URL),
  }),
});

export const verifyInstructorSubscriptionPaymentSchema = z.object({
  body: z.object({
    planId: z.string().min(1, 'Plan ID is required').max(FIELD_SIZES.URL),
    razorpayOrderId: z.string().min(1).max(FIELD_SIZES.URL),
    razorpayPaymentId: z.string().min(1).max(FIELD_SIZES.URL),
    razorpaySignature: z
      .string()
      .min(1)
      .max(FIELD_SIZES.URL * 4),
  }),
});
