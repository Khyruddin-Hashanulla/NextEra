import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionEnrollment extends Document {
  user: mongoose.Types.ObjectId;
  subscription: mongoose.Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionEnrollmentSchema = new Schema<ISubscriptionEnrollment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    autoRenew: { type: Boolean, default: false },
  },
  { timestamps: true }
);

subscriptionEnrollmentSchema.index({ user: 1, status: 1 });

export const SubscriptionEnrollment = mongoose.model<ISubscriptionEnrollment>(
  'SubscriptionEnrollment',
  subscriptionEnrollmentSchema
);
