import mongoose, { Schema, Document } from 'mongoose';

export interface IStudyReminder extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'one-time';
  dayOfWeek?: number;
  time: string;
  course?: mongoose.Types.ObjectId;
  isActive: boolean;
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studyReminderSchema = new Schema<IStudyReminder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 500 },
    type: { type: String, enum: ['daily', 'weekly', 'one-time'], required: true },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    time: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    course: { type: Schema.Types.ObjectId, ref: 'Course' },
    isActive: { type: Boolean, default: true },
    lastTriggered: { type: Date },
  },
  { timestamps: true }
);

export const StudyReminder = mongoose.model<IStudyReminder>('StudyReminder', studyReminderSchema);
