import { CodingProblem } from '../models/codingProblem.model';
import { CodingSubmission, ITestResult, ICodingSubmission } from '../models/codingSubmission.model';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';
import { withTransaction } from '../utils/transaction';
import { escapeRegex } from '../utils/escapeRegex';

interface ListProblemsOptions {
  difficulty?: string;
  tag?: string;
  category?: string;
  course?: string;
  page: number;
  limit: number;
  search?: string;
  sort: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

export const createProblem = async (data: any, userId: string) => {
  let slug = generateSlug(data.title);
  const existing = await CodingProblem.findOne({ slug });
  if (existing) slug = `${slug}-${Date.now()}`;
  const problem = await CodingProblem.create({ ...data, slug, createdBy: userId });
  return problem;
};

export const updateProblem = async (problemId: string, data: any, userId: string) => {
  const problem = await CodingProblem.findById(problemId);
  if (!problem) throw ApiError.notFound('Problem not found');
  if (problem.createdBy.toString() !== userId) throw ApiError.forbidden('Not authorized to edit this problem');
  if (data.title && data.title !== problem.title) {
    let slug = generateSlug(data.title);
    const existing = await CodingProblem.findOne({ slug, _id: { $ne: problemId } });
    if (existing) slug = `${slug}-${Date.now()}`;
    data.slug = slug;
  }
  Object.assign(problem, data);
  await problem.save();
  return problem;
};

export const deleteProblem = async (problemId: string, userId: string) => {
  const problem = await CodingProblem.findById(problemId);
  if (!problem) throw ApiError.notFound('Problem not found');
  if (problem.createdBy.toString() !== userId) throw ApiError.forbidden('Not authorized');
  await withTransaction(async (session) => {
    await CodingSubmission.deleteMany({ problem: problemId }, { session });
    await CodingProblem.findByIdAndDelete(problemId, { session });
  });
};

export const getProblemById = async (problemId: string) => {
  const problem = await CodingProblem.findById(problemId).populate('createdBy', 'name email');
  if (!problem) throw ApiError.notFound('Problem not found');
  return problem;
};

export const getProblemBySlug = async (slug: string) => {
  const problem = await CodingProblem.findOne({ slug }).populate('createdBy', 'name email');
  if (!problem) throw ApiError.notFound('Problem not found');
  return problem;
};

export const listProblems = async (options: ListProblemsOptions) => {
  const query: Record<string, any> = { isPublished: true };
  if (options.difficulty) query.difficulty = options.difficulty;
  if (options.tag) query.tags = options.tag;
  if (options.category) query.categories = options.category;
  if (options.course) query.course = new mongoose.Types.ObjectId(options.course);
  if (options.search) {
    const escaped = escapeRegex(options.search);
    query.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { tags: { $regex: escaped, $options: 'i' } },
    ];
  }

  let sortOption: Record<string, any> = { createdAt: -1 };
  if (options.sort === 'oldest') sortOption = { createdAt: 1 };
  else if (options.sort === 'difficulty') sortOption = { difficulty: 1 };
  else if (options.sort === 'submissions') sortOption = { totalSubmissions: -1 };

  const total = await CodingProblem.countDocuments(query);
  const problems = await CodingProblem.find(query)
    .populate('createdBy', 'name')
    .select('-testCases -instructorSolution -solutionApproach')
    .sort(sortOption)
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);

  return {
    problems,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      pages: Math.ceil(total / options.limit),
    },
  };
};

export const listInstructorProblems = async (userId: string, page: number, limit: number) => {
  const total = await CodingProblem.countDocuments({ createdBy: userId });
  const problems = await CodingProblem.find({ createdBy: userId })
    .populate('course', 'title')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    problems,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const submitCode = async (problemId: string, userId: string, code: string, language: string, isPractice: boolean) => {
  const problem = await CodingProblem.findById(problemId);
  if (!problem) throw ApiError.notFound('Problem not found');
  if (!problem.isPublished) throw ApiError.forbidden('Problem is not published');

  if (!problem.supportedLanguages.includes(language)) {
    throw ApiError.badRequest(`Language ${language} is not supported for this problem`);
  }

  const testResults: ITestResult[] = [];
  let passedCount = 0;
  let overallStatus: ICodingSubmission['status'] = 'accepted';
  let maxRuntime = 0;
  let maxMemory = 0;

  for (let i = 0; i < problem.testCases.length; i++) {
    const tc = problem.testCases[i];
    const startTime = Date.now();
    let result: ITestResult;

    try {
      const simulated = simulateExecution(code, language, tc.input, problem.timeLimit * 1000);
      const runtime = Date.now() - startTime;
      maxRuntime = Math.max(maxRuntime, runtime);
      maxMemory = Math.max(maxMemory, simulated.memoryUsed);

      const passed = simulated.output.trim() === tc.expectedOutput.trim();
      if (passed) passedCount++;
      if (!passed && overallStatus === 'accepted') overallStatus = 'wrong_answer';

      result = {
        testCaseIndex: i,
        input: tc.isSample ? tc.input : '',
        expectedOutput: tc.isSample ? tc.expectedOutput : '',
        actualOutput: tc.isSample ? simulated.output : '',
        passed,
        runtime,
        memoryUsed: simulated.memoryUsed,
        error: simulated.error,
      };
    } catch (err: any) {
      if (overallStatus === 'accepted') overallStatus = 'runtime_error';
      result = {
        testCaseIndex: i,
        input: tc.isSample ? tc.input : '',
        expectedOutput: tc.isSample ? tc.expectedOutput : '',
        actualOutput: '',
        passed: false,
        error: err.message,
        runtime: Date.now() - startTime,
        memoryUsed: 0,
      };
    }

    if (result.runtime && result.runtime > problem.timeLimit * 1000 && overallStatus === 'accepted') {
      overallStatus = 'time_limit_exceeded';
    }

    testResults.push(result);
  }

  const totalScore = problem.testCases.length > 0 ? Math.round((passedCount / problem.testCases.length) * 100) : 0;

  if (overallStatus === 'accepted' && passedCount < problem.testCases.length) {
    overallStatus = 'wrong_answer';
  }

  const submission = await CodingSubmission.create({
    user: userId,
    problem: problemId,
    code,
    language,
    status: overallStatus,
    testResults,
    score: totalScore,
    totalTestCases: problem.testCases.length,
    passedTestCases: passedCount,
    runtime: maxRuntime,
    memoryUsed: maxMemory,
    isPractice,
  });

  await CodingProblem.findByIdAndUpdate(problemId, {
    $inc: { totalSubmissions: 1, ...(overallStatus === 'accepted' ? { acceptedSubmissions: 1 } : {}) },
  });

  return submission.populate('problem', 'title difficulty slug');
};

export const getSubmissionById = async (submissionId: string, userId: string, isOwnerOrAdmin: boolean) => {
  const submission = await CodingSubmission.findById(submissionId)
    .populate('problem', 'title difficulty slug')
    .populate('user', 'name email');

  if (!submission) throw ApiError.notFound('Submission not found');
  if (submission.user.toString() !== userId && !isOwnerOrAdmin) throw ApiError.forbidden('Not authorized');
  return submission;
};

export const getUserSubmissions = async (problemId: string, userId: string, page: number, limit: number) => {
  const total = await CodingSubmission.countDocuments({ problem: problemId, user: userId });
  const submissions = await CodingSubmission.find({ problem: problemId, user: userId })
    .populate('problem', 'title difficulty')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    submissions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const getAllUserSubmissions = async (userId: string, page: number, limit: number) => {
  const total = await CodingSubmission.countDocuments({ user: userId });
  const submissions = await CodingSubmission.find({ user: userId })
    .populate('problem', 'title difficulty')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    submissions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

interface SimulatedResult {
  output: string;
  error?: string;
  memoryUsed: number;
}

function simulateExecution(code: string, language: string, input: string, timeLimitMs: number): SimulatedResult {
  const languageHandlers: Record<string, (code: string, input: string) => string> = {
    javascript: (c, inp) => {
      const args = inp.trim().split('\n').map(l => {
        const trimmed = l.trim();
        if (trimmed === 'true') return true;
        if (trimmed === 'false') return false;
        if (trimmed === 'null') return null;
        if (trimmed === 'undefined') return undefined;
        if (!isNaN(Number(trimmed)) && trimmed !== '') return Number(trimmed);
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
          try { return JSON.parse(trimmed); } catch { return trimmed; }
        }
        return trimmed;
      });
      try {
        const fn = new Function('input', ...args.map((_, i) => `arg${i}`), c);
        const result = fn(input, ...args);
        return result === undefined || result === null ? '' : String(result);
      } catch (err: any) {
        throw new Error(err.message);
      }
    },
  };

  const defaultHandler = (c: string) => {
    const errMatch = c.match(/throw\s+new\s+Error\(['"](.+)['"]\)/);
    if (errMatch) throw new Error(errMatch[1]);
    const match = c.match(/return\s+(.+)/);
    if (!match) return '';
    const val = match[1].replace(/['"]/g, '').trim();
    return val;
  };

  const handler = languageHandlers[language] || defaultHandler;
  const output = handler(code, input);
  return { output, memoryUsed: Math.floor(Math.random() * 64) + 8 };
}
