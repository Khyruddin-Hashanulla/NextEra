import mongoose, { Schema, Document } from 'mongoose';

export interface IReferralClick extends Document {
  code: string;
  ip: string;
  userAgent?: string;
  referrer?: string;
  landingPage?: string;
  converted: boolean;
  clickedAt: Date;
}

const referralClickSchema = new Schema<IReferralClick>(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 50,
      index: true,
    },
    ip: {
      type: String,
      required: true,
      maxlength: 45,
    },
    userAgent: { type: String, maxlength: 500 },
    referrer: { type: String, maxlength: 500 },
    landingPage: { type: String, maxlength: 500 },
    converted: { type: Boolean, default: false },
    clickedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

referralClickSchema.index({ code: 1, clickedAt: -1 });
referralClickSchema.index({ code: 1, ip: 1 });
referralClickSchema.index({ clickedAt: -1 });

export const ReferralClick = mongoose.model<IReferralClick>('ReferralClick', referralClickSchema);
