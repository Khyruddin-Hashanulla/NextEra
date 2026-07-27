import { z } from 'zod';

export const createLiveClassSchema = z.object({
  body: z.object({
    course: z.string().min(1, 'Course ID is required'),
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().optional().default(''),
    topic: z.string().optional().default(''),
    agenda: z.string().optional().default(''),
    startTime: z.string().min(1, 'Start time is required'),
    duration: z.number().int().min(1, 'Duration must be at least 1 minute').max(1440),
    timezone: z.string().optional().default('UTC'),
    meetingProvider: z.enum(['zoom', 'google_meet', 'other']).optional().default('zoom'),
    password: z.string().optional(),
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
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    topic: z.string().optional(),
    agenda: z.string().optional(),
    startTime: z.string().optional(),
    duration: z.number().int().min(1).max(1440).optional(),
    timezone: z.string().optional(),
    password: z.string().optional(),
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
    liveClass: z.string().min(1),
    course: z.string().min(1),
    title: z.string().min(1),
    url: z.string().url('Recording URL is required'),
    password: z.string().optional(),
    duration: z.number().int().optional(),
    format: z.string().optional(),
    thumbnailUrl: z.string().optional(),
  }),
});
