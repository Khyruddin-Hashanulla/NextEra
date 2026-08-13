import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { buildUserWithRole } from '@/test/factories';
import { createAuthValue } from '@/test/mocks/providers';
import { WishlistButton } from '../WishlistButton';

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

describe('WishlistButton', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('renders the active heart when the course is already wishlisted', async () => {
    seedWishlist(['c1']);
    renderWithProviders(<WishlistButton courseId="c1" />, { user: buildUserWithRole('student') });

    const button = await screen.findByRole('button', { name: 'Remove from wishlist' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders the inactive heart when the course is not wishlisted', async () => {
    seedWishlist([]);
    renderWithProviders(<WishlistButton courseId="c1" />, { user: buildUserWithRole('student') });

    const button = await screen.findByRole('button', { name: 'Add to wishlist' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('adds a course to the wishlist on click', async () => {
    seedWishlist([]);
    renderWithProviders(<WishlistButton courseId="c1" />, { user: buildUserWithRole('student') });

    const button = await screen.findByRole('button', { name: 'Add to wishlist' });
    fireEvent.click(button);

    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
    expect(wishlistedCourses).toEqual(['c1']);
  });

  it('removes a course from the wishlist on click', async () => {
    seedWishlist(['c1']);
    renderWithProviders(<WishlistButton courseId="c1" />, { user: buildUserWithRole('student') });

    const button = await screen.findByRole('button', { name: 'Remove from wishlist' });
    fireEvent.click(button);

    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'));
    expect(wishlistedCourses).toEqual([]);
  });

  it('does not call the API when the user is not authenticated', async () => {
    const getSpy = vi.fn();
    server.use(
      http.get('/api/v1/student/wishlist', () => {
        getSpy();
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    renderWithProviders(<WishlistButton courseId="c1" />, {
      mockAuth: createAuthValue({ isAuthenticated: false }),
    });

    const button = await screen.findByRole('button', { name: 'Add to wishlist' });
    fireEvent.click(button);

    await waitFor(() => expect(getSpy).not.toHaveBeenCalled());
  });
});