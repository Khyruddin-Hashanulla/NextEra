import { ApiError } from '../../../src/utils/ApiError';
import { errorHandler } from '../../../src/middlewares/errorHandler.middleware';
import { env } from '../../../src/config/env';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

describe('errorHandler middleware', () => {
  it('responds with the ApiError status and message', () => {
    const res = mockResponse();
    errorHandler(ApiError.notFound('Missing'), mockRequest(), res as never, mockNext());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Missing' }));
  });

  it('does not include a stack in non-development environments', () => {
    const res = mockResponse();
    errorHandler(ApiError.badRequest('nope'), mockRequest(), res as never, mockNext());
    const payload = res.json.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('stack');
  });

  it('includes the stack for ApiErrors in development', () => {
    const original = env.nodeEnv;
    (env as any).nodeEnv = 'development';
    try {
      const res = mockResponse();
      const err = ApiError.badRequest('dev');
      errorHandler(err, mockRequest(), res as never, mockNext());
      const payload = res.json.mock.calls[0][0] as Record<string, unknown>;
      expect(payload.stack).toBe(err.stack);
    } finally {
      (env as any).nodeEnv = original;
    }
  });

  it('responds with a generic 500 for unknown errors', () => {
    const res = mockResponse();
    errorHandler(new Error('boom'), mockRequest(), res as never, mockNext());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'An internal server error occurred',
      })
    );
  });

  it('includes the error message and stack for unknown errors in development', () => {
    const original = env.nodeEnv;
    (env as any).nodeEnv = 'development';
    try {
      const res = mockResponse();
      const err = new Error('dev boom');
      errorHandler(err, mockRequest(), res as never, mockNext());
      const payload = res.json.mock.calls[0][0] as Record<string, unknown>;
      expect(payload).toEqual(expect.objectContaining({ error: 'dev boom', stack: err.stack }));
    } finally {
      (env as any).nodeEnv = original;
    }
  });

  it('handles validation-style ApiErrors with messages', () => {
    const res = mockResponse();
    errorHandler(ApiError.badRequest('title: too short'), mockRequest(), res as never, mockNext());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'title: too short' }));
  });
});
