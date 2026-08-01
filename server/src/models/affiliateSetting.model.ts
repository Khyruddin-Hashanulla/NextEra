import mongoose, { Schema, Document } from 'mongoose';

export interface IAffiliateSetting extends Document {
  enabled: boolean;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  eligibleProducts: ('course' | 'bundle' | 'subscription')[];
  minimumPurchaseAmount: number;
  referralCookieExpiryDays: number;
  maxCommissionPerOrder: number;
  autoApproveCommission: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const affiliateSettingSchema = new Schema<IAffiliateSetting>(
  {
    enabled: { type: Boolean, default: true },
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    commissionValue: { type: Number, default: 10, min: 0, max: 100 },
    eligibleProducts: {
      type: [String],
      enum: ['course', 'bundle', 'subscription'],
      default: ['course', 'bundle'],
    },
    minimumPurchaseAmount: { type: Number, default: 0, min: 0 },
    referralCookieExpiryDays: { type: Number, default: 30, min: 1, max: 365 },
    maxCommissionPerOrder: { type: Number, default: 10000, min: 0 },
    autoApproveCommission: { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const AffiliateSetting = mongoose.model<IAffiliateSetting>(
  'AffiliateSetting',
  affiliateSettingSchema
);
