import { z } from 'zod';

export const createBlogCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(5000),
    parent: z.string().optional(),
  }),
});

export const updateBlogCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(5000),
  }),
});
