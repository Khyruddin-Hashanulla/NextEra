import { ApiError } from '../../../src/utils/ApiError';
import { MESSAGES } from '../../../src/constants/messages';
import { authorize } from '../../../src/middlewares/authorize.middleware';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

const student = { userId: 'u1', role: 'student', email: 's@x.com' };
const instructor = { userId: 'u2', role: 'instructor', email: 'i@x.com' };

describe('authorize middleware', () => {
  it('rejects when no currentUser is present', () => {
    const { next } = run(authorize('instructor'), mockRequest());
    const err = next.mock.calls[0][0] as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe(MESSAGES.ERROR.TOKEN_REQUIRED);
  });

  it('rejects a role outside the allowed list', () => {
    const { next } = run(authorize('instructor'), mockRequest({ currentUser: student }));
    const err = next.mock.calls[0][0] as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe(MESSAGES.ERROR.FORBIDDEN);
  });

  it('allows a role in the allowed list', () => {
    const { next } = run(authorize('student', 'instructor'), mockRequest({ currentUser: student }));
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('allows any of the allowed roles', () => {
    const { next } = run(authorize('instructor'), mockRequest({ currentUser: instructor }));
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('rejects when allowed list is empty and a user exists', () => {
    const { next } = run(authorize(), mockRequest({ currentUser: student }));
    const err = next.mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(403);
  });

  function run(middleware: ReturnType<typeof authorize>, req: ReturnType<typeof mockRequest>) {
    const res = mockResponse();
    const next = mockNext();
    middleware(req, res as never, next);
    return { req, res, next };
  }
});
