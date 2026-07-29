import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizAttempt extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  lecture: mongoose.Types.ObjectId;
  answers: { question: string; selectedAnswer: string; isCorrect: boolean }[];
  score: number;
  totalQuestions: number;
  passed: boolean;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    lecture: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true },
    answers: [
      {
        question: { type: String, required: true, maxlength: 2000 },
        selectedAnswer: { type: String, required: true, maxlength: 2000 },
        isCorrect: { type: Boolean, required: true },
      },
    ],
    score: { type: Number, required: true, min: 0 },
    totalQuestions: { type: Number, required: true, min: 1 },
    passed: { type: Boolean, required: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

quizAttemptSchema.index({ user: 1, lecture: 1 });

export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);
