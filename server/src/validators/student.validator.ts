import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  body: z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    couponCode: z.string().optional(),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
  }),
});

export const updateProgressSchema = z.object({
  body: z.object({
    lectureId: z.string().min(1),
    position: z.number().min(0).optional(),
    completed: z.boolean().optional(),
    duration: z.number().min(0).optional(),
  }),
});

export const createNoteSchema = z.object({
  body: z.object({
    courseId: z.string().min(1),
    lectureId: z.string().min(1),
    content: z.string().min(1).max(5000),
    timestamp: z.number().min(0).optional(),
  }),
});

export const updateNoteSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(5000),
    timestamp: z.number().min(0).optional(),
  }),
});

export const toggleBookmarkSchema = z.object({
  body: z.object({
    courseId: z.string().min(1),
    lectureId: z.string().min(1),
  }),
});

export const createDiscussionSchema = z.object({
  body: z.object({
    courseId: z.string().min(1),
    lectureId: z.string().optional(),
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(5000),
  }),
});

export const replyToDiscussionSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(5000),
  }),
});

export const createReviewSchema = z.object({
  body: z.object({
    courseId: z.string().min(1),
    rating: z.number().min(1).max(5),
    review: z.string().max(2000).optional(),
  }),
});

export const submitAssignmentSchema = z.object({
  body: z.object({
    courseId: z.string().min(1),
    lectureId: z.string().min(1),
    content: z.string().max(5000).optional(),
  }),
});

export const submitQuizSchema = z.object({
  body: z.object({
    courseId: z.string().min(1),
    lectureId: z.string().min(1),
    answers: z
      .array(
        z.object({
          question: z.string().min(1),
          selectedAnswer: z.string().min(1),
        })
      )
      .min(1),
  }),
});
