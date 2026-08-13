import mongoose, { Schema, Document } from 'mongoose';

export type QuestionType = 'single' | 'multiple' | 'boolean' | 'fill_blank' | 'matching' | 'coding' | 'essay';
export type EvaluationStatus = 'in_progress' | 'auto_graded' | 'pending' | 'graded' | 'published';
export type QuestionStatus = 'correct' | 'incorrect' | 'skipped' | 'partial' | 'pending';

export interface IQuizAttemptDetail {
  questionId: string;
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  selectedAnswer: string;
  isCorrect: boolean;
  marksObtained: number;
  maxMarks: number;
  status: QuestionStatus;
  explanation?: string;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
}

export interface IQuizAttemptGradingHistoryEntry {
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  letterGrade?: string;
  feedback?: string;
  gradedBy: mongoose.Types.ObjectId;
  gradedAt: Date;
  action: 'manual_grade' | 'override' | 'publish' | 'auto_grade';
}

export interface IQuizAttempt extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  lecture: mongoose.Types.ObjectId;
  quizTitle?: string;
  attemptNumber: number;
  answers: {
    question: string;
    questionId?: string;
    selectedAnswer: string;
    isCorrect: boolean;
    type?: QuestionType;
    marksObtained?: number;
    maxMarks?: number;
    status?: QuestionStatus;
    explanation?: string;
    feedback?: string;
    correctAnswer?: string;
  }[];
  details?: IQuizAttemptDetail[];
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  passingPercentage: number;
  passFail: 'pass' | 'fail';
  passed: boolean;
  letterGrade?: string;
  timeTaken?: number;
  timeLimit?: number;
  autoSubmitted: boolean;
  evaluationStatus: EvaluationStatus;
  evaluationVersion: number;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
  publishedAt?: Date;
  publishedBy?: mongoose.Types.ObjectId;
  gradingHistory?: IQuizAttemptGradingHistoryEntry[];
  startedAt: Date;
  completedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
}

const quizAttemptDetailSchema = new Schema<IQuizAttemptDetail>(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true, maxlength: 2000 },
    type: {
      type: String,
      enum: ['single', 'multiple', 'boolean', 'fill_blank', 'matching', 'coding', 'essay'],
      required: true,
    },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true, maxlength: 2000 },
    selectedAnswer: { type: String, required: true, maxlength: 2000 },
    isCorrect: { type: Boolean, required: true },
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['correct', 'incorrect', 'skipped', 'partial', 'pending'], required: true },
    explanation: { type: String, maxlength: 5000 },
    feedback: { type: String, maxlength: 2000 },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    gradedAt: { type: Date },
  },
  { _id: false }
);

const quizAttemptGradingHistorySchema = new Schema<IQuizAttemptGradingHistoryEntry>(
  {
    marksObtained: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    letterGrade: { type: String, maxlength: 10 },
    feedback: { type: String, maxlength: 2000 },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gradedAt: { type: Date, required: true, default: Date.now },
    action: { type: String, enum: ['manual_grade', 'override', 'publish', 'auto_grade'], required: true },
  },
  { _id: false }
);

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    lecture: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true },
    quizTitle: { type: String, maxlength: 200 },
    attemptNumber: { type: Number, required: true, min: 1 },
    answers: [
      {
        question: { type: String, required: true, maxlength: 2000 },
        questionId: { type: String },
        selectedAnswer: { type: String, required: true, maxlength: 2000 },
        isCorrect: { type: Boolean, required: true },
        type: { type: String, enum: ['single', 'multiple', 'boolean', 'fill_blank', 'matching', 'coding', 'essay'] },
        marksObtained: { type: Number, min: 0 },
        maxMarks: { type: Number, min: 0 },
        status: { type: String, enum: ['correct', 'incorrect', 'skipped', 'partial', 'pending'] },
        explanation: { type: String, maxlength: 5000 },
        feedback: { type: String, maxlength: 2000 },
        correctAnswer: { type: String, maxlength: 2000 },
      },
    ],
    details: [quizAttemptDetailSchema],
    score: { type: Number, required: true, min: 0 },
    totalQuestions: { type: Number, required: true, min: 1 },
    correctAnswers: { type: Number, default: 0, min: 0 },
    incorrectAnswers: { type: Number, default: 0, min: 0 },
    skippedQuestions: { type: Number, default: 0, min: 0 },
    marksObtained: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    passingPercentage: { type: Number, required: true, min: 0, max: 100 },
    passFail: { type: String, enum: ['pass', 'fail'], required: true },
    passed: { type: Boolean, required: true },
    letterGrade: { type: String, maxlength: 10 },
    timeTaken: { type: Number, min: 0 },
    timeLimit: { type: Number, min: 0 },
    autoSubmitted: { type: Boolean, default: false },
    evaluationStatus: {
      type: String,
      enum: ['in_progress', 'auto_graded', 'pending', 'graded', 'published'],
      default: 'in_progress',
    },
    evaluationVersion: { type: Number, default: 1 },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    gradedAt: { type: Date },
    publishedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    gradingHistory: [quizAttemptGradingHistorySchema],
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
    submittedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

quizAttemptSchema.index({ user: 1, lecture: 1 });
quizAttemptSchema.index({ lecture: 1, createdAt: -1 });
quizAttemptSchema.index({ lecture: 1, score: -1 });
quizAttemptSchema.index({ user: 1, createdAt: -1 });
quizAttemptSchema.index({ course: 1 });
quizAttemptSchema.index({ evaluationStatus: 1, lecture: 1 });

export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);
