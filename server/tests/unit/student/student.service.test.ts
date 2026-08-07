import { ApiError } from '../../../src/utils/ApiError';
import { StudentService } from '../../../src/services/student.service';
import { Course } from '../../../src/models/course.model';
import { Section } from '../../../src/models/section.model';
import { Lecture } from '../../../src/models/lecture.model';
import { Enrollment } from '../../../src/models/enrollment.model';

vi.mock('../../../src/models/course.model', () => ({
  Course: { findById: vi.fn() },
}));

vi.mock('../../../src/models/section.model', () => ({
  Section: { find: vi.fn() },
}));

vi.mock('../../../src/models/lecture.model', () => ({
  Lecture: { find: vi.fn() },
}));

vi.mock('../../../src/models/enrollment.model', () => ({
  Enrollment: { findOne: vi.fn() },
}));

const service = new StudentService();

function queryChain(value: unknown) {
  const q = Promise.resolve(value) as any;
  q.populate = vi.fn().mockReturnValue(q);
  q.sort = vi.fn().mockReturnValue(q);
  q.lean = vi.fn().mockReturnValue(value);
  return q;
}

function quizLecture(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'l1',
    title: 'Quiz Lecture',
    type: 'video',
    duration: 10,
    isFree: false,
    order: 1,
    section: 's1',
    videoUrl: { url: 'https://cdn.example.com/secret.mp4' },
    quiz: {
      questions: [{ question: 'Q1', options: ['A', 'B'], correctAnswer: 'A', explanation: 'because' }],
    },
    ...overrides,
  };
}

describe('getCourseWithCurriculum', () => {
  afterEach(() => vi.clearAllMocks());

  it('keeps ALL lectures visible for non-enrolled viewers, but strips content from locked ones', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(
      queryChain({ _id: 'c1', title: 'React', status: 'published' }),
    );
    vi.mocked(Section.find as never).mockReturnValue(queryChain([{ _id: 's1', title: 'Intro' }]));
    vi.mocked(Lecture.find as never).mockReturnValue(
      queryChain([quizLecture({ isFree: true }), quizLecture()]),
    );
    vi.mocked(Enrollment.findOne as never).mockReturnValue(queryChain(null));

    const result = await service.getCourseWithCurriculum('c1');

    const lectures = result.curriculum[0].lectures;
    // Every lecture stays visible (full curriculum disclosure), locked or free.
    expect(lectures).toHaveLength(2);
    // Free preview keeps its playback content; locked lecture is stripped of content.
    const free = lectures.find((l: any) => l.isFree);
    const locked = lectures.find((l: any) => !l.isFree);
    expect(free).not.toHaveProperty('quiz');
    expect(free.videoUrl).toBeDefined();
    expect(free.isFree).toBe(true);
    expect(locked.title).toBe('Quiz Lecture');
    expect(locked.isFree).toBe(false);
    expect(locked).not.toHaveProperty('videoUrl');
    expect(locked).not.toHaveProperty('quiz');
    expect(result.isEnrolled).toBe(false);
  });

  it('returns full content for enrolled students but strips answer keys from quiz', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(
      queryChain({ _id: 'c1', title: 'React', status: 'published' }),
    );
    vi.mocked(Section.find as never).mockReturnValue(queryChain([{ _id: 's1', title: 'Intro' }]));
    vi.mocked(Lecture.find as never).mockReturnValue(queryChain([quizLecture()]));
    vi.mocked(Enrollment.findOne as never).mockReturnValue(queryChain({ _id: 'e1' }));

    const result = await service.getCourseWithCurriculum('c1', 'u1');

    const lecture = result.curriculum[0].lectures[0];
    expect(lecture.videoUrl).toBeDefined();
    expect(lecture.quiz.questions[0].question).toBe('Q1');
    expect(lecture.quiz.questions[0]).not.toHaveProperty('correctAnswer');
    expect(result.isEnrolled).toBe(true);
  });

  it('hides unpublished courses from anonymous viewers', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(
      queryChain({ _id: 'c1', title: 'Draft', status: 'draft' }),
    );
    await expect(service.getCourseWithCurriculum('c1')).rejects.toThrow('Course not found');
  });
});
