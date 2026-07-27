import mongoose, { Schema, Document } from 'mongoose';

export interface IInstructorSubscription extends Document {
  instructor: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  payment?: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const instructorSubscriptionSchema = new Schema<IInstructorSubscription>(
  {
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: Schema.Types.ObjectId, ref: 'InstructorSubscriptionPlan', required: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
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

instructorSubscriptionSchema.index({ instructor: 1, status: 1 });

export const InstructorSubscription = mongoose.model<IInstructorSubscription>(
  'InstructorSubscription',
  instructorSubscriptionSchema
);
