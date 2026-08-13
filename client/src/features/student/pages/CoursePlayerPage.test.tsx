import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const { getCourseDetail, updateProgress, getQuizAttempts } = vi.hoisted(() => ({
  getCourseDetail: vi.fn(),
  updateProgress: vi.fn(),
  getQuizAttempts: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('@/api/endpoints/student', () => ({
  studentApi: {
    getCourseDetail,
    updateProgress,
    getQuizAttempts,
  },
}));

vi.mock('@/api/endpoints/quiz', () => ({
  quizApi: {
    startQuizEnhanced: vi.fn(),
    submitQuiz: vi.fn(),
  },
}));

vi.mock('@/api/endpoints/liveClass', () => ({
  liveClassApi: {},
}));

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CoursePlayerPage } from './CoursePlayerPage';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;
const useMutationMock = useMutation as unknown as ReturnType<typeof vi.fn>;
const useQueryClientMock = useQueryClient as unknown as ReturnType<typeof vi.fn>;

function courseData() {
  return {
    course: { _id: 'c1', title: 'Video Course' },
    isEnrolled: true,
    enrollment: { completedLectures: [], completionPercentage: 0 },
    curriculum: [
      {
        _id: 's1',
        title: 'Section 1',
        lectures: [
          {
            _id: 'l1',
            title: 'YouTube Lecture',
            type: 'video',
            isFree: false,
            order: 1,
            duration: 0,
            videoSource: {
              source: 'youtube',
              videoId: 'dQw4w9WgXcQ',
              url: '',
              thumbnailUrl: '',
              playbackRate: 1,
              provider: '',
              qualities: [],
            },
            videoUrl: { url: '', publicId: '' },
          },
        ],
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getCourseDetail.mockReset();
  updateProgress.mockReset();
  getQuizAttempts.mockReset();

  useQueryMock.mockReturnValue({ data: courseData(), isLoading: false, error: null });
  useMutationMock.mockReturnValue({
    mutate: updateProgress,
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
  });
  useQueryClientMock.mockReturnValue({ invalidateQueries: vi.fn() });
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/student/course/c1']}>
      <Routes>
        <Route path="/student/course/:courseId" element={<CoursePlayerPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CoursePlayerPage', () => {
  it('renders a YouTube iframe when a lecture uses a youtube videoSource', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /YouTube Lecture/i }));

    const iframe = document.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1'
    );
    expect(iframe!.getAttribute('allowFullScreen')).not.toBeNull();
    expect(iframe!.getAttribute('allow')).toContain('autoplay');
  });

  it('extracts a YouTube id from a full watch URL stored in videoId', () => {
    const data = courseData();
    data.curriculum[0].lectures[0].videoSource.videoId = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    useQueryMock.mockReturnValue({ data, isLoading: false, error: null });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /YouTube Lecture/i }));

    const iframe = document.querySelector('iframe');
    expect(iframe!.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1'
    );
  });

  it('renders a native video element for direct videoUrl lectures', () => {
    const data = courseData();
    data.curriculum[0].lectures[0].videoSource = {
      source: 'direct',
      videoId: 'v1',
      url: 'https://cdn.example.com/video.mp4',
      thumbnailUrl: '',
      playbackRate: 1,
      provider: '',
      qualities: [],
    };
    data.curriculum[0].lectures[0].videoUrl = { url: 'https://cdn.example.com/video.mp4', publicId: 'v1' };
    useQueryMock.mockReturnValue({ data, isLoading: false, error: null });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /YouTube Lecture/i }));

    expect(document.querySelector('iframe')).toBeNull();
    expect(document.querySelector('video')).not.toBeNull();
  });

  it('auto-selects the first lesson after enrollment so the student sees content immediately', () => {
    renderPage();

    expect(screen.getAllByText('YouTube Lecture').length).toBeGreaterThan(0);
    expect(document.querySelector('iframe')).not.toBeNull();
    expect(screen.queryByText('Select a lecture to start learning')).not.toBeInTheDocument();
  });

  it('shows "No lessons available yet." when an enrolled course has no lectures', () => {
    const data = courseData();
    data.curriculum = [{ _id: 's1', title: 'Section 1', lectures: [] }];
    useQueryMock.mockReturnValue({ data, isLoading: false, error: null });

    renderPage();

    expect(screen.getByText('No lessons available yet.')).toBeInTheDocument();
  });

  it('keeps the student inside the app instead of bouncing back to the course details page', () => {
    const data = courseData();
    data.isEnrolled = false;
    useQueryMock.mockReturnValue({ data, isLoading: false, error: null });

    renderPage();

    expect(screen.getByRole('link', { name: /My Courses/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /View Course/i })).not.toBeInTheDocument();
  });

  it('renders quiz questions and options for a quiz-type lecture', () => {
    const data = courseData();
    data.curriculum[0].lectures = [
      {
        _id: 'q1',
        title: 'React Basics Quiz',
        type: 'quiz',
        isFree: false,
        order: 1,
        duration: 0,
        correctAnswer: undefined,
        quiz: {
          timeLimit: 0,
          passingScore: 60,
          maxAttempts: 3,
          showResults: true,
          randomizeQuestions: false,
          negativeMarking: false,
          partialMarking: false,
          attemptCooldownMinutes: 0,
          allowResume: true,
          shuffleOptions: false,
          scoringPolicy: 'best',
          questions: [
            {
              question: 'What does JSX stand for?',
              options: ['JavaScript XML', 'Java Syntax'],
              marks: 1,
              type: 'single',
            },
            { question: 'True or false: Hooks are functions.', options: ['True', 'False'], marks: 1, type: 'boolean' },
          ],
        },
      },
    ] as any;
    getQuizAttempts.mockResolvedValue({ data: { data: [] } });
    useQueryMock.mockReturnValue({ data, isLoading: false, error: null });

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /React Basics Quiz/i }));

    expect(screen.getByText(/2 Question Quiz/i)).toBeInTheDocument();
    expect(screen.getByText(/What does JSX stand for\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Quiz/i })).toBeInTheDocument();
    expect(screen.getByText('JavaScript XML')).toBeInTheDocument();
    expect(screen.getByText('Java Syntax')).toBeInTheDocument();
    expect(screen.getByText('True')).toBeInTheDocument();
    expect(screen.getByText('False')).toBeInTheDocument();
  });
});
