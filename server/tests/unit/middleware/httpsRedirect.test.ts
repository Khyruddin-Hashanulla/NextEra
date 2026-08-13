import { httpsRedirect } from '../../../src/middlewares/httpsRedirect.middleware';
import { env } from '../../../src/config/env';
import { logger } from '../../../src/utils/logger';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

vi.mock('../../../src/config/env', () => ({
  env: { nodeEnv: 'test', port: 5055 },
}));

vi.mock('../../../src/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

function run(req: ReturnType<typeof mockRequest>) {
  const res = mockResponse();
  const next = mockNext();
  httpsRedirect(req, res as never, next);
  return { res, next };
}

describe('httpsRedirect middleware', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls next when not in production', () => {
    const { next } = run(mockRequest({ originalUrl: '/api/courses' }));
    expect(next).toHaveBeenCalledOnce();
  });

  it('calls next when the request is secure in production', () => {
    (env as any).nodeEnv = 'production';
    const { next } = run(mockRequest({ secure: true, protocol: 'https', originalUrl: '/api/courses' }));
    expect(next).toHaveBeenCalledOnce();
  });

  it('calls next when the protocol is https', () => {
    (env as any).nodeEnv = 'production';
    const { next } = run(
      mockRequest({ protocol: 'https', originalUrl: '/api/courses', headers: { host: 'example.com' } })
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('redirects http requests to https in production', () => {
    (env as any).nodeEnv = 'production';
    const { res, next } = run(
      mockRequest({
        protocol: 'http',
        originalUrl: '/api/courses',
        ip: '1.2.3.4',
        method: 'GET',
        headers: { host: 'example.com' },
      })
    );
    expect(res.redirect).toHaveBeenCalledWith(301, 'https://example.com/api/courses');
    expect(logger.warn).toHaveBeenCalledWith(
      'HTTPS redirect',
      expect.objectContaining({ from: 'http://example.com/api/courses' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('falls back to x-forwarded-host for the redirect host', () => {
    (env as any).nodeEnv = 'production';
    const { res } = run(
      mockRequest({
        protocol: 'http',
        originalUrl: '/x',
        headers: { 'x-forwarded-host': 'cdn.example.com' },
      })
    );
    expect(res.redirect).toHaveBeenCalledWith(301, 'https://cdn.example.com/x');
  });

  it('falls back to the env port when no host header exists', () => {
    (env as any).nodeEnv = 'production';
    const { res } = run(mockRequest({ protocol: 'http', originalUrl: '/y', headers: {} }));
    expect(res.redirect).toHaveBeenCalledWith(301, 'https://localhost:5055/y');
  });
});
