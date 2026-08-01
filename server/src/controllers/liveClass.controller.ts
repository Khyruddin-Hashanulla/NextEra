import { Request, Response } from 'express';
import { liveClassService } from '../services/liveClass.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';

// ─── Instructor ────────────────────────────────────────────────
export const listInstructorLiveClasses = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const courseId = req.query.courseId as string;
  const status = req.query.status as string;
  const data = await liveClassService.listByInstructor(req.currentUser!.userId, courseId, status, page, limit);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Live classes fetched', data));
});

export const getLiveClass = asyncHandler(async (req: Request, res: Response) => {
  const data = await liveClassService.getById(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Live class fetched', data));
});

export const createLiveClass = asyncHandler(async (req: Request, res: Response) => {
  const liveClass = await liveClassService.create(req.currentUser!.userId, req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Live class created', liveClass));
});

export const updateLiveClass = asyncHandler(async (req: Request, res: Response) => {
  const liveClass = await liveClassService.update(req.params.id, req.currentUser!.userId, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Live class updated', liveClass));
});

export const cancelLiveClass = asyncHandler(async (req: Request, res: Response) => {
  const liveClass = await liveClassService.cancel(req.params.id, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Live class cancelled', liveClass));
});

export const startLiveClass = asyncHandler(async (req: Request, res: Response) => {
  const liveClass = await liveClassService.startClass(req.params.id, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Live class started', liveClass));
});

export const endLiveClass = asyncHandler(async (req: Request, res: Response) => {
  const liveClass = await liveClassService.endClass(req.params.id, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Live class ended', liveClass));
});

// ─── Recordings (Instructor) ───────────────────────────────────
export const listInstructorRecordings = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const courseId = req.query.courseId as string;
  const data = await liveClassService.listRecordings(courseId, req.currentUser!.userId, page, limit);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Recordings fetched', data));
});

export const addRecording = asyncHandler(async (req: Request, res: Response) => {
  const recording = await liveClassService.addRecording({
    ...req.body,
    instructor: req.currentUser!.userId,
  });
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Recording added', recording));
});

export const deleteRecording = asyncHandler(async (req: Request, res: Response) => {
  await liveClassService.deleteRecording(req.params.id, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Recording deleted', null));
});

export const syncInstructorRecordings = asyncHandler(async (req: Request, res: Response) => {
  const { liveClassId } = req.body;
  const data = await liveClassService.syncRecordingsForClass(liveClassId, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Recordings synced', data));
});

export const getInstructorRecording = asyncHandler(async (req: Request, res: Response) => {
  const recording = await liveClassService.getRecordingById(req.params.id, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Recording fetched', recording));
});

// ─── Student ──────────────────────────────────────────────────
export const listStudentLiveClasses = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const filterType = (req.query.filter as string) || 'upcoming';
  const data = await liveClassService.listByStudent(req.currentUser!.userId, filterType as any, page, limit);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Live classes fetched', data));
});

export const joinLiveClass = asyncHandler(async (req: Request, res: Response) => {
  const data = await liveClassService.joinClass(req.params.id, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Join link generated', data));
});

export const leaveLiveClass = asyncHandler(async (req: Request, res: Response) => {
  await liveClassService.leaveClass(req.params.id, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Left live class', null));
});

export const listStudentRecordings = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const courseId = req.query.courseId as string;
  const data = await liveClassService.listStudentRecordings(req.currentUser!.userId, page, limit, courseId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Recordings fetched', data));
});

export const incrementRecordingView = asyncHandler(async (req: Request, res: Response) => {
  await liveClassService.incrementRecordingView(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('View counted', null));
});

// ─── Recordings (Admin) ──────────────────────────────────────
export const listAdminRecordings = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const data = await liveClassService.listAllRecordings(
    {
      courseId: req.query.courseId as string,
      instructorId: req.query.instructorId as string,
      status: req.query.status as string,
      search: req.query.search as string,
    },
    page,
    limit
  );
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Recordings fetched', data));
});

export const getAdminRecording = asyncHandler(async (req: Request, res: Response) => {
  const recording = await liveClassService.getRecordingById(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Recording fetched', recording));
});

export const deleteAdminRecording = asyncHandler(async (req: Request, res: Response) => {
  await liveClassService.deleteRecordingAsAdmin(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Recording deleted', null));
});

export const syncAdminRecording = asyncHandler(async (req: Request, res: Response) => {
  const { liveClassId } = req.body;
  const data = await liveClassService.syncRecordingsForClass(liveClassId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Recordings synced', data));
});
