import { z } from 'zod';
import { FIELD_SIZES, ARRAY_LIMITS } from '../utils/validation';
import { objectIdSchema } from './common';
import { FORUM_CATEGORY_SLUGS, FORUM_SORTS } from '../constants/forum';

const tagSchema = z.string().trim().min(1).max(30);

export const createForumTopicSchema = z.object({
  body: z.object({
    category: z.enum(FORUM_CATEGORY_SLUGS),
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(FIELD_SIZES.TITLE),
    content: z.string().trim().min(3, 'Content must be at least 3 characters').max(FIELD_SIZES.COMMENT),
    tags: z.array(tagSchema).max(ARRAY_LIMITS.TAGS).default([]),
  }),
});

export const replyToForumTopicSchema = z.object({
  body: z.object({
    content: z.string().trim().min(1).max(FIELD_SIZES.COMMENT),
  }),
});

export const forumListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1).catch(1),
    limit: z.coerce.number().int().min(1).max(50).default(15).catch(15),
    sort: z.enum(FORUM_SORTS).default('latest'),
    category: z.enum(FORUM_CATEGORY_SLUGS).optional(),
    search: z.string().max(FIELD_SIZES.SHORT_DESCRIPTION).trim().optional(),
    solved: z.enum(['true', 'false']).optional(),
    instructor: z.enum(['true', 'false']).optional(),
  }),
});

export const forumTopicIdParamSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const forumReplyIdParamSchema = z.object({
  params: z.object({ id: objectIdSchema, replyId: objectIdSchema }),
});

export const forumSolvedSchema = z.object({
  body: z.object({ solved: z.boolean() }),
});

export const forumBestAnswerSchema = z.object({
  body: z.object({ replyId: objectIdSchema }),
});

export const forumPinSchema = z.object({
  body: z.object({ pinned: z.boolean() }),
});

export const forumLockSchema = z.object({
  body: z.object({ locked: z.boolean() }),
});