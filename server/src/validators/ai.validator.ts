import { z } from 'zod';
import { FIELD_SIZES, ARRAY_LIMITS } from '../utils/validation';

export const generateDescriptionSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(FIELD_SIZES.TITLE),
    category: z.string().min(1).max(FIELD_SIZES.NAME),
    level: z.string().min(1).max(FIELD_SIZES.NAME),
    keywords: z.array(z.string().max(FIELD_SIZES.NAME)).max(ARRAY_LIMITS.KEYWORDS).optional().default([]),
  }),
});

export const generateQuizSchema = z.object({
  body: z.object({
    topic: z.string().min(1).max(FIELD_SIZES.TOPIC),
    count: z.number().min(1).max(20).optional().default(5),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  }),
});

export const generateAssignmentSchema = z.object({
  body: z.object({
    topic: z.string().min(1).max(FIELD_SIZES.TOPIC),
    duration: z.string().min(1).max(FIELD_SIZES.SHORT_DESCRIPTION),
    skills: z.array(z.string().min(1).max(FIELD_SIZES.NAME)).min(1).max(ARRAY_LIMITS.SKILLS),
  }),
});

export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(FIELD_SIZES.MESSAGE),
    history: z
      .array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string().max(FIELD_SIZES.MESSAGE),
        })
      )
      .max(ARRAY_LIMITS.HISTORY_MESSAGES)
      .optional()
      .default([]),
  }),
});
