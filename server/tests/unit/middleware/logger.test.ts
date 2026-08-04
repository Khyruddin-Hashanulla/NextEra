import { requestLogger } from '../../../src/middlewares/logger.middleware';
import { logger } from '../../../src/utils/logger';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

vi.mock('../../../src/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

function resWithOn() {
  const res = mockResponse() as any;
  res.on = vi.fn();
  res.statusCode = 200;
  return res;
}

describe('requestLogger middleware', () => {
  it('logs the request on finish and calls next', () => {
    const req = mockRequest({ method: 'GET', originalUrl: '/api/courses' });
    const res = resWithOn();
    const next = mockNext();

    requestLogger(req, res, next);

    expect(next).toHaveBeenCalledOnce();

    const handler = res.on.mock.calls[0][1];
    handler();

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('GET /api/courses 200'),
    );
  });

  it('works when next is a plain function', () => {
    const req = mockRequest({ method: 'POST', originalUrl: '/api/auth/login' });
    const res = resWithOn();
    let called = false;

    requestLogger(req, res, () => {
      called = true;
    });

    expect(called).toBe(true);
  });
});
