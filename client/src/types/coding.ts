export type Difficulty = 'easy' | 'medium' | 'hard';
export type SubmissionStatus =
  | 'pending'
  | 'running'
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded'
  | 'runtime_error'
  | 'compilation_error';
export type ProgrammingLanguage = 'javascript' | 'python' | 'java' | 'cpp' | 'typescript' | 'go' | 'rust';

export interface TestCase {
  input: string;
  expectedOutput: string;
  isSample: boolean;
  explanation?: string;
}

export interface CodingProblemListItem {
  _id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
  categories: string[];
  supportedLanguages: ProgrammingLanguage[];
  totalSubmissions: number;
  acceptedSubmissions: number;
  createdBy: { _id: string; name: string };
  course?: { _id: string; title: string };
  isPublished: boolean;
  createdAt: string;
}

export interface CodingProblemDetail extends CodingProblemListItem {
  description: string;
  timeLimit: number;
  memoryLimit: number;
  testCases: TestCase[];
  solutionTemplate: Record<string, string>;
  solutionApproach?: string;
}

export interface TestResult {
  testCaseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
  runtime?: number;
  memoryUsed?: number;
}

export interface CodingSubmission {
  _id: string;
  user: { _id: string; name: string; email: string };
  problem: { _id: string; title: string; difficulty: Difficulty; slug: string };
  code: string;
  language: ProgrammingLanguage;
  status: SubmissionStatus;
  testResults: TestResult[];
  score: number;
  totalTestCases: number;
  passedTestCases: number;
  runtime: number;
  memoryUsed: number;
  errorMessage?: string;
  isPractice: boolean;
  createdAt: string;
}

export interface CreateCodingProblemPayload {
  title: string;
  description: string;
  difficulty: Difficulty;
  tags?: string[];
  categories?: string[];
  supportedLanguages?: ProgrammingLanguage[];
  timeLimit?: number;
  memoryLimit?: number;
  testCases: TestCase[];
  solutionTemplate?: Record<string, string>;
  solutionApproach?: string;
  instructorSolution?: string;
  course?: string;
  lecture?: string;
  isPublished?: boolean;
}

export interface SubmitCodePayload {
  code: string;
  language: ProgrammingLanguage;
  isPractice?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
