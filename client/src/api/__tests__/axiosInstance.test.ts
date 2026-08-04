import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import axiosInstance, { fetchCsrfToken, getCsrfToken } from '@/api/axiosInstance';
import { TOKEN_KEYS, API_BASE_URL } from '@/lib/constants';

const realLocation = window.location;

function stubLocation() {
  Object.defineProperty(window, 'location', {
    value: { ...realLocation, href: 'http://localhost/' },
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  if (window.location !== realLocation) {
    Object.defineProperty(window, 'location', {
      value: realLocation,
      configurable: true,
      writable: true,
    });
  }
});

afterAll(() => {
  Object.defineProperty(window, 'location', { value: realLocation, configurable: true, writable: true });
});

function authPayload() {
  return {
    data: {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: { _id: 'u-1', name: 'Jane', email: 'j@x.com' },
    },
  };
}

function setupProtectedEndpoint(failuresBeforeSuccess: number) {
  let attempts = 0;
  server.use(
    http.get('/api/v1/protected', () => {
      attempts += 1;
      if (attempts <= failuresBeforeSuccess) {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      return HttpResponse.json({ data: { ok: true } });
    }),
    http.post('/api/v1/auth/refresh', () => HttpResponse.json(authPayload())),
  );
  return () => attempts;
}

describe('axiosInstance request interceptor', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('attaches the Authorization header when a token exists', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'my-token');
    const seen: string | null = null;
    server.use(
      http.get('/api/v1/echo', ({ request }) => {
        (request.headers.get('authorization') ?? '').startsWith('Bearer');
        return HttpResponse.json({ data: { auth: request.headers.get('authorization'), seen } });
      }),
    );
    const { data } = await axiosInstance.get('/echo');
    expect(data.data.auth).toBe('Bearer my-token');
  });

  it('skips the Authorization header without a token', async () => {
    server.use(
      http.get('/api/v1/echo2', ({ request }) =>
        HttpResponse.json({ data: { auth: request.headers.get('authorization') } }),
      ),
    );
    const { data } = await axiosInstance.get('/echo2');
    expect(data.data.auth).toBeNull();
  });

  it('attaches the CSRF token for unsafe methods', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'my-token');
    server.use(
      http.post('/api/v1/csrf-echo', ({ request }) =>
        HttpResponse.json({ data: { csrf: request.headers.get('x-csrf-token') } }),
      ),
    );
    await fetchCsrfToken();
    const { data } = await axiosInstance.post('/csrf-echo', {});
    expect(data.data.csrf).toBe('test-csrf-token');
  });
});

describe('axiosInstance response interceptor', () => {
  it('returns the response on success', async () => {
    server.use(
      http.get('/api/v1/plain', () => HttpResponse.json({ data: { ok: true } })),
    );
    const { data } = await axiosInstance.get('/plain');
    expect(data.data.ok).toBe(true);
  });

  it('retries once after a successful token refresh on 401', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'expired');
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, 'refresh-1');
    const attempts = setupProtectedEndpoint(1);

    const { data } = await axiosInstance.get('/protected');
    expect(attempts()).toBe(2);
    expect(data.data.ok).toBe(true);
    expect(localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)).toBe('new-access-token');
    expect(localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN)).toBe('new-refresh-token');
  });

  it('queues concurrent 401s and performs a single refresh', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'expired');
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, 'refresh-1');

    let refreshCalls = 0;
    const attempts: Record<string, number> = {};
    const protectedHandler = (path: string) =>
      http.get(path, () => {
        attempts[path] = (attempts[path] ?? 0) + 1;
        return attempts[path] <= 1
          ? HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          : HttpResponse.json({ data: { ok: path } });
      });
    server.use(
      protectedHandler('/api/v1/protected-a'),
      protectedHandler('/api/v1/protected-b'),
      http.post('/api/v1/auth/refresh', () => {
        refreshCalls += 1;
        return HttpResponse.json(authPayload());
      }),
    );

    const [a, b] = await Promise.all([
      axiosInstance.get('/protected-a'),
      axiosInstance.get('/protected-b'),
    ]);
    expect(a.data.data.ok).toBe('/api/v1/protected-a');
    expect(b.data.data.ok).toBe('/api/v1/protected-b');
    expect(refreshCalls).toBe(1);
  });

  it('clears tokens and redirects to login when refresh fails', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'expired');
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, 'refresh-1');
    stubLocation();

    server.use(
      http.get('/api/v1/protected-c', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
      http.post('/api/v1/auth/refresh', () =>
        HttpResponse.json({ message: 'Invalid refresh token' }, { status: 401 }),
      ),
    );

    await expect(axiosInstance.get('/protected-c')).rejects.toThrow();
    expect(localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN)).toBeNull();
    expect(window.location.href).toBe('/auth/login');
  });

  it('rejects immediately when a 401 occurs without a refresh token', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'expired');
    stubLocation();

    server.use(
      http.get('/api/v1/protected-d', () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    );

    await expect(axiosInstance.get('/protected-d')).rejects.toThrow();
    expect(window.location.href).toBe('/auth/login');
  });

  it('rejects cancelled requests without redirecting', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'expired');
    stubLocation();

    const controller = new AbortController();
    controller.abort();
    await expect(axiosInstance.get('/anything', { signal: controller.signal })).rejects.toThrow();

    expect(window.location.href).toBe('http://localhost/');
  });
});

describe('fetchCsrfToken', () => {
  it('stores the token from the server', async () => {
    server.use(
      http.get('/api/v1/csrf-token', () =>
        HttpResponse.json({ data: { csrfToken: 'server-token' } }),
      ),
    );
    await fetchCsrfToken();
    expect(getCsrfToken()).toBe('server-token');
  });

  it('clears the token when the request fails', async () => {
    server.use(
      http.get('/api/v1/csrf-token', () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );
    await fetchCsrfToken();
    expect(getCsrfToken()).toBeNull();
  });
});

describe('axiosInstance csrf recovery', () => {
  it('fetches a fresh CSRF token on a 403 csrf error', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'my-token');
    let csrfRefetched = 0;
    server.use(
      http.get('/api/v1/csrf-check', () => {
        csrfRefetched += 1;
        return HttpResponse.json({ message: 'Invalid CSRF token' }, { status: 403 });
      }),
      http.get('/api/v1/csrf-token', () =>
        HttpResponse.json({ data: { csrfToken: 'rotated-token' } }),
      ),
    );

    await expect(axiosInstance.get('/csrf-check')).rejects.toThrow();
    expect(csrfRefetched).toBe(1);
    expect(getCsrfToken()).toBe('rotated-token');
  });

  it('rejects queued 401s when the refresh itself fails', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'expired');
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, 'bad-refresh');
    stubLocation();

    server.use(
      http.get('/api/v1/q-a', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })),
      http.get('/api/v1/q-b', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })),
      http.post('/api/v1/auth/refresh', () =>
        HttpResponse.json({ message: 'Bad refresh' }, { status: 401 }),
      ),
    );

    const a = axiosInstance.get('/q-a');
    const b = axiosInstance.get('/q-b');
    await expect(a).rejects.toThrow();
    await expect(b).rejects.toThrow();
    expect(localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)).toBeNull();
  });
});
