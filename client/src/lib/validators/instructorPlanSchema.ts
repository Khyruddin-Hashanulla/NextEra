import { z } from 'zod';

/**
 * Frontend mirror of the backend plan validators
 * (server/src/validators/revenue.validator.ts) and the Mongoose entitlements
 * schema (server/src/models/instructorSubscriptionPlan.model.ts). Field names
 * and ranges must stay identical so the create/update payload the admin form
 * produces always passes server-side validation.
 */

export const instructorPlanEntitlementsSchema = z.object({
  courses: z.object({
    canCreateFree: z.boolean(),
    canCreatePaid: z.boolean(),
    maxCreationCount: z.number().int('Must be a whole number').min(0, 'Must be 0 or more'),
    creationWindowDays: z
      .number()
      .int('Must be a whole number')
      .min(1, 'Window must be at least 1 day')
      .max(3650, 'Window cannot exceed 3650 days'),
    maxPublishedCourses: z.number().int('Must be a whole number').min(0, 'Must be 0 or more'),
    unlimitedCreationMode: z.boolean(),
    highCreationCap: z.number().int('Must be a whole number').min(0, 'Must be 0 or more'),
  }),
  students: z.object({
    maxStudents: z.number().int('Must be a whole number').min(0, 'Must be 0 or more'),
  }),
  revenue: z.object({
    enabled: z.boolean(),
    commissionPercent: z.number().min(0, 'Must be 0 or more').max(100, 'Cannot exceed 100'),
    instructorSharePercent: z.number().min(0, 'Must be 0 or more').max(100, 'Cannot exceed 100'),
  }),
  storage: z.object({
    videoGB: z.number().min(0, 'Must be 0 or more'),
    materialGB: z.number().min(0, 'Must be 0 or more'),
    recordingGB: z.number().min(0, 'Must be 0 or more'),
    maxVideoFileSizeMB: z.number().int('Must be a whole number').min(0, 'Must be 0 or more'),
    unlimited: z.boolean().optional(),
  }),
  certificates: z.object({
    enabled: z.boolean(),
    qrVerification: z.boolean(),
  }),
  liveClasses: z.object({
    enabled: z.boolean(),
    monthlyLimit: z.number().int('Must be a whole number').min(0, 'Must be 0 or more'),
    maxDurationMinutes: z.number().int('Must be a whole number').min(0, 'Must be 0 or more'),
    recording: z.boolean(),
  }),
  analytics: z.object({
    basic: z.boolean(),
    advanced: z.boolean(),
    revenue: z.boolean(),
    export: z.boolean(),
  }),
  marketing: z.object({
    coupons: z.boolean(),
    maxActiveCoupons: z.number().int('Must be a whole number').min(0, 'Must be 0 or more'),
    bundles: z.boolean(),
    instructorSubscriptions: z.boolean(),
    affiliate: z.boolean(),
    affiliatePayout: z.boolean(),
  }),
  support: z.object({
    level: z.enum(['none', 'email', 'priority', 'dedicated']),
  }),
});

export const instructorPlanLegacyFeaturesSchema = z.object({
  freeCoursesLimit: z.number().int('Must be a whole number').min(0, 'Must be 0 or more').max(10000),
  unlimitedCourses: z.boolean(),
  storageLimitMB: z.number().int('Must be a whole number').min(0, 'Must be 0 or more').max(1000000),
  advancedAnalytics: z.boolean(),
  coupons: z.boolean(),
  liveClasses: z.boolean(),
  featuredInstructor: z.boolean(),
  prioritySupport: z.boolean(),
  unlimitedStorage: z.boolean(),
  premiumMarketing: z.boolean(),
});

export const instructorPlanFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Plan name is required').max(200, 'Name cannot exceed 200 characters'),
    code: z
      .string()
      .trim()
      .max(50, 'Code cannot exceed 50 characters')
      .transform((v) => v.toUpperCase()),
    type: z.enum(['free', 'paid']),
    price: z.number().min(0, 'Price must be 0 or more').max(10000000, 'Price is too large'),
    discountPrice: z.number().min(0, 'Discount price must be 0 or more').max(10000000, 'Discount price is too large'),
    durationDays: z
      .number()
      .int('Duration must be a whole number')
      .min(1, 'Duration must be at least 1 day')
      .max(36500, 'Duration is too long'),
    description: z.string().max(5000, 'Description cannot exceed 5000 characters'),
    sortOrder: z.number().int('Sort order must be a whole number').min(0, 'Sort order must be 0 or more').max(1000),
    status: z.enum(['active', 'inactive']),
    features: instructorPlanLegacyFeaturesSchema.optional(),
    entitlements: instructorPlanEntitlementsSchema.optional(),
  })
  .superRefine((val, ctx) => {
    const { type, price, discountPrice } = val;
    if (type === 'paid' && price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price'],
        message: 'Paid plans require a price greater than 0.',
      });
    }
    if (type === 'free' && price > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price'],
        message: 'Free plans cannot have a price. Set the price to 0.',
      });
    }
    if (discountPrice > price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountPrice'],
        message: 'Discount price cannot exceed the regular price.',
      });
    }
  });

export type InstructorPlanFormValues = z.infer<typeof instructorPlanFormSchema>;
export type InstructorPlanEntitlementsValues = z.infer<typeof instructorPlanEntitlementsSchema>;
