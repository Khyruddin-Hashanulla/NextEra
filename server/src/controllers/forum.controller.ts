import { Request, Response } from 'express';
import * as forumService from '../services/forum.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';

// ─── Public reads ─────────────────────────────────────────────
export const listForumTopics = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, sort, category, search, solved, instructor } = req.query as Record<string, string>;
  const data = await forumService.listForumTopics(
    {
      page: Number(page) || 1,
      limit: Number(limit) || 15,
      sort: (sort || 'latest') as never,
      category,
      search,
      solved,
      instructor,
    },
    req.currentUser?.userId
  );
  res.status(HTTP_STATUS.OK).json(
    ApiResponse.success('Discussions fetched', {
      discussions: data.discussions,
      pagination: data.pagination,
    })
  );
});

export const listForumCategories = asyncHandler(async (_req: Request, res: Response) => {
  const data = await forumService.listForumCategories();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Forum categories fetched', data));
});

export const getForumStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await forumService.getForumStats();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Forum stats fetched', data));
});

export const getForumTopic = asyncHandler(async (req: Request, res: Response) => {
  const data = await forumService.getForumTopic(req.params.id, req.currentUser?.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Discussion fetched', data));
});

// ─── Authenticated actions ────────────────────────────────────
export const createForumTopic = asyncHandler(async (req: Request, res: Response) => {
  const data = await forumService.createForumTopic(req.currentUser!.userId, req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Discussion created', data));
});

export const replyToForumTopic = asyncHandler(async (req: Request, res: Response) => {
  const data = await forumService.replyToTopic(req.params.id, req.currentUser!.userId, req.body.content);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Reply added', data));
});

export const toggleForumTopicLike = asyncHandler(async (req: Request, res: Response) => {
  const data = await forumService.toggleTopicLike(req.params.id, req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Reaction updated', data));
});

export const markForumTopicSolved = asyncHandler(async (req: Request, res: Response) => {
  const data = await forumService.markTopicSolved(
    req.params.id,
    req.currentUser!.userId,
    req.currentUser!.role,
    req.body.solved
  );
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Discussion status updated', data));
});

export const markForumBestAnswer = asyncHandler(async (req: Request, res: Response) => {
  const data = await forumService.markBestAnswer(
    req.params.id,
    req.body.replyId,
    req.currentUser!.userId,
    req.currentUser!.role
  );
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Best answer updated', data));
});

export const deleteForumTopic = asyncHandler(async (req: Request, res: Response) => {
  const data = await forumService.deleteTopic(req.params.id, req.currentUser!.userId, req.currentUser!.role);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Discussion deleted', data));
});

export const deleteForumReply = asyncHandler(async (req: Request, res: Response) => {
  const data = await forumService.deleteReply(
    req.params.id,
    req.params.replyId,
    req.currentUser!.userId,
    req.currentUser!.role
  );
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Reply deleted', data));
});

// ─── Admin moderation ─────────────────────────────────────────
export const setForumTopicPinned = asyncHandler(async (req: Request, res: Response) => {
  const data = await forumService.setTopicPinned(req.params.id, req.body.pinned);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Discussion updated', data));
});

export const setForumTopicLocked = asyncHandler(async (req: Request, res: Response) => {
  const data = await forumService.setTopicLocked(req.params.id, req.body.locked);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Discussion updated', data));
});