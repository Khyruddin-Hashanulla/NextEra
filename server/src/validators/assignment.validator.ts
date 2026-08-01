import { z } from 'zod';
import { FIELD_SIZES } from '../utils/validation';
import { ASSIGNMENT_STATUSES } from '../utils/grading';

const assignmentFileSchema = z.object({
  url: z.string().min(1).max(FIELD_SIZES.URL),
  publicId: z.string().min(1).max(FIELD_SIZES.URL),
  name: z.string().min(1).max(FIELD_SIZES.TITLE),
});

const rubricItemSchema = z.object({
  criteria: z.string().min(1).max(300),
  maxPoints: z.number().min(0).max(100000),
  obtainedPoints: z.number().min(0).max(100000),
  comment: z.string().max(1000).optional(),
});

export const gradeSubmissionSchema = z.object({
  body: z.object({
    grade: z.number().min(0).max(100000),
    maxMarks: z.number().min(1).max(100000).optional(),
    feedback: z.string().max(FIELD_SIZES.REVIEW).optional(),
    privateNotes: z.string().max(FIELD_SIZES.REVIEW).optional(),
    letterGrade: z.string().max(10).optional(),
    customGradeScale: z.string().max(200).optional(),
    rubric: z.array(rubricItemSchema).max(50).optional(),
    gradedFiles: z.array(assignmentFileSchema).max(5).optional(),
    publish: z.boolean().optional(),
  }),
});

export const updateSubmissionStatusSchema = z.object({
  body: z.object({
    status: z.enum(['under_review', 'rejected']),
    privateNotes: z.string().max(FIELD_SIZES.REVIEW).optional(),
  }),
});

export const returnForResubmissionSchema = z.object({
  body: z.object({
    feedback: z.string().max(FIELD_SIZES.REVIEW).optional(),
    privateNotes: z.string().max(FIELD_SIZES.REVIEW).optional(),
    resubmissionDeadline: z.string().datetime().optional(),
  }),
});

export const overrideGradeSchema = z.object({
  body: z.object({
    grade: z.number().min(0).max(100000),
    maxMarks: z.number().min(1).max(100000).optional(),
    feedback: z.string().max(FIELD_SIZES.REVIEW).optional(),
    privateNotes: z.string().max(FIELD_SIZES.REVIEW).optional(),
    letterGrade: z.string().max(10).optional(),
    customGradeScale: z.string().max(200).optional(),
    rubric: z.array(rubricItemSchema).max(50).optional(),
    gradedFiles: z.array(assignmentFileSchema).max(5).optional(),
  }),
});

export const submitAssignmentSchema = z.object({
  body: z.object({
    courseId: z.string().min(1).max(FIELD_SIZES.URL),
    lectureId: z.string().min(1).max(FIELD_SIZES.URL),
    content: z.string().max(FIELD_SIZES.NOTE).optional(),
    files: z.array(assignmentFileSchema).max(5).optional(),
  }),
});

export const assignmentsOverviewQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1).catch(1),
    limit: z.coerce.number().int().min(1).max(100).default(20).catch(20),
    courseId: z.string().optional(),
    status: z.enum(ASSIGNMENT_STATUSES).optional(),
  }),
});

export const submissionsListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1).catch(1),
    limit: z.coerce.number().int().min(1).max(100).default(20).catch(20),
    status: z.enum(ASSIGNMENT_STATUSES).optional(),
    search: z.string().max(200).optional(),
    sort: z.enum(['submittedAt', '-submittedAt', 'grade', '-grade']).optional(),
  }),
});
