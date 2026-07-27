import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogBookmark extends Document {
  user: mongoose.Types.ObjectId;
  blog: mongoose.Types.ObjectId;
  createdAt: Date;
}

const blogBookmarkSchema = new Schema<IBlogBookmark>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    blog: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

blogBookmarkSchema.index({ user: 1, blog: 1 }, { unique: true });

export const BlogBookmark = mongoose.model<IBlogBookmark>('BlogBookmark', blogBookmarkSchema);
