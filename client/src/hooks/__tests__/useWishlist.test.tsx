import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { server } from '@/test/mocks/server';
import { createTestQueryClient } from '@/test/utils';
import { MockAuthProvider, createAuthValue } from '@/test/mocks/providers';
import { useWishlist } from '@/hooks/useWishlist';

const item = {
  _id: 'w1',
  user: 'u1',
  course: { _id: 'c1', title: 'Course One', price: 0 },
  createdAt: '2026-01-01T00:00:00.000Z',
};

let wishlistedCourses: string[] = [];

function seedWishlist(courseIds: string[]) {
  wishlistedCourses = [...courseIds];
  server.use(
    http.get('/api/v1/student/wishlist', () =>
      HttpResponse.json({ success: true, data: wishlistedCourses.includes('c1') ? [item] : [] })
    ),
    http.post('/api/v1/student/wishlist', async ({ request }) => {
      const body = (await request.json()) as { courseId: string };
      if (wishlistedCourses.includes(body.courseId)) {
        wishlistedCourses = wishlistedCourses.filter((c) => c !== body.courseId);
      } else {
        wishlistedCourses = [...wishlistedCourses, body.courseId];
      }
      return HttpResponse.json({ success: true, data: { wishlisted: wishlistedCourses.includes(body.courseId) } });
    })
  );
}

function renderWishlist() {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider value={createAuthValue({ isAuthenticated: true })}>{children}</MockAuthProvider>
    </QueryClientProvider>
  );
  return renderHook(() => useWishlist(), { wrapper }).result;
}

describe('useWishlist', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('loads the authenticated student wishlist', async () => {
    seedWishlist(['c1']);
    const result = renderWishlist();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.items[0]._id).toBe('w1'));
    expect(result.current.items[0].course._id).toBe('c1');
    expect(result.current.isWishlisted('c1')).toBe(true);
    expect(result.current.isWishlisted('c2')).toBe(false);
  });

  it('optimistically adds and removes a course', async () => {
    seedWishlist([]);
    const result = renderWishlist();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isWishlisted('c1')).toBe(false);

    await result.current.toggle('c1');
    await waitFor(() => expect(result.current.isWishlisted('c1')).toBe(true));
    await waitFor(() => expect(result.current.items[0]._id).toBe('w1'));

    await result.current.toggle('c1');
    await waitFor(() => expect(result.current.isWishlisted('c1')).toBe(false));
    await waitFor(() => expect(result.current.items).toHaveLength(0));
  });
});