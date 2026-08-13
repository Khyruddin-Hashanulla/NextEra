import { Request, Response, NextFunction } from 'express';
import * as codingService from '../services/codingProblem.service';

export const createProblem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const problem = await codingService.createProblem(req.body, req.currentUser!.userId);
    res.status(201).json({ success: true, data: problem });
  } catch (err) {
    next(err);
  }
};

export const updateProblem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const problem = await codingService.updateProblem(req.params.problemId, req.body, req.currentUser!.userId);
    res.json({ success: true, data: problem });
  } catch (err) {
    next(err);
  }
};

export const deleteProblem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await codingService.deleteProblem(req.params.problemId, req.currentUser!.userId);
    res.json({ success: true, message: 'Problem deleted' });
  } catch (err) {
    next(err);
  }
};

export const getProblemById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const problem = await codingService.getProblemById(req.params.problemId);
    res.json({ success: true, data: problem });
  } catch (err) {
    next(err);
  }
};

export const getProblemBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const problem = await codingService.getProblemBySlug(req.params.slug);
    res.json({ success: true, data: problem });
  } catch (err) {
    next(err);
  }
};

export const listProblems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const result = await codingService.listProblems({
      difficulty: req.query.difficulty as string,
      tag: req.query.tag as string,
      category: req.query.category as string,
      course: req.query.course as string,
      page,
      limit,
      search: req.query.search as string,
      sort: (req.query.sort as string) || 'newest',
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const listInstructorProblems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const result = await codingService.listInstructorProblems(req.currentUser!.userId, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const submitCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const submission = await codingService.submitCode(
      req.params.problemId,
      req.currentUser!.userId,
      req.body.code,
      req.body.language,
      req.body.isPractice !== false
    );
    res.json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
};

export const getSubmissionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdminOrInstructor = req.currentUser?.role === 'instructor' || req.currentUser?.role === 'admin';
    const submission = await codingService.getSubmissionById(
      req.params.submissionId,
      req.currentUser!.userId,
      isAdminOrInstructor
    );
    res.json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
};

export const getUserSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const result = await codingService.getUserSubmissions(req.params.problemId, req.currentUser!.userId, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getAllUserSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const result = await codingService.getAllUserSubmissions(req.currentUser!.userId, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
