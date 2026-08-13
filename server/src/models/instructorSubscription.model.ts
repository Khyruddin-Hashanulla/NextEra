import mongoose, { Schema, Document } from 'mongoose';

export type InstructorSubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';

export interface IInstructorSubscriptionPriceSnapshot {
  amount: number;
  currency: string;
  durationDays: number;
}

export interface IInstructorSubscription extends Document {
  instructor: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  planSnapshot: {
    code: string;
    name: string;
    price: number;
    durationDays: number;
  };
  payment?: mongoose.Types.ObjectId;
  paymentReference?: string;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  priceSnapshot?: IInstructorSubscriptionPriceSnapshot;
  startDate: Date;
  endDate: Date;
  status: InstructorSubscriptionStatus;
  autoRenew: boolean;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Canonicalize legacy lowercase statuses (e.g. 'active', 'cancelled') to the
// enum's uppercase form on every write, so reads that filter on 'ACTIVE' never
// silently miss older documents and validation never rejects them.
const STATUS_CANONICAL: Record<string, string> = {
  active: 'ACTIVE',
  trialing: 'TRIALING',
  trial: 'TRIALING',
  past_due: 'PAST_DUE',
  pastdue: 'PAST_DUE',
  cancelled: 'CANCELLED',
  canceled: 'CANCELLED',
  expired: 'EXPIRED',
  suspended: 'SUSPENDED',
};

function canonicalizeStatus(value: string): string {
  if (typeof value === 'string' && STATUS_CANONICAL[value.toLowerCase()]) {
    return STATUS_CANONICAL[value.toLowerCase()];
  }
  return value;
}

const instructorSubscriptionSchema = new Schema<IInstructorSubscription>(
  {
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: Schema.Types.ObjectId, ref: 'InstructorSubscriptionPlan', required: true },
    planSnapshot: {
      code: { type: String, default: '' },
      name: { type: String, default: '' },
      price: { type: Number, default: 0 },
      durationDays: { type: Number, default: 30 },
    },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
    paymentReference: { type: String, default: '' },
    razorpaySubscriptionId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    priceSnapshot: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      durationDays: { type: Number, default: 30 },
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'SUSPENDED'],
      default: 'ACTIVE',
      set: canonicalizeStatus,
    },
    autoRenew: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, default: '' },
  },
  { timestamps: true }
);

function canonicalizeStatusInUpdate(this: any) {
  const update = this.getUpdate?.();
  if (!update) return;
  if (update.$set && typeof update.$set === 'object' && typeof update.$set.status === 'string') {
    update.$set.status = canonicalizeStatus(update.$set.status);
    return;
  }
  if (typeof update.status === 'string') {
    update.status = canonicalizeStatus(update.status);
  }
}

instructorSubscriptionSchema.pre('findOneAndUpdate', canonicalizeStatusInUpdate);

instructorSubscriptionSchema.index({ instructor: 1, status: 1 });
instructorSubscriptionSchema.index({ instructor: 1, createdAt: -1 });
// Guarantee at most one ACTIVE subscription per instructor. Duplicate ACTIVE
// records were previously possible via concurrent verify/webhook requests.
// NOTE: building this index fails if duplicate ACTIVE rows already exist; run a
// reconciliation migration before applying it to an existing production DB.
instructorSubscriptionSchema.index({ instructor: 1 }, { unique: true, partialFilterExpression: { status: 'ACTIVE' } });

export const InstructorSubscription = mongoose.model<IInstructorSubscription>(
  'InstructorSubscription',
  instructorSubscriptionSchema
);
