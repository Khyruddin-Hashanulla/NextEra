import { z } from 'zod';
import { FIELD_SIZES, paginationSchema } from '../utils/validation';

export const createLiveClassSchema = z.object({
  body: z.object({
    course: z.string().min(1, 'Course ID is required').max(FIELD_SIZES.URL),
    title: z.string().min(1, 'Title is required').max(FIELD_SIZES.TITLE),
    description: z.string().max(FIELD_SIZES.DESCRIPTION).optional().default(''),
    topic: z.string().max(FIELD_SIZES.TOPIC).optional().default(''),
    agenda: z.string().max(FIELD_SIZES.AGENDA).optional().default(''),
    startTime: z.string().min(1, 'Start time is required').max(FIELD_SIZES.TIMESTAMP),
    duration: z.number().int().min(1, 'Duration must be at least 1 minute').max(1440),
    timezone: z.string().max(FIELD_SIZES.NAME).optional().default('UTC'),
    meetingProvider: z.enum(['zoom', 'google_meet', 'other']).optional().default('zoom'),
    password: z.string().max(FIELD_SIZES.TOKEN).optional(),
    settings: z.object({
      muteOnEntry: z.boolean().optional(),
      approvalType: z.enum(['automatic', 'manual']).optional(),
      waitingRoom: z.boolean().optional(),
      qa: z.boolean().optional(),
      chat: z.boolean().optional(),
      allowRecording: z.boolean().optional(),
    }).optional(),
    notifyStudents: z.boolean().optional().default(true),
    recording: z.object({
      autoRecord: z.boolean().optional().default(false),
    }).optional(),
  }),
});

export const updateLiveClassSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(FIELD_SIZES.TITLE).optional(),
    description: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
    topic: z.string().max(FIELD_SIZES.TOPIC).optional(),
    agenda: z.string().max(FIELD_SIZES.AGENDA).optional(),
    startTime: z.string().max(FIELD_SIZES.TIMESTAMP).optional(),
    duration: z.number().int().min(1).max(1440).optional(),
    timezone: z.string().max(FIELD_SIZES.NAME).optional(),
    password: z.string().max(FIELD_SIZES.TOKEN).optional(),
    settings: z.object({
      muteOnEntry: z.boolean().optional(),
      approvalType: z.enum(['automatic', 'manual']).optional(),
      waitingRoom: z.boolean().optional(),
      qa: z.boolean().optional(),
      chat: z.boolean().optional(),
      allowRecording: z.boolean().optional(),
    }).optional(),
    recording: z.object({
      autoRecord: z.boolean().optional(),
    }).optional(),
  }),
});

export const addRecordingSchema = z.object({
  body: z.object({
    liveClass: z.string().min(1).max(FIELD_SIZES.URL),
    course: z.string().min(1).max(FIELD_SIZES.URL),
    title: z.string().min(1).max(FIELD_SIZES.TITLE),
    url: z.string().url('Recording URL is required').max(FIELD_SIZES.URL),
    password: z.string().max(FIELD_SIZES.TOKEN).optional(),
    duration: z.number().int().max(86400).optional(),
    format: z.string().max(FIELD_SIZES.NAME).optional(),
    thumbnailUrl: z.string().max(FIELD_SIZES.URL).optional(),
  }),
});

export const syncRecordingSchema = z.object({
  body: z.object({
    liveClassId: z.string().min(1, 'Live class ID is required').max(FIELD_SIZES.URL),
  }),
});

export const recordingParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Recording ID is required').max(FIELD_SIZES.URL),
  }),
});

export const recordingsQuerySchema = z.object({
  query: paginationSchema.extend({
    courseId: z.string().max(FIELD_SIZES.URL).optional(),
    instructorId: z.string().max(FIELD_SIZES.URL).optional(),
    status: z.string().max(FIELD_SIZES.NAME).optional(),
    search: z.string().max(FIELD_SIZES.TITLE).optional(),
  }),
});
