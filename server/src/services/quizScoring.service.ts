import { IQuizAttemptDetail, QuestionType, QuestionStatus, EvaluationStatus } from '../models/quizAttempt.model';
import { computeLetterGrade } from '../utils/grading';

export interface NormalizedQuestion {
  questionId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  marks: number;
  type: QuestionType;
  negativeMarks: number;
  isBonus: boolean;
  weight: number;
}

export interface QuestionGradeResult {
  isCorrect: boolean;
  marksObtained: number;
  maxMarks: number;
  status: QuestionStatus;
}

export interface AttemptResult {
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  passFail: 'pass' | 'fail';
  letterGrade: string;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  timeTaken?: number;
  evaluationStatus: EvaluationStatus;
  details: IQuizAttemptDetail[];
}

export interface QuizConfig {
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
  questions: NormalizedQuestion[];
}

function normalizeLegacyQuestions(legacyJson: string): NormalizedQuestion[] {
  try {
    const parsed = JSON.parse(legacyJson) as {
      question: string;
      options: string[];
      correctAnswer: string;
      explanation?: string;
      marks?: number;
    }[];
    return parsed.map((q, idx) => ({
      questionId: `legacy_${idx}`,
      question: q.question,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      marks: q.marks || 1,
      type: 'single' as QuestionType,
      negativeMarks: 0,
      isBonus: false,
      weight: 1,
    }));
  } catch {
    return [];
  }
}

export function resolveQuizQuestions(lecture: {
  quiz?: ILectureQuiz;
  assignment?: { question: string };
}): NormalizedQuestion[] {
  const quiz = lecture.quiz;
  if (quiz && quiz.questions && quiz.questions.length > 0) {
    return quiz.questions.map((q, idx) => ({
      questionId: q.questionId || `q_${idx}`,
      question: q.question,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      marks: q.marks || 1,
      type: (q.type as QuestionType) || 'single',
      negativeMarks: q.negativeMarks || 0,
      isBonus: q.isBonus || false,
      weight: q.weight || 1,
    }));
  }
  if (lecture.assignment?.question) {
    return normalizeLegacyQuestions(lecture.assignment.question);
  }
  return [];
}

function parseAnswer(answer: string): string | string[] | Record<string, string> {
  try {
    const parsed = JSON.parse(answer);
    if (Array.isArray(parsed) || (typeof parsed === 'object' && parsed !== null)) return parsed;
    return parsed;
  } catch {
    return answer;
  }
}

function compareAnswers(
  selected: string,
  correct: string,
  type: QuestionType,
  partialMarking: boolean
): { isCorrect: boolean; partialScore?: number } {
  const selectedParsed = parseAnswer(selected);
  const correctParsed = parseAnswer(correct);

  switch (type) {
    case 'single':
    case 'boolean': {
      const match = String(selectedParsed).trim().toLowerCase() === String(correctParsed).trim().toLowerCase();
      return { isCorrect: match };
    }
    case 'multiple': {
      const selectedArr = Array.isArray(selectedParsed) ? selectedParsed : [selectedParsed];
      const correctArr = Array.isArray(correctParsed) ? correctParsed : [correctParsed];
      const correctSet = new Set(correctArr.map(String));
      const selectedSet = new Set(selectedArr.map(String));
      const isExact = correctSet.size === selectedSet.size && [...correctSet].every((v) => selectedSet.has(v));
      if (partialMarking) {
        let correctCount = 0;
        for (const sel of selectedArr) {
          if (correctSet.has(String(sel))) correctCount++;
        }
        const partial = correctArr.length > 0 ? correctCount / correctArr.length : 0;
        return { isCorrect: isExact, partialScore: partial };
      }
      return { isCorrect: isExact };
    }
    case 'fill_blank': {
      const selectedStr = String(selectedParsed).trim().toLowerCase();
      const correctArr = Array.isArray(correctParsed) ? correctParsed : [correctParsed];
      const matched = correctArr.some((c) => String(c).trim().toLowerCase() === selectedStr);
      if (partialMarking) {
        const maxSimilarity = Math.max(
          ...correctArr.map((c) => {
            const cs = String(c).trim().toLowerCase();
            let matches = 0;
            for (let i = 0; i < Math.min(cs.length, selectedStr.length); i++) {
              if (cs[i] === selectedStr[i]) matches++;
            }
            return matches / Math.max(cs.length, selectedStr.length, 1);
          })
        );
        return { isCorrect: matched, partialScore: matched ? 1 : maxSimilarity };
      }
      return { isCorrect: matched };
    }
    case 'matching': {
      const selectedObj = selectedParsed as Record<string, string>;
      const correctObj = correctParsed as Record<string, string>;
      const correctKeys = Object.keys(correctObj);
      let matched = 0;
      for (const key of correctKeys) {
        if (selectedObj[key] !== undefined && String(selectedObj[key]).trim() === String(correctObj[key]).trim()) {
          matched++;
        }
      }
      const isExact = matched === correctKeys.length && Object.keys(selectedObj).length === correctKeys.length;
      if (partialMarking && correctKeys.length > 0) {
        return { isCorrect: isExact, partialScore: matched / correctKeys.length };
      }
      return { isCorrect: isExact };
    }
    case 'coding':
    case 'essay':
      return { isCorrect: false };
    default:
      return { isCorrect: false };
  }
}

export function gradeQuestion(
  question: NormalizedQuestion,
  selectedAnswer: string,
  config: { negativeMarking: boolean; partialMarking: boolean }
): QuestionGradeResult {
  if (!selectedAnswer || selectedAnswer.trim() === '') {
    return {
      isCorrect: false,
      marksObtained: 0,
      maxMarks: question.marks,
      status: 'skipped',
    };
  }

  if (question.type === 'coding' || question.type === 'essay') {
    return {
      isCorrect: false,
      marksObtained: 0,
      maxMarks: question.marks,
      status: 'pending',
    };
  }

  const { isCorrect, partialScore } = compareAnswers(
    selectedAnswer,
    question.correctAnswer,
    question.type,
    config.partialMarking
  );
  let marksObtained = 0;

  if (isCorrect) {
    marksObtained = question.marks * question.weight;
    return {
      isCorrect: true,
      marksObtained,
      maxMarks: question.marks * question.weight,
      status: 'correct',
    };
  }

  if (partialScore !== undefined && partialScore > 0) {
    marksObtained = question.marks * question.weight * partialScore;
    return {
      isCorrect: false,
      marksObtained: Math.round(marksObtained * 100) / 100,
      maxMarks: question.marks * question.weight,
      status: 'partial',
    };
  }

  if (config.negativeMarking && question.negativeMarks > 0) {
    marksObtained = -question.negativeMarks;
  }

  return {
    isCorrect: false,
    marksObtained: Math.round(marksObtained * 100) / 100,
    maxMarks: question.marks * question.weight,
    status: 'incorrect',
  };
}

export function computeAttemptResult(
  questions: NormalizedQuestion[],
  answers: { questionId?: string; question: string; selectedAnswer: string }[],
  config: {
    passingScore: number;
    timeLimit: number;
    negativeMarking: boolean;
    partialMarking: boolean;
    startedAt: Date;
    submittedAt: Date;
    autoSubmitted?: boolean;
  }
): AttemptResult {
  const timeTaken = Math.max(0, Math.floor((config.submittedAt.getTime() - config.startedAt.getTime()) / 1000));
  const autoSubmitted = config.autoSubmitted || (config.timeLimit > 0 && timeTaken > config.timeLimit * 60);

  let score = 0;
  let totalMarks = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let skippedQuestions = 0;
  let hasPending = false;
  const details: IQuizAttemptDetail[] = [];

  for (const q of questions) {
    const submitted = answers.find((a) => a.questionId === q.questionId || a.question === q.question);
    const selectedAnswer = submitted?.selectedAnswer || '';
    const gradeResult = gradeQuestion(q, selectedAnswer, {
      negativeMarking: config.negativeMarking,
      partialMarking: config.partialMarking,
    });
    const isBonus = q.isBonus;

    if (!isBonus) {
      totalMarks += q.marks * q.weight;
    }
    score += gradeResult.marksObtained;

    switch (gradeResult.status) {
      case 'correct':
        correctAnswers++;
        break;
      case 'incorrect':
      case 'partial':
        incorrectAnswers++;
        break;
      case 'skipped':
        skippedQuestions++;
        break;
      case 'pending':
        hasPending = true;
        skippedQuestions++;
        break;
    }

    const detail: IQuizAttemptDetail = {
      questionId: q.questionId,
      question: q.question,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer,
      selectedAnswer,
      isCorrect: gradeResult.isCorrect,
      marksObtained: gradeResult.marksObtained,
      maxMarks: gradeResult.maxMarks,
      status: gradeResult.status,
      explanation: q.explanation,
    };
    details.push(detail);
  }

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;
  const passingScore = config.passingScore ?? 60;
  const passed = passingScore > 0 ? percentage >= passingScore : true;
  const passFail: 'pass' | 'fail' = passed ? 'pass' : 'fail';
  const letterGrade = computeLetterGrade(percentage);

  let evaluationStatus: EvaluationStatus = 'auto_graded';
  if (hasPending) evaluationStatus = 'pending';
  if (autoSubmitted) evaluationStatus = 'auto_graded';

  return {
    score: Math.round(score * 100) / 100,
    totalMarks: Math.round(totalMarks * 100) / 100,
    percentage,
    passed,
    passFail,
    letterGrade,
    correctAnswers,
    incorrectAnswers,
    skippedQuestions,
    timeTaken,
    evaluationStatus,
    details,
  };
}

export function computeAttemptScoreByPolicy(
  attempts: { score: number; totalMarks: number; percentage: number }[],
  policy: 'best' | 'latest' | 'average' | 'highest'
): { score: number; totalMarks: number; percentage: number } {
  if (!attempts.length) return { score: 0, totalMarks: 0, percentage: 0 };
  switch (policy) {
    case 'best':
      return attempts.reduce((best, a) => (a.percentage > best.percentage ? a : best), attempts[0]);
    case 'latest':
      return attempts[attempts.length - 1];
    case 'average': {
      const sum = attempts.reduce(
        (acc, a) => ({ score: acc.score + a.score, totalMarks: acc.totalMarks + a.totalMarks, percentage: 0 }),
        { score: 0, totalMarks: 0, percentage: 0 }
      );
      sum.percentage = sum.totalMarks > 0 ? Math.round((sum.score / sum.totalMarks) * 10000) / 100 : 0;
      return sum;
    }
    case 'highest':
      return attempts.reduce((best, a) => (a.score > best.score ? a : best), attempts[0]);
    default:
      return attempts[0];
  }
}

export function generateCsvHeaders(): string[] {
  return [
    'Attempt ID',
    'Student ID',
    'Student Name',
    'Student Email',
    'Course',
    'Quiz',
    'Attempt Number',
    'Score',
    'Total Marks',
    'Percentage',
    'Pass/Fail',
    'Letter Grade',
    'Correct',
    'Incorrect',
    'Skipped',
    'Time Taken (s)',
    'Time Limit (min)',
    'Auto Submitted',
    'Evaluation Status',
    'Started At',
    'Submitted At',
    'Graded By',
    'Published At',
  ];
}

export function attemptToCsvRow(attempt: {
  _id: string;
  user: { _id: string; name: string; email: string };
  course: { _id: string; title: string };
  lecture: { _id: string; title: string };
  quizTitle?: string;
  attemptNumber: number;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  letterGrade?: string;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  timeTaken?: number;
  timeLimit?: number;
  autoSubmitted: boolean;
  evaluationStatus: EvaluationStatus;
  startedAt: Date;
  submittedAt?: Date;
  gradedBy?: { _id: string; name: string } | string;
  publishedAt?: Date;
}): string[] {
  return [
    attempt._id,
    attempt.user._id,
    attempt.user.name,
    attempt.user.email,
    attempt.course.title,
    attempt.quizTitle || attempt.lecture.title,
    String(attempt.attemptNumber),
    String(attempt.score),
    String(attempt.totalMarks),
    String(attempt.percentage),
    attempt.passed ? 'Pass' : 'Fail',
    attempt.letterGrade || '',
    String(attempt.correctAnswers),
    String(attempt.incorrectAnswers),
    String(attempt.skippedQuestions),
    String(attempt.timeTaken || 0),
    String(attempt.timeLimit || 0),
    attempt.autoSubmitted ? 'Yes' : 'No',
    attempt.evaluationStatus,
    new Date(attempt.startedAt).toISOString(),
    attempt.submittedAt ? new Date(attempt.submittedAt).toISOString() : '',
    typeof attempt.gradedBy === 'object' ? attempt.gradedBy.name : '',
    attempt.publishedAt ? new Date(attempt.publishedAt).toISOString() : '',
  ];
}

interface ILectureQuiz {
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
  questions: NormalizedQuestion[];
}
