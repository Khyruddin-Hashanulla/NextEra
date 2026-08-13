import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const { getAssignmentsOverview } = vi.hoisted(() => ({
  getAssignmentsOverview: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/api/endpoints/student', () => ({
  studentApi: {
    getAssignmentsOverview,
  },
}));

import { useQuery } from '@tanstack/react-query';
import { AssignmentsPage } from './AssignmentsPage';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;

const overviewData = {
  assignments: [
    {
      _id: 'a1',
      title: 'Intro to Programming',
      course: { _id: 'c1', title: 'CS 101', thumbnail: { url: '' } },
      dueDate: '2026-08-15T00:00:00.000Z',
      maxMarks: 100,
      status: 'submitted',
      submission: {
        _id: 's1',
        grade: 85,
        maxMarks: 100,
        percentage: 85,
        passFail: 'pass',
        letterGrade: 'A',
        submittedAt: '2026-07-20T10:00:00.000Z',
        lateSubmission: false,
      },
    },
  ],
  pagination: { page: 1, limit: 12, total: 1, pages: 1 },
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/student/assignments']}>
      <Routes>
        <Route path="/student/assignments" element={<AssignmentsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getAssignmentsOverview.mockReset();
  getAssignmentsOverview.mockResolvedValue({ data: { data: overviewData } });
  useQueryMock.mockImplementation(({ _queryFn }: any) => ({
    data: overviewData,
    isLoading: false,
  }));
});

describe('AssignmentsPage', () => {
  it('renders the "All" filter button without crashing (PROFILE of the .label bug)', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  });

  it('renders the remaining status filter buttons', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Assigned' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submitted' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Overdue' })).toBeInTheDocument();
  });

  it('renders assignment cards from the overview response', () => {
    renderPage();
    expect(screen.getByText('Intro to Programming')).toBeInTheDocument();
    expect(screen.getByText('CS 101')).toBeInTheDocument();
  });

  it('does not crash when the backend returns an unknown assignment status', () => {
    useQueryMock.mockImplementation(() => ({
      data: {
        ...overviewData,
        assignments: [{ ...overviewData.assignments[0], status: 'unknown_status' }],
      },
      isLoading: false,
    }));
    renderPage();
    expect(screen.getByText('Intro to Programming')).toBeInTheDocument();
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument();
  });
});
