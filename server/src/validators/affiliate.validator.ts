import { z } from 'zod';
import { FIELD_SIZES } from '../utils/validation';

export const updateAffiliateProfileSchema = z.object({
  body: z.object({
    payoutMethod: z.enum(['bank', 'paypal', 'upi']).optional(),
    payoutDetails: z.object({
      bankAccount: z.string().max(FIELD_SIZES.NAME).optional(),
      bankIfsc: z.string().max(FIELD_SIZES.NAME).optional(),
      paypalEmail: z.string().email().max(FIELD_SIZES.EMAIL).optional().or(z.literal('')),
      upiId: z.string().max(FIELD_SIZES.NAME).optional(),
    }).optional(),
  }),
});

export const generateLinkSchema = z.object({
  body: z.object({
    productPath: z.string().max(FIELD_SIZES.URL).optional(),
  }),
});

export const trackClickSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(20),
    landingPage: z.string().max(FIELD_SIZES.URL).optional(),
    referrer: z.string().max(FIELD_SIZES.URL).optional(),
  }),
});

export const updateAffiliateSettingsSchema = z.object({
  body: z.object({
    enabled: z.boolean().optional(),
    commissionType: z.enum(['percentage', 'fixed']).optional(),
    commissionValue: z.number().min(0).max(100).optional(),
    eligibleProducts: z.array(z.enum(['course', 'bundle', 'subscription'])).optional(),
    minimumPurchaseAmount: z.number().min(0).optional(),
    referralCookieExpiryDays: z.number().int().min(1).max(365).optional(),
    maxCommissionPerOrder: z.number().min(0).optional(),
    autoApproveCommission: z.boolean().optional(),
  }),
});

export const referralCodeParamSchema = z.object({
  params: z.object({
    code: z.string().min(1).max(20),
  }),
});
