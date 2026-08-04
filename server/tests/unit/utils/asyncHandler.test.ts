import { asyncHandler } from '../../../src/utils/asyncHandler';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

describe('asyncHandler', () => {
  it('calls next() without arguments on success', async () => {
    const handler = asyncHandler(async (_req, _res, next) => {
      next();
    });
    const next = mockNext();
    handler(mockRequest(), mockResponse() as never, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it('passes rejected errors to next', async () => {
    const expected = new Error('async boom');
    const handler = asyncHandler(async () => {
      throw expected;
    });
    const next = mockNext();
    handler(mockRequest(), mockResponse() as never, next);
    await Promise.resolve();
    expect(next).toHaveBeenCalledWith(expected);
  });

  it('supports handlers that return values', async () => {
    const handler = asyncHandler(async (_req, _res, next) => {
      return next('value');
    });
    const next = mockNext();
    handler(mockRequest(), mockResponse() as never, next);
    await Promise.resolve();
    expect(next).toHaveBeenCalledWith('value');
  });
});
