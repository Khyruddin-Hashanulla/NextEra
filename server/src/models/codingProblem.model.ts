import mongoose, { Schema, Document } from 'mongoose';

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isSample: boolean;
  explanation?: string;
}

export interface ICodingProblem extends Document {
  title: string;
  slug: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  categories: string[];
  supportedLanguages: string[];
  timeLimit: number;
  memoryLimit: number;
  testCases: ITestCase[];
  solutionTemplate: Record<string, string>;
  solutionApproach?: string;
  instructorSolution?: string;
  totalSubmissions: number;
  acceptedSubmissions: number;
  createdBy: mongoose.Types.ObjectId;
  course?: mongoose.Types.ObjectId;
  lecture?: mongoose.Types.ObjectId;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const testCaseSchema = new Schema<ITestCase>({
  input: { type: String, required: true, maxlength: 5000 },
  expectedOutput: { type: String, required: true, maxlength: 5000 },
  isSample: { type: Boolean, default: false },
  explanation: { type: String, maxlength: 2000 },
}, { _id: false });

const codingProblemSchema = new Schema<ICodingProblem>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 50000 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 50 }],
    categories: [{ type: String, trim: true, lowercase: true, maxlength: 50 }],
    supportedLanguages: [{ type: String, enum: ['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'rust'], default: ['javascript', 'python'], maxlength: 20 }],
    timeLimit: { type: Number, default: 2, min: 1, max: 60 },
    memoryLimit: { type: Number, default: 256, min: 16, max: 1024 },
    testCases: [testCaseSchema],
    solutionTemplate: { type: Schema.Types.Mixed, default: {} },
    solutionApproach: { type: String, maxlength: 10000 },
    instructorSolution: { type: String, maxlength: 50000 },
    totalSubmissions: { type: Number, default: 0 },
    acceptedSubmissions: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', index: true },
    lecture: { type: Schema.Types.ObjectId, ref: 'Lecture', index: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

codingProblemSchema.index({ difficulty: 1, isPublished: 1 });
codingProblemSchema.index({ tags: 1 });

export const CodingProblem = mongoose.model<ICodingProblem>('CodingProblem', codingProblemSchema);
