import { z } from 'zod';
import { FIELD_SIZES, ARRAY_LIMITS } from '../utils/validation';

const testCaseSchema = z.object({
  input: z.string().max(FIELD_SIZES.CONTENT),
  expectedOutput: z.string().max(FIELD_SIZES.CONTENT),
  isSample: z.boolean().optional().default(false),
  explanation: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
});

export const createCodingProblemSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(FIELD_SIZES.TITLE),
    description: z.string().min(1).max(FIELD_SIZES.CONTENT),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    tags: z.array(z.string().max(FIELD_SIZES.NAME)).max(ARRAY_LIMITS.TAGS).optional().default([]),
    categories: z.array(z.string().max(FIELD_SIZES.NAME)).max(ARRAY_LIMITS.CATEGORIES).optional().default([]),
    supportedLanguages: z
      .array(z.enum(['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'rust']))
      .max(ARRAY_LIMITS.SUPPORTED_LANGUAGES)
      .optional()
      .default(['javascript', 'python']),
    timeLimit: z.number().min(1).max(60).optional().default(2),
    memoryLimit: z.number().min(16).max(1024).optional().default(256),
    testCases: z.array(testCaseSchema).min(1).max(ARRAY_LIMITS.TEST_CASES),
    solutionTemplate: z.record(z.string().max(FIELD_SIZES.CONTENT)).optional().default({}),
    solutionApproach: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
    instructorSolution: z.string().max(FIELD_SIZES.CONTENT).optional(),
    course: z.string().max(FIELD_SIZES.URL).optional(),
    lecture: z.string().max(FIELD_SIZES.URL).optional(),
    isPublished: z.boolean().optional().default(false),
  }),
});

export const updateCodingProblemSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(FIELD_SIZES.TITLE).optional(),
    description: z.string().min(1).max(FIELD_SIZES.CONTENT).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    tags: z.array(z.string().max(FIELD_SIZES.NAME)).max(ARRAY_LIMITS.TAGS).optional(),
    categories: z.array(z.string().max(FIELD_SIZES.NAME)).max(ARRAY_LIMITS.CATEGORIES).optional(),
    supportedLanguages: z
      .array(z.enum(['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'rust']))
      .max(ARRAY_LIMITS.SUPPORTED_LANGUAGES)
      .optional(),
    timeLimit: z.number().min(1).max(60).optional(),
    memoryLimit: z.number().min(16).max(1024).optional(),
    testCases: z.array(testCaseSchema).min(1).max(ARRAY_LIMITS.TEST_CASES).optional(),
    solutionTemplate: z.record(z.string().max(FIELD_SIZES.CONTENT)).optional(),
    solutionApproach: z.string().max(FIELD_SIZES.DESCRIPTION).optional(),
    instructorSolution: z.string().max(FIELD_SIZES.CONTENT).optional(),
    course: z.string().max(FIELD_SIZES.URL).optional(),
    lecture: z.string().max(FIELD_SIZES.URL).optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const submitCodeSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(FIELD_SIZES.CODE),
    language: z.enum(['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'rust']),
    isPractice: z.boolean().optional().default(true),
  }),
});

export const listCodingProblemsQuerySchema = z.object({
  query: z.object({
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    tag: z.string().max(FIELD_SIZES.NAME).optional(),
    category: z.string().max(FIELD_SIZES.NAME).optional(),
    course: z.string().max(FIELD_SIZES.URL).optional(),
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
    search: z.string().max(FIELD_SIZES.TITLE).optional(),
    sort: z.enum(['newest', 'oldest', 'difficulty', 'submissions']).optional().default('newest'),
  }),
});
