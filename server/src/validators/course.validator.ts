import { z } from 'zod';
import { FIELD_SIZES, ARRAY_LIMITS } from '../utils/validation';

const videoSourceSchema = z.object({
  source: z.enum(['youtube', 'vimeo', 'bunny', 's3', 'direct', 'none']).default('none'),
  url: z.string().max(FIELD_SIZES.URL).default(''),
  videoId: z.string().max(FIELD_SIZES.URL).default(''),
  provider: z.string().max(FIELD_SIZES.NAME).default(''),
  thumbnailUrl: z.string().max(FIELD_SIZES.URL).default(''),
  playbackRate: z.number().default(1),
  qualities: z.array(z.string().max(FIELD_SIZES.SHORT_DESCRIPTION)).max(10).default([]),
});

const lectureAttachmentSchema = z.object({
  url: z.string().max(FIELD_SIZES.URL),
  publicId: z.string().max(FIELD_SIZES.URL),
  name: z.string().max(FIELD_SIZES.TITLE),
  type: z.string().max(FIELD_SIZES.NAME),
  size: z.number().max(200 * 1024 * 1024).default(0),
});

const resourceSchema = z.object({
  url: z.string().max(FIELD_SIZES.URL),
  publicId: z.string().max(FIELD_SIZES.URL),
  name: z.string().max(FIELD_SIZES.TITLE),
  type: z.string().max(FIELD_SIZES.NAME),
  size: z.number().max(200 * 1024 * 1024).default(0),
});

const sourceCodeSchema = z.object({
  url: z.string().max(FIELD_SIZES.URL).default(''),
  publicId: z.string().max(FIELD_SIZES.URL).default(''),
  name: z.string().max(FIELD_SIZES.TITLE).default(''),
  size: z.number().max(200 * 1024 * 1024).default(0),
});

const certificateSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  template: z.string().max(FIELD_SIZES.URL).optional(),
  issueAutomatically: z.boolean().optional(),
  passingCriteria: z.enum(['completion', 'quiz_score']).optional(),
  minimumQuizScore: z.number().min(0).max(100).optional(),
});

const pricingSchema = z.object({
  originalPrice: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  hasDiscount: z.boolean().optional(),
  gstPercent: z.number().min(0).max(100).optional(),
  gstInclusive: z.boolean().optional(),
});

const metaSchema = z.object({
  seoTitle: z.string().max(FIELD_SIZES.TITLE).optional(),
  seoDescription: z.string().max(FIELD_SIZES.SHORT_DESCRIPTION).optional(),
  seoKeywords: z.array(z.string().max(FIELD_SIZES.NAME)).max(ARRAY_LIMITS.SEO_KEYWORDS).optional(),
});

const questionSchema = z.object({
  question: z.string().min(1).max(FIELD_SIZES.QUESTION),
  options: z.array(z.string().min(1).max(FIELD_SIZES.SHORT_DESCRIPTION)).min(2, 'At least 2 options required').max(ARRAY_LIMITS.OPTIONS_PER_QUESTION),
  correctAnswer: z.string().min(1).max(FIELD_SIZES.SHORT_DESCRIPTION),
  explanation: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
  marks: z.number().min(0).max(1000).optional(),
});

const assignmentSchema = z.object({
  question: z.string().min(1).max(FIELD_SIZES.DESCRIPTION),
  instructions: z.string().min(1).max(FIELD_SIZES.INSTRUCTIONS),
  dueDate: z.string().max(FIELD_SIZES.TIMESTAMP).optional(),
  totalMarks: z.number().min(0).max(10000).optional(),
  passingMarks: z.number().min(0).max(10000).optional(),
  allowLateSubmission: z.boolean().optional(),
  lateSubmissionDays: z.number().min(0).max(365).optional(),
  penaltyPercent: z.number().min(0).max(100).optional(),
});

const quizSchema = z.object({
  timeLimit: z.number().min(0).max(1440).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  maxAttempts: z.number().min(0).max(100).optional(),
  showResults: z.boolean().optional(),
  randomizeQuestions: z.boolean().optional(),
  questions: z.array(questionSchema).max(ARRAY_LIMITS.QUESTIONS_PER_QUIZ).optional(),
});

export const createCourseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(FIELD_SIZES.TITLE),
  description: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
  shortDescription: z.string().max(FIELD_SIZES.SHORT_DESCRIPTION).optional(),
  thumbnail: z.object({ url: z.string().max(FIELD_SIZES.URL), publicId: z.string().max(FIELD_SIZES.URL) }).optional(),
  introVideo: videoSourceSchema.optional(),
  welcomeMessage: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
  congratulationMessage: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
  pricing: pricingSchema.optional(),
  price: z.number().min(0).optional(),
  category: z.string().max(FIELD_SIZES.URL).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'all']).optional(),
  language: z.string().max(FIELD_SIZES.LANGUAGE).optional(),
  prerequisites: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
  benefits: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
  requirements: z.array(z.string().max(FIELD_SIZES.SHORT_DESCRIPTION)).max(ARRAY_LIMITS.REQUIREMENTS).optional(),
  tags: z.array(z.string().max(FIELD_SIZES.NAME)).max(ARRAY_LIMITS.TAGS).optional(),
  whatYouWillLearn: z.array(z.string().max(FIELD_SIZES.SHORT_DESCRIPTION)).max(ARRAY_LIMITS.WHAT_YOU_LEARN).optional(),
  visibility: z.enum(['public', 'private']).optional(),
  courseType: z.enum(['paid', 'free', 'draft', 'private']).optional(),
  badge: z.string().max(FIELD_SIZES.BADGE).optional(),
  certificateSettings: certificateSettingsSchema.optional(),
  meta: metaSchema.optional(),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  thumbnail: z.object({ url: z.string().max(FIELD_SIZES.URL), publicId: z.string().max(FIELD_SIZES.URL) }).optional(),
});

export const createSectionSchema = z.object({
  title: z.string().min(2, 'Section title must be at least 2 characters').max(FIELD_SIZES.TITLE),
  description: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
  objective: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
});

export const updateSectionSchema = z.object({
  title: z.string().min(2).max(FIELD_SIZES.TITLE).optional(),
  description: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
  objective: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
  order: z.number().min(0).max(1000).optional(),
});

export const createLectureSchema = z.object({
  title: z.string().min(2, 'Lecture title must be at least 2 characters').max(FIELD_SIZES.TITLE),
  slug: z.string().max(FIELD_SIZES.SLUG).optional(),
  description: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
  type: z.enum(['video', 'article', 'assignment', 'quiz']),
  duration: z.number().min(0).max(86400).optional(),
  videoSource: videoSourceSchema.optional(),
  videoUrl: z.object({
    url: z.string().max(FIELD_SIZES.URL),
    publicId: z.string().max(FIELD_SIZES.URL),
  }).optional(),
  articleContent: z.string().max(FIELD_SIZES.ARTICLE_CONTENT).optional(),
  resources: z.array(resourceSchema).max(ARRAY_LIMITS.RESOURCES_PER_LECTURE).optional(),
  attachments: z.array(lectureAttachmentSchema).max(ARRAY_LIMITS.ATTACHMENTS_PER_LECTURE).optional(),
  sourceCode: sourceCodeSchema.optional(),
  practiceFiles: z.array(lectureAttachmentSchema).max(ARRAY_LIMITS.PRACTICE_FILES).optional(),
  notes: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
  assignment: assignmentSchema.optional(),
  quiz: quizSchema.optional(),
  isFree: z.boolean().optional(),
  seoTitle: z.string().max(FIELD_SIZES.TITLE).optional(),
  seoDescription: z.string().max(FIELD_SIZES.SHORT_DESCRIPTION).optional(),
});

export const updateLectureSchema = createLectureSchema.partial();

export const reorderSectionsSchema = z.object({
  sectionOrder: z.array(z.object({
    sectionId: z.string().max(FIELD_SIZES.URL),
    order: z.number().min(0).max(1000),
  })).max(ARRAY_LIMITS.SECTIONS),
});

export const reorderLecturesSchema = z.object({
  lectureOrder: z.array(z.object({
    lectureId: z.string().max(FIELD_SIZES.URL),
    order: z.number().min(0).max(1000),
  })).max(ARRAY_LIMITS.LECTURES_PER_SECTION),
});
