import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoSource {
  source: 'youtube' | 'vimeo' | 'bunny' | 's3' | 'direct' | 'none';
  url: string;
  videoId: string;
  provider: string;
  thumbnailUrl: string;
  playbackRate: number;
  qualities: string[];
}

export interface ILectureAttachment {
  url: string;
  publicId: string;
  name: string;
  type: string;
  size: number;
}

export interface ILectureAssignment {
  question: string;
  instructions: string;
  dueDate?: Date;
  totalMarks: number;
  passingMarks: number;
  allowLateSubmission: boolean;
  lateSubmissionDays: number;
  penaltyPercent: number;
}

export interface ILectureQuiz {
  timeLimit: number;
  passingScore: number;
  maxAttempts: number;
  showResults: boolean;
  randomizeQuestions: boolean;
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    marks: number;
  }[];
}

export interface ILecture extends Document {
  section: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  type: 'video' | 'article' | 'assignment' | 'quiz';
  duration: number;
  videoSource: IVideoSource;
  videoUrl: { url: string; publicId: string };
  articleContent: string;
  resources: { url: string; publicId: string; name: string; type: string; size: number }[];
  attachments: ILectureAttachment[];
  sourceCode: { url: string; publicId: string; name: string; size: number };
  practiceFiles: ILectureAttachment[];
  notes: string;
  assignment: ILectureAssignment;
  quiz: ILectureQuiz;
  order: number;
  isFree: boolean;
  seoTitle: string;
  seoDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

const lectureSchema = new Schema<ILecture>(
  {
    section: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Lecture title is required'],
      trim: true,
    },
    slug: { type: String, default: '' },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['video', 'article', 'assignment', 'quiz'],
      required: [true, 'Lecture type is required'],
    },
    duration: { type: Number, default: 0 },
    videoSource: {
      source: { type: String, enum: ['youtube', 'vimeo', 'bunny', 's3', 'direct', 'none'], default: 'none' },
      url: { type: String, default: '' },
      videoId: { type: String, default: '' },
      provider: { type: String, default: '' },
      thumbnailUrl: { type: String, default: '' },
      playbackRate: { type: Number, default: 1 },
      qualities: [String],
    },
    videoUrl: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    articleContent: { type: String, default: '' },
    resources: [
      {
        url: { type: String },
        publicId: { type: String },
        name: { type: String },
        type: { type: String },
        size: { type: Number, default: 0 },
      },
    ],
    attachments: [
      {
        url: { type: String },
        publicId: { type: String },
        name: { type: String },
        type: { type: String },
        size: { type: Number, default: 0 },
      },
    ],
    sourceCode: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      name: { type: String, default: '' },
      size: { type: Number, default: 0 },
    },
    practiceFiles: [
      {
        url: { type: String },
        publicId: { type: String },
        name: { type: String },
        type: { type: String },
        size: { type: Number, default: 0 },
      },
    ],
    notes: { type: String, default: '' },
    assignment: {
      question: { type: String, default: '' },
      instructions: { type: String, default: '' },
      dueDate: Date,
      totalMarks: { type: Number, default: 100 },
      passingMarks: { type: Number, default: 60 },
      allowLateSubmission: { type: Boolean, default: false },
      lateSubmissionDays: { type: Number, default: 7 },
      penaltyPercent: { type: Number, default: 10 },
    },
    quiz: {
      timeLimit: { type: Number, default: 0 },
      passingScore: { type: Number, default: 60 },
      maxAttempts: { type: Number, default: 3 },
      showResults: { type: Boolean, default: true },
      randomizeQuestions: { type: Boolean, default: false },
      questions: [
        {
          question: { type: String },
          options: [String],
          correctAnswer: { type: String },
          explanation: { type: String, default: '' },
          marks: { type: Number, default: 1 },
        },
      ],
    },
    order: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
  },
  { timestamps: true }
);

lectureSchema.index({ section: 1, order: 1 });
lectureSchema.index({ course: 1, order: 1 });

export const Lecture = mongoose.model<ILecture>('Lecture', lectureSchema);
