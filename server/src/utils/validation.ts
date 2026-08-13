export const FIELD_SIZES = {
  TITLE: 200,
  SHORT_DESCRIPTION: 300,
  DESCRIPTION: 5000,
  BIO: 500,
  MESSAGE: 5000,
  CONTENT: 50000,
  COMMENT: 5000,
  REVIEW: 2000,
  NOTE: 5000,
  REPLY: 2000,
  ANNOUNCEMENT: 5000,
  NAME: 100,
  EMAIL: 254,
  PHONE: 20,
  ADDRESS: 500,
  QUALIFICATION: 1000,
  EXPERIENCE: 2000,
  QUESTION: 500,
  INSTRUCTIONS: 2000,
  TOPIC: 200,
  AGENDA: 2000,
  CODE: 100000,
  ARTICLE_CONTENT: 50000,
  PASSWORD: 128,
  TOKEN: 500,
  URL: 2048,
  SLUG: 200,
  REASON: 500,
  ADMIN_NOTE: 500,
  PLATFORM_NAME: 100,
  CURRENCY: 3,
  TIMESTAMP: 50,
  BADGE: 50,
  LANGUAGE: 50,
  LINK: 2048,
} as const;

export const ARRAY_LIMITS = {
  TAGS: 20,
  CATEGORIES: 20,
  REQUIREMENTS: 20,
  WHAT_YOU_LEARN: 50,
  SECTIONS: 100,
  LECTURES_PER_SECTION: 200,
  QUESTIONS_PER_QUIZ: 100,
  RESOURCES_PER_LECTURE: 20,
  ATTACHMENTS_PER_LECTURE: 10,
  PRACTICE_FILES: 10,
  KEYWORDS: 20,
  SKILLS: 20,
  FEATURES: 50,
  PERMISSIONS: 50,
  VARIABLES: 30,
  HISTORY_MESSAGES: 50,
  SUPPORTED_LANGUAGES: 10,
  TEST_CASES: 50,
  SOCIAL_LINKS: 10,
  EXPERTISE: 20,
  SEO_KEYWORDS: 20,
  OPTIONS_PER_QUESTION: 10,
} as const;

export const NESTING_LIMITS = {
  MAX_DEPTH: 6,
  MAX_KEYS: 100,
} as const;

import { z } from 'zod';

export const stringField = (maxSize: number, minSize = 1) => z.string().min(minSize).max(maxSize).trim();

export const optionalStringField = (maxSize: number) => z.string().max(maxSize).trim().optional();

export const limitedArray = <T extends z.ZodTypeAny>(schema: T, maxItems: number) => z.array(schema).max(maxItems);

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).default(20).catch(20),
});
