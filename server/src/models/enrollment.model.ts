import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  enrolledAt: Date;
  completionPercentage: number;
  completedLectures: mongoose.Types.ObjectId[];
  isCompleted: boolean;
  certificateUrl?: string;
  lastWatchedLecture?: mongoose.Types.ObjectId;
  lastWatchedTimestamp?: number;
  watchHistory: { lecture: mongoose.Types.ObjectId; lastPosition: number; completed: boolean; watchedAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    enrolledAt: { type: Date, default: Date.now },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    completedLectures: [{ type: Schema.Types.ObjectId, ref: 'Lecture' }],
    isCompleted: { type: Boolean, default: false },
    certificateUrl: String,
    lastWatchedLecture: { type: Schema.Types.ObjectId, ref: 'Lecture' },
    lastWatchedTimestamp: { type: Number, default: 0 },
    watchHistory: [
      {
        lecture: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true },
        lastPosition: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        watchedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
