import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const { listAnnouncements } = vi.hoisted(() => ({
  listAnnouncements: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  keepPreviousData: undefined,
}));

vi.mock('@/api/endpoints/student', () => ({
  studentApi: {
    listAnnouncements,
  },
}));

import { useQuery } from '@tanstack/react-query';
import { AnnouncementsPage } from './AnnouncementsPage';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;

const overviewData = {
  announcements: [
    {
      _id: 'a1',
      course: { _id: 'c1', title: 'CS 101' },
      instructor: 'i1',
      title: 'Midterm schedule update',
      message: 'The midterm will be held on Friday at 10 AM in Room 201.',
      attachments: [],
      sendEmail: false,
      createdAt: '2026-08-10T10:00:00.000Z',
    },
  ],
  total: 1,
  page: 1,
  totalPages: 1,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/student/announcements']}>
      <Routes>
        <Route path="/student/announcements" element={<AnnouncementsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  listAnnouncements.mockReset();
  listAnnouncements.mockResolvedValue({ data: { data: overviewData } });
  useQueryMock.mockImplementation(({ _queryFn }: any) => ({
    data: overviewData,
    isLoading: false,
  }));
});

describe('AnnouncementsPage', () => {
  it('renders the header and announcement cards', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Announcements' })).toBeInTheDocument();
    expect(screen.getByText('Midterm schedule update')).toBeInTheDocument();
    expect(screen.getByText('CS 101')).toBeInTheDocument();
  });

  it('opens the detail dialog when an announcement card is clicked', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Midterm schedule update/ }));
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getAllByText('The midterm will be held on Friday at 10 AM in Room 201.')).toHaveLength(2);
  });

  it('shows the empty state when there are no announcements', () => {
    useQueryMock.mockImplementation(() => ({
      data: { ...overviewData, announcements: [] },
      isLoading: false,
    }));
    renderPage();
    expect(screen.getByText('No announcements yet')).toBeInTheDocument();
  });

  it('shows a skeleton while loading', () => {
    useQueryMock.mockImplementation(() => ({ data: undefined, isLoading: true }));
    renderPage();
    expect(screen.queryByRole('heading', { name: 'Announcements' })).not.toBeInTheDocument();
    expect(screen.queryByText('No announcements yet')).not.toBeInTheDocument();
  });

  it('shows an error state and retries on request failure', () => {
    const refetch = vi.fn();
    useQueryMock.mockImplementation(() => ({
      data: undefined,
      isLoading: false,
      error: new Error('boom'),
      refetch,
    }));
    renderPage();
    const retry = screen.getByRole('button', { name: 'Try Again' });
    expect(retry).toBeInTheDocument();
    fireEvent.click(retry);
    expect(refetch).toHaveBeenCalled();
  });

  it('renders pagination when there are multiple pages', () => {
    useQueryMock.mockImplementation(() => ({
      data: { ...overviewData, total: 21, page: 1, totalPages: 3 },
      isLoading: false,
    }));
    renderPage();
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.getByText(/of 3/)).toBeInTheDocument();
  });
});