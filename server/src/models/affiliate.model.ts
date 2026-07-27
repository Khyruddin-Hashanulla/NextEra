import mongoose, { Schema, Document } from 'mongoose';

export interface IAffiliate extends Document {
  user: mongoose.Types.ObjectId;
  code: string;
  commissionPercent: number;
  totalEarnings: number;
  totalClicks: number;
  totalConversions: number;
  status: 'active' | 'inactive';
  payoutMethod: 'bank' | 'paypal' | 'upi';
  payoutDetails: {
    bankAccount?: string;
    bankIfsc?: string;
    paypalEmail?: string;
    upiId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const affiliateSchema = new Schema<IAffiliate>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    commissionPercent: { type: Number, required: true, default: 10, min: 1, max: 50 },
    totalEarnings: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    totalConversions: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    payoutMethod: { type: String, enum: ['bank', 'paypal', 'upi'], default: 'bank' },
    payoutDetails: {
      bankAccount: String,
      bankIfsc: String,
      paypalEmail: String,
      upiId: String,
    },
  },
  { timestamps: true }
);

export const Affiliate = mongoose.model<IAffiliate>('Affiliate', affiliateSchema);
