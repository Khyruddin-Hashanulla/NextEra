import mongoose, { Schema, Document } from 'mongoose';

export interface IFeaturedPromotion extends Document {
  type: 'course' | 'instructor';
  course?: mongoose.Types.ObjectId;
  instructor?: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  price: number;
  payment?: mongoose.Types.ObjectId;
  status: 'active' | 'expired' | 'cancelled';
  position: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const featuredPromotionSchema = new Schema<IFeaturedPromotion>(
  {
    type: { type: String, enum: ['course', 'instructor'], required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course' },
    instructor: { type: Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    price: { type: Number, required: true, min: 0 },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    position: { type: Number, default: 0 },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

featuredPromotionSchema.index({ status: 1, position: 1 });

export const FeaturedPromotion = mongoose.model<IFeaturedPromotion>(
  'FeaturedPromotion',
  featuredPromotionSchema
);
