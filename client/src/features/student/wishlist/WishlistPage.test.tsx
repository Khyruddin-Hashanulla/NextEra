import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse, delay } from 'msw';
import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/render/renderWithProviders';
import { buildUserWithRole } from '@/test/factories';
import { WishlistPage } from '@/features/student/pages/WishlistPage';

const items = [
  {
    _id: 'w1',
    user: 'u1',
    course: {
      _id: 'c1',
      title: 'React Masterclass',
      price: 1999,
      level: 'intermediate',
      averageRating: 4.7,
      totalReviews: 321,
      instructor: { _id: 'i1', name: 'Jane Doe' },
      thumbnail: { url: 'https://img.example/react.jpg', publicId: 'r1' },
    },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

let wishlistedCourses: string[] = [];

function seedWishlist(courseIds: string[]) {
  wishlistedCourses = [...courseIds];
  server.use(
    http.get('/api/v1/student/wishlist', () =>
      HttpResponse.json({ success: true, data: wishlistedCourses.includes('c1') ? items : [] })
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

function renderPage() {
  return renderWithProviders(<WishlistPage />, { user: buildUserWithRole('student') });
}

describe('WishlistPage', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('renders the header and saved courses', async () => {
    seedWishlist(['c1']);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Wishlist' })).toBeInTheDocument();
    expect(await screen.findByText('React Masterclass')).toBeInTheDocument();
    expect(screen.getByText('by Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('intermediate')).toBeInTheDocument();
    expect(screen.getByText('₹1,999')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove React Masterclass from wishlist' })).toBeInTheDocument();
  });

  it('shows a skeleton while loading', async () => {
    server.use(
      http.get('/api/v1/student/wishlist', async () => {
        await delay(1000);
        return HttpResponse.json({ success: true, data: [] });
      })
    );
    renderPage();
    expect(screen.getByRole('status', { name: 'Loading your wishlist' })).toBeInTheDocument();
  });

  it('shows an empty state when there are no saved courses', async () => {
    seedWishlist([]);
    renderPage();

    expect(await screen.findByText('No courses saved yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore Courses' })).toHaveAttribute('href', '/courses');
  });

  it('shows an error state and retries successfully', async () => {
    server.use(
      http.get('/api/v1/student/wishlist', () =>
        HttpResponse.json({ success: false, message: 'boom' }, { status: 500 })
      )
    );
    renderPage();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: 'Try Again' });

    seedWishlist(['c1']);
    fireEvent.click(retry);

    expect(await screen.findByText('React Masterclass')).toBeInTheDocument();
  });

  it('removes a course from the wishlist on remove click', async () => {
    seedWishlist(['c1']);
    renderPage();

    await screen.findByText('React Masterclass');
    fireEvent.click(screen.getByRole('button', { name: 'Remove React Masterclass from wishlist' }));

    await waitFor(() => expect(screen.queryByText('React Masterclass')).not.toBeInTheDocument());
    expect(wishlistedCourses).toEqual([]);
    expect(await screen.findByText('No courses saved yet')).toBeInTheDocument();
  });
});