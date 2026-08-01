import { z } from 'zod';
import { FIELD_SIZES } from '../utils/validation';
import { ROLES } from '../constants/roles';

export const startQuizSchema = z.object({
  body: z.object({
    courseId: z.string().min(1).max(FIELD_SIZES.URL),
    lectureId: z.string().min(1).max(FIELD_SIZES.URL),
  }),
});

export const submitQuizSchema = z.object({
  body: z.object({
    attemptId: z.string().min(1).max(FIELD_SIZES.URL),
    answers: z
      .array(
        z.object({
          questionId: z.string().min(1).max(FIELD_SIZES.URL).optional(),
          question: z.string().min(1).max(FIELD_SIZES.QUESTION),
          selectedAnswer: z.string().min(1).max(FIELD_SIZES.SHORT_DESCRIPTION),
        })
      )
      .min(1)
      .max(200),
    autoSubmitted: z.boolean().optional(),
  }),
});

export const updateQuizStatusSchema = z.object({
  body: z.object({
    status: z.enum(['started', 'in_progress', 'submitted', 'graded', 'published', 'abandoned']),
    remark: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
  }),
});

export const overrideGradeSchema = z.object({
  body: z.object({
    grade: z.number().min(0).max(100000).optional(),
    feedback: z.string().max(FIELD_SIZES.REVIEW).optional(),
    letterGrade: z.string().max(10).optional(),
    publish: z.boolean().optional(),
    gradedFiles: z
      .array(
        z.object({
          url: z.string().min(1).max(FIELD_SIZES.URL),
          publicId: z.string().min(1).max(FIELD_SIZES.URL),
          name: z.string().min(1).max(FIELD_SIZES.TITLE),
        })
      )
      .max(5)
      .optional(),
    rubric: z
      .array(
        z.object({
          criteria: z.string().min(1).max(300),
          maxPoints: z.number().min(0).max(100000),
          obtainedPoints: z.number().min(0).max(100000),
          comment: z.string().max(1000).optional(),
        })
      )
      .max(50)
      .optional(),
    resubmissionDeadline: z.string().datetime().optional(),
  }),
});

export const publishGradeSchema = z.object({
  body: z.object({
    publishedBy: z.string().min(1).max(FIELD_SIZES.URL),
  }),
});

export const quizAnalyticsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1).catch(1),
    limit: z.coerce.number().int().min(1).max(100).default(20).catch(20),
    lectureId: z.string().optional(),
    courseId: z.string().optional(),
    search: z.string().max(200).optional(),
    sort: z.enum(['recent', 'score-desc', 'score-asc', 'accuracy-desc']).optional(),
  }),
});

export const quizExportQuerySchema = z.object({
  query: z.object({
    lectureId: z.string().optional(),
    courseId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const quizAttemptQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1).catch(1),
    limit: z.coerce.number().int().min(1).max(100).default(20).catch(20),
    status: z.enum(['in_progress', 'pending', 'graded', 'published', 'abandoned']).optional(),
    attemptNumber: z.coerce.number().int().min(1).optional(),
    search: z.string().max(200).optional(),
    sort: z.enum(['createdAt-desc', 'createdAt-asc', 'score-desc', 'score-asc']).optional(),
  }),
});

export const resumeQuizSchema = z.object({
  body: z.object({
    attemptId: z.string().min(1).max(FIELD_SIZES.URL),
  }),
});

export const autoSubmitQuizSchema = z.object({
  body: z.object({
    attemptId: z.string().min(1).max(FIELD_SIZES.URL),
  }),
});