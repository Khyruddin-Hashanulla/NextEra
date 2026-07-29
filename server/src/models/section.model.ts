import mongoose, { Schema, Document } from 'mongoose';

export interface ISection extends Document {
  course: mongoose.Types.ObjectId;
  title: string;
  description: string;
  objective: string;
  order: number;
  totalLectures: number;
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

const sectionSchema = new Schema<ISection>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
      maxlength: 200,
    },
    description: { type: String, default: '', maxlength: 5000 },
    objective: { type: String, default: '', maxlength: 2000 },
    order: { type: Number, default: 0 },
    totalLectures: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sectionSchema.index({ course: 1, order: 1 });

export const Section = mongoose.model<ISection>('Section', sectionSchema);
