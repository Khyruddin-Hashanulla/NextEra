import { mockResponse } from '../../helpers/requestHelpers';

async function loadCookies() {
  vi.resetModules();
  return import('../../../src/config/cookies');
}

describe('config/cookies', () => {
  it('sets the refresh cookie as httpOnly, strict, and scoped to /api/v1/auth', async () => {
    const { setRefreshTokenCookie, REFRESH_TOKEN_COOKIE_NAME } = await loadCookies();
    const res = mockResponse();

    setRefreshTokenCookie(res as never, 'my-refresh-token');

    expect(res.cookie).toHaveBeenCalledTimes(1);
    const [name, value, options] = vi.mocked(res.cookie).mock.calls[0];
    expect(name).toBe(REFRESH_TOKEN_COOKIE_NAME);
    expect(value).toBe('my-refresh-token');
    expect(options).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  });

  it('clears the refresh cookie with the same security flags and no maxAge', async () => {
    const { clearRefreshTokenCookie, REFRESH_TOKEN_COOKIE_NAME } = await loadCookies();
    const res = mockResponse();

    clearRefreshTokenCookie(res as never);

    expect(res.clearCookie).toHaveBeenCalledTimes(1);
    const [name, options] = vi.mocked(res.clearCookie).mock.calls[0];
    expect(name).toBe(REFRESH_TOKEN_COOKIE_NAME);
    expect(options).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/api/v1/auth',
    });
    expect(options).not.toHaveProperty('maxAge');
  });

  it('includes the domain when COOKIE_DOMAIN is configured', async () => {
    vi.resetModules();
    process.env.COOKIE_DOMAIN = 'nextera.example.com';
    const { setRefreshTokenCookie } = await import('../../../src/config/cookies');
    const res = mockResponse();

    setRefreshTokenCookie(res as never, 'token');

    const options = vi.mocked(res.cookie).mock.calls[0][2];
    expect(options.domain).toBe('nextera.example.com');
    delete process.env.COOKIE_DOMAIN;
  });

  it('marks the cookie as Secure in production', async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = 'https://app.nextera.com';
    process.env.SERVER_URL = 'https://api.nextera.com';
    const { setRefreshTokenCookie } = await import('../../../src/config/cookies');
    const res = mockResponse();

    setRefreshTokenCookie(res as never, 'token');

    const options = vi.mocked(res.cookie).mock.calls[0][2];
    expect(options.secure).toBe(true);
    delete process.env.NODE_ENV;
    delete process.env.CLIENT_URL;
    delete process.env.SERVER_URL;
  });
});
