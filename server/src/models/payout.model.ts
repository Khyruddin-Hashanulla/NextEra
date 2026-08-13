import mongoose, { Schema, Document } from 'mongoose';

export interface IPayout extends Document {
  instructor: mongoose.Types.ObjectId;
  amount: number;
  commissionAmount: number;
  totalAmount: number;
  sourcePayment: mongoose.Types.ObjectId;
  sourceType: 'course' | 'bundle' | 'subscription';
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed' | 'cancelled';
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
      enum: ['pending', 'approved', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    razorpayPayoutId: { type: String, maxlength: 200 },
    utr: { type: String, maxlength: 100 },
    scheduledDate: { type: Date, required: true },
    completedDate: Date,
    notes: { type: String, maxlength: 2000 },
  },
  { timestamps: true }
);

payoutSchema.index({ instructor: 1, status: 1 });
payoutSchema.index({ scheduledDate: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ status: 1 });

export const Payout = mongoose.model<IPayout>('Payout', payoutSchema);
