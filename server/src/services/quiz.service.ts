import mongoose from 'mongoose';
import { Lecture } from '../models/lecture.model';
import { QuizAttempt } from '../models/quizAttempt.model';
import { Enrollment } from '../models/enrollment.model';
import { User } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { computeAttemptResult, resolveQuizQuestions } from './quizScoring.service';

export interface StartQuizInput {
  userId: string;
  courseId: string;
  lectureId: string;
}

export interface SubmitQuizInput {
  attemptId: string;
  answers: { questionId?: string; question: string; selectedAnswer: string }[];
  autoSubmitted?: boolean;
}

export interface UpdateAttemptStatusInput {
  attemptId: string;
  status: 'started' | 'in_progress' | 'submitted' | 'graded' | 'published' | 'abandoned';
  gradedAt?: Date;
  gradedBy?: mongoose.Types.ObjectId;
  remark?: string;
}

export interface OverrideGradeInput {
  attemptId: string;
  grade?: number;
  feedback?: string;
  letterGrade?: string;
  publish?: boolean;
  gradedFiles?: { url: string; publicId: string; name: string }[];
  rubric?: { criteria: string; maxPoints: number; obtainedPoints: number; comment?: string }[];
  resubmissionDeadline?: string;
}

export interface PublishGradeInput {
  attemptId: string;
  publishedBy: mongoose.Types.ObjectId;
}

export interface GetAttemptsFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sort?: string;
}

export class QuizService {
  // ─── Core Quiz Attempt Management ───────────────────────────────────

  // ─── Enhanced Quiz Scoring Integration ───────────────────────────────────

  async startQuizEnhanced(input: StartQuizInput): Promise<{ attempt: any; canResume?: boolean }> {
    const { userId, courseId, lectureId } = input;

    const lecture = await Lecture.findById(lectureId).lean();
    if (!lecture) {
      throw ApiError.notFound('Lecture not found');
    }

    if (lecture.type !== 'quiz' && lecture.type !== 'assignment') {
      throw ApiError.badRequest(`This lecture is not a quiz (${lecture.type})`);
    }

    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (!enrollment) {
      throw ApiError.forbidden('You are not enrolled in this course');
    }

    const user = await User.findById(userId).lean();
    if (!user || !user.isActive) {
      throw ApiError.forbidden('Account is blocked');
    }

    const quizConfig = (lecture.quiz as any) || {};
    const questions = resolveQuizQuestions(lecture as any);
    const lectureTitle = lecture.title;

    const existingAttempts = await QuizAttempt.find({ user: userId, lecture: lectureId })
      .sort({ createdAt: -1 })
      .lean();
    const maxAttempts = quizConfig.maxAttempts > 0 ? quizConfig.maxAttempts : 999999;
    const attemptsCount = existingAttempts.length;

    if (attemptsCount >= maxAttempts) {
      throw ApiError.badRequest('Maximum attempts reached');
    }

    const attemptNumber = attemptsCount + 1;

    const cooldownMinutes = quizConfig.attemptCooldownMinutes > 0 ? quizConfig.attemptCooldownMinutes : 0;
    if (cooldownMinutes > 0 && existingAttempts.length > 0) {
      const lastAttempt = existingAttempts[0];
      const now = new Date();
      const timeSinceLast = (now.getTime() - lastAttempt.startedAt.getTime()) / (1000 * 60);
      if (timeSinceLast < cooldownMinutes) {
        const remainingSeconds = Math.ceil((cooldownMinutes * 60 - timeSinceLast) * 60);
        const m = Math.floor(remainingSeconds / 60);
        const s = remainingSeconds % 60;
        throw ApiError.badRequest(
          `You must wait ${m > 0 ? m + ' minute(s) and ' : ''}${s} seconds before starting another attempt.`
        );
      }
    }

    const canResume =
      attemptsCount > 0 &&
      quizConfig.allowResume &&
      existingAttempts.some((a) => !a.completedAt && a.evaluationStatus === 'in_progress');
    const startedAt = canResume ? existingAttempts[0].startedAt : new Date();

    let attempt: any;
    if (canResume) {
      attempt = await QuizAttempt.findByIdAndUpdate(existingAttempts[0]._id, {
        $set: {
          startedAt,
          completedAt: undefined,
          submittedAt: undefined,
          answers: [],
          details: [],
          score: 0,
          totalMarks: 0,
          percentage: 0,
          passed: false,
          correctAnswers: 0,
          incorrectAnswers: 0,
          skippedQuestions: 0,
          evaluationStatus: 'in_progress',
          evaluationVersion: existingAttempts[0].evaluationVersion + 1,
        },
      });
    } else {
      attempt = await QuizAttempt.create({
        user: userId,
        course: courseId,
        lecture: lectureId,
        quizTitle: lectureTitle,
        attemptNumber,
        answers: [],
        details: [],
        score: 0,
        totalQuestions: questions.length,
        totalMarks: questions.reduce((sum, q) => sum + q.marks * q.weight, 0),
        marksObtained: 0,
        percentage: 0,
        passingPercentage: quizConfig.passingScore || 60,
        passFail: 'fail',
        passed: false,
        correctAnswers: 0,
        incorrectAnswers: 0,
        skippedQuestions: 0,
        timeLimit: quizConfig.timeLimit,
        autoSubmitted: false,
        evaluationStatus: 'in_progress',
        evaluationVersion: 1,
        startedAt,
        completedAt: null,
        submittedAt: null,
      });
    }

    return { attempt, canResume };
  }

  async getStudentAnalytics(lectureId: string, userId: string): Promise<any> {
    const attempts = await QuizAttempt.find({ user: userId, lecture: lectureId }).sort({ createdAt: -1 }).lean();

    const total = attempts.length;
    if (total === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        averagePercentage: 0,
        passRate: 0,
        completionRate: 0,
        latestAttempt: null,
        bestAttempt: null,
      };
    }

    const scores = attempts.map((a) => a.score);
    const totalMarks = attempts.map((a) => a.totalMarks);
    const averageScore = scores.reduce((a, b) => a + b, 0) / total;
    const averageTotal = totalMarks.reduce((a, b) => a + b, 0) / total;
    const averagePercentage = averageTotal > 0 ? (averageScore / averageTotal) * 100 : 0;

    const passedCount = attempts.filter((a) => a.passed).length;
    const passRate = (passedCount / total) * 100;

    const completedCount = attempts.filter((a) => a.completedAt).length;
    const completionRate = (completedCount / total) * 100;

    const latestAttempt = attempts[0];
    const bestAttempt = attempts.reduce(
      (best, current) => (current.percentage > best.percentage ? current : best),
      attempts[0]
    );

    return {
      totalAttempts: total,
      averageScore,
      averagePercentage,
      passRate,
      completionRate,
      latestAttempt: {
        attemptId: latestAttempt._id,
        attemptNumber: latestAttempt.attemptNumber,
        score: latestAttempt.score,
        totalMarks: latestAttempt.totalMarks,
        percentage: latestAttempt.percentage,
        passed: latestAttempt.passed,
        completedAt: latestAttempt.completedAt,
      },
      bestAttempt: bestAttempt
        ? {
            attemptId: bestAttempt._id,
            attemptNumber: bestAttempt.attemptNumber,
            score: bestAttempt.score,
            totalMarks: bestAttempt.totalMarks,
            percentage: bestAttempt.percentage,
            passed: bestAttempt.passed,
            completedAt: bestAttempt.completedAt,
          }
        : null,
    };
  }

  async startQuiz(input: StartQuizInput): Promise<{ attempt: any; canResume?: boolean }> {
    const { userId, courseId, lectureId } = input;

    const lecture = await Lecture.findById(lectureId).lean();
    if (!lecture) {
      throw ApiError.notFound('Lecture not found');
    }

    const lectureType = lecture.type;
    if (lectureType !== 'quiz' && lectureType !== 'assignment') {
      throw ApiError.badRequest(`This lecture is not a quiz (${lectureType})`);
    }

    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
    if (!enrollment) {
      throw ApiError.forbidden('You are not enrolled in this course');
    }

    const user = await User.findById(userId).lean();
    if (!user || !user.isActive) {
      throw ApiError.forbidden('Account is blocked');
    }

    const quizConfig = (lecture.quiz as any) || {};
    const questions = resolveQuizQuestions(lecture as any);
    const lectureTitle = lecture.title;

    const existingAttempts = await QuizAttempt.find({ user: userId, lecture: lectureId })
      .sort({ createdAt: -1 })
      .lean();
    const maxAttempts = quizConfig.maxAttempts > 0 ? quizConfig.maxAttempts : 999999;
    const attemptsCount = existingAttempts.length;

    if (attemptsCount >= maxAttempts) {
      throw ApiError.badRequest('Maximum attempts reached');
    }

    const attemptNumber = attemptsCount + 1;

    const cooldownMinutes = quizConfig.attemptCooldownMinutes > 0 ? quizConfig.attemptCooldownMinutes : 0;
    if (cooldownMinutes > 0 && existingAttempts.length > 0) {
      const lastAttempt = existingAttempts[0];
      const now = new Date();
      const timeSinceLast = (now.getTime() - lastAttempt.startedAt.getTime()) / (1000 * 60);
      if (timeSinceLast < cooldownMinutes) {
        const remainingSeconds = Math.ceil((cooldownMinutes * 60 - timeSinceLast) * 60);
        const m = Math.floor(remainingSeconds / 60);
        const s = remainingSeconds % 60;
        throw ApiError.badRequest(
          `You must wait ${m > 0 ? m + ' minute(s) and ' : ''}${s} seconds before starting another attempt.`
        );
      }
    }

    const canResume =
      attemptsCount > 0 &&
      quizConfig.allowResume &&
      existingAttempts.some((a) => !a.completedAt && a.evaluationStatus === 'in_progress');
    const startedAt = canResume ? existingAttempts[0].startedAt : new Date();

    let attempt: any;
    if (canResume) {
      attempt = await QuizAttempt.findByIdAndUpdate(existingAttempts[0]._id, {
        $set: {
          startedAt,
          completedAt: undefined,
          submittedAt: undefined,
          answers: [],
          details: [],
          score: 0,
          totalMarks: 0,
          percentage: 0,
          passed: false,
          correctAnswers: 0,
          incorrectAnswers: 0,
          skippedQuestions: 0,
          evaluationStatus: 'in_progress',
          evaluationVersion: existingAttempts[0].evaluationVersion + 1,
        },
      });
    } else {
      attempt = await QuizAttempt.create({
        user: userId,
        course: courseId,
        lecture: lectureId,
        quizTitle: lectureTitle,
        attemptNumber,
        answers: [],
        details: [],
        score: 0,
        totalQuestions: questions.length,
        totalMarks: 0,
        marksObtained: 0,
        percentage: 0,
        passingPercentage: quizConfig.passingScore || 60,
        passFail: 'fail',
        passed: false,
        correctAnswers: 0,
        incorrectAnswers: 0,
        skippedQuestions: 0,
        timeLimit: quizConfig.timeLimit,
        autoSubmitted: false,
        evaluationStatus: 'in_progress',
        evaluationVersion: 1,
        startedAt,
        completedAt: null,
        submittedAt: null,
      });
    }

    return { attempt, canResume };
  }

  async submitQuiz(input: SubmitQuizInput): Promise<{ attempt: any; autoSubmitted: boolean }> {
    const { attemptId, answers, autoSubmitted = false } = input;

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      throw ApiError.notFound('Quiz attempt not found');
    }

    if (attempt.evaluationStatus !== 'in_progress' && !autoSubmitted) {
      throw ApiError.badRequest('Quiz cannot be submitted in its current state');
    }

    const lecture = await Lecture.findById(attempt.lecture).lean();
    if (!lecture) {
      throw ApiError.badRequest('Lecture not found');
    }

    const quizConfig = (lecture.quiz as any) || {};
    const questions = resolveQuizQuestions(lecture as any);

    const now = new Date();
    const timeTaken = Math.max(0, Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000));

    const config: any = {
      passingScore: quizConfig.passingScore || 60,
      timeLimit: quizConfig.timeLimit || 0,
      negativeMarking: quizConfig.negativeMarking || false,
      partialMarking: quizConfig.partialMarking || false,
      startedAt: attempt.startedAt,
      submittedAt: now,
      autoSubmitted,
    };

    const result = computeAttemptResult(questions, answers, config);

    const updated: any = {
      answers,
      details: result.details.map((d) => ({
        ...d,
        gradedAt: d.status === 'pending' ? undefined : d.gradedAt || now,
        gradedBy: d.status === 'pending' ? undefined : attempt.user,
      })),
      score: result.score,
      totalMarks: result.totalMarks,
      totalQuestions: questions.length,
      correctAnswers: result.correctAnswers,
      incorrectAnswers: result.incorrectAnswers,
      skippedQuestions: result.skippedQuestions,
      marksObtained: result.score,
      percentage: result.percentage,
      passingPercentage: config.passingScore,
      passFail: result.passFail,
      passed: result.passed,
      letterGrade: result.letterGrade,
      timeTaken,
      autoSubmitted,
      evaluationStatus: result.evaluationStatus,
      submittedAt: now,
      completedAt: now,
    };

    if (result.letterGrade) {
      (updated as any).letterGrade = result.letterGrade;
    }
    if (result.evaluationStatus === 'graded' || result.evaluationStatus === 'published') {
      (updated as any).gradedAt = now;
      (updated as any).gradedBy = attempt.user;
      if (result.evaluationStatus === 'published') {
        (updated as any).publishedAt = now;
        (updated as any).evaluationStatus = 'published';
      }
    }

    const updatedAttempt = await QuizAttempt.findByIdAndUpdate(attempt._id, updated);

    return { attempt: updatedAttempt, autoSubmitted };
  }

  async resumeQuiz(attemptId: string): Promise<{ attempt: any; canResume: boolean }> {
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      throw ApiError.notFound('Quiz attempt not found');
    }

    const lecture = await Lecture.findById(attempt.lecture).lean();
    if (!lecture) {
      throw ApiError.badRequest('Lecture not found');
    }

    const quizConfig = (lecture.quiz as any) || {};

    if (attempt.completedAt) {
      return { attempt, canResume: false };
    }

    if (attempt.evaluationStatus !== 'in_progress') {
      return { attempt, canResume: false };
    }

    if (!quizConfig.allowResume) {
      return { attempt, canResume: false };
    }

    return { attempt, canResume: true };
  }

  async getStudentQuizAttempts(userId: string, lectureId: string): Promise<any[]> {
    const attempts = await QuizAttempt.find({ user: userId, lecture: lectureId }).sort({ createdAt: -1 }).lean();

    return attempts;
  }

  async getStudentQuizOverview(userId: string): Promise<any> {
    const attempts = await QuizAttempt.find({ user: userId }).sort({ createdAt: -1 }).lean();

    if (attempts.length === 0) {
      return {
        quizzes: [],
        stats: {
          totalAttempts: 0,
          averageScore: 0,
          passedCount: 0,
          latestAttempt: null,
          bestAttempt: null,
          scoreHistory: [],
          attemptDistribution: {},
        },
      };
    }

    const total = attempts.length;
    const averageScore = attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / total;
    const passedCount = attempts.filter((a) => a.passed).length;
    const latestAttempt = attempts[0];
    const bestAttempt = attempts.reduce(
      (best, current) => (current.percentage > best.percentage ? current : best),
      attempts[0]
    );

    const scoreHistory = attempts
      .filter((a) => a.completedAt)
      .map((a) => ({
        attemptNumber: a.attemptNumber,
        percentage: a.percentage,
        completedAt: a.completedAt,
      }));

    const attemptDistribution: Record<string, number> = {};
    attempts.forEach((a) => {
      attemptDistribution[String(a.attemptNumber)] = (attemptDistribution[String(a.attemptNumber)] || 0) + 1;
    });

    const quizzes = attempts.map((a) => ({
      _id: a._id,
      title: a.quizTitle || 'Quiz',
      attemptNumber: a.attemptNumber,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      completedAt: a.completedAt,
      score: a.score,
      totalMarks: a.totalMarks,
      percentage: a.percentage,
      passed: a.passed,
      letterGrade: a.letterGrade,
      correctAnswers: a.correctAnswers,
      totalQuestions: a.totalQuestions,
      timeTaken: a.timeTaken,
      status: a.evaluationStatus,
      evaluationStatus: a.evaluationStatus,
      details: a.details,
    }));

    return {
      quizzes,
      stats: {
        totalAttempts: total,
        averageScore: Math.round(averageScore * 10) / 10,
        passedCount,
        latestAttempt: latestAttempt
          ? {
              attemptId: latestAttempt._id,
              attemptNumber: latestAttempt.attemptNumber,
              score: latestAttempt.score,
              totalMarks: latestAttempt.totalMarks,
              percentage: latestAttempt.percentage,
              passed: latestAttempt.passed,
              completedAt: latestAttempt.completedAt,
            }
          : null,
        bestAttempt: bestAttempt
          ? {
              attemptId: bestAttempt._id,
              attemptNumber: bestAttempt.attemptNumber,
              score: bestAttempt.score,
              totalMarks: bestAttempt.totalMarks,
              percentage: bestAttempt.percentage,
              passed: bestAttempt.passed,
              completedAt: bestAttempt.completedAt,
            }
          : null,
        scoreHistory,
        attemptDistribution,
      },
    };
  }

  async getAttemptDetails(attemptId: string): Promise<any> {
    const attempt = await QuizAttempt.findById(attemptId).lean();
    if (!attempt) {
      throw ApiError.notFound('Quiz attempt not found');
    }

    const lecture = await Lecture.findById(attempt.lecture).lean();
    if (!lecture) {
      throw ApiError.notFound('Lecture not found');
    }

    return { attempt, lecture };
  }

  async manualGradeAttempt(attemptId: string, input: OverrideGradeInput): Promise<any> {
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      throw ApiError.notFound('Quiz attempt not found');
    }

    if (attempt.evaluationStatus === 'pending' || attempt.evaluationStatus === 'auto_graded') {
      throw ApiError.badRequest('Quiz attempt is not eligible for manual grading');
    }

    const lecture = await Lecture.findById(attempt.lecture).lean();
    if (!lecture) {
      throw ApiError.notFound('Lecture not found');
    }

    const quizConfig = (lecture.quiz as any) || {};
    const _questions = resolveQuizQuestions(lecture as any);

    const updates: any = {};
    if (input.grade !== undefined) {
      updates.marksObtained = input.grade;
      updates.score = input.grade;
      updates.percentage = quizConfig.totalMarks ? (input.grade / quizConfig.totalMarks) * 100 : 0;
      updates.passed = updates.percentage >= (quizConfig.passingScore || 60);
    }
    if (input.feedback !== undefined) {
      (updates as any).details = attempt.details?.map((d) => ({ ...d, feedback: input.feedback })) || [];
    }
    if (input.letterGrade !== undefined) {
      (updates as any).letterGrade = input.letterGrade;
    }
    if (input.gradedFiles !== undefined) {
      (updates as any).gradedFiles = input.gradedFiles;
    }
    if (input.rubric !== undefined) {
      (updates as any).rubric = input.rubric;
    }
    if (input.publish !== undefined && input.publish) {
      (updates as any).publishedAt = new Date();
      (updates as any).publishedBy = input.attemptId;
      (updates as any).evaluationStatus = 'published';
    }

    if (input.resubmissionDeadline) {
      const deadline = new Date(input.resubmissionDeadline);
      if (!isNaN(deadline.getTime())) {
        (updates as any).resubmissionDeadline = deadline;
      }
    }

    const updatedAttempt = await QuizAttempt.findByIdAndUpdate(attempt._id, updates);

    if (input.publish) {
      await this.addGradingHistory(
        attempt._id.toString(),
        new mongoose.Types.ObjectId(input.attemptId),
        input.grade || 0,
        input.letterGrade || '',
        'manual_grade',
        input.feedback,
        new mongoose.Types.ObjectId(input.attemptId)
      );
    }

    return updatedAttempt;
  }

  async publishAttempt(attemptId: string, publishedBy: mongoose.Types.ObjectId): Promise<any> {
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      throw ApiError.notFound('Quiz attempt not found');
    }

    if (attempt.evaluationStatus === 'pending' || attempt.evaluationStatus === 'auto_graded') {
      throw ApiError.badRequest('Quiz attempt is not eligible for publishing');
    }

    const updated = await QuizAttempt.findByIdAndUpdate(attempt._id, {
      publishedAt: new Date(),
      publishedBy,
      evaluationStatus: 'published',
    });

    if (!updated) {
      throw ApiError.notFound('Quiz attempt not found');
    }

    await this.addGradingHistory(
      attempt._id.toString(),
      publishedBy,
      updated.marksObtained || 0,
      updated.letterGrade || '',
      'publish',
      '',
      publishedBy
    );

    return updated;
  }

  async getQuizAnalytics(lectureId: string): Promise<any> {
    const attempts = await QuizAttempt.find({ lecture: lectureId }).lean();

    const total = attempts.length;
    if (total === 0) return { total, averageScore: 0, passRate: 0, completionRate: 0 };

    const scores = attempts.map((a) => a.score);
    const totalMarks = attempts.map((a) => a.totalMarks);
    const averageScore = scores.reduce((a, b) => a + b, 0) / total;
    const averageTotal = totalMarks.reduce((a, b) => a + b, 0) / total;
    const averagePercentage = averageTotal > 0 ? (averageScore / averageTotal) * 100 : 0;
    const passedCount = attempts.filter((a) => a.passed).length;
    const passRate = (passedCount / total) * 100;
    const completedCount = attempts.filter((a) => a.completedAt).length;
    const completionRate = (completedCount / total) * 100;

    const scoreDistribution = {
      excellent: attempts.filter((a) => a.percentage >= 90).length,
      good: attempts.filter((a) => a.percentage >= 80 && a.percentage < 90).length,
      satisfactory: attempts.filter((a) => a.percentage >= 70 && a.percentage < 80).length,
      needsImprovement: attempts.filter((a) => a.percentage >= 60 && a.percentage < 70).length,
      belowPassing: attempts.filter((a) => a.percentage < 60).length,
    };

    return {
      total,
      averageScore,
      averagePercentage,
      passRate,
      completionRate,
      scoreDistribution,
    };
  }

  async getQuestionStatistics(lectureId: string): Promise<any[]> {
    const attempts = await QuizAttempt.find({ lecture: lectureId }).lean();
    if (attempts.length === 0) return [];

    const lecture = await Lecture.findById(lectureId).lean();
    const questions = resolveQuizQuestions(lecture as any);

    const questionStats = questions.map((q, _idx) => {
      const correct = attempts.filter((a) =>
        a.details?.some((d) => d.questionId === q.questionId && d.isCorrect)
      ).length;
      const attempted = attempts.filter((a) =>
        a.details?.some((d) => d.questionId === q.questionId && d.selectedAnswer)
      ).length;
      const incorrect = attempted - correct;
      const skipped = attempts.length - attempted;
      const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

      return {
        questionId: q.questionId,
        question: q.question,
        type: q.type,
        marks: q.marks,
        total: attempts.length,
        correct,
        incorrect,
        skipped,
        accuracy,
        difficulty: accuracy >= 80 ? 'easy' : accuracy >= 60 ? 'medium' : 'hard',
      };
    });

    return questionStats.sort((a, b) => b.correct - a.correct);
  }

  async getLeaderboard(lectureId: string, limit: number = 10): Promise<any[]> {
    const attempts = await QuizAttempt.find({ lecture: lectureId })
      .sort({ percentage: -1, score: -1 })
      .limit(limit)
      .lean();

    return attempts.map((a, idx) => ({
      rank: idx + 1,
      attemptId: a._id,
      student: {
        id: a.user,
        name: `Student ${a.user.toString().slice(-6)}`,
      },
      score: a.score,
      totalMarks: a.totalMarks,
      percentage: a.percentage,
      passed: a.passed,
      letterGrade: a.letterGrade,
      completedAt: a.completedAt,
    }));
  }

  async exportAttemptData(attemptId: string): Promise<{ data: any[]; csvHeaders: string[] }> {
    const attempt = await QuizAttempt.findById(attemptId).lean();
    if (!attempt) {
      throw ApiError.notFound('Quiz attempt not found');
    }

    const lecture = await Lecture.findById(attempt.lecture).lean();

    const exportData = [
      {
        attemptId: attempt._id,
        studentId: attempt.user,
        studentName: `Student ${attempt.user.toString().slice(-6)}`,
        studentEmail: `student${attempt.user.toString().slice(-6)}@example.com`,
        course: lecture?.course?.toString() || '',
        quizTitle: attempt.quizTitle || lecture?.title || '',
        attemptNumber: attempt.attemptNumber,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        passFail: attempt.passFail,
        letterGrade: attempt.letterGrade || '',
        correctAnswers: attempt.correctAnswers,
        incorrectAnswers: attempt.incorrectAnswers,
        skippedQuestions: attempt.skippedQuestions,
        timeTaken: attempt.timeTaken,
        timeLimit: attempt.timeLimit,
        autoSubmitted: attempt.autoSubmitted,
        evaluationStatus: attempt.evaluationStatus,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        gradedBy: typeof attempt.gradedBy === 'object' ? attempt.gradedBy?.toString() : '',
        publishedAt: attempt.publishedAt,
        answers: JSON.stringify(attempt.answers),
        details: JSON.stringify(attempt.details),
      },
    ];

    const csvHeaders = [
      'Attempt ID',
      'Student ID',
      'Student Name',
      'Student Email',
      'Course',
      'Quiz Title',
      'Attempt Number',
      'Score',
      'Total Marks',
      'Percentage',
      'Pass/Fail',
      'Letter Grade',
      'Correct Answers',
      'Incorrect Answers',
      'Skipped Questions',
      'Time Taken (s)',
      'Time Limit (min)',
      'Auto Submitted',
      'Evaluation Status',
      'Started At',
      'Submitted At',
      'Graded By',
      'Published At',
      'Answers (JSON)',
      'Details (JSON)',
    ];

    return { data: exportData, csvHeaders };
  }

  async getQuizAnalyticsForAdmin(courseId: string): Promise<any> {
    const attempts = await QuizAttempt.find({ course: courseId }).lean();
    const lectures = await Lecture.find({ course: courseId }).lean();

    const totalQuizzes = attempts.length;
    const totalStudents = new Set(attempts.map((a) => a.user)).size;
    const averageScore = attempts.reduce((sum, a) => sum + a.score, 0) / (totalQuizzes || 1);
    const passRate = (attempts.filter((a) => a.passed).length / (totalQuizzes || 1)) * 100;
    const failureRate = 100 - passRate;

    const quizStats = lectures
      .map((lecture) => {
        const lectureAttempts = attempts.filter((a) => a.lecture.toString() === lecture._id.toString());
        if (lectureAttempts.length === 0) return null;

        const averageScore = lectureAttempts.reduce((sum, a) => sum + a.score, 0) / lectureAttempts.length;
        const passRate = (lectureAttempts.filter((a) => a.passed).length / lectureAttempts.length) * 100;
        const totalAttempts = lectureAttempts.length;

        return {
          lectureId: lecture._id,
          lectureTitle: lecture.title,
          type: lecture.type,
          totalAttempts,
          averageScore,
          passRate,
          difficulty: 'medium',
        };
      })
      .filter(Boolean) as any;

    const difficultQuizzes = quizStats.sort((a: any, b: any) => b.averageScore - a.averageScore).slice(0, 5);

    const highScorers = attempts
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((a) => ({
        studentId: a.user,
        score: a.score,
        percentage: a.percentage,
        quiz: a.quizTitle || 'Quiz',
      }));

    const questionStats = await this.getAllQuestionStatistics(courseId);

    return {
      overview: {
        totalQuizzes,
        totalStudents,
        averageScore,
        passRate,
        failureRate,
      },
      difficultQuizzes,
      highScorers,
      questionStats,
      recentActivity: attempts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
    };
  }

  private async addGradingHistory(
    attemptId: string,
    performedBy: mongoose.Types.ObjectId,
    marks: number,
    letterGrade: string,
    action: 'manual_grade' | 'override' | 'publish' | 'auto_grade',
    feedback?: string,
    gradedBy?: mongoose.Types.ObjectId
  ): Promise<void> {
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) return;

    const historyEntry = {
      marksObtained: marks,
      totalMarks: attempt.totalMarks,
      percentage: attempt.totalMarks ? (marks / attempt.totalMarks) * 100 : 0,
      letterGrade,
      feedback,
      gradedBy: gradedBy || performedBy,
      gradedAt: new Date(),
      action,
    };

    await QuizAttempt.findByIdAndUpdate(attemptId, {
      $push: { gradingHistory: historyEntry },
    });
  }

  private async getAllQuestionStatistics(courseId: string): Promise<any[]> {
    const attempts = await QuizAttempt.find({ course: courseId }).lean();
    if (attempts.length === 0) return [];

    const uniqueQuestions = new Set<string>();

    for (const attempt of attempts) {
      if (attempt.details && Array.isArray(attempt.details)) {
        attempt.details.forEach((d) => {
          if (d.questionId) uniqueQuestions.add(d.questionId);
        });
      }
    }

    if (uniqueQuestions.size === 0) return [];

    const questionStats = Array.from(uniqueQuestions)
      .map((qId): any => {
        const matchingDetails = attempts.flatMap((a) => a.details?.filter((d) => d.questionId === qId) || []);
        const total = matchingDetails.length;
        if (total === 0) return null;

        const correct = matchingDetails.filter((d) => d.isCorrect).length;
        const attempted = matchingDetails.filter((d) => d.selectedAnswer).length;
        const incorrect = attempted - correct;
        const skipped = total - attempted;
        const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

        return {
          questionId: qId,
          total: total,
          correct,
          incorrect,
          skipped,
          accuracy,
          difficulty: accuracy >= 80 ? 'easy' : accuracy >= 60 ? 'medium' : 'hard',
        };
      })
      .filter(Boolean);

    return questionStats.sort((a, b) => b.correct - a.correct);
  }

  async invalidateCache(lectureId: string): Promise<void> {
    await QuizAttempt.updateMany({ lecture: lectureId }, { $set: { evaluationStatus: 'pending' } });
  }
}

export const quizService = new QuizService();
