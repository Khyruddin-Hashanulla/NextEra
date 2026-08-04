import { ApiError } from '../../../src/utils/ApiError';

describe('ApiError', () => {
  it('creates an operational error with statusCode, message and prototype', () => {
    const err = new ApiError(418, 'I am a teapot');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(418);
    expect(err.message).toBe('I am a teapot');
    expect(err.isOperational).toBe(true);
    expect(err.name).toBe('Error');
  });

  it('defaults isOperational to true', () => {
    const err = new ApiError(400, 'default');
    expect(err.isOperational).toBe(true);
  });

  it('marks internal server errors as non-operational', () => {
    const err = ApiError.internal('boom');
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(false);
  });

  it.each([
    ['badRequest', 400],
    ['unauthorized', 401],
    ['forbidden', 403],
    ['notFound', 404],
    ['conflict', 409],
    ['tooManyRequests', 429],
    ['internal', 500],
  ] as const)('static %s sets status code %d', (method, statusCode) => {
    const err = ApiError[method]('message');
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(statusCode);
    expect(err.message).toBe('message');
  });

  it('throws with instanceof checks intact across messages', () => {
    try {
      throw ApiError.badRequest('invalid');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).statusCode).toBe(400);
    }
  });
});
