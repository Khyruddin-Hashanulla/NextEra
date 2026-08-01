import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';
import { assignmentService } from '../services/assignment.service';

// ─── Instructor Endpoints ──────────────────────────────────────

export const getInstructorAssignments = asyncHandler(async (req: Request, res: Response) => {
  const result = await assignmentService.getInstructorAssignments(req.currentUser!.userId, req.query as any);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Assignments fetched', result));
});

export const getInstructorAssignmentStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await assignmentService.getInstructorAssignmentStats(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Stats fetched', result));
});

export const getLectureSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const result = await assignmentService.getLectureSubmissions(
    req.currentUser!.userId,
    req.params.lectureId,
    req.query as any
  );
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Submissions fetched', result));
});

export const getSubmissionDetail = asyncHandler(async (req: Request, res: Response) => {
  const result = await assignmentService.getSubmissionDetail(req.currentUser!.userId, req.params.submissionId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Submission fetched', result));
});

export const updateSubmissionStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await assignmentService.updateSubmissionStatus(
    req.currentUser!.userId,
    req.params.submissionId,
    req.body
  );
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Status updated', result));
});

export const gradeSubmission = asyncHandler(async (req: Request, res: Response) => {
  const result = await assignmentService.gradeSubmission(
    req.currentUser!.userId,
    req.params.submissionId,
    req.body
  );
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Submission graded', result));
});

export const returnForResubmission = asyncHandler(async (req: Request, res: Response) => {
  const result = await assignmentService.returnForResubmission(
    req.currentUser!.userId,
    req.params.submissionId,
    req.body
  );
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Returned for resubmission', result));
});

// ─── Admin Endpoints ───────────────────────────────────────────

export const listAllSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const result = await assignmentService.listAllSubmissions(req.query as any);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Submissions fetched', result));
});

export const getSubmissionForAdmin = asyncHandler(async (req: Request, res: Response) => {
  const result = await assignmentService.getSubmissionForAdmin(req.params.submissionId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Submission fetched', result));
});

export const overrideGrade = asyncHandler(async (req: Request, res: Response) => {
  const result = await assignmentService.overrideGrade(
    req.currentUser!.userId,
    req.params.submissionId,
    req.body
  );
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Grade overridden', result));
});

export const getSubmissionAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const result = await assignmentService.getSubmissionAnalytics(req.query as any);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Analytics fetched', result));
});

export const getGradingLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const courseId = req.query.courseId as string | undefined;
  const result = await assignmentService.getGradingLogs({ page, limit, courseId });
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Grading logs fetched', result));
});
