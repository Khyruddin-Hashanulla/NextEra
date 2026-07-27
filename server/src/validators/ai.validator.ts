import { z } from 'zod';

export const generateDescriptionSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    category: z.string().min(1),
    level: z.string().min(1),
    keywords: z.array(z.string()).optional().default([]),
  }),
});

export const generateQuizSchema = z.object({
  body: z.object({
    topic: z.string().min(1),
    count: z.number().min(1).max(20).optional().default(5),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  }),
});

export const generateAssignmentSchema = z.object({
  body: z.object({
    topic: z.string().min(1),
    duration: z.string().min(1),
    skills: z.array(z.string()).min(1),
  }),
});

export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(5000),
    history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })).optional().default([]),
  }),
});
