import { z } from 'zod';

const testCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isSample: z.boolean().optional().default(false),
  explanation: z.string().optional(),
});

export const createCodingProblemSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(50000),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    tags: z.array(z.string()).optional().default([]),
    categories: z.array(z.string()).optional().default([]),
    supportedLanguages: z.array(z.enum(['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'rust'])).optional().default(['javascript', 'python']),
    timeLimit: z.number().min(1).max(60).optional().default(2),
    memoryLimit: z.number().min(16).max(1024).optional().default(256),
    testCases: z.array(testCaseSchema).min(1),
    solutionTemplate: z.record(z.string()).optional().default({}),
    solutionApproach: z.string().max(10000).optional(),
    instructorSolution: z.string().max(50000).optional(),
    course: z.string().optional(),
    lecture: z.string().optional(),
    isPublished: z.boolean().optional().default(false),
  }),
});

export const updateCodingProblemSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(50000).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    supportedLanguages: z.array(z.enum(['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'rust'])).optional(),
    timeLimit: z.number().min(1).max(60).optional(),
    memoryLimit: z.number().min(16).max(1024).optional(),
    testCases: z.array(testCaseSchema).min(1).optional(),
    solutionTemplate: z.record(z.string()).optional(),
    solutionApproach: z.string().max(10000).optional(),
    instructorSolution: z.string().max(50000).optional(),
    course: z.string().optional(),
    lecture: z.string().optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const submitCodeSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(100000),
    language: z.enum(['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'rust']),
    isPractice: z.boolean().optional().default(true),
  }),
});

export const listCodingProblemsQuerySchema = z.object({
  query: z.object({
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    tag: z.string().optional(),
    category: z.string().optional(),
    course: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
    search: z.string().optional(),
    sort: z.enum(['newest', 'oldest', 'difficulty', 'submissions']).optional().default('newest'),
  }),
});
