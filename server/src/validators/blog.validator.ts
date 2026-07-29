import { z } from 'zod';
import { FIELD_SIZES } from '../utils/validation';

export const createBlogCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(FIELD_SIZES.COMMENT),
    parent: z.string().max(FIELD_SIZES.URL).optional(),
  }),
});

export const updateBlogCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(FIELD_SIZES.COMMENT),
  }),
});
