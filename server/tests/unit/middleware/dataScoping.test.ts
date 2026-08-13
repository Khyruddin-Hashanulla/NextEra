import {
  createOwnerMiddleware,
  verifyCourseOwnership,
  verifySectionOwnership,
} from '../../../src/middlewares/dataScoping.middleware';
import { Course } from '../../../src/models/course.model';
import { Section } from '../../../src/models/section.model';
import { AuditLog } from '../../../src/models/auditLog.model';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

vi.mock('../../../src/models/course.model', () => ({
  Course: { findById: vi.fn() },
}));

vi.mock('../../../src/models/section.model', () => ({
  Section: { findById: vi.fn() },
}));

vi.mock('../../../src/models/auditLog.model', () => ({
  AuditLog: { create: vi.fn().mockResolvedValue(undefined) },
}));

function queryChain(value: unknown) {
  const q = Promise.resolve(value) as any;
  q.select = vi.fn().mockReturnValue(q);
  q.lean = vi.fn().mockResolvedValue(value);
  q.exec = vi.fn().mockResolvedValue(value);
  return q;
}

function adminRequest() {
  return mockRequest({ currentUser: { userId: 'a1', role: 'admin', email: 'a@b.com' } as never });
}

function userRequest(userId = 'u1') {
  return mockRequest({
    currentUser: { userId, role: 'instructor', email: 'i@b.com' } as never,
    originalUrl: '/api/courses/abc',
    method: 'GET',
  });
}

describe('createOwnerMiddleware', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lets admins bypass ownership checks', async () => {
    const mw = createOwnerMiddleware({ model: Course, ownerField: 'instructor', resourceName: 'Course' });
    const req = adminRequest();
    const res = mockResponse();
    const next = mockNext();
    await mw(req, res as never, next);
    expect(next).toHaveBeenCalledOnce();
    expect(Course.findById).not.toHaveBeenCalled();
  });

  it('rejects invalid ids with a not-found error', async () => {
    const mw = createOwnerMiddleware({ model: Course, ownerField: 'instructor', resourceName: 'Course' });
    const req = mockRequest({ ...userRequest(), params: { id: 'not-an-id' } });
    const res = mockResponse();
    const next = mockNext();
    await mw(req, res as never, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(404);
    expect(AuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'access_denied', resourceType: 'Course' })
    );
  });

  it('rejects when the resource does not exist', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(null));
    const mw = createOwnerMiddleware({ model: Course, ownerField: 'instructor', resourceName: 'Course' });
    const req = mockRequest({ ...userRequest(), params: { id: '507f1f77bcf86cd799439011' } });
    const res = mockResponse();
    const next = mockNext();
    await mw(req, res as never, next);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it('rejects when the owner does not match the current user', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ instructor: 'someone-else' }));
    const mw = createOwnerMiddleware({ model: Course, ownerField: 'instructor', resourceName: 'Course' });
    const req = mockRequest({ ...userRequest('u1'), params: { id: '507f1f77bcf86cd799439011' } });
    const res = mockResponse();
    const next = mockNext();
    await mw(req, res as never, next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('rejects when the owner field is missing', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({}));
    const mw = createOwnerMiddleware({ model: Course, ownerField: 'instructor', resourceName: 'Course' });
    const req = mockRequest({ ...userRequest(), params: { id: '507f1f77bcf86cd799439011' } });
    const res = mockResponse();
    const next = mockNext();
    await mw(req, res as never, next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('allows when the owner matches', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ instructor: 'u1' }));
    const mw = createOwnerMiddleware({ model: Course, ownerField: 'instructor', resourceName: 'Course' });
    const req = mockRequest({ ...userRequest('u1'), params: { id: '507f1f77bcf86cd799439011' } });
    const res = mockResponse();
    const next = mockNext();
    await mw(req, res as never, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('extracts the id from the query string', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ instructor: 'u1' }));
    const mw = createOwnerMiddleware({
      model: Course,
      ownerField: 'instructor',
      resourceName: 'Course',
      idSource: 'query',
      idField: 'courseId',
    });
    const req = mockRequest({
      ...userRequest('u1'),
      query: { courseId: '507f1f77bcf86cd799439011' },
    });
    const res = mockResponse();
    const next = mockNext();
    await mw(req, res as never, next);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('extracts the id from the body', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ instructor: 'u1' }));
    const mw = createOwnerMiddleware({
      model: Course,
      ownerField: 'instructor',
      resourceName: 'Course',
      idSource: 'body',
      idField: 'courseId',
    });
    const req = mockRequest({
      ...userRequest('u1'),
      body: { courseId: '507f1f77bcf86cd799439011' },
    });
    const res = mockResponse();
    const next = mockNext();
    await mw(req, res as never, next);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('runs an additional check and rejects when it fails', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ instructor: 'u1' }));
    const mw = createOwnerMiddleware({
      model: Course,
      ownerField: 'instructor',
      resourceName: 'Course',
      skipOwnerCheck: true,
      additionalCheck: async () => false,
    });
    const req = mockRequest({ ...userRequest('u1'), params: { id: '507f1f77bcf86cd799439011' } });
    const res = mockResponse();
    const next = mockNext();
    await mw(req, res as never, next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('runs an additional check and allows when it passes', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ instructor: 'u1' }));
    const mw = createOwnerMiddleware({
      model: Course,
      ownerField: 'instructor',
      resourceName: 'Course',
      skipOwnerCheck: true,
      additionalCheck: async () => true,
    });
    const req = mockRequest({ ...userRequest('u1'), params: { id: '507f1f77bcf86cd799439011' } });
    const res = mockResponse();
    const next = mockNext();
    await mw(req, res as never, next);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('skips the owner check when configured', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ title: 'Anything' }));
    const mw = createOwnerMiddleware({
      model: Course,
      ownerField: 'instructor',
      resourceName: 'Course',
      skipOwnerCheck: true,
    });
    const req = mockRequest({ ...userRequest(), params: { id: '507f1f77bcf86cd799439011' } });
    const res = mockResponse();
    const next = mockNext();
    await mw(req, res as never, next);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('passes model lookup errors to next', async () => {
    vi.mocked(Course.findById as never).mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockRejectedValue(new Error('boom')) }),
    });
    const mw = createOwnerMiddleware({ model: Course, ownerField: 'instructor', resourceName: 'Course' });
    const req = mockRequest({ ...userRequest(), params: { id: '507f1f77bcf86cd799439011' } });
    const res = mockResponse();
    const next = mockNext();
    await mw(req, res as never, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});

describe('verifyCourseOwnership', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('allows admins', async () => {
    const req = adminRequest();
    const res = mockResponse();
    const next = mockNext();
    await verifyCourseOwnership(req, res as never, next);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('rejects when the course instructor differs', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ instructor: 'other' }));
    const req = mockRequest({ ...userRequest('u1'), params: { id: '507f1f77bcf86cd799439011' } });
    const res = mockResponse();
    const next = mockNext();
    await verifyCourseOwnership(req, res as never, next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });
});

describe('verifySectionOwnership', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a section whose course does not match', async () => {
    vi.mocked(Section.findById as never).mockReturnValue(queryChain({ course: 'courseB' }));
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ instructor: 'u1' }));
    const req = mockRequest({
      ...userRequest('u1'),
      params: {
        id: 'courseA',
        sectionId: '507f1f77bcf86cd799439011',
      },
    });
    const res = mockResponse();
    const next = mockNext();
    await verifySectionOwnership(req, res as never, next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('allows a section whose course the user owns', async () => {
    vi.mocked(Section.findById as never).mockReturnValue(queryChain({ course: 'courseA' }));
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ instructor: 'u1' }));
    const req = mockRequest({
      ...userRequest('u1'),
      params: { id: 'courseA', sectionId: '507f1f77bcf86cd799439011' },
    });
    const res = mockResponse();
    const next = mockNext();
    await verifySectionOwnership(req, res as never, next);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('uses the courseId param when id is missing for section checks', async () => {
    vi.mocked(Section.findById as never).mockReturnValue(queryChain({ course: 'courseA' }));
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ instructor: 'u1' }));
    const req = mockRequest({
      ...userRequest('u1'),
      params: { courseId: 'courseA', sectionId: '507f1f77bcf86cd799439011' },
    });
    const res = mockResponse();
    const next = mockNext();
    await verifySectionOwnership(req, res as never, next);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });
});
