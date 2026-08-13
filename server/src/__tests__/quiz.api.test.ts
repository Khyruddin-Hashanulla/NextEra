import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { ROLES } from '../constants/roles';
import { errorHandler } from '../middlewares/errorHandler.middleware';

let mockCurrentUser: { userId: string; role: string; email: string } | null = null;

jest.mock('../middlewares/auth.middleware', () => {
  const { ApiError } = jest.requireActual('../utils/ApiError');
  return {
    authenticate: (req: any, _res: any, next: any) => {
      if (!mockCurrentUser) {
        return next(ApiError.unauthorized('Token required'));
      }
      req.currentUser = mockCurrentUser;
      next();
    },
    optionalAuthenticate: (req: any, _res: any, next: any) => {
      if (mockCurrentUser) req.currentUser = mockCurrentUser;
      next();
    },
  };
});

jest.mock('../middlewares/authorize.middleware', () => {
  const { ApiError } = jest.requireActual('../utils/ApiError');
  return {
    authorize:
      (...allowedRoles: string[]) =>
      (req: any, _res: any, next: any) => {
        if (!req.currentUser) {
          return next(ApiError.unauthorized('Token required'));
        }
        if (!allowedRoles.includes(req.currentUser.role)) {
          return next(ApiError.forbidden('Forbidden'));
        }
        next();
      },
  };
});

jest.mock('../middlewares/dataScoping.middleware', () => ({
  verifyQuizAttemptOwnership: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../services/quiz.service', () => {
  const mockQuizService = {
    startQuiz: jest.fn(),
    startQuizEnhanced: jest.fn(),
    submitQuiz: jest.fn(),
    autoSubmitQuiz: jest.fn(),
    resumeQuiz: jest.fn(),
    getStudentQuizAttempts: jest.fn(),
    getAttemptDetails: jest.fn(),
    getStudentAnalytics: jest.fn(),
    getStudentQuizOverview: jest.fn(),
    manualGradeAttempt: jest.fn(),
    publishAttempt: jest.fn(),
    getQuizAnalytics: jest.fn(),
    getQuestionStatistics: jest.fn(),
    getLeaderboard: jest.fn(),
    exportAttemptData: jest.fn(),
    getQuizAnalyticsForAdmin: jest.fn(),
    invalidateCache: jest.fn(),
  };
  return { quizService: mockQuizService };
});

import quizRoutes from '../routes/quiz.routes';
import { quizService } from '../services/quiz.service';

const mockService = quizService as unknown as Record<string, jest.Mock>;

const STUDENT_ID = new mongoose.Types.ObjectId().toString();
const INSTRUCTOR_ID = new mongoose.Types.ObjectId().toString();
const ADMIN_ID = new mongoose.Types.ObjectId().toString();
const ATTEMPT_ID = new mongoose.Types.ObjectId().toString();

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/quiz', quizRoutes);
  app.use(errorHandler);
  return app;
}

function asUser(role: string, userId: string) {
  mockCurrentUser = { userId, role, email: `${role}@test.com` };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = null;
});

describe('Authentication', () => {
  it('returns 401 without a token', async () => {
    const res = await request(buildApp()).get('/api/v1/quiz/overview');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/quiz/start (Student quiz flow)', () => {
  it('allows a student to start a quiz', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    mockService.startQuiz.mockResolvedValue({ attempt: { _id: ATTEMPT_ID }, canResume: false });
    const res = await request(buildApp())
      .post('/api/v1/quiz/start')
      .send({ courseId: 'course1', lectureId: 'lecture1' });
    expect(res.status).toBe(200);
    expect(mockService.startQuiz).toHaveBeenCalledWith({
      userId: STUDENT_ID,
      courseId: 'course1',
      lectureId: 'lecture1',
    });
  });
});

describe('POST /api/v1/quiz/start-enhanced (Student quiz flow)', () => {
  it('allows a student to start an enhanced quiz', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    mockService.startQuizEnhanced.mockResolvedValue({ attempt: { _id: ATTEMPT_ID }, canResume: false });
    const res = await request(buildApp())
      .post('/api/v1/quiz/start-enhanced')
      .send({ courseId: 'course1', lectureId: 'lecture1' });
    expect(res.status).toBe(200);
    expect(mockService.startQuizEnhanced).toHaveBeenCalledWith({
      userId: STUDENT_ID,
      courseId: 'course1',
      lectureId: 'lecture1',
    });
  });

  it('returns 400 for missing fields', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    const res = await request(buildApp()).post('/api/v1/quiz/start-enhanced').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/quiz/submit (Student quiz flow)', () => {
  it('submits quiz answers', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    mockService.submitQuiz.mockResolvedValue({ attempt: { _id: ATTEMPT_ID, score: 9, totalMarks: 10 } });
    const res = await request(buildApp())
      .post('/api/v1/quiz/submit')
      .send({
        attemptId: ATTEMPT_ID,
        answers: [{ questionId: 'q_001', question: 'Q', selectedAnswer: 'A' }],
      });
    expect(res.status).toBe(200);
    expect(mockService.submitQuiz).toHaveBeenCalledWith({
      attemptId: ATTEMPT_ID,
      answers: [{ questionId: 'q_001', question: 'Q', selectedAnswer: 'A' }],
      autoSubmitted: undefined,
    });
  });
});

describe('GET /api/v1/quiz/overview (Student quiz overview)', () => {
  it('returns student quiz overview', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    mockService.getStudentQuizOverview.mockResolvedValue({
      quizzes: [],
      stats: { totalAttempts: 0, averageScore: 0, passedCount: 0 },
    });
    const res = await request(buildApp()).get('/api/v1/quiz/overview');
    expect(res.status).toBe(200);
    expect(mockService.getStudentQuizOverview).toHaveBeenCalledWith(STUDENT_ID);
  });
});

describe('GET /api/v1/quiz/result/:attemptId (ownership)', () => {
  it('allows a student to view their own attempt details', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    mockService.getAttemptDetails.mockResolvedValue({
      attempt: { _id: ATTEMPT_ID, user: STUDENT_ID },
      lecture: { _id: 'lecture1' },
    });
    const res = await request(buildApp()).get(`/api/v1/quiz/result/${ATTEMPT_ID}`);
    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/quiz/instructor/analytics/:lectureId (Instructor-only)', () => {
  it('allows an instructor to access analytics', async () => {
    asUser(ROLES.INSTRUCTOR, INSTRUCTOR_ID);
    mockService.getQuizAnalytics.mockResolvedValue({ totalAttempts: 10, averageScore: 135 });
    const res = await request(buildApp()).get('/api/v1/quiz/instructor/analytics/lecture1');
    expect(res.status).toBe(200);
    expect(mockService.getQuizAnalytics).toHaveBeenCalledWith('lecture1');
  });

  it('denies a student from instructor analytics', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    const res = await request(buildApp()).get('/api/v1/quiz/instructor/analytics/lecture1');
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/v1/quiz/manual-grade/:attemptId (Instructor/Admin only)', () => {
  it('allows an instructor to manually grade', async () => {
    asUser(ROLES.INSTRUCTOR, INSTRUCTOR_ID);
    mockService.manualGradeAttempt.mockResolvedValue({ _id: ATTEMPT_ID, score: 125, letterGrade: 'B' });
    const res = await request(buildApp())
      .put(`/api/v1/quiz/manual-grade/${ATTEMPT_ID}`)
      .send({ grade: 125, feedback: 'Good', letterGrade: 'B', publish: true });
    expect(res.status).toBe(200);
    expect(mockService.manualGradeAttempt).toHaveBeenCalledWith(ATTEMPT_ID, {
      grade: 125,
      feedback: 'Good',
      letterGrade: 'B',
      publish: true,
    });
  });

  it('denies a student from manual grading', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    const res = await request(buildApp()).put(`/api/v1/quiz/manual-grade/${ATTEMPT_ID}`).send({ grade: 80 });
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/v1/quiz/publish/:attemptId (Instructor/Admin only)', () => {
  it('allows an instructor to publish a grade', async () => {
    asUser(ROLES.INSTRUCTOR, INSTRUCTOR_ID);
    mockService.publishAttempt.mockResolvedValue({ _id: ATTEMPT_ID, evaluationStatus: 'published' });
    const res = await request(buildApp()).put(`/api/v1/quiz/publish/${ATTEMPT_ID}`);
    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/quiz/admin/analytics (Admin only)', () => {
  it('allows an admin to access admin analytics', async () => {
    asUser(ROLES.ADMIN, ADMIN_ID);
    mockService.getQuizAnalyticsForAdmin.mockResolvedValue({ totalQuizzes: 5 });
    const res = await request(buildApp()).get('/api/v1/quiz/admin/analytics');
    expect(res.status).toBe(200);
  });

  it('denies an instructor from admin analytics', async () => {
    asUser(ROLES.INSTRUCTOR, INSTRUCTOR_ID);
    const res = await request(buildApp()).get('/api/v1/quiz/admin/analytics');
    expect(res.status).toBe(403);
  });
});
