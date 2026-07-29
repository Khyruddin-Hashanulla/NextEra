import { z } from 'zod';
import { FIELD_SIZES } from '../utils/validation';

export const initiatePaymentSchema = z.object({
  body: z.object({
    courseId: z.string().min(1, 'Course ID is required').max(FIELD_SIZES.URL),
    couponCode: z.string().max(20).optional(),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1).max(FIELD_SIZES.URL),
    razorpayPaymentId: z.string().min(1).max(FIELD_SIZES.URL),
    razorpaySignature: z.string().min(1).max(FIELD_SIZES.URL),
  }),
});

export const updateProgressSchema = z.object({
  body: z.object({
    lectureId: z.string().min(1).max(FIELD_SIZES.URL),
    position: z.number().min(0).max(86400).optional(),
    completed: z.boolean().optional(),
    duration: z.number().min(0).max(86400).optional(),
  }),
});

export const createNoteSchema = z.object({
  body: z.object({
    courseId: z.string().min(1).max(FIELD_SIZES.URL),
    lectureId: z.string().min(1).max(FIELD_SIZES.URL),
    content: z.string().min(1).max(FIELD_SIZES.NOTE),
    timestamp: z.number().min(0).max(86400).optional(),
  }),
});

export const updateNoteSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(FIELD_SIZES.NOTE),
    timestamp: z.number().min(0).max(86400).optional(),
  }),
});

export const toggleBookmarkSchema = z.object({
  body: z.object({
    courseId: z.string().min(1).max(FIELD_SIZES.URL),
    lectureId: z.string().min(1).max(FIELD_SIZES.URL),
  }),
});

export const createDiscussionSchema = z.object({
  body: z.object({
    courseId: z.string().min(1).max(FIELD_SIZES.URL),
    lectureId: z.string().max(FIELD_SIZES.URL).optional(),
    title: z.string().min(1).max(FIELD_SIZES.TITLE),
    content: z.string().min(1).max(FIELD_SIZES.COMMENT),
  }),
});

export const replyToDiscussionSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(FIELD_SIZES.COMMENT),
  }),
});

export const createReviewSchema = z.object({
  body: z.object({
    courseId: z.string().min(1).max(FIELD_SIZES.URL),
    rating: z.number().min(1).max(5),
    review: z.string().max(FIELD_SIZES.REVIEW).optional(),
  }),
});

export const submitAssignmentSchema = z.object({
  body: z.object({
    courseId: z.string().min(1).max(FIELD_SIZES.URL),
    lectureId: z.string().min(1).max(FIELD_SIZES.URL),
    content: z.string().max(FIELD_SIZES.NOTE).optional(),
  }),
});

export const submitQuizSchema = z.object({
  body: z.object({
    courseId: z.string().min(1).max(FIELD_SIZES.URL),
    lectureId: z.string().min(1).max(FIELD_SIZES.URL),
    answers: z
      .array(
        z.object({
          question: z.string().min(1).max(FIELD_SIZES.QUESTION),
          selectedAnswer: z.string().min(1).max(FIELD_SIZES.SHORT_DESCRIPTION),
        })
      )
      .min(1)
      .max(200),
  }),
});
