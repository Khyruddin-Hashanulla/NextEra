import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useInstructorSubscription, useInstructorSubscriptionStatus } from '@/hooks/useInstructorSubscription';
import { createTestQueryClient } from '@/test/utils';
import { TOKEN_KEYS } from '@/lib/constants';

function renderSubscription() {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const result = renderHook(() => useInstructorSubscription(), { wrapper });
  return result.result;
}

function renderStatus() {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const result = renderHook(() => useInstructorSubscriptionStatus(), { wrapper });
  return result.result;
}

describe('useInstructorSubscription', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('maps the subscription payload into a PlanInfo', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'token');
    const result = renderSubscription();

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.status).toBe('active');
    expect(result.current.data?.planName).toBe('pro');
    expect(result.current.data?.features.unlimitedCourses).toBe(true);
    expect(result.current.data?.features.advancedAnalytics).toBe(true);
    expect(result.current.data?.features.coupons).toBe(false);
    expect(result.current.data?.endDate).toBe('2026-12-31T00:00:00.000Z');
  });

  it('falls back to default feature values', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'token');
    const result = renderSubscription();

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.features.freeCoursesLimit).toBe(2);
    expect(result.current.data?.features.storageLimitMB).toBe(500);
  });
});

describe('useInstructorSubscriptionStatus', () => {
  it('reads the subscription status and expiry', async () => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'token');
    const result = renderStatus();

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.status).toBe('active');
    expect(result.current.data?.expiry).toBe('2026-12-31T00:00:00.000Z');
  });

  it('falls back to defaults when fields are missing', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    server.use(http.get('/api/v1/instructor/subscription', () => HttpResponse.json({ data: {} })));

    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, 'token');
    const result = renderStatus();

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.status).toBe('none');
    expect(result.current.data?.expiry).toBeNull();
  });
});
