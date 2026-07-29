import { z } from 'zod';
import { FIELD_SIZES } from '../utils/validation';

export const createReminderSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(FIELD_SIZES.TITLE),
    description: z.string().max(FIELD_SIZES.SHORT_DESCRIPTION).optional(),
    type: z.enum(['daily', 'weekly', 'one-time']),
    dayOfWeek: z.number().min(0).max(6).optional(),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').max(5),
    course: z.string().max(FIELD_SIZES.URL).optional(),
  }),
});

export const updateReminderSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(FIELD_SIZES.TITLE).optional(),
    description: z.string().max(FIELD_SIZES.SHORT_DESCRIPTION).optional(),
    type: z.enum(['daily', 'weekly', 'one-time']).optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
    time: z.string().regex(/^\d{2}:\d{2}$/).max(5).optional(),
    course: z.string().max(FIELD_SIZES.URL).optional(),
    isActive: z.boolean().optional(),
  }),
});
