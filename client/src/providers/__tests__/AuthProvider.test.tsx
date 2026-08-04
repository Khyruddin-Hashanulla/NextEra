import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { createTestQueryClient } from '@/test/utils';
import { TOKEN_KEYS, QUERY_KEYS } from '@/lib/constants';
import { buildUserWithRole } from '@/test/factories';

function renderAuth() {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
  const utils = renderHook(() => useAuth(), { wrapper });
  return { result: utils.result, queryClient, rerender: utils.rerender };
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts unauthenticated without a token', () => {
    const { result } = renderAuth();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('loads the current user when a token exists', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'token');
    const { result } = renderAuth();

    await waitFor(() => expect(result.current.user).not.toBeNull());
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('student@example.com');
  });

  it('login stores tokens and sets the user', async () => {
    const { result, rerender } = renderAuth();

    await act(async () => {
      await result.current.login('student@example.com', 'Password1');
    });
    rerender();

    expect(localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)).toBe('test-access-token');
    expect(localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN)).toBe('test-refresh-token');
    expect(result.current.user).not.toBeNull();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('login propagates errors', async () => {
    const { result } = renderAuth();
    await expect(result.current.login('', 'x')).rejects.toThrow();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('register sets the user', async () => {
    const { result, rerender } = renderAuth();
    await act(async () => {
      await result.current.register('Jane', 'j@x.com', 'Password1');
    });
    rerender();
    expect(result.current.user).not.toBeNull();
  });

  it('googleLogin stores tokens and sets the user', async () => {
    const { result, rerender } = renderAuth();
    await act(async () => {
      await result.current.googleLogin('credential');
    });
    rerender();
    expect(localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)).toBe('test-access-token');
    expect(result.current.user).not.toBeNull();
  });

  it('verifyEmail stores tokens, sets the user, and returns it', async () => {
    const { result, rerender } = renderAuth();
    let verified: unknown;
    await act(async () => {
      verified = await result.current.verifyEmail('j@x.com', '123456');
    });
    rerender();
    expect(localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)).toBe('test-access-token');
    expect(localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN)).toBe('test-refresh-token');
    expect(result.current.user).not.toBeNull();
    expect(result.current.isAuthenticated).toBe(true);
    expect(verified).not.toBeNull();
  });

  it('logout clears tokens, the cache, and the user', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'token');
    const { result, queryClient, rerender } = renderAuth();
    await waitFor(() => expect(result.current.user).not.toBeNull());

    await act(async () => {
      await result.current.logout();
    });
    rerender();

    expect(localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN)).toBeNull();
    expect(queryClient.getQueryData(QUERY_KEYS.auth.user)).toBeUndefined();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logout clears state even when the API call fails', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'token');
    const { result, rerender } = renderAuth();
    await waitFor(() => expect(result.current.user).not.toBeNull());

    const logout = result.current.logout;
    await act(async () => {
      await logout();
    });
    rerender();

    expect(result.current.user).toBeNull();
  });

  it('setUser stores a user and clears on null', async () => {
    const { result, rerender } = renderAuth();
    const user = buildUserWithRole('instructor', { _id: 'i-1' });

    await act(async () => {
      result.current.setUser(user);
    });
    rerender();
    expect(result.current.user?._id).toBe('i-1');
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      result.current.setUser(null);
    });
    rerender();
    expect(result.current.user).toBeNull();
  });

  it('clears state when the logout API call itself fails', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    server.use(
      http.post('/api/v1/auth/logout', () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );

    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'token');
    const { result, rerender } = renderAuth();
    await waitFor(() => expect(result.current.user).not.toBeNull());

    await act(async () => {
      await result.current.logout();
    });
    rerender();

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN)).toBeNull();
  });
});

describe('useAuth', () => {
  it('throws when used outside an AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider',
    );
  });
});
