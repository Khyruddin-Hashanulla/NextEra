import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ROLES } from '../constants/roles';
import { ApiError } from '../utils/ApiError';

jest.mock('../models/course.model');
jest.mock('../models/section.model');
jest.mock('../models/lecture.model');
jest.mock('../models/note.model');
jest.mock('../models/enrollment.model');
jest.mock('../models/certificate.model');
jest.mock('../models/assignmentSubmission.model');
jest.mock('../models/coupon.model');
jest.mock('../models/announcement.model');
jest.mock('../models/review.model');
jest.mock('../models/quizAttempt.model');
jest.mock('../models/liveClass.model');
jest.mock('../models/codingSubmission.model');
jest.mock('../models/notification.model');
jest.mock('../models/auditLog.model');

const mockModels = {
  Course: jest.requireMock('../models/course.model').Course,
  Section: jest.requireMock('../models/section.model').Section,
  Lecture: jest.requireMock('../models/lecture.model').Lecture,
  Note: jest.requireMock('../models/note.model').Note,
  Coupon: jest.requireMock('../models/coupon.model').Coupon,
  Announcement: jest.requireMock('../models/announcement.model').Announcement,
  Review: jest.requireMock('../models/review.model').Review,
  QuizAttempt: jest.requireMock('../models/quizAttempt.model').QuizAttempt,
  LiveClass: jest.requireMock('../models/liveClass.model').LiveClass,
  CodingSubmission: jest.requireMock('../models/codingSubmission.model').CodingSubmission,
  Notification: jest.requireMock('../models/notification.model').Notification,
  AuditLog: jest.requireMock('../models/auditLog.model').AuditLog,
};

const mw = require('../middlewares/ownership.middleware');
const ds = require('../services/dataScoping.service');

const OWNER = new mongoose.Types.ObjectId().toString();
const OTHER = new mongoose.Types.ObjectId().toString();

function req(overrides: any = {}): Partial<Request> {
  return {
    params: {},
    currentUser: { userId: OWNER, role: ROLES.INSTRUCTOR, email: 't@t.com' },
    ip: '127.0.0.1',
    headers: {},
    originalUrl: '/test',
    method: 'GET',
    ...overrides,
  };
}

const res = (): Partial<Response> => ({});
const nextFn = (): NextFunction => jest.fn();

function chainResult(val: any) {
  return { select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(val) };
}

function mockById(model: any, val: any) {
  model.findById.mockReset();
  model.findById.mockImplementation(() => chainResult(val));
}

const SIMPLE_MIDDLEWARES: [string, any, any, string, Record<string, string>?][] = [
  ['Course', mw.verifyCourseOwnership, mockModels.Course, 'instructor'],
  ['Note', mw.verifyNoteOwnership, mockModels.Note, 'user'],
  ['Review', mw.verifyReviewOwnership, mockModels.Review, 'user'],
  ['Coupon', mw.verifyCouponOwnership, mockModels.Coupon, 'createdBy'],
  ['Announcement', mw.verifyAnnouncementOwnership, mockModels.Announcement, 'instructor'],
  ['QuizAttempt', mw.verifyQuizAttemptOwnership, mockModels.QuizAttempt, 'user'],
  ['LiveClass', mw.verifyLiveClassOwnership, mockModels.LiveClass, 'instructor'],
  ['CodingSubmission', mw.verifyCodingSubmissionOwnership, mockModels.CodingSubmission, 'user', { submissionId: '__ID__' }],
  ['Notification', mw.verifyNotificationOwnership, mockModels.Notification, 'user'],
];

describe.each(SIMPLE_MIDDLEWARES)('%s middleware', (name: string, middleware: any, model: any, ownerField: string, paramsOverride?: Record<string, string>) => {
  function buildParams(id: string): Record<string, string> {
    if (paramsOverride) {
      const p: Record<string, string> = {};
      for (const [k, v] of Object.entries(paramsOverride)) {
        p[k] = v === '__ID__' ? id : v;
      }
      return p;
    }
    return { id };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockModels.AuditLog.create.mockResolvedValue({});
  });

  it('passes when owner accesses their resource', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockById(model, { _id: id, [ownerField]: OWNER });
    const next = nextFn();
    await middleware(req({ params: buildParams(id) }) as Request, res() as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes when admin accesses any resource', async () => {
    const next = nextFn();
    await middleware(req({ currentUser: { userId: OTHER, role: ROLES.ADMIN, email: 'a@a.com' } }) as Request, res() as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks with 403 when different user', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockById(model, { _id: id, [ownerField]: OTHER });
    const next = nextFn();
    await middleware(req({ params: buildParams(id) }) as Request, res() as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(403);
  });

  it('blocks with 404 when resource not found', async () => {
    mockById(model, null);
    const next = nextFn();
    await middleware(req({ params: buildParams(new mongoose.Types.ObjectId().toString()) }) as Request, res() as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(404);
  });

  it('audit-logs on denied access (403)', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    mockById(model, { _id: id, [ownerField]: OTHER });
    const next = nextFn();
    await middleware(req({ params: buildParams(id) }) as Request, res() as Response, next);
    expect(mockModels.AuditLog.create).toHaveBeenCalled();
    const entry = mockModels.AuditLog.create.mock.calls[0][0];
    expect(entry.adminId).toBe(OWNER);
    expect(entry.action).toBe('access_denied');
    expect(entry.metadata.role).toBe(ROLES.INSTRUCTOR);
  });
});

// ─── Section (multi-step: section → course → instructor) ──────

describe('verifySectionOwnership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModels.AuditLog.create.mockResolvedValue({});
    mockModels.Section.findById.mockReset();
    mockModels.Course.findById.mockReset();
  });

  it('passes when section belongs to owned course', async () => {
    const courseId = new mongoose.Types.ObjectId().toString();
    const sectionId = new mongoose.Types.ObjectId().toString();
    mockModels.Section.findById.mockImplementation(() => chainResult({ _id: sectionId, course: courseId }));
    mockModels.Course.findById.mockImplementation(() => chainResult({ _id: courseId, instructor: OWNER }));
    const next = nextFn();
    await mw.verifySectionOwnership(req({ params: { id: courseId, sectionId } }) as Request, res() as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks with 403 when section in different course', async () => {
    const courseId = new mongoose.Types.ObjectId().toString();
    const sectionId = new mongoose.Types.ObjectId().toString();
    mockModels.Section.findById.mockImplementation(() => chainResult({ _id: sectionId, course: new mongoose.Types.ObjectId().toString() }));
    const next = nextFn();
    await mw.verifySectionOwnership(req({ params: { id: courseId, sectionId } }) as Request, res() as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(403);
  });

  it('blocks with 403 when different instructor owns course', async () => {
    const courseId = new mongoose.Types.ObjectId().toString();
    const sectionId = new mongoose.Types.ObjectId().toString();
    mockModels.Section.findById.mockImplementation(() => chainResult({ _id: sectionId, course: courseId }));
    mockModels.Course.findById.mockImplementation(() => chainResult({ _id: courseId, instructor: OTHER }));
    const next = nextFn();
    await mw.verifySectionOwnership(req({ params: { id: courseId, sectionId } }) as Request, res() as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(403);
  });
});

// ─── Lecture (multi-step: lecture → course → instructor) ─────

describe('verifyLectureOwnership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModels.Lecture.findById.mockReset();
    mockModels.Course.findById.mockReset();
    mockModels.AuditLog.create.mockResolvedValue({});
  });

  it('passes when lecture belongs to owned course', async () => {
    const courseId = new mongoose.Types.ObjectId().toString();
    const lectureId = new mongoose.Types.ObjectId().toString();
    mockModels.Lecture.findById.mockImplementation(() => chainResult({ _id: lectureId, course: courseId }));
    mockModels.Course.findById.mockImplementation(() => chainResult({ _id: courseId, instructor: OWNER }));
    const next = nextFn();
    await mw.verifyLectureOwnership(req({ params: { id: courseId, lectureId } }) as Request, res() as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('blocks with 403 when different instructor', async () => {
    const courseId = new mongoose.Types.ObjectId().toString();
    const lectureId = new mongoose.Types.ObjectId().toString();
    mockModels.Lecture.findById.mockImplementation(() => chainResult({ _id: lectureId, course: courseId }));
    mockModels.Course.findById.mockImplementation(() => chainResult({ _id: courseId, instructor: OTHER }));
    const next = nextFn();
    await mw.verifyLectureOwnership(req({ params: { id: courseId, lectureId } }) as Request, res() as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(403);
  });
});

// ─── factory ──────────────────────────────────────────────────

describe('createOwnerMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModels.AuditLog.create.mockResolvedValue({});
  });

  it('generates middleware with custom config', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const fakeModel: any = { findById: jest.fn(() => chainResult({ _id: id, customField: OWNER })) };
    const m = mw.createOwnerMiddleware({ model: fakeModel, ownerField: 'customField', resourceName: 'X' });
    const next = nextFn();
    await m(req({ params: { id } }) as Request, res() as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('supports query idSource and custom idField', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const fakeModel: any = { findById: jest.fn(() => chainResult({ _id: id, owner: OTHER })) };
    const m = mw.createOwnerMiddleware({ model: fakeModel, ownerField: 'owner', resourceName: 'X', idSource: 'query', idField: 'rid' });
    const next = nextFn();
    await m(req({ query: { rid: id } }) as Request, res() as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(403);
  });
});

// ─── DataScopingService ────────────────────────────────────────

describe('DataScopingService', () => {
  const service = new ds.DataScopingService();
  const fakeModel: any = { findById: jest.fn(), findOne: jest.fn(), find: jest.fn(), findByIdAndUpdate: jest.fn(), findOneAndUpdate: jest.fn(), findByIdAndDelete: jest.fn(), findOneAndDelete: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('scopedFindById scopes to userId for non-admin', async () => {
    fakeModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    await service.scopedFindById(fakeModel, 'abc', req() as Request, 'user');
    expect(fakeModel.findOne).toHaveBeenCalledWith({ _id: 'abc', user: OWNER });
  });

  it('scopedFindById uses unscoped findById for admin', async () => {
    fakeModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({}) });
    await service.scopedFindById(fakeModel, 'abc', req({ currentUser: { userId: OTHER, role: ROLES.ADMIN } }) as Request, 'user');
    expect(fakeModel.findById).toHaveBeenCalledWith('abc');
  });

  it('scopedFind adds owner filter for non-admin', async () => {
    fakeModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
    await service.scopedFind(fakeModel, { course: 'c1' }, req() as Request, 'user');
    expect(fakeModel.find).toHaveBeenCalledWith({ course: 'c1', user: OWNER });
  });

  it('scopedFindByIdAndUpdate scopes for non-admin', async () => {
    fakeModel.findOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({}) });
    await service.scopedFindByIdAndUpdate(fakeModel, 'abc', { $set: { x: 1 } }, req() as Request, 'user');
    expect(fakeModel.findOneAndUpdate).toHaveBeenCalledWith({ _id: 'abc', user: OWNER }, { $set: { x: 1 } }, { new: true });
  });
});

// ─── auditDenied ───────────────────────────────────────────────

describe('auditDenied', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModels.AuditLog.create.mockResolvedValue({});
  });

  it('creates an access_denied audit entry', async () => {
    await ds.auditDenied(req({ originalUrl: '/api/test' }) as Request, 'Widget', 'w1', 'Not yours');
    expect(mockModels.AuditLog.create).toHaveBeenCalled();
    const c = mockModels.AuditLog.create.mock.calls[0][0];
    expect(c.action).toBe('access_denied');
    expect(c.resourceType).toBe('Widget');
    expect(c.resourceId).toBe('w1');
    expect(c.metadata.reason).toBe('Not yours');
  });
});
