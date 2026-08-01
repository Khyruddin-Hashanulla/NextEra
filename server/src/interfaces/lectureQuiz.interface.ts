import { Types } from 'mongoose';

export interface ILectureQuiz {
  timeLimit: number;
  passingScore: number;
  maxAttempts: number;
  showResults: boolean;
  randomizeQuestions: boolean;
  negativeMarking: boolean;
  partialMarking: boolean;
  attemptCooldownMinutes: number;
  allowResume: boolean;
  shuffleOptions: boolean;
  scoringPolicy: 'best' | 'latest' | 'average' | 'highest';
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    marks: number;
    type: QuestionType;
    negativeMarks: number;
    isBonus: boolean;
    weight: number;
    questionId?: string;
  }[];
}

export type QuestionType = 'single' | 'multiple' | 'boolean' | 'fill_blank' | 'matching' | 'coding' | 'essay';
