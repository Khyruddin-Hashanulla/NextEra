import mongoose from 'mongoose';
import { StudentService } from '../services/student.service';

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

jest.mock('../models/user.model', () => ({
  User: { findById: jest.fn() },
}));
jest.mock('../models/enrollment.model', () => ({
  Enrollment: { find: jest.fn(), findOne: jest.fn() },
}));
jest.mock('../models/lecture.model', () => ({
  Lecture: { findById: jest.fn(), find: jest.fn(), countDocuments: jest.fn() },
}));
jest.mock('../models/assignmentSubmission.model', () => ({
  AssignmentSubmission: {
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
  },
}));
jest.mock('../models/notification.model', () => ({
  Notification: { create: jest.fn() },
}));

import { User } from '../models/user.model';
import { Enrollment } from '../models/enrollment.model';
import { Lecture } from '../models/lecture.model';
import { AssignmentSubmission } from '../models/assignmentSubmission.model';

const COURSE_ID = '6a6c5515bf5829ee772c2ce1';
const LECTURE_ID = '6a6c5515bf5829ee772c2ce2';
const USER_ID = '6a6c5515bf5829ee772c2ce3';

let service: StudentService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new StudentService();
  mockSave.mockImplementation(function (this: any) {
    return Promise.resolve(this);
  });
});

function mockActiveUser() {
  return { _id: USER_ID, name: 'Student One', email: 's@example.com', isActive: true };
}

function mockAssignmentLecture(overrides: Record<string, unknown> = {}) {
  return {
    _id: LECTURE_ID,
    title: 'Week 1 Assignment',
    type: 'assignment',
    course: COURSE_ID,
    assignment: { totalMarks: 100, dueDate: null, allowLateSubmission: false },
    ...overrides,
  };
}

describe('StudentService.submitAssignment', () => {
  it('creates an on-time submission', async () => {
    (User.findById as jest.Mock).mockReturnValue(chainable(mockActiveUser()));
    (Enrollment.findOne as jest.Mock).mockResolvedValue({ _id: 'enr-1' });
    (Lecture.findById as jest.Mock).mockResolvedValue(mockAssignmentLecture());
    const created = { _id: 'sub-1', user: USER_ID, status: 'submitted', submissionVersion: 1 };
    (AssignmentSubmission.create as jest.Mock).mockResolvedValue(created);
    (AssignmentSubmission.findOne as jest.Mock).mockResolvedValue(null);

    const result = await service.submitAssignment(USER_ID, COURSE_ID, LECTURE_ID, 'My answer', [
      { url: 'https://cdn/x.pdf', publicId: 'x', name: 'x.pdf' },
    ]);

    expect(result.status).toBe('submitted');
    expect(result.submissionVersion).toBe(1);
    expect(AssignmentSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: USER_ID,
        course: COURSE_ID,
        lecture: LECTURE_ID,
        status: 'submitted',
        lateSubmission: false,
        penaltyPercent: 0,
      })
    );
  });

  it('marks an early-bird submission after due date with allowLateSubmission as late_submission with penalty', async () => {
    const dueDate = new Date(Date.now() - 3 * 60 * 60 * 1000);
    (User.findById as jest.Mock).mockReturnValue(chainable(mockActiveUser()));
    (Enrollment.findOne as jest.Mock).mockResolvedValue({ _id: 'enr-1' });
    (Lecture.findById as jest.Mock).mockResolvedValue(
      mockAssignmentLecture({
        assignment: { totalMarks: 100, dueDate: dueDate.toISOString(), allowLateSubmission: true },
      })
    );
    const created = { _id: 'sub-2', user: USER_ID, status: 'late_submission', penaltyPercent: 3, penaltyApplied: true };
    (AssignmentSubmission.create as jest.Mock).mockResolvedValue(created);
    (AssignmentSubmission.findOne as jest.Mock).mockResolvedValue(null);

    const result = await service.submitAssignment(USER_ID, COURSE_ID, LECTURE_ID);

    expect(result.status).toBe('late_submission');
    expect(result.penaltyPercent).toBe(3);
    expect(result.penaltyApplied).toBe(true);
    expect(AssignmentSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'late_submission',
        lateSubmission: true,
        penaltyPercent: 3,
        penaltyApplied: true,
      })
    );
  });

  it('rejects submission after deadline when late submission is disallowed', async () => {
    const dueDate = new Date(Date.now() - 60 * 1000);
    (User.findById as jest.Mock).mockReturnValue(chainable(mockActiveUser()));
    (Enrollment.findOne as jest.Mock).mockResolvedValue({ _id: 'enr-1' });
    (Lecture.findById as jest.Mock).mockResolvedValue(
      mockAssignmentLecture({
        assignment: { totalMarks: 100, dueDate: dueDate.toISOString(), allowLateSubmission: false },
      })
    );
    (AssignmentSubmission.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.submitAssignment(USER_ID, COURSE_ID, LECTURE_ID)).rejects.toThrow('deadline');
  });

  it('rejects a second submission when not returned for resubmission', async () => {
    (User.findById as jest.Mock).mockReturnValue(chainable(mockActiveUser()));
    (Enrollment.findOne as jest.Mock).mockResolvedValue({ _id: 'enr-1' });
    (Lecture.findById as jest.Mock).mockResolvedValue(mockAssignmentLecture());
    (AssignmentSubmission.findOne as jest.Mock).mockResolvedValue({ _id: 'sub-1', status: 'graded' });

    await expect(service.submitAssignment(USER_ID, COURSE_ID, LECTURE_ID)).rejects.toThrow('already submitted');
  });

  it('allows resubmission only when status is returned_for_resubmission and resets grade fields', async () => {
    (User.findById as jest.Mock).mockReturnValue(chainable(mockActiveUser()));
    (Enrollment.findOne as jest.Mock).mockResolvedValue({ _id: 'enr-1' });
    (Lecture.findById as jest.Mock).mockResolvedValue(mockAssignmentLecture());
    const existing = {
      _id: 'sub-1',
      user: USER_ID,
      status: 'returned_for_resubmission',
      content: 'old',
      files: [],
      submissionVersion: 1,
      grade: 40,
      maxMarks: 100,
      percentage: 40,
      passFail: 'fail',
      letterGrade: 'C',
      feedback: 'fix it',
      gradedAt: new Date(),
      gradedBy: new mongoose.Types.ObjectId(),
      publishedAt: new Date(),
      publishedBy: new mongoose.Types.ObjectId(),
      rubric: [{ criteria: 'c', maxPoints: 10, obtainedPoints: 4 }],
      save: mockSave,
    };
    (AssignmentSubmission.findOne as jest.Mock).mockResolvedValue(existing);

    const result = await service.submitAssignment(USER_ID, COURSE_ID, LECTURE_ID, 'new answer');

    expect(result.status).toBe('submitted');
    expect(result.submissionVersion).toBe(2);
    expect(result.resubmittedAt).toBeDefined();
    expect(result.grade).toBeUndefined();
    expect(result.feedback).toBeUndefined();
    expect(result.rubric).toEqual([]);
    expect(existing.save).toHaveBeenCalled();
  });

  it('blocks blocked users', async () => {
    (User.findById as jest.Mock).mockReturnValue(chainable({ ...mockActiveUser(), isActive: false }));

    await expect(service.submitAssignment(USER_ID, COURSE_ID, LECTURE_ID)).rejects.toThrow('blocked');
  });

  it('blocks non-enrolled students', async () => {
    (User.findById as jest.Mock).mockReturnValue(chainable(mockActiveUser()));
    (Enrollment.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.submitAssignment(USER_ID, COURSE_ID, LECTURE_ID)).rejects.toThrow('not enrolled');
  });
});

describe('StudentService.getAssignmentsOverview', () => {
  it('derives overdue and assigned statuses for unsubmitted assignments', async () => {
    (Enrollment.find as jest.Mock).mockReturnValue(chainable([{ course: COURSE_ID }]));
    const pastDue = new Date(Date.now() - 86400000);
    const futureDue = new Date(Date.now() + 86400000);
    const lectures = [
      {
        _id: LECTURE_ID,
        title: 'Past',
        course: { _id: COURSE_ID, title: 'C1' },
        assignment: { totalMarks: 100, dueDate: pastDue.toISOString() },
      },
      {
        _id: '6a6c5515bf5829ee772c2ce4',
        title: 'Future',
        course: { _id: COURSE_ID, title: 'C1' },
        assignment: { totalMarks: 100, dueDate: futureDue.toISOString() },
      },
    ];
    (Lecture.find as jest.Mock).mockReturnValue(chainable(lectures));
    (AssignmentSubmission.find as jest.Mock).mockReturnValue(chainable([]));

    const overview = await service.getAssignmentsOverview(USER_ID, 1, 20);

    expect(overview.assignments[0].status).toBe('overdue');
    expect(overview.assignments[1].status).toBe('assigned');
  });

  it('filters by the computed "overdue" status', async () => {
    (Enrollment.find as jest.Mock).mockReturnValue(chainable([{ course: COURSE_ID }]));
    const pastDue = new Date(Date.now() - 86400000);
    const futureDue = new Date(Date.now() + 86400000);
    const lectures = [
      {
        _id: LECTURE_ID,
        title: 'Past',
        course: { _id: COURSE_ID, title: 'C1' },
        assignment: { totalMarks: 100, dueDate: pastDue.toISOString() },
      },
      {
        _id: '6a6c5515bf5829ee772c2ce4',
        title: 'Future',
        course: { _id: COURSE_ID, title: 'C1' },
        assignment: { totalMarks: 100, dueDate: futureDue.toISOString() },
      },
    ];
    (Lecture.find as jest.Mock).mockReturnValue(chainable(lectures));
    (AssignmentSubmission.find as jest.Mock).mockReturnValue(chainable([]));

    const overview = await service.getAssignmentsOverview(USER_ID, 1, 20, undefined, 'overdue');

    expect(overview.assignments).toHaveLength(1);
    expect(overview.assignments[0].title).toBe('Past');
    expect(overview.pagination.total).toBe(1);
  });

  it('filters by the computed "assigned" status', async () => {
    (Enrollment.find as jest.Mock).mockReturnValue(chainable([{ course: COURSE_ID }]));
    const pastDue = new Date(Date.now() - 86400000);
    const futureDue = new Date(Date.now() + 86400000);
    const lectures = [
      {
        _id: LECTURE_ID,
        title: 'Past',
        course: { _id: COURSE_ID, title: 'C1' },
        assignment: { totalMarks: 100, dueDate: pastDue.toISOString() },
      },
      {
        _id: '6a6c5515bf5829ee772c2ce4',
        title: 'Future',
        course: { _id: COURSE_ID, title: 'C1' },
        assignment: { totalMarks: 100, dueDate: futureDue.toISOString() },
      },
    ];
    (Lecture.find as jest.Mock).mockReturnValue(chainable(lectures));
    (AssignmentSubmission.find as jest.Mock).mockReturnValue(chainable([]));

    const overview = await service.getAssignmentsOverview(USER_ID, 1, 20, undefined, 'assigned');

    expect(overview.assignments).toHaveLength(1);
    expect(overview.assignments[0].title).toBe('Future');
    expect(overview.pagination.total).toBe(1);
  });

  it('filters by a stored submission status', async () => {
    (Enrollment.find as jest.Mock).mockReturnValue(chainable([{ course: COURSE_ID }]));
    const lectures = [
      {
        _id: LECTURE_ID,
        title: 'Graded',
        course: { _id: COURSE_ID, title: 'C1' },
        assignment: { totalMarks: 100, dueDate: null },
      },
      {
        _id: '6a6c5515bf5829ee772c2ce4',
        title: 'Pending',
        course: { _id: COURSE_ID, title: 'C1' },
        assignment: { totalMarks: 100, dueDate: null },
      },
    ];
    (Lecture.find as jest.Mock).mockReturnValue(chainable(lectures));
    (AssignmentSubmission.find as jest.Mock).mockReturnValue(
      chainable([{ _id: '5f9c7f9c7f9c7f9c7f9c7f9c', lecture: LECTURE_ID, status: 'graded' }])
    );

    const overview = await service.getAssignmentsOverview(USER_ID, 1, 20, undefined, 'graded');

    expect(overview.assignments).toHaveLength(1);
    expect(overview.assignments[0].title).toBe('Graded');
    expect(overview.assignments[0].status).toBe('graded');
  });
});
