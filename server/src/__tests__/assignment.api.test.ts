import express from 'express';
import request from 'supertest';
import { ROLES } from '../constants/roles';
import { errorHandler } from '../middlewares/errorHandler.middleware';

let mockCurrentUser: { userId: string; role: string; email: string } | null = null;

jest.mock('../middlewares/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.currentUser = mockCurrentUser;
    next();
  },
  optionalAuthenticate: (req: any, _res: any, next: any) => {
    if (mockCurrentUser) req.currentUser = mockCurrentUser;
    next();
  },
}));

jest.mock('../services/audit.service', () => ({
  auditService: { log: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../models/assignmentSubmission.model', () => ({
  AssignmentSubmission: {
    findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
  },
}));

const mockAssignmentService = {
  getInstructorAssignments: jest.fn(),
  getInstructorAssignmentStats: jest.fn(),
  getLectureSubmissions: jest.fn(),
  getSubmissionDetail: jest.fn(),
  updateSubmissionStatus: jest.fn(),
  gradeSubmission: jest.fn(),
  returnForResubmission: jest.fn(),
  listAllSubmissions: jest.fn(),
  getSubmissionForAdmin: jest.fn(),
  overrideGrade: jest.fn(),
  getSubmissionAnalytics: jest.fn(),
  getGradingLogs: jest.fn(),
};
jest.mock('../services/assignment.service', () => ({
  assignmentService: mockAssignmentService,
}));

const mockStudentService = {
  getAssignmentSubmissions: jest.fn(),
  getAssignmentsOverview: jest.fn(),
  getAssignmentDetail: jest.fn(),
  submitAssignment: jest.fn(),
};
jest.mock('../services/student.service', () => ({
  studentService: mockStudentService,
}));

import studentRoutes from '../routes/student.routes';
import instructorRoutes from '../routes/instructor.routes';
import adminRoutes from '../routes/admin.routes';
import { auditService } from '../services/audit.service';
import mongoose from 'mongoose';

const STUDENT_ID = new mongoose.Types.ObjectId().toString();
const INSTRUCTOR_ID = new mongoose.Types.ObjectId().toString();
const SUBMISSION_ID = new mongoose.Types.ObjectId().toString();

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/student', studentRoutes);
  app.use('/api/v1/instructor', instructorRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use(errorHandler);
  return app;
}

function asUser(role: string, userId = INSTRUCTOR_ID) {
  mockCurrentUser = { userId, role, email: `${role}@test.com` };
}

function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = null;
  (auditService.log as jest.Mock).mockResolvedValue(undefined);
  Object.values(mockAssignmentService).forEach((fn) => (fn as jest.Mock).mockResolvedValue({}));
  Object.values(mockStudentService).forEach((fn) => (fn as jest.Mock).mockResolvedValue({}));
});

describe('GET /api/v1/instructor/assignments (RBAC)', () => {
  it('returns 200 for instructor', async () => {
    asUser(ROLES.INSTRUCTOR);
    mockAssignmentService.getInstructorAssignments.mockResolvedValue({ assignments: [] });
    const res = await request(buildApp()).get('/api/v1/instructor/assignments');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockAssignmentService.getInstructorAssignments).toHaveBeenCalledWith(INSTRUCTOR_ID, expect.anything());
  });

  it('returns 200 for admin', async () => {
    asUser(ROLES.ADMIN);
    await request(buildApp()).get('/api/v1/instructor/assignments');
  });

  it('returns 403 for student', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    const res = await request(buildApp()).get('/api/v1/instructor/assignments');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 without a user', async () => {
    mockCurrentUser = null;
    const res = await request(buildApp()).get('/api/v1/instructor/assignments');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/v1/instructor/assignments/submissions/:id/grade', () => {
  it('grades a submission with valid payload', async () => {
    asUser(ROLES.INSTRUCTOR);
    mockAssignmentService.gradeSubmission.mockResolvedValue({ grade: 85, status: 'graded' });
    const res = await request(buildApp())
      .patch(`/api/v1/instructor/assignments/submissions/${SUBMISSION_ID}/grade`)
      .send({ grade: 85, feedback: 'Good work', publish: true });
    expect(res.status).toBe(200);
    expect(mockAssignmentService.gradeSubmission).toHaveBeenCalledWith(INSTRUCTOR_ID, SUBMISSION_ID, expect.objectContaining({ grade: 85, publish: true }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ASSIGNMENT_GRADED' }));
  });

  it('rejects grade above max limit with 400', async () => {
    asUser(ROLES.INSTRUCTOR);
    const res = await request(buildApp())
      .patch(`/api/v1/instructor/assignments/submissions/${SUBMISSION_ID}/grade`)
      .send({ grade: 99999999 });
    expect(res.status).toBe(400);
    expect(mockAssignmentService.gradeSubmission).not.toHaveBeenCalled();
  });

  it('rejects negative grade with 400', async () => {
    asUser(ROLES.INSTRUCTOR);
    const res = await request(buildApp())
      .patch(`/api/v1/instructor/assignments/submissions/${SUBMISSION_ID}/grade`)
      .send({ grade: -5 });
    expect(res.status).toBe(400);
  });

  it('rejects missing grade with 400', async () => {
    asUser(ROLES.INSTRUCTOR);
    const res = await request(buildApp())
      .patch(`/api/v1/instructor/assignments/submissions/${SUBMISSION_ID}/grade`)
      .send({ feedback: 'no grade' });
    expect(res.status).toBe(400);
  });

  it('rejects student with 403', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    const res = await request(buildApp())
      .patch(`/api/v1/instructor/assignments/submissions/${SUBMISSION_ID}/grade`)
      .send({ grade: 80 });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/v1/instructor/assignments/submissions/:id/status', () => {
  it('allows under_review status', async () => {
    asUser(ROLES.INSTRUCTOR);
    mockAssignmentService.updateSubmissionStatus.mockResolvedValue({ status: 'under_review' });
    const res = await request(buildApp())
      .patch(`/api/v1/instructor/assignments/submissions/${SUBMISSION_ID}/status`)
      .send({ status: 'under_review' });
    expect(res.status).toBe(200);
  });

  it('rejects invalid status with 400', async () => {
    asUser(ROLES.INSTRUCTOR);
    const res = await request(buildApp())
      .patch(`/api/v1/instructor/assignments/submissions/${SUBMISSION_ID}/status`)
      .send({ status: 'graded' });
    expect(res.status).toBe(400);
  });

  it('rejects non-instructor with 403', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    const res = await request(buildApp())
      .patch(`/api/v1/instructor/assignments/submissions/${SUBMISSION_ID}/status`)
      .send({ status: 'under_review' });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/v1/instructor/assignments/submissions/:id/return', () => {
  it('returns for resubmission', async () => {
    asUser(ROLES.INSTRUCTOR);
    mockAssignmentService.returnForResubmission.mockResolvedValue({ status: 'returned_for_resubmission' });
    const res = await request(buildApp())
      .patch(`/api/v1/instructor/assignments/submissions/${SUBMISSION_ID}/return`)
      .send({ feedback: 'Please redo' });
    expect(res.status).toBe(200);
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ASSIGNMENT_RETURNED' }));
  });

  it('rejects bad resubmission deadline with 400', async () => {
    asUser(ROLES.INSTRUCTOR);
    const res = await request(buildApp())
      .patch(`/api/v1/instructor/assignments/submissions/${SUBMISSION_ID}/return`)
      .send({ resubmissionDeadline: 'not-a-date' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/instructor/assignments/:lectureId/submissions', () => {
  it('filters by status and returns 200', async () => {
    asUser(ROLES.INSTRUCTOR);
    mockAssignmentService.getLectureSubmissions.mockResolvedValue({ submissions: [] });
    const lectureId = new mongoose.Types.ObjectId().toString();
    const res = await request(buildApp()).get(`/api/v1/instructor/assignments/${lectureId}/submissions?status=submitted&page=1&limit=10`);
    expect(res.status).toBe(200);
    expect(mockAssignmentService.getLectureSubmissions).toHaveBeenCalledWith(INSTRUCTOR_ID, lectureId, expect.objectContaining({ status: 'submitted' }));
  });

  it('rejects invalid status filter with 400', async () => {
    asUser(ROLES.INSTRUCTOR);
    const lectureId = new mongoose.Types.ObjectId().toString();
    const res = await request(buildApp()).get(`/api/v1/instructor/assignments/${lectureId}/submissions?status=bogus`);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/student/assignments', () => {
  it('submits an assignment and audits ASSIGNMENT_SUBMITTED', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    const courseId = new mongoose.Types.ObjectId().toString();
    const lectureId = new mongoose.Types.ObjectId().toString();
    mockStudentService.submitAssignment.mockResolvedValue({ _id: SUBMISSION_ID, submissionVersion: 1, status: 'submitted' });
    const res = await request(buildApp())
      .post('/api/v1/student/assignments')
      .send({ courseId, lectureId, content: 'My answer' });
    expect(res.status).toBe(201);
    expect(mockStudentService.submitAssignment).toHaveBeenCalledWith(STUDENT_ID, courseId, lectureId, 'My answer', undefined);
    await flush();
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ASSIGNMENT_SUBMITTED' }));
  });

  it('audits ASSIGNMENT_UPDATED on resubmission (version > 1)', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    mockStudentService.submitAssignment.mockResolvedValue({ _id: SUBMISSION_ID, submissionVersion: 2, status: 'submitted' });
    await request(buildApp())
      .post('/api/v1/student/assignments')
      .send({ courseId: new mongoose.Types.ObjectId().toString(), lectureId: new mongoose.Types.ObjectId().toString() });
    await flush();
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ASSIGNMENT_UPDATED' }));
  });

  it('rejects missing lectureId with 400', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    const res = await request(buildApp())
      .post('/api/v1/student/assignments')
      .send({ courseId: new mongoose.Types.ObjectId().toString() });
    expect(res.status).toBe(400);
    expect(mockStudentService.submitAssignment).not.toHaveBeenCalled();
  });

  it('rejects more than 5 files with 400', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    const files = Array.from({ length: 6 }, (_, i) => ({ url: `u${i}`, publicId: `p${i}`, name: `f${i}` }));
    const res = await request(buildApp())
      .post('/api/v1/student/assignments')
      .send({ courseId: new mongoose.Types.ObjectId().toString(), lectureId: new mongoose.Types.ObjectId().toString(), files });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/student/assignments/overview', () => {
  it('returns overview for enrolled student', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    mockStudentService.getAssignmentsOverview.mockResolvedValue({ assignments: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
    const res = await request(buildApp()).get('/api/v1/student/assignments/overview');
    expect(res.status).toBe(200);
    expect(mockStudentService.getAssignmentsOverview).toHaveBeenCalledWith(STUDENT_ID, 1, 20, undefined, undefined);
  });

  it('accepts and forwards the "overdue" status filter', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    mockStudentService.getAssignmentsOverview.mockResolvedValue({ assignments: [], pagination: { page: 1, limit: 12, total: 0, pages: 0 } });
    const res = await request(buildApp()).get('/api/v1/student/assignments/overview?page=1&limit=12&status=overdue');
    expect(res.status).toBe(200);
    expect(mockStudentService.getAssignmentsOverview).toHaveBeenCalledWith(STUDENT_ID, 1, 12, undefined, 'overdue');
  });

  it('rejects invalid status filter with 400', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    const res = await request(buildApp()).get('/api/v1/student/assignments/overview?status=bad');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/student/assignments/:lectureId', () => {
  it('returns detail for enrolled student', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    mockStudentService.getAssignmentDetail.mockResolvedValue({ lecture: {}, status: 'assigned', submission: null });
    const lectureId = new mongoose.Types.ObjectId().toString();
    const res = await request(buildApp()).get(`/api/v1/student/assignments/${lectureId}`);
    expect(res.status).toBe(200);
    expect(mockStudentService.getAssignmentDetail).toHaveBeenCalledWith(STUDENT_ID, lectureId);
  });
});

describe('Admin assignment endpoints (RBAC)', () => {
  it('lists all submissions for admin', async () => {
    asUser(ROLES.ADMIN);
    mockAssignmentService.listAllSubmissions.mockResolvedValue({ submissions: [] });
    const res = await request(buildApp()).get('/api/v1/admin/assignments');
    expect(res.status).toBe(200);
  });

  it('returns 403 for instructor on admin routes', async () => {
    asUser(ROLES.INSTRUCTOR);
    const res = await request(buildApp()).get('/api/v1/admin/assignments');
    expect(res.status).toBe(403);
  });

  it('returns 403 for student on admin routes', async () => {
    asUser(ROLES.STUDENT, STUDENT_ID);
    const res = await request(buildApp()).get('/api/v1/admin/assignments');
    expect(res.status).toBe(403);
  });

  it('fetches analytics for admin', async () => {
    asUser(ROLES.ADMIN);
    mockAssignmentService.getSubmissionAnalytics.mockResolvedValue({ total: 0 });
    const res = await request(buildApp()).get('/api/v1/admin/assignments/analytics');
    expect(res.status).toBe(200);
  });

  it('fetches grading log for admin', async () => {
    asUser(ROLES.ADMIN);
    mockAssignmentService.getGradingLogs.mockResolvedValue({ logs: [], pagination: {} });
    const res = await request(buildApp()).get('/api/v1/admin/assignments/grading-log');
    expect(res.status).toBe(200);
  });

  it('overrides grade for admin and audits ASSIGNMENT_OVERRIDE', async () => {
    asUser(ROLES.ADMIN);
    mockAssignmentService.overrideGrade.mockResolvedValue({ grade: 90, status: 'graded' });
    const res = await request(buildApp())
      .patch(`/api/v1/admin/assignments/${SUBMISSION_ID}/override`)
      .send({ grade: 90 });
    expect(res.status).toBe(200);
    await flush();
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ASSIGNMENT_OVERRIDE' }));
  });

  it('rejects admin override with invalid payload 400', async () => {
    asUser(ROLES.ADMIN);
    const res = await request(buildApp())
      .patch(`/api/v1/admin/assignments/${SUBMISSION_ID}/override`)
      .send({ grade: -1 });
    expect(res.status).toBe(400);
  });
});
