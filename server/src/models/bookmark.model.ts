import mongoose, { Schema, Document } from 'mongoose';

export interface IBookmark extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  lecture: mongoose.Types.ObjectId;
  createdAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    lecture: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

bookmarkSchema.index({ user: 1, lecture: 1 }, { unique: true });

export const Bookmark = mongoose.model<IBookmark>('Bookmark', bookmarkSchema);
