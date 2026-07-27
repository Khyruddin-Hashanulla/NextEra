import mongoose, { Schema, Document } from 'mongoose';

export interface IInstructorSubscriptionPlan extends Document {
  name: string;
  type: 'free' | 'paid';
  price: number;
  durationDays: number;
  description: string;
  features: {
    freeCoursesLimit: number;
    unlimitedCourses: boolean;
    storageLimitMB: number;
    advancedAnalytics: boolean;
    coupons: boolean;
    liveClasses: boolean;
    featuredInstructor: boolean;
    prioritySupport: boolean;
    unlimitedStorage: boolean;
    premiumMarketing: boolean;
  };
  status: 'active' | 'inactive';
  totalSubscribers: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const instructorSubscriptionPlanSchema = new Schema<IInstructorSubscriptionPlan>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['free', 'paid'], required: true, default: 'free' },
    price: { type: Number, required: true, default: 0, min: 0 },
    durationDays: { type: Number, required: true, default: 30 },
    description: { type: String, default: '' },
    features: {
      freeCoursesLimit: { type: Number, default: 2 },
      unlimitedCourses: { type: Boolean, default: false },
      storageLimitMB: { type: Number, default: 500 },
      advancedAnalytics: { type: Boolean, default: false },
      coupons: { type: Boolean, default: false },
      liveClasses: { type: Boolean, default: false },
      featuredInstructor: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      unlimitedStorage: { type: Boolean, default: false },
      premiumMarketing: { type: Boolean, default: false },
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    totalSubscribers: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const InstructorSubscriptionPlan = mongoose.model<IInstructorSubscriptionPlan>(
  'InstructorSubscriptionPlan',
  instructorSubscriptionPlanSchema
);
