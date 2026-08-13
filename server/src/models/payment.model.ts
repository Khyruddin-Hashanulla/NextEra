import mongoose, { Schema, Document } from 'mongoose';

export interface ICommissionSplit {
  instructor: mongoose.Types.ObjectId;
  baseAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  instructorShare: number;
}

export interface IPaymentFailureDetails {
  failureCode: string;
  failureReason: string;
  failureDescription: string;
  paymentMethod: string;
  bank: string;
  wallet: string;
  upiProvider: string;
  cardLast4: string;
  cardNetwork: string;
  cardIssuer: string;
  failedAt: Date;
}

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  referredBy?: mongoose.Types.ObjectId;
  affiliateCommission?: number;
  type: 'course' | 'bundle' | 'subscription' | 'instructor_subscription';
  course?: mongoose.Types.ObjectId;
  bundle?: mongoose.Types.ObjectId;
  subscription?: mongoose.Types.ObjectId;
  subscriptionEnrollment?: mongoose.Types.ObjectId;
  instructorSubscription?: mongoose.Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  coupon?: mongoose.Types.ObjectId;
  discountAmount: number;
  commissionPercent: number;
  commissionSplits: ICommissionSplit[];
  totalCommissionAmount: number;
  totalInstructorShare: number;
  walletCredited: boolean;
  pendingReason?: string;
  failureDetails?: IPaymentFailureDetails;
  paymentCapturedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const commissionSplitSchema = new Schema<ICommissionSplit>(
  {
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    baseAmount: { type: Number, required: true },
    commissionPercent: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    instructorShare: { type: Number, required: true },
  },
  { _id: false }
);

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    affiliateCommission: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ['course', 'bundle', 'subscription', 'instructor_subscription'],
      required: true,
      default: 'course',
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    bundle: {
      type: Schema.Types.ObjectId,
      ref: 'Bundle',
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    subscriptionEnrollment: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionEnrollment',
    },
    instructorSubscription: {
      type: Schema.Types.ObjectId,
      ref: 'InstructorSubscription',
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: String,
    razorpaySignature: String,
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    coupon: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    commissionPercent: {
      type: Number,
      default: 25,
    },
    commissionSplits: [commissionSplitSchema],
    totalCommissionAmount: { type: Number, default: 0 },
    totalInstructorShare: { type: Number, default: 0 },
    walletCredited: { type: Boolean, default: false },
    pendingReason: { type: String },
    failureDetails: {
      failureCode: { type: String },
      failureReason: { type: String },
      failureDescription: { type: String },
      paymentMethod: { type: String },
      bank: { type: String },
      wallet: { type: String },
      upiProvider: { type: String },
      cardLast4: { type: String },
      cardNetwork: { type: String },
      cardIssuer: { type: String },
      failedAt: { type: Date },
    },
    paymentCapturedAt: { type: Date },
    refundedAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1, course: 1 });
paymentSchema.index({ status: 1, type: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1, type: 1, createdAt: -1 });
paymentSchema.index({ 'commissionSplits.instructor': 1, status: 1, createdAt: -1 });
paymentSchema.index({ razorpayPaymentId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
