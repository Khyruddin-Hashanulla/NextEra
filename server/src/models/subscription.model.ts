import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  name: string;
  description: string;
  price: number;
  discountedPrice: number;
  durationDays: number;
  features: string[];
  level: 'basic' | 'standard' | 'premium';
  status: 'active' | 'inactive';
  totalSubscribers: number;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, default: 0, min: 0 },
    durationDays: { type: Number, required: true, default: 30 },
    features: [{ type: String, maxlength: 200 }],
    level: {
      type: String,
      enum: ['basic', 'standard', 'premium'],
      default: 'basic',
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    totalSubscribers: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
