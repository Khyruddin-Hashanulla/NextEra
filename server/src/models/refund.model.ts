import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRefund extends Document {
  payment: Types.ObjectId;
  user: Types.ObjectId;
  course?: Types.ObjectId;
  bundle?: Types.ObjectId;
  amount: number;
  reason: string;
  refundType: 'full' | 'partial';
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  adminNote?: string;
  razorpayRefundId?: string;
  razorpayRefundStatus?: string;
  razorpayRefundSpeed?: string;
  gatewayResponse?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course' },
    bundle: { type: Schema.Types.ObjectId, ref: 'Bundle' },
    amount: { type: Number, required: true },
    reason: { type: String, required: true, maxlength: 2000 },
    refundType: {
      type: String,
      enum: ['full', 'partial'],
      default: 'full',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processed'],
      default: 'pending',
    },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date },
    adminNote: { type: String, maxlength: 2000 },
    razorpayRefundId: { type: String, maxlength: 200 },
    razorpayRefundStatus: { type: String, maxlength: 50 },
    razorpayRefundSpeed: { type: String, maxlength: 50 },
    gatewayResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Backs up the "one active/processed refund per payment" rule enforced by
// PaymentService.processRefundPayment: at most ONE refund in {pending, approved,
// processed} may exist per payment. Rejected refunds may be retried, and a fully
// processed refund leaves the filter set, so this never blocks a same-payment refund
// that was legitimately rejected first.
refundSchema.index(
  { payment: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'approved', 'processed'] } },
  }
);
refundSchema.index({ status: 1, createdAt: -1 });
refundSchema.index({ user: 1, createdAt: -1 });
refundSchema.index({ payment: 1, createdAt: -1 });

export const Refund = mongoose.model<IRefund>('Refund', refundSchema);
