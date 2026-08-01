import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';
import { quizService } from '../services/quiz.service';

// ─── Student Quiz Flow ───────────────────────────────────────────────

export const startQuiz = asyncHandler(async (req: Request, res: Response) => {
  const result = await quizService.startQuiz({
    userId: req.currentUser!.userId,
    courseId: req.body.courseId,
    lectureId: req.body.lectureId,
  });
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Quiz started', result));
});

export const startQuizEnhanced = asyncHandler(async (req: Request, res: Response) => {
  const result = await quizService.startQuizEnhanced({
    userId: req.currentUser!.userId,
    courseId: req.body.courseId,
    lectureId: req.body.lectureId,
  });
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Quiz started', result));
});

export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { attemptId, answers, autoSubmitted } = req.body;
  const result = await quizService.submitQuiz({
    attemptId,
    answers,
    autoSubmitted,
  });
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Quiz submitted', result));
});

export const autoSubmitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { attemptId } = req.body;
  const result = await quizService.submitQuiz({
    attemptId,
    answers: [],
    autoSubmitted: true,
  });
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Quiz auto-submitted', result));
});

export const resumeQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { attemptId } = req.body;
  const result = await quizService.resumeQuiz(attemptId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Quiz resumed', result));
});

export const getStudentQuizAttempts = asyncHandler(async (req: Request, res: Response) => {
  const { lectureId } = req.params;
  const attempts = await quizService.getStudentQuizAttempts(req.currentUser!.userId, lectureId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Quiz attempts fetched', attempts));
});

export const getAttemptDetails = asyncHandler(async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const result = await quizService.getAttemptDetails(attemptId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Quiz attempt details fetched', result));
});

export const getStudentAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { lectureId } = req.params;
  const result = await quizService.getStudentAnalytics(lectureId, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Student analytics fetched', result));
});

export const getStudentQuizOverview = asyncHandler(async (req: Request, res: Response) => {
  const result = await quizService.getStudentQuizOverview(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Student quiz overview fetched', result));
});

// ─── Instructor / Admin Grading & Analytics ───────────────────────────

export const manualGradeAttempt = asyncHandler(async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const result = await quizService.manualGradeAttempt(attemptId, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Attempt graded manually', result));
});

export const publishGrade = asyncHandler(async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const result = await quizService.publishAttempt(
    attemptId,
    new mongoose.Types.ObjectId(req.currentUser!.userId),
  );
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Grade published', result));
});

export const getQuizAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { lectureId } = req.params;
  const result = await quizService.getQuizAnalytics(lectureId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Quiz analytics fetched', result));
});

export const getQuestionStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { lectureId } = req.params;
  const result = await quizService.getQuestionStatistics(lectureId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Question statistics fetched', result));
});

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { lectureId } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const result = await quizService.getLeaderboard(lectureId, limit);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Leaderboard fetched', result));
});

export const exportQuizData = asyncHandler(async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const result = await quizService.exportAttemptData(attemptId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Quiz data exported', result));
});

export const getQuizAnalyticsForAdmin = asyncHandler(async (req: Request, res: Response) => {
  const courseId = req.query.courseId as string | undefined;
  const result = await quizService.getQuizAnalyticsForAdmin(courseId ?? '');
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Admin quiz analytics fetched', result));
});

export const invalidateQuizCache = asyncHandler(async (req: Request, res: Response) => {
  const { lectureId } = req.params;
  await quizService.invalidateCache(lectureId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Quiz cache invalidated', null));
});
