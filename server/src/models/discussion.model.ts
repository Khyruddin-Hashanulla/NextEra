import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscussion extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  lecture?: mongoose.Types.ObjectId;
  title: string;
  content: string;
  replies: {
    user: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const discussionSchema = new Schema<IDiscussion>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lecture: { type: Schema.Types.ObjectId, ref: 'Lecture', index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 5000 },
    replies: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true, maxlength: 5000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

discussionSchema.index({ course: 1, createdAt: -1 });

export const Discussion = mongoose.model<IDiscussion>('Discussion', discussionSchema);
