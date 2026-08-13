import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const { addToast, submitAssignment } = vi.hoisted(() => ({ addToast: vi.fn(), submitAssignment: vi.fn() }));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => ({ addToast }),
}));

vi.mock('@/components/skeletons/FormSkeleton', () => ({
  FormSkeleton: () => <div>Loading skeleton</div>,
}));

vi.mock('@/api/endpoints/student', () => ({
  studentApi: {
    getAssignmentDetail: vi.fn(),
    submitAssignment: submitAssignment,
    uploadAssignmentFile: vi.fn(),
  },
}));

import { useQuery, useMutation } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { AssignmentDetailPage } from './AssignmentDetailPage';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;
const useMutationMock = useMutation as unknown as ReturnType<typeof vi.fn>;

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/student/assignments/lecture-1']}>
      <Routes>
        <Route path="/student/assignments/:lectureId" element={<AssignmentDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

const baseData = {
  lecture: {
    _id: 'lecture-1',
    title: 'Intro to Programming',
    course: { _id: 'course-1', title: 'CS 101' },
    assignment: {
      totalMarks: 100,
      passingMarks: 40,
      dueDate: '2026-08-15T00:00:00.000Z',
      instructions: 'Write a program that prints Hello World.',
    },
  },
  status: 'submitted',
  canSubmit: true,
  submission: {
    _id: 'sub-1',
    submissionVersion: 1,
    submittedAt: '2026-07-20T10:00:00.000Z',
    content: 'My answer',
    files: [],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  addToast.mockClear();
  submitAssignment.mockClear();
  (studentApi.getAssignmentDetail as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { data: baseData } });
  useMutationMock.mockImplementation(({ mutationFn, onSuccess, onError }: any) => {
    return {
      mutate: () => {
        Promise.resolve(mutationFn())
          .then(() => onSuccess?.())
          .catch(() => onError?.());
      },
      isPending: false,
    };
  });
});

describe('AssignmentDetailPage', () => {
  it('renders assignment details and grade card with letter grade', async () => {
    useQueryMock.mockReturnValue({
      data: {
        ...baseData,
        status: 'graded',
        submission: {
          ...baseData.submission,
          grade: 85,
          maxMarks: 100,
          percentage: 85,
          letterGrade: 'A',
          passFail: 'pass',
          feedback: 'Great work!',
        },
      },
      isLoading: false,
    });

    renderPage();

    expect(await screen.findByText('Intro to Programming')).toBeInTheDocument();
    expect(screen.getByText('CS 101')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Passed')).toBeInTheDocument();
    expect(screen.getByText('Great work!')).toBeInTheDocument();
    expect(screen.getByText('Feedback')).toBeInTheDocument();
  });

  it('renders Reviewed Files with download links when gradedFiles exist', async () => {
    useQueryMock.mockReturnValue({
      data: {
        ...baseData,
        status: 'graded',
        submission: {
          ...baseData.submission,
          grade: 90,
          maxMarks: 100,
          gradedFiles: [
            { url: 'https://cloud.example/reviewed-1.pdf', publicId: 'rf-1', name: 'reviewed-notes.pdf' },
            { url: 'https://cloud.example/reviewed-2.pdf', publicId: 'rf-2', name: 'commented-v2.pdf' },
          ],
        },
      },
      isLoading: false,
    });

    renderPage();

    expect(await screen.findByText('Reviewed Files')).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    const downloadLinks = links.filter((l) => (l as HTMLAnchorElement).href.includes('cloud.example'));
    expect(downloadLinks).toHaveLength(2);
    expect(screen.getByText('reviewed-notes.pdf')).toBeInTheDocument();
    expect(screen.getByText('commented-v2.pdf')).toBeInTheDocument();
  });

  it('does not render Reviewed Files when gradedFiles is empty', async () => {
    useQueryMock.mockReturnValue({
      data: {
        ...baseData,
        status: 'graded',
        submission: { ...baseData.submission, grade: 90, maxMarks: 100, gradedFiles: [] },
      },
      isLoading: false,
    });

    renderPage();

    await waitFor(() => expect(screen.getByText('Intro to Programming')).toBeInTheDocument());
    expect(screen.queryByText('Reviewed Files')).not.toBeInTheDocument();
  });

  it('submits an assignment and shows success toast', async () => {
    useQueryMock.mockReturnValue({ data: baseData, isLoading: false });
    submitAssignment.mockResolvedValue({ data: { data: { _id: 'sub-1' } } });

    renderPage();

    const textarea = await screen.findByPlaceholderText('Write your assignment answer...');
    fireEvent.change(textarea, { target: { value: 'My final answer' } });

    const submitButton = screen.getByRole('button', { name: 'Submit Assignment' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitAssignment).toHaveBeenCalledWith({
        courseId: 'course-1',
        lectureId: 'lecture-1',
        content: 'My final answer',
        files: undefined,
      });
    });
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Assignment submitted', variant: 'success' })
    );
  });

  it('renders skeleton while loading', () => {
    useQueryMock.mockReturnValue({ data: undefined, isLoading: true });
    renderPage();
    expect(screen.getByText('Loading skeleton')).toBeInTheDocument();
  });
});
