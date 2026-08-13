import mongoose from 'mongoose';
import { AssignmentService } from '../services/assignment.service';

const mockSave = jest.fn();

function chainable(result: unknown) {
  const chain: any = {
    lean: jest.fn().mockResolvedValue(result),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };
  return chain;
}

function mockSubmission(overrides: Record<string, unknown> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    user: new mongoose.Types.ObjectId(),
    course: new mongoose.Types.ObjectId(),
    lecture: new mongoose.Types.ObjectId(),
    status: 'submitted',
    content: 'My answer',
    files: [],
    grade: undefined,
    maxMarks: undefined,
    percentage: undefined,
    passFail: undefined,
    letterGrade: undefined,
    feedback: undefined,
    privateNotes: undefined,
    gradedBy: undefined,
    gradedAt: undefined,
    publishedAt: undefined,
    publishedBy: undefined,
    rubric: [],
    gradingHistory: [],
    save: mockSave,
    ...overrides,
  };
}

function mockLecture(value: unknown = assignmentLecture) {
  return chainable(value);
}

function mockCourse(value: unknown) {
  return chainable(value);
}

const INSTRUCTOR_ID = '6a6c5515bf5829ee772c2ce7';
const ADMIN_ID = '6a6c5515bf5829ee772c2ce8';

function mockOwnedCourse() {
  const course = {
    _id: assignmentLecture.course,
    instructor: INSTRUCTOR_ID,
    toString: () => assignmentLecture.course.toString(),
  };
  return chainable(course);
}

jest.mock('../models/assignmentSubmission.model', () => ({
  AssignmentSubmission: {
    findById: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
  },
}));
jest.mock('../models/lecture.model', () => ({
  Lecture: { findById: jest.fn(), find: jest.fn(), countDocuments: jest.fn() },
}));
jest.mock('../models/course.model', () => ({
  Course: { findById: jest.fn(), find: jest.fn() },
}));
jest.mock('../models/enrollment.model', () => ({
  Enrollment: { find: jest.fn(), findOne: jest.fn() },
}));
jest.mock('../models/user.model', () => ({
  User: { findById: jest.fn(), find: jest.fn() },
}));
jest.mock('../models/notification.model', () => ({
  Notification: { create: jest.fn() },
}));

import { AssignmentSubmission } from '../models/assignmentSubmission.model';
import { Lecture } from '../models/lecture.model';
import { Course } from '../models/course.model';
import { Notification } from '../models/notification.model';

const assignmentLecture = {
  _id: new mongoose.Types.ObjectId(),
  title: 'Week 1 Assignment',
  type: 'assignment',
  course: new mongoose.Types.ObjectId(),
  assignment: { totalMarks: 100, passingMarks: 60 },
};

let service: AssignmentService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new AssignmentService();
  mockSave.mockImplementation(function (this: any) {
    return Promise.resolve(this);
  });
});

describe('AssignmentService.gradeSubmission', () => {
  it('grades and publishes a submission', async () => {
    const submission = mockSubmission();
    (AssignmentSubmission.findById as jest.Mock).mockResolvedValue(submission);
    (Lecture.findById as jest.Mock).mockReturnValue(mockLecture(assignmentLecture));
    (Course.findById as jest.Mock).mockReturnValue(mockOwnedCourse());
    (Notification.create as jest.Mock).mockResolvedValue({});

    const result = await service.gradeSubmission(INSTRUCTOR_ID, submission._id.toString(), {
      grade: 85,
      publish: true,
    });

    expect(result.status).toBe('graded');
    expect(result.percentage).toBe(85);
    expect(result.passFail).toBe('pass');
    expect(result.letterGrade).toBe('A');
    expect(result.publishedAt).toBeDefined();
    expect(result.gradingHistory).toHaveLength(1);
    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Assignment Graded', type: 'assignment' })
    );
  });

  it('keeps draft under_review when publish is false', async () => {
    const submission = mockSubmission();
    (AssignmentSubmission.findById as jest.Mock).mockResolvedValue(submission);
    (Lecture.findById as jest.Mock).mockReturnValue(mockLecture(assignmentLecture));
    (Course.findById as jest.Mock).mockReturnValue(mockOwnedCourse());

    const result = await service.gradeSubmission(INSTRUCTOR_ID, submission._id.toString(), {
      grade: 70,
    });

    expect(result.status).toBe('under_review');
    expect(result.publishedAt).toBeUndefined();
    expect(result.gradingHistory).toHaveLength(0);
    expect(Notification.create).not.toHaveBeenCalled();
  });

  it('appends history and notifies with Grade Updated when re-grading published submission', async () => {
    const submission = mockSubmission({ status: 'graded', publishedAt: new Date(), gradingHistory: [{ grade: 50 }] });
    (AssignmentSubmission.findById as jest.Mock).mockResolvedValue(submission);
    (Lecture.findById as jest.Mock).mockReturnValue(mockLecture(assignmentLecture));
    (Course.findById as jest.Mock).mockReturnValue(mockOwnedCourse());

    await service.gradeSubmission(INSTRUCTOR_ID, submission._id.toString(), {
      grade: 90,
      publish: true,
    });

    expect(submission.gradingHistory).toHaveLength(2);
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Grade Updated' }));
  });

  it('throws when grade exceeds max marks', async () => {
    const submission = mockSubmission();
    (AssignmentSubmission.findById as jest.Mock).mockResolvedValue(submission);
    (Lecture.findById as jest.Mock).mockReturnValue(mockLecture(assignmentLecture));
    (Course.findById as jest.Mock).mockReturnValue(mockOwnedCourse());

    await expect(service.gradeSubmission(INSTRUCTOR_ID, submission._id.toString(), { grade: 101 })).rejects.toThrow(
      'exceed'
    );
  });

  it('throws not found when submission is missing', async () => {
    (AssignmentSubmission.findById as jest.Mock).mockResolvedValue(null);
    await expect(service.gradeSubmission(INSTRUCTOR_ID, 'missing-id', { grade: 10 })).rejects.toThrow(
      'Submission not found'
    );
  });

  it('throws forbidden when instructor does not own the course', async () => {
    const submission = mockSubmission();
    (AssignmentSubmission.findById as jest.Mock).mockResolvedValue(submission);
    (Lecture.findById as jest.Mock).mockReturnValue(mockLecture(assignmentLecture));
    (Course.findById as jest.Mock).mockReturnValue(
      mockCourse({ _id: assignmentLecture.course, instructor: 'other-instructor' })
    );

    await expect(service.gradeSubmission(INSTRUCTOR_ID, submission._id.toString(), { grade: 10 })).rejects.toThrow(
      'access'
    );
  });
});

describe('AssignmentService.returnForResubmission', () => {
  it('sets returned_for_resubmission status and notifies', async () => {
    const submission = mockSubmission();
    (AssignmentSubmission.findById as jest.Mock).mockResolvedValue(submission);
    (Course.findById as jest.Mock).mockReturnValue(mockOwnedCourse());
    (Lecture.findById as jest.Mock).mockReturnValue(mockLecture(assignmentLecture));

    const result = await service.returnForResubmission(INSTRUCTOR_ID, submission._id.toString(), {
      feedback: 'Please improve',
      resubmissionDeadline: '2026-08-15',
    });

    expect(result.status).toBe('returned_for_resubmission');
    expect(result.feedback).toBe('Please improve');
    expect(result.resubmissionDeadline).toEqual(new Date('2026-08-15'));
    expect(result.gradingHistory).toHaveLength(1);
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Assignment Returned' }));
  });
});

describe('AssignmentService.updateSubmissionStatus', () => {
  it('moves a submission to under_review', async () => {
    const submission = mockSubmission();
    (AssignmentSubmission.findById as jest.Mock).mockResolvedValue(submission);
    (Course.findById as jest.Mock).mockReturnValue(mockOwnedCourse());
    (Lecture.findById as jest.Mock).mockReturnValue(mockLecture(assignmentLecture));

    const result = await service.updateSubmissionStatus(INSTRUCTOR_ID, submission._id.toString(), {
      status: 'under_review',
    });

    expect(result.status).toBe('under_review');
    expect(result.reviewedAt).toBeDefined();
  });

  it('rejects an unsupported status change', async () => {
    const submission = mockSubmission();
    (AssignmentSubmission.findById as jest.Mock).mockResolvedValue(submission);
    (Course.findById as jest.Mock).mockReturnValue(mockOwnedCourse());
    (Lecture.findById as jest.Mock).mockReturnValue(mockLecture(assignmentLecture));

    await expect(
      service.updateSubmissionStatus(INSTRUCTOR_ID, submission._id.toString(), { status: 'graded' })
    ).rejects.toThrow('Cannot set status');
  });

  it('notifies the student when rejected', async () => {
    const submission = mockSubmission();
    (AssignmentSubmission.findById as jest.Mock).mockResolvedValue(submission);
    (Course.findById as jest.Mock).mockReturnValue(mockOwnedCourse());
    (Lecture.findById as jest.Mock).mockReturnValue(mockLecture(assignmentLecture));

    await service.updateSubmissionStatus(INSTRUCTOR_ID, submission._id.toString(), { status: 'rejected' });

    expect(submission.status).toBe('rejected');
    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Assignment Rejected' }));
  });
});

describe('AssignmentService.overrideGrade', () => {
  it('forces graded status and records history even when previously ungraded', async () => {
    const submission = mockSubmission({ status: 'under_review' });
    (AssignmentSubmission.findById as jest.Mock).mockResolvedValue(submission);
    (Lecture.findById as jest.Mock).mockReturnValue(mockLecture(assignmentLecture));

    const result = await service.overrideGrade(ADMIN_ID, submission._id.toString(), { grade: 95 });

    expect(result.status).toBe('graded');
    expect(result.publishedBy?.toString()).toBe(ADMIN_ID);
    expect(result.gradingHistory).toHaveLength(1);
    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Grade Updated (Admin Override)' })
    );
  });
});

describe('AssignmentService.getInstructorAssignmentStats', () => {
  it('returns empty stats when the instructor has no assignment lectures', async () => {
    (Course.find as jest.Mock).mockReturnValue(chainable([]));
    (Lecture.find as jest.Mock).mockReturnValue(chainable([]));

    const stats = await service.getInstructorAssignmentStats(INSTRUCTOR_ID);
    expect(stats).toEqual({
      totalLectures: 0,
      totalSubmissions: 0,
      pending: 0,
      graded: 0,
      returned: 0,
      rejected: 0,
      underReview: 0,
    });
  });

  it('groups submissions by status', async () => {
    (Course.find as jest.Mock).mockReturnValue(chainable([{ _id: new mongoose.Types.ObjectId() }]));
    (Lecture.find as jest.Mock).mockReturnValue(chainable([{ _id: new mongoose.Types.ObjectId() }]));
    (AssignmentSubmission.aggregate as jest.Mock).mockResolvedValue([
      { _id: 'submitted', count: 3 },
      { _id: 'late_submission', count: 1 },
      { _id: 'graded', count: 5 },
    ]);

    const stats = await service.getInstructorAssignmentStats(INSTRUCTOR_ID);
    expect(stats).toEqual({
      totalLectures: 1,
      totalSubmissions: 9,
      pending: 4,
      graded: 5,
      returned: 0,
      rejected: 0,
      underReview: 0,
    });
  });
});

describe('AssignmentService.getLectureSubmissions', () => {
  it('throws for non-assignment lectures', async () => {
    (Lecture.findById as jest.Mock).mockReturnValue(mockLecture({ _id: new mongoose.Types.ObjectId(), type: 'video' }));

    await expect(service.getLectureSubmissions(INSTRUCTOR_ID, 'lecture-1', { page: 1, limit: 10 })).rejects.toThrow(
      'not an assignment'
    );
  });
});

describe('AssignmentService.getSubmissionAnalytics', () => {
  it('computes pass rate from graded submissions', async () => {
    (AssignmentSubmission.aggregate as jest.Mock)
      .mockResolvedValueOnce([{ _id: 'graded', count: 10 }])
      .mockResolvedValueOnce([{ avgGrade: 72.5, avgPercentage: 72.5, passCount: 8, failCount: 2 }]);
    (AssignmentSubmission.countDocuments as jest.Mock).mockResolvedValue(10);

    const analytics = await service.getSubmissionAnalytics({});

    expect(analytics.byStatus.graded).toBe(10);
    expect(analytics.gradingStats.passRate).toBe(80);
    expect(analytics.gradingStats.averagePercentage).toBe(72.5);
  });
});
