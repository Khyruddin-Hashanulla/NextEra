import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignmentSubmission extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  lecture: mongoose.Types.ObjectId;
  content: string;
  files: { url: string; publicId: string; name: string }[];
  status: 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
  submittedAt: Date;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    lecture: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true },
    content: { type: String, default: '', maxlength: 5000 },
    files: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        name: { type: String, required: true },
      },
    ],
    status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
    grade: { type: Number, min: 0, max: 100 },
    feedback: { type: String, maxlength: 2000 },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date },
  },
  { timestamps: true }
);

assignmentSubmissionSchema.index({ user: 1, lecture: 1 }, { unique: true });

export const AssignmentSubmission = mongoose.model<IAssignmentSubmission>('AssignmentSubmission', assignmentSubmissionSchema);
