export interface QuizHistoryDetail {
  questionId: string;
  question: string;
  type?: string;
  selectedAnswer?: string;
  isCorrect: boolean;
  marksObtained: number;
  maxMarks: number;
  status?: string;
  letterGrade?: string;
  explanation?: string;
  feedback?: string;
}

export interface QuizHistoryAttempt {
  _id: string;
  title: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  completedAt?: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  letterGrade?: string;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken?: number;
  timeLimit?: number;
  status?: string;
  evaluationStatus?: string;
  details?: QuizHistoryDetail[];
}

export interface QuizHistorySummaryAttempt {
  attemptId?: string;
  attemptNumber: number;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  completedAt?: string;
}

export interface QuizHistoryStats {
  totalAttempts: number;
  averageScore: number;
  passedCount: number;
  latestAttempt?: QuizHistorySummaryAttempt | null;
  bestAttempt?: QuizHistorySummaryAttempt | null;
  scoreHistory?: { attemptNumber: number; percentage: number; completedAt?: string }[];
  attemptDistribution?: Record<string, number>;
}

export interface QuizHistoryOverview {
  quizzes: QuizHistoryAttempt[];
  stats: QuizHistoryStats;
}

export interface QuizAttemptResult {
  attempt: QuizHistoryAttempt;
  lecture?: { _id: string; title: string; course?: { _id: string; title?: string } };
}