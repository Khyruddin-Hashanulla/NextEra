import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRefund extends Document {
  payment: Types.ObjectId;
  user: Types.ObjectId;
  course?: Types.ObjectId;
  bundle?: Types.ObjectId;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  adminNote?: string;
  razorpayRefundId?: string;
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
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processed'],
      default: 'pending',
    },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date },
    adminNote: { type: String },
    razorpayRefundId: { type: String },
  },
  { timestamps: true }
);

export const Refund = mongoose.model<IRefund>('Refund', refundSchema);
