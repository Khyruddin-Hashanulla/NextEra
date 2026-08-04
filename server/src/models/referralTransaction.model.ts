import mongoose, { Schema, Document } from 'mongoose';

export interface IReferralTransaction extends Document {
  affiliate: mongoose.Types.ObjectId;
  referral: mongoose.Types.ObjectId;
  payment: mongoose.Types.ObjectId;
  type: 'commission' | 'reversal' | 'payout';
  amount: number;
  commissionRate: number;
  originalAmount: number;
  status: 'pending' | 'approved' | 'reversed' | 'paid';
  description: string;
  reversedTransaction?: mongoose.Types.ObjectId;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const referralTransactionSchema = new Schema<IReferralTransaction>(
  {
    affiliate: {
      type: Schema.Types.ObjectId,
      ref: 'Affiliate',
      required: true,
      index: true,
    },
    referral: {
      type: Schema.Types.ObjectId,
      ref: 'Referral',
      required: true,
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    type: {
      type: String,
      enum: ['commission', 'reversal', 'payout'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    commissionRate: {
      type: Number,
      required: true,
    },
    originalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'reversed', 'paid'],
      default: 'pending',
    },
    description: { type: String, default: '' },
    reversedTransaction: {
      type: Schema.Types.ObjectId,
      ref: 'ReferralTransaction',
    },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

referralTransactionSchema.index({ affiliate: 1, createdAt: -1 });
referralTransactionSchema.index({ affiliate: 1, type: 1, status: 1 });
referralTransactionSchema.index({ payment: 1 }, { unique: true });
referralTransactionSchema.index({ referral: 1 });

export const ReferralTransaction = mongoose.model<IReferralTransaction>(
  'ReferralTransaction',
  referralTransactionSchema
);
