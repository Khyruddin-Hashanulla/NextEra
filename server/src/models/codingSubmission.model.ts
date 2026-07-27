import mongoose, { Schema, Document } from 'mongoose';

export interface ITestResult {
  testCaseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
  runtime?: number;
  memoryUsed?: number;
}

export interface ICodingSubmission extends Document {
  user: mongoose.Types.ObjectId;
  problem: mongoose.Types.ObjectId;
  code: string;
  language: string;
  status: 'pending' | 'running' | 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'runtime_error' | 'compilation_error';
  testResults: ITestResult[];
  score: number;
  totalTestCases: number;
  passedTestCases: number;
  runtime: number;
  memoryUsed: number;
  errorMessage?: string;
  isPractice: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const testResultSchema = new Schema<ITestResult>({
  testCaseIndex: { type: Number, required: true },
  input: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  actualOutput: { type: String, default: '' },
  passed: { type: Boolean, required: true },
  error: { type: String },
  runtime: { type: Number },
  memoryUsed: { type: Number },
}, { _id: false });

const codingSubmissionSchema = new Schema<ICodingSubmission>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problem: { type: Schema.Types.ObjectId, ref: 'CodingProblem', required: true, index: true },
    code: { type: String, required: true, maxlength: 100000 },
    language: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error'],
      default: 'pending',
    },
    testResults: [testResultSchema],
    score: { type: Number, default: 0, min: 0, max: 100 },
    totalTestCases: { type: Number, default: 0 },
    passedTestCases: { type: Number, default: 0 },
    runtime: { type: Number, default: 0 },
    memoryUsed: { type: Number, default: 0 },
    errorMessage: { type: String, maxlength: 5000 },
    isPractice: { type: Boolean, default: true },
  },
  { timestamps: true }
);

codingSubmissionSchema.index({ user: 1, problem: 1 });
codingSubmissionSchema.index({ problem: 1, status: 1 });

export const CodingSubmission = mongoose.model<ICodingSubmission>('CodingSubmission', codingSubmissionSchema);
