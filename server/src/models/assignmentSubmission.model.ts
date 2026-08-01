import mongoose, { Schema, Document } from 'mongoose';
import { ASSIGNMENT_STATUSES, AssignmentStatus } from '../utils/grading';

export interface IAssignmentFile {
  url: string;
  publicId: string;
  name: string;
}

export interface IAssignmentRubricItem {
  criteria: string;
  maxPoints: number;
  obtainedPoints: number;
  comment?: string;
}

export interface IAssignmentGradingHistoryEntry {
  grade: number;
  maxMarks: number;
  percentage: number;
  passFail: 'pass' | 'fail';
  letterGrade: string;
  customGradeScale?: string;
  feedback?: string;
  privateNotes?: string;
  status: AssignmentStatus;
  gradedBy: mongoose.Types.ObjectId;
  gradedAt: Date;
}

export interface IAssignmentSubmission extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  lecture: mongoose.Types.ObjectId;
  content: string;
  files: IAssignmentFile[];
  status: AssignmentStatus;
  grade?: number;
  maxMarks?: number;
  percentage?: number;
  passFail?: 'pass' | 'fail';
  letterGrade?: string;
  customGradeScale?: string;
  rubric: IAssignmentRubricItem[];
  feedback?: string;
  privateNotes?: string;
  gradedFiles: IAssignmentFile[];
  gradedBy?: mongoose.Types.ObjectId;
  publishedAt?: Date;
  publishedBy?: mongoose.Types.ObjectId;
  submittedAt: Date;
  gradedAt?: Date;
  reviewedAt?: Date;
  resubmittedAt?: Date;
  resubmissionDeadline?: Date;
  submissionVersion: number;
  lateSubmission: boolean;
  penaltyPercent: number;
  penaltyApplied: boolean;
  gradingHistory: IAssignmentGradingHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const assignmentFileSchema = new Schema<IAssignmentFile>(
  {
    url: { type: String, required: true, maxlength: 500 },
    publicId: { type: String, required: true, maxlength: 200 },
    name: { type: String, required: true, maxlength: 200 },
  },
  { _id: false }
);

const rubricItemSchema = new Schema<IAssignmentRubricItem>(
  {
    criteria: { type: String, required: true, maxlength: 300 },
    maxPoints: { type: Number, required: true, min: 0, max: 100000 },
    obtainedPoints: { type: Number, required: true, min: 0, max: 100000 },
    comment: { type: String, maxlength: 1000 },
  },
  { _id: false }
);

const gradingHistoryEntrySchema = new Schema<IAssignmentGradingHistoryEntry>(
  {
    grade: { type: Number, required: true, min: 0, max: 100000 },
    maxMarks: { type: Number, required: true, min: 1, max: 100000 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    passFail: { type: String, enum: ['pass', 'fail'], required: true },
    letterGrade: { type: String, required: true, maxlength: 10 },
    customGradeScale: { type: String, maxlength: 200 },
    feedback: { type: String, maxlength: 2000 },
    privateNotes: { type: String, maxlength: 2000 },
    status: { type: String, enum: ASSIGNMENT_STATUSES, required: true },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gradedAt: { type: Date, required: true },
  },
  { _id: false }
);

const assignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lecture: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true, index: true },
    content: { type: String, default: '', maxlength: 5000 },
    files: {
      type: [assignmentFileSchema],
      default: [],
      validate: {
        validator: (files: IAssignmentFile[]) => files.length <= 5,
        message: 'A submission can have at most 5 files',
      },
    },
    status: {
      type: String,
      enum: ASSIGNMENT_STATUSES,
      default: 'submitted',
    },
    grade: { type: Number, min: 0, max: 100000 },
    maxMarks: { type: Number, min: 1, max: 100000 },
    percentage: { type: Number, min: 0, max: 100 },
    passFail: { type: String, enum: ['pass', 'fail'] },
    letterGrade: { type: String, maxlength: 10 },
    customGradeScale: { type: String, maxlength: 200 },
    rubric: {
      type: [rubricItemSchema],
      default: [],
      validate: {
        validator: (items: IAssignmentRubricItem[]) => items.length <= 50,
        message: 'A rubric can have at most 50 criteria',
      },
    },
    feedback: { type: String, maxlength: 2000 },
    privateNotes: { type: String, maxlength: 2000 },
    gradedFiles: {
      type: [assignmentFileSchema],
      default: [],
      validate: {
        validator: (files: IAssignmentFile[]) => files.length <= 5,
        message: 'Reviewed files can have at most 5 entries',
      },
    },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date },
    reviewedAt: { type: Date },
    resubmittedAt: { type: Date },
    resubmissionDeadline: { type: Date },
    submissionVersion: { type: Number, default: 1 },
    lateSubmission: { type: Boolean, default: false },
    penaltyPercent: { type: Number, default: 0, min: 0, max: 100 },
    penaltyApplied: { type: Boolean, default: false },
    gradingHistory: {
      type: [gradingHistoryEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

assignmentSubmissionSchema.index({ user: 1, lecture: 1 }, { unique: true });
assignmentSubmissionSchema.index({ lecture: 1, status: 1 });
assignmentSubmissionSchema.index({ course: 1, status: 1 });
assignmentSubmissionSchema.index({ status: 1, submittedAt: -1 });

export const AssignmentSubmission = mongoose.model<IAssignmentSubmission>(
  'AssignmentSubmission',
  assignmentSubmissionSchema
);
