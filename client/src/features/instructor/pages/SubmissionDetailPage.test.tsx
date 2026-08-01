import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const { addToast, gradeSubmission, returnForResubmission, updateSubmissionStatus } = vi.hoisted(() => ({
  addToast: vi.fn(),
  gradeSubmission: vi.fn(),
  returnForResubmission: vi.fn(),
  updateSubmissionStatus: vi.fn(),
}));

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

vi.mock('@/api/endpoints/instructor', () => ({
  instructorApi: {
    getSubmissionDetail: vi.fn(),
    gradeSubmission: gradeSubmission,
    returnForResubmission: returnForResubmission,
    updateSubmissionStatus: updateSubmissionStatus,
  },
}));

import { useQuery, useMutation } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { SubmissionDetailPage } from './SubmissionDetailPage';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;
const useMutationMock = useMutation as unknown as ReturnType<typeof vi.fn>;

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/instructor/assignments/submissions/sub-1']}>
      <Routes>
        <Route path="/instructor/assignments/submissions/:submissionId" element={<SubmissionDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

const baseSubmission = {
  _id: 'sub-1',
  submissionVersion: 1,
  status: 'submitted',
  submittedAt: '2026-07-20T10:00:00.000Z',
  content: 'My submitted answer',
  files: [],
  user: { name: 'Alice', email: 'alice@test.com' },
  lecture: { _id: 'lecture-1', assignment: { totalMarks: 100 } },
};

function mutationMock(publishValue: boolean | null) {
  return ({ mutationFn, onSuccess, onError }: any) => ({
    mutate: (arg?: any) => {
      Promise.resolve(mutationFn(arg))
        .then(() => onSuccess?.())
        .catch(() => onError?.());
    },
    isPending: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  addToast.mockClear();
  (instructorApi.getSubmissionDetail as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { data: baseSubmission } });
  useMutationMock.mockImplementation(mutationMock(null));
});

describe('SubmissionDetailPage', () => {
  it('renders student info and submission content', async () => {
    useQueryMock.mockReturnValue({ data: baseSubmission, isLoading: false });
    renderPage();

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    expect(screen.getByText('My submitted answer')).toBeInTheDocument();
    expect(screen.getByText('submitted')).toBeInTheDocument();
  });

  it('renders Grading History entries when present', async () => {
    useQueryMock.mockReturnValue({
      data: {
        ...baseSubmission,
        status: 'graded',
        gradingHistory: [
          {
            grade: 80,
            maxMarks: 100,
            percentage: 80,
            letterGrade: 'B',
            status: 'graded',
            gradedAt: '2026-07-21T09:00:00.000Z',
            gradedBy: { name: 'Prof. Smith' },
            feedback: 'Needs more detail',
          },
        ],
      },
      isLoading: false,
    });

    renderPage();

    expect(await screen.findByText('Grading History')).toBeInTheDocument();
    expect(screen.getByText('B · 80%')).toBeInTheDocument();
    expect(screen.getByText(/Prof\. Smith/)).toBeInTheDocument();
    expect(screen.getByText('Needs more detail')).toBeInTheDocument();
  });

  it('publishes a grade and shows success toast', async () => {
    useQueryMock.mockReturnValue({ data: baseSubmission, isLoading: false });
    gradeSubmission.mockResolvedValue({ data: { data: { status: 'graded' } } });
    useMutationMock.mockImplementation(mutationMock(null));

    renderPage();

    const gradeInput = await screen.findByPlaceholderText('e.g. 85');
    fireEvent.change(gradeInput, { target: { value: '92' } });
    const feedbackTextarea = screen.getByPlaceholderText('Provide feedback to the student...');
    fireEvent.change(feedbackTextarea, { target: { value: 'Excellent' } });

    const publishButton = screen.getByRole('button', { name: /Publish Grade/ });
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(gradeSubmission).toHaveBeenCalledWith('sub-1', expect.objectContaining({ grade: 92, publish: true, feedback: 'Excellent' }));
    });
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Grade saved', variant: 'success' }));
  });

  it('returns the submission for resubmission', async () => {
    useQueryMock.mockReturnValue({ data: baseSubmission, isLoading: false });
    returnForResubmission.mockResolvedValue({ data: { data: { status: 'returned_for_resubmission' } } });
    useMutationMock.mockImplementation(mutationMock(null));

    renderPage();

    const returnFeedback = await screen.findByPlaceholderText('Notes on what needs to change before resubmission...');
    fireEvent.change(returnFeedback, { target: { value: 'Please redo the analysis' } });

    const returnButton = screen.getByRole('button', { name: 'Return' });
    fireEvent.click(returnButton);

    await waitFor(() => {
      expect(returnForResubmission).toHaveBeenCalledWith('sub-1', { feedback: 'Please redo the analysis' });
    });
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Returned for resubmission', variant: 'success' }));
  });

  it('rejects a submission', async () => {
    useQueryMock.mockReturnValue({ data: baseSubmission, isLoading: false });
    updateSubmissionStatus.mockResolvedValue({ data: { data: { status: 'rejected' } } });
    useMutationMock.mockImplementation(mutationMock(null));

    renderPage();

    const rejectButton = await screen.findByRole('button', { name: 'Reject' });
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(updateSubmissionStatus).toHaveBeenCalledWith('sub-1', { status: 'rejected' });
    });
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Submission rejected', variant: 'success' }));
  });

  it('renders skeleton while loading', () => {
    useQueryMock.mockReturnValue({ data: undefined, isLoading: true });
    renderPage();
    expect(screen.getByText('Loading skeleton')).toBeInTheDocument();
  });
});
