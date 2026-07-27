import { z } from 'zod';

const videoSourceSchema = z.object({
  source: z.enum(['youtube', 'vimeo', 'bunny', 's3', 'direct', 'none']).default('none'),
  url: z.string().default(''),
  videoId: z.string().default(''),
  provider: z.string().default(''),
  thumbnailUrl: z.string().default(''),
  playbackRate: z.number().default(1),
  qualities: z.array(z.string()).default([]),
});

const lectureAttachmentSchema = z.object({
  url: z.string(),
  publicId: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number().default(0),
});

const resourceSchema = z.object({
  url: z.string(),
  publicId: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number().default(0),
});

const sourceCodeSchema = z.object({
  url: z.string().default(''),
  publicId: z.string().default(''),
  name: z.string().default(''),
  size: z.number().default(0),
});

export const createCourseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(300).optional(),
  thumbnail: z.object({ url: z.string(), publicId: z.string() }).optional(),
  introVideo: videoSourceSchema.optional(),
  welcomeMessage: z.string().optional(),
  congratulationMessage: z.string().optional(),
  pricing: z.object({
    originalPrice: z.number().min(0).optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    hasDiscount: z.boolean().optional(),
    gstPercent: z.number().min(0).max(100).optional(),
    gstInclusive: z.boolean().optional(),
  }).optional(),
  price: z.number().min(0).optional(),
  category: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'all']).optional(),
  language: z.string().optional(),
  prerequisites: z.string().optional(),
  benefits: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  whatYouWillLearn: z.array(z.string()).optional(),
  visibility: z.enum(['public', 'private']).optional(),
  courseType: z.enum(['paid', 'free', 'draft', 'private']).optional(),
  badge: z.string().optional(),
  certificateSettings: z.object({
    enabled: z.boolean().optional(),
    template: z.string().optional(),
    issueAutomatically: z.boolean().optional(),
    passingCriteria: z.enum(['completion', 'quiz_score']).optional(),
    minimumQuizScore: z.number().min(0).max(100).optional(),
  }).optional(),
  meta: z.object({
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.array(z.string()).optional(),
  }).optional(),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  thumbnail: z.object({ url: z.string(), publicId: z.string() }).optional(),
});

export const createSectionSchema = z.object({
  title: z.string().min(2, 'Section title must be at least 2 characters').max(200),
  description: z.string().optional(),
  objective: z.string().optional(),
});

export const updateSectionSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().optional(),
  objective: z.string().optional(),
  order: z.number().min(0).optional(),
});

export const createLectureSchema = z.object({
  title: z.string().min(2, 'Lecture title must be at least 2 characters').max(200),
  slug: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['video', 'article', 'assignment', 'quiz']),
  duration: z.number().min(0).optional(),
  videoSource: videoSourceSchema.optional(),
  videoUrl: z.object({ url: z.string(), publicId: z.string() }).optional(),
  articleContent: z.string().optional(),
  resources: z.array(resourceSchema).optional(),
  attachments: z.array(lectureAttachmentSchema).optional(),
  sourceCode: sourceCodeSchema.optional(),
  practiceFiles: z.array(lectureAttachmentSchema).optional(),
  notes: z.string().optional(),
  assignment: z.object({
    question: z.string(),
    instructions: z.string(),
    dueDate: z.string().optional(),
    totalMarks: z.number().optional(),
    passingMarks: z.number().optional(),
    allowLateSubmission: z.boolean().optional(),
    lateSubmissionDays: z.number().optional(),
    penaltyPercent: z.number().optional(),
  }).optional(),
  quiz: z.object({
    timeLimit: z.number().optional(),
    passingScore: z.number().optional(),
    maxAttempts: z.number().optional(),
    showResults: z.boolean().optional(),
    randomizeQuestions: z.boolean().optional(),
    questions: z.array(z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.string(),
      explanation: z.string().optional(),
      marks: z.number().optional(),
    })).optional(),
  }).optional(),
  isFree: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export const updateLectureSchema = createLectureSchema.partial();

export const reorderSectionsSchema = z.object({
  sectionOrder: z.array(z.object({ sectionId: z.string(), order: z.number() })),
});

export const reorderLecturesSchema = z.object({
  lectureOrder: z.array(z.object({ lectureId: z.string(), order: z.number() })),
});
