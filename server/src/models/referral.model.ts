import mongoose, { Schema, Document } from 'mongoose';

export interface IReferral extends Document {
  referrer: mongoose.Types.ObjectId;
  referred: mongoose.Types.ObjectId;
  code: string;
  status: 'pending' | 'converted' | 'expired';
  convertedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    referrer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referred: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 50,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'converted', 'expired'],
      default: 'pending',
    },
    convertedAt: { type: Date },
  },
  { timestamps: true }
);

referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referred: 1 }, { unique: true });

export const Referral = mongoose.model<IReferral>('Referral', referralSchema);
