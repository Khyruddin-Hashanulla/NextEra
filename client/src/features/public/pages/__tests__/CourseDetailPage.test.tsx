import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const { getCourseDetail, enrollFreeCourse, navigateMock, isAuthenticatedRef } = vi.hoisted(() => ({
  getCourseDetail: vi.fn(),
  enrollFreeCourse: vi.fn(),
  navigateMock: vi.fn(),
  isAuthenticatedRef: { current: false },
}));

const invalidateQueries = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock('@/api/endpoints/student', () => ({
  studentApi: {
    getCourseDetail,
    enrollFreeCourse,
  },
}));

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: null, isAuthenticated: isAuthenticatedRef.current }),
}));

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

import { useQuery } from '@tanstack/react-query';
import { CourseDetailPage } from '../CourseDetailPage';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;

function courseData(patch: {
  courseType?: string;
  price?: number;
  pricing?: { originalPrice: number; discountPercent: number; hasDiscount: boolean; gstPercent: number; gstInclusive: boolean };
}) {
  return {
    course: {
      _id: 'c1',
      title: 'Pricing Test Course',
      slug: 'pricing-test-course',
      description: 'Description',
      shortDescription: 'Short desc',
      thumbnail: { url: '', publicId: '' },
      instructor: { _id: 'i1', name: 'Instructor' },
      category: { _id: 'cat1', name: 'Tech' },
      level: 'beginner',
      language: 'English',
      benefits: '',
      requirements: [],
      tags: [],
      whatYouWillLearn: [],
      visibility: 'public',
      status: 'published',
      isApproved: true,
      featured: false,
      badge: '',
      totalDuration: 2,
      totalLectures: 4,
      totalSections: 1,
      totalResources: 0,
      averageRating: 0,
      totalReviews: 0,
      totalEnrollments: 0,
      updatedAt: '2026-01-01T00:00:00.000Z',
      courseType: 'free',
      price: 0,
      pricing: { originalPrice: 0, discountPercent: 0, hasDiscount: false, gstPercent: 18, gstInclusive: true },
      ...patch,
    },
    curriculum: [
      {
        _id: 'sec1',
        title: 'Section 1',
        totalDuration: 2,
        totalLectures: 2,
        lectures: [
          { _id: 'l1', title: 'Intro', type: 'video', duration: 5, order: 1, isFree: true },
          { _id: 'l2', title: 'Components', type: 'video', duration: 12, order: 2, isFree: false },
        ],
      },
    ],
    isEnrolled: false,
    enrollment: null,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/courses/c1']}>
      <Routes>
        <Route path="/courses/:id" element={<CourseDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getCourseDetail.mockReset();
});

describe('CourseDetailPage pricing', () => {
  it('shows Free with an Enroll for Free button for a free course, even when originalPrice is set', async () => {
    useQueryMock.mockReturnValue({
      data: courseData({ courseType: 'free', price: 0, pricing: { originalPrice: 1999, discountPercent: 0, hasDiscount: false, gstPercent: 18, gstInclusive: true } }),
      isLoading: false,
      error: null,
    });

    renderPage();

    expect(await screen.findByText('Free')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Enroll for Free/i }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/1,999|1999/)).not.toBeInTheDocument();
  });

  it('shows the correct price for a paid course without discount', async () => {
    useQueryMock.mockReturnValue({
      data: courseData({ courseType: 'paid', price: 1999, pricing: { originalPrice: 0, discountPercent: 0, hasDiscount: false, gstPercent: 18, gstInclusive: true } }),
      isLoading: false,
      error: null,
    });

    renderPage();
    await screen.findByText('Pricing Test Course');
    expect(screen.getByText(/1,999/)).toBeInTheDocument();
    expect(screen.queryAllByRole('link', { name: /Enroll for Free/i }).length).toBe(0);
    expect(screen.getAllByRole('link', { name: /Enroll Now/i }).length).toBeGreaterThan(0);
  });

  it('shows original price strike-through and Save badge only when discounted', async () => {
    useQueryMock.mockReturnValue({
      data: courseData({ courseType: 'paid', price: 1499, pricing: { originalPrice: 1999, discountPercent: 25, hasDiscount: true, gstPercent: 18, gstInclusive: true } }),
      isLoading: false,
      error: null,
    });

    renderPage();
    await screen.findByText('Pricing Test Course');
    expect(screen.getByText('Save 25%')).toBeInTheDocument();
    expect(screen.getByText('₹1,499')).toBeInTheDocument();
  });

  it('calls enroll exactly once on double-click and navigates to the learning page', async () => {
    useQueryMock.mockReturnValue({
      data: courseData({ courseType: 'free', price: 0, pricing: { originalPrice: 1999, discountPercent: 0, hasDiscount: false, gstPercent: 18, gstInclusive: true } }),
      isLoading: false,
      error: null,
    });
    enrollFreeCourse.mockResolvedValue({ data: { data: { alreadyEnrolled: false } } });
    isAuthenticatedRef.current = true;

    renderPage();
    const button = await screen.findByRole('button', { name: /Enroll for Free/i });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(enrollFreeCourse).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/student/courses/c1/learn',
        { replace: true },
      ),
    );
    // The stale course-detail cache is invalidated so the page reflects enrollment on return.
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['course-detail', 'c1'] });
  });
});

describe('CourseDetailPage curriculum visibility', () => {
  async function openCurriculum(data: any) {
    const user = userEvent.setup();
    useQueryMock.mockReturnValue({ data, isLoading: false, error: null });
    renderPage();
    await screen.findByText('Pricing Test Course');
    await user.click(screen.getByRole('tab', { name: /Curriculum/i }));
    const sectionTrigger = await screen.findByRole('button', { name: /Section 1/i });
    await user.click(sectionTrigger);
  }

  it('shows ALL lectures before enrollment, locking only non-free ones', async () => {
    await openCurriculum(courseData({ courseType: 'paid', price: 1999, pricing: { originalPrice: 0, discountPercent: 0, hasDiscount: false, gstPercent: 18, gstInclusive: true } }));

    // Every lecture is visible, free and locked alike
    expect(await screen.findByText('Intro')).toBeInTheDocument();
    expect(screen.getByText('Components')).toBeInTheDocument();
    // Locked lecture is disabled and free preview keeps its badge
    expect(screen.getByText('Free Preview')).toBeInTheDocument();
    expect(screen.getByText('Components').closest('button')).toBeDisabled();
  });

  it('unlocks every lecture for an enrolled student (no lock, playable)', async () => {
    const data = courseData({ courseType: 'paid', price: 1999, pricing: { originalPrice: 0, discountPercent: 0, hasDiscount: false, gstPercent: 18, gstInclusive: true } });
    data.isEnrolled = true;

    await openCurriculum(data);

    const lockedRow = screen.getByText('Components').closest('button');
    expect(lockedRow).not.toBeDisabled();
    expect(screen.queryByText('Free Preview')).not.toBeInTheDocument();

    fireEvent.click(lockedRow!);
    expect(navigateMock).toHaveBeenCalledWith('/student/courses/c1/learn');
  });
});