import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  lecture: mongoose.Types.ObjectId;
  content: string;
  timestamp?: number;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lecture: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true, index: true },
    content: { type: String, required: true, maxlength: 5000 },
    timestamp: { type: Number, default: undefined },
  },
  { timestamps: true }
);

noteSchema.index({ user: 1, lecture: 1 });

export const Note = mongoose.model<INote>('Note', noteSchema);
