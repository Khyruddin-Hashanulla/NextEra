import mongoose, { Schema, Document } from 'mongoose';

export interface IPayout extends Document {
  instructor: mongoose.Types.ObjectId;
  amount: number;
  commissionAmount: number;
  totalAmount: number;
  sourcePayment: mongoose.Types.ObjectId;
  sourceType: 'course' | 'bundle' | 'subscription';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  razorpayPayoutId?: string;
  utr?: string;
  scheduledDate: Date;
  completedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const payoutSchema = new Schema<IPayout>(
  {
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    sourcePayment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    sourceType: {
      type: String,
      enum: ['course', 'bundle', 'subscription'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    razorpayPayoutId: String,
    utr: String,
    scheduledDate: { type: Date, required: true },
    completedDate: Date,
    notes: String,
  },
  { timestamps: true }
);

payoutSchema.index({ instructor: 1, status: 1 });
payoutSchema.index({ scheduledDate: 1 });

export const Payout = mongoose.model<IPayout>('Payout', payoutSchema);
