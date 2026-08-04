import { render, type RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { type ReactElement, type ReactNode } from 'react';
import type { User } from '@/types/user';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { QUERY_KEYS, TOKEN_KEYS } from '@/lib/constants';
import { createTestQueryClient } from '@/test/utils';
import { MockAuthProvider, createAuthValue, type AuthMockValue } from '@/test/mocks/providers';

export interface RenderWithProvidersOptions {
  user?: User | null;
  route?: string;
  initialEntries?: string[];
  queryClient?: QueryClient;
  mockAuth?: AuthMockValue;
}

export interface RenderWithProvidersResult extends RenderResult {
  queryClient: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const { user = null, route = '/', initialEntries, mockAuth } = options;
  const queryClient = options.queryClient ?? createTestQueryClient();

  if (user) {
    queryClient.setQueryData(QUERY_KEYS.auth.user, user);
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'test-access-token');
  }

  const auth = mockAuth ?? (user ? createAuthValue({ user, isAuthenticated: true }) : undefined);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries ?? [route]}>
        <ThemeProvider>
          <ToastProvider>
            {auth ? (
              <MockAuthProvider value={auth}>{children}</MockAuthProvider>
            ) : (
              <AuthProvider>{children}</AuthProvider>
            )}
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );

  const result = render(ui, { wrapper });
  return Object.assign(result, { queryClient });
}
