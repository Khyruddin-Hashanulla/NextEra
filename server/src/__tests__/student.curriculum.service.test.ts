import mongoose from 'mongoose';
import { studentService } from '../services/student.service';
import { Course } from '../models/course.model';
import { Section } from '../models/section.model';
import { Lecture } from '../models/lecture.model';
import { Enrollment } from '../models/enrollment.model';

jest.mock('../models/course.model', () => ({
  Course: { findById: jest.fn() },
}));
jest.mock('../models/section.model', () => ({
  Section: { find: jest.fn() },
}));
jest.mock('../models/lecture.model', () => ({
  Lecture: { find: jest.fn() },
}));
jest.mock('../models/enrollment.model', () => ({
  Enrollment: { findOne: jest.fn() },
}));
jest.mock('../cache/cacheManager', () => ({
  cacheManager: {
    invalidateStudentCache: jest.fn().mockResolvedValue(undefined),
    invalidateStudentCourseList: jest.fn().mockResolvedValue(undefined),
    invalidateCourseCache: jest.fn().mockResolvedValue(undefined),
    invalidateAdminCache: jest.fn().mockResolvedValue(undefined),
    invalidateRevenueCache: jest.fn().mockResolvedValue(undefined),
    invalidateInstructorCache: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockCourseFindById = Course.findById as unknown as jest.Mock;
const mockSectionFind = Section.find as unknown as jest.Mock;
const mockLectureFind = Lecture.find as unknown as jest.Mock;
const mockEnrollmentFindOne = Enrollment.findOne as unknown as jest.Mock;

const courseId = new mongoose.Types.ObjectId().toString();
const s1 = new mongoose.Types.ObjectId().toString();
const s2 = new mongoose.Types.ObjectId().toString();

const sections = [
  { _id: s1, course: courseId, title: 'Section 1', order: 1 },
  { _id: s2, course: courseId, title: 'Section 2', order: 2 },
];

const lectures = [
  {
    _id: 'l1',
    section: s1,
    course: courseId,
    title: 'Intro',
    type: 'video',
    duration: 5,
    order: 1,
    isFree: true,
    videoSource: { source: 'youtube', videoId: 'x' },
    videoUrl: { url: 'x', publicId: '' },
  },
  {
    _id: 'l2',
    section: s1,
    course: courseId,
    title: 'Components',
    type: 'video',
    duration: 12,
    order: 2,
    isFree: false,
    videoSource: { source: 'youtube', videoId: 'y' },
    videoUrl: { url: 'y', publicId: '' },
  },
  {
    _id: 'l3',
    section: s2,
    course: courseId,
    title: 'Props',
    type: 'video',
    duration: 8,
    order: 1,
    isFree: false,
    videoSource: { source: 'youtube', videoId: 'z' },
    videoUrl: { url: 'z', publicId: '' },
  },
];

function mockCourseQuery(courseDoc: any) {
  const query: any = {};
  query.populate = jest.fn().mockReturnValue(query);
  query.select = jest.fn().mockReturnValue(query);
  query.lean = jest.fn().mockResolvedValue(courseDoc);
  return query;
}

describe('StudentService.getCourseWithCurriculum (curriculum visibility)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns EVERY lecture for a non-enrolled viewer, but exposes playback content only on free lectures', async () => {
    mockCourseFindById.mockReturnValue(mockCourseQuery({ _id: courseId, title: 'C', status: 'published' }));
    mockSectionFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(sections) }),
    });
    mockLectureFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(lectures) }),
    });
    mockEnrollmentFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const result = await studentService.getCourseWithCurriculum(courseId);

    expect(result.isEnrolled).toBe(false);
    // ALL sections present
    expect(result.curriculum).toHaveLength(2);
    // Section 1 holds 2 lectures, Section 2 holds 1 -> nothing is dropped
    expect(result.curriculum[0].lectures).toHaveLength(2);
    expect(result.curriculum[1].lectures).toHaveLength(1);

    const s1Lectures = result.curriculum[0].lectures;
    const intro = s1Lectures.find((l: any) => l._id === 'l1');
    const comp = s1Lectures.find((l: any) => l._id === 'l2');

    // free lecture keeps its playback content
    expect(intro.isFree).toBe(true);
    expect(intro.videoSource).toBeDefined();

    // locked lecture keeps metadata (title/order/type/duration) for the lock UI,
    // but NO playback content leaks to unauthenticated viewers
    expect(comp.isFree).toBe(false);
    expect(comp.title).toBe('Components');
    expect(comp.order).toBe(2);
    expect(comp.videoSource).toBeUndefined();
  });

  it('returns full lectures and answer-safe quiz data for an enrolled student', async () => {
    const enrolledLectures = [
      {
        _id: 'l2',
        section: s1,
        course: courseId,
        title: 'Components',
        type: 'video',
        duration: 12,
        order: 2,
        isFree: false,
        videoSource: { source: 'youtube', videoId: 'y' },
        quiz: { questions: [{ question: 'q', correctAnswer: 'A' }] },
      },
    ];
    mockCourseFindById.mockReturnValue(mockCourseQuery({ id: courseId, title: 'C', status: 'published' }));
    mockSectionFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([sections[0]]) }),
    });
    mockLectureFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(enrolledLectures) }),
    });
    mockEnrollmentFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'e1' }) });

    const result = await studentService.getCourseWithCurriculum(courseId, 'u1');

    expect(result.isEnrolled).toBe(true);
    const lecture = result.curriculum[0].lectures[0];
    expect(lecture.videoSource).toBeDefined();
    expect(lecture.quiz.questions[0].correctAnswer).toBeUndefined();
  });
});
