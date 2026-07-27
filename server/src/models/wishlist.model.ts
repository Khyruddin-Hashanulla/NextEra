import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlist extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  createdAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

wishlistSchema.index({ user: 1, course: 1 }, { unique: true });

export const Wishlist = mongoose.model<IWishlist>('Wishlist', wishlistSchema);
