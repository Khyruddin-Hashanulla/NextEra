import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  rating: number;
  review: string;
  instructorReply?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: '', maxlength: 2000 },
    instructorReply: { type: String, default: '', maxlength: 2000 },
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, course: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
