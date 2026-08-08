import { QuizService } from '../services/quiz.service';

function leanResult(result: unknown) {
  return { lean: jest.fn().mockResolvedValue(result) };
}

jest.mock('../models/lecture.model', () => ({
  Lecture: { findById: jest.fn() },
}));
jest.mock('../models/enrollment.model', () => ({
  Enrollment: { findOne: jest.fn() },
}));
jest.mock('../models/user.model', () => ({
  User: { findById: jest.fn() },
}));
jest.mock('../models/quizAttempt.model', () => ({
  QuizAttempt: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

import { Lecture } from '../models/lecture.model';
import { Enrollment } from '../models/enrollment.model';
import { User } from '../models/user.model';
import { QuizAttempt } from '../models/quizAttempt.model';

const COURSE_ID = '6a6c5515bf5829ee772c2ce1';
const LECTURE_ID = '6a6c5515bf5829ee772c2ce2';
const USER_ID = '6a6c5515bf5829ee772c2ce3';

const quizLecture = {
  _id: LECTURE_ID,
  title: 'React Basics Quiz',
  type: 'quiz',
  quiz: {
    timeLimit: 0,
    passingScore: 60,
    maxAttempts: 3,
    questions: [
      { questionId: 'q_0', question: 'What does JSX stand for?', options: ['JavaScript XML', 'Java Syntax'], correctAnswer: 'JavaScript XML', marks: 1, type: 'single' },
      { questionId: 'q_1', question: 'True or false: Hooks are functions.', options: ['True', 'False'], correctAnswer: 'True', marks: 1, type: 'boolean' },
    ],
  },
};

function leanSortable(result: unknown) {
  return { sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(result) }) };
}

let service: QuizService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new QuizService();

  (Lecture.findById as jest.Mock).mockReturnValue(leanResult(quizLecture));
  (Enrollment.findOne as jest.Mock).mockResolvedValue({ _id: 'enr1', user: USER_ID, course: COURSE_ID });
  (User.findById as jest.Mock).mockReturnValue(leanResult({ _id: USER_ID, isActive: true }));
  (QuizAttempt.find as jest.Mock).mockReturnValue(leanSortable([]));
});

describe('QuizService.startQuizEnhanced', () => {
  it('creates an attempt with all required schema fields populated', async () => {
    (QuizAttempt.create as jest.Mock).mockResolvedValue({ _id: 'attempt1' });

    await service.startQuizEnhanced({ userId: USER_ID, courseId: COURSE_ID, lectureId: LECTURE_ID });

    const created = (QuizAttempt.create as jest.Mock).mock.calls[0][0];
    expect(created.totalQuestions).toBe(2);
    expect(created.marksObtained).toBe(0);
    expect(created.passingPercentage).toBe(60);
    expect(created.passFail).toBe('fail');
    expect(created.percentage).toBe(0);
    expect(created.passed).toBe(false);
    expect(created.score).toBe(0);
    expect(created.startedAt).toEqual(expect.any(Date));
  });
});