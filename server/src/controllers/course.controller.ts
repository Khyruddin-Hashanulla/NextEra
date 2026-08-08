import { Request, Response } from 'express';
import { courseService } from '../services/course.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.create(req.currentUser!.userId, req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Course created', data));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.getById(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course fetched', data));
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.getBySlug(req.params.slug);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course fetched', data));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.update(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course updated', data));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await courseService.delete(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course deleted', null));
});

export const duplicate = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.duplicate(req.params.id, req.currentUser!.userId);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Course duplicated', data));
});

export const listMyCourses = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query as any;
  const data = await courseService.listByInstructor(req.currentUser!.userId, status);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Courses fetched', data));
});

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const { search, category, level, status, page, limit, sort, featured } = req.query as any;
  const data = await courseService.listAll({ search, category, level, status, page: Number(page), limit: Number(limit), sort, featured: featured === 'true' });
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Courses fetched', data));
});

export const submitForReview = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.submitForReview(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course submitted for review', data));
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.approve(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course approved', data));
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.reject(req.params.id, req.body.reason);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course rejected', data));
});

export const publish = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.publish(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course published', data));
});

export const unpublish = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.unpublish(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course unpublished', data));
});

export const archive = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.archive(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course archived', data));
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.restore(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course restored', data));
});

export const markCourseContentCompleted = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.markCourseContentCompleted(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Course content finalized', data));
});

export const toggleFeatured = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.toggleFeatured(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Featured toggled', data));
});

export const getCurriculum = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.getCurriculum(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Curriculum fetched', data));
});

export const getOwnerCurriculum = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.getOwnerCurriculum(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Curriculum fetched', data));
});

export const getPublishedCurriculum = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.getPublishedCurriculum(req.params.id, req.currentUser?.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Curriculum fetched', data));
});

export const createSection = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.createSection(req.params.id, req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Section created', data));
});

export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.updateSection(req.params.sectionId, req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Section updated', data));
});

export const removeSection = asyncHandler(async (req: Request, res: Response) => {
  await courseService.deleteSection(req.params.sectionId, req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Section deleted', null));
});

export const reorderSections = asyncHandler(async (req: Request, res: Response) => {
  await courseService.reorderSections(req.params.id, req.body.sectionOrder);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Sections reordered', null));
});

export const getSection = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.getSection(req.params.sectionId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Section fetched', data));
});

export const createLecture = asyncHandler(async (req: Request, res: Response) => {
  const { sectionId } = req.params;
  const data = await courseService.createLecture(sectionId, req.params.id, req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Lecture created', data));
});

export const updateLecture = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.updateLecture(req.params.lectureId, req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Lecture updated', data));
});

export const removeLecture = asyncHandler(async (req: Request, res: Response) => {
  await courseService.deleteLecture(req.params.lectureId, req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Lecture deleted', null));
});

export const reorderLectures = asyncHandler(async (req: Request, res: Response) => {
  await courseService.reorderLectures(req.params.sectionId, req.params.id, req.body.lectureOrder);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Lectures reordered', null));
});

export const moveLecture = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.moveLecture(req.params.lectureId, req.params.id, req.body.targetSectionId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Lecture moved', data));
});

export const getLecture = asyncHandler(async (req: Request, res: Response) => {
  const data = await courseService.getLecture(req.params.lectureId, req.params.id, req.currentUser?.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Lecture fetched', data));
});
