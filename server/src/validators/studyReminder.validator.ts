import { z } from 'zod';

export const createReminderSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(500).optional(),
    type: z.enum(['daily', 'weekly', 'one-time']),
    dayOfWeek: z.number().min(0).max(6).optional(),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
    course: z.string().optional(),
  }),
});

export const updateReminderSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(500).optional(),
    type: z.enum(['daily', 'weekly', 'one-time']).optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
    time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    course: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});
