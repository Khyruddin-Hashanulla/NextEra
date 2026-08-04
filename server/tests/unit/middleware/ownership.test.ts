import {
  _verifyCourseOwnershipLegacy,
  _verifySectionOwnershipLegacy,
  _verifyLectureOwnershipLegacy,
} from '../../../src/middlewares/ownership.middleware';
import { Course } from '../../../src/models/course.model';
import { Section } from '../../../src/models/section.model';
import { Lecture } from '../../../src/models/lecture.model';
import { AuditLog } from '../../../src/models/auditLog.model';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

vi.mock('../../../src/models/course.model', () => ({
  Course: { findById: vi.fn() },
}));

vi.mock('../../../src/models/section.model', () => ({
  Section: { findById: vi.fn() },
}));

vi.mock('../../../src/models/lecture.model', () => ({
  Lecture: { findById: vi.fn() },
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

const VALID_ID = '507f1f77bcf86cd799439011';
const COURSE_A = '507f1f77bcf86cd799439011';
const COURSE_B = '507f1f77bcf86cd799439012';

function adminReq() {
  return mockRequest({ currentUser: { userId: 'a1', role: 'admin' } as never });
}

function userReq(userId = 'u1') {
  return mockRequest({
    currentUser: { userId, role: 'instructor' } as never,
    originalUrl: '/api/courses/x',
    method: 'GET',
  });
}

async function run(mw: (req: any, res: any, next: any) => Promise<void>, req: any) {
  const res = mockResponse();
  const next = mockNext();
  await mw(req, res, next);
  return next;
}

describe('legacy ownership middleware', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('_verifyCourseOwnershipLegacy allows admins', async () => {
    const next = await run(_verifyCourseOwnershipLegacy, adminReq());
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('_verifyCourseOwnershipLegacy rejects an invalid course id', async () => {
    const req = mockRequest({ ...userReq(), params: { id: 'bad' } });
    const next = await run(_verifyCourseOwnershipLegacy, req);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it('_verifyCourseOwnershipLegacy rejects when the course is missing', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain(null));
    const req = mockRequest({ ...userReq(), params: { id: VALID_ID } });
    const next = await run(_verifyCourseOwnershipLegacy, req);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it('_verifyCourseOwnershipLegacy rejects a non-owner', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ instructor: 'other' }));
    const req = mockRequest({ ...userReq('u1'), params: { id: VALID_ID } });
    const next = await run(_verifyCourseOwnershipLegacy, req);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
    expect(AuditLog.create).toHaveBeenCalled();
  });

  it('_verifyCourseOwnershipLegacy allows the owner', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ instructor: 'u1' }));
    const req = mockRequest({ ...userReq('u1'), params: { id: VALID_ID } });
    const next = await run(_verifyCourseOwnershipLegacy, req);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('_verifySectionOwnershipLegacy allows admins', async () => {
    const next = await run(_verifySectionOwnershipLegacy, adminReq());
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('_verifySectionOwnershipLegacy rejects an invalid section id', async () => {
    const req = mockRequest({
      ...userReq(),
      params: { id: COURSE_A, sectionId: 'bad' },
    });
    const next = await run(_verifySectionOwnershipLegacy, req);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it('_verifySectionOwnershipLegacy rejects a missing section', async () => {
    vi.mocked(Section.findById as never).mockReturnValue(queryChain(null));
    const req = mockRequest({ ...userReq(), params: { id: COURSE_A, sectionId: VALID_ID } });
    const next = await run(_verifySectionOwnershipLegacy, req);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it('_verifySectionOwnershipLegacy rejects a section for the wrong course', async () => {
    vi.mocked(Section.findById as never).mockReturnValue(queryChain({ course: COURSE_B }));
    const req = mockRequest({ ...userReq(), params: { id: COURSE_A, sectionId: VALID_ID } });
    const next = await run(_verifySectionOwnershipLegacy, req);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('_verifySectionOwnershipLegacy allows when the course is owned', async () => {
    vi.mocked(Section.findById as never).mockReturnValue(queryChain({ course: COURSE_A }));
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ instructor: 'u1' }));
    const req = mockRequest({ ...userReq('u1'), params: { id: COURSE_A, sectionId: VALID_ID } });
    const next = await run(_verifySectionOwnershipLegacy, req);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('_verifyLectureOwnershipLegacy allows admins', async () => {
    const next = await run(_verifyLectureOwnershipLegacy, adminReq());
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('_verifyLectureOwnershipLegacy rejects an invalid lecture id', async () => {
    const req = mockRequest({
      ...userReq(),
      params: { id: COURSE_A, lectureId: 'bad' },
    });
    const next = await run(_verifyLectureOwnershipLegacy, req);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it('_verifyLectureOwnershipLegacy rejects a missing lecture', async () => {
    vi.mocked(Lecture.findById as never).mockReturnValue(queryChain(null));
    const req = mockRequest({ ...userReq(), params: { id: COURSE_A, lectureId: VALID_ID } });
    const next = await run(_verifyLectureOwnershipLegacy, req);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it('_verifyLectureOwnershipLegacy rejects a lecture for the wrong course', async () => {
    vi.mocked(Lecture.findById as never).mockReturnValue(queryChain({ course: COURSE_B }));
    const req = mockRequest({ ...userReq(), params: { id: COURSE_A, lectureId: VALID_ID } });
    const next = await run(_verifyLectureOwnershipLegacy, req);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('_verifyLectureOwnershipLegacy allows when the course is owned', async () => {
    vi.mocked(Lecture.findById as never).mockReturnValue(queryChain({ course: COURSE_A }));
    vi.mocked(Course.findById as never).mockReturnValue(queryChain({ instructor: 'u1' }));
    const req = mockRequest({ ...userReq('u1'), params: { id: COURSE_A, lectureId: VALID_ID } });
    const next = await run(_verifyLectureOwnershipLegacy, req);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });
});
