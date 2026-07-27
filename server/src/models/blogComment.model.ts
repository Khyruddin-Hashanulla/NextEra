import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogComment extends Document {
  blog: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  parent?: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  likeCount: number;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const blogCommentSchema = new Schema<IBlogComment>(
  {
    blog: { type: Schema.Types.ObjectId, ref: 'Blog', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 5000 },
    parent: { type: Schema.Types.ObjectId, ref: 'BlogComment', default: null },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likeCount: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

blogCommentSchema.index({ blog: 1, createdAt: -1 });

export const BlogComment = mongoose.model<IBlogComment>('BlogComment', blogCommentSchema);
