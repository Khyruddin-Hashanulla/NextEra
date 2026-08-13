import mongoose from 'mongoose';
import { AssignmentService } from '../services/assignment.service';
import { Course } from '../models/course.model';
import { Lecture } from '../models/lecture.model';
import { AssignmentSubmission } from '../models/assignmentSubmission.model';

jest.mock('../models/course.model', () => ({
  Course: { find: jest.fn(), findById: jest.fn() },
}));
jest.mock('../models/lecture.model', () => ({
  Lecture: { aggregate: jest.fn(), find: jest.fn(), findById: jest.fn(), countDocuments: jest.fn() },
}));
jest.mock('../models/assignmentSubmission.model', () => ({
  AssignmentSubmission: { aggregate: jest.fn(), find: jest.fn(), findOne: jest.fn() },
}));

const mockedCourseFind = Course.find as jest.Mock;
const mockedLectureAggregate = Lecture.aggregate as jest.Mock;
const mockedSubmissionAggregate = AssignmentSubmission.aggregate as jest.Mock;

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

const INSTRUCTOR_ID = '6a6c5515bf5829ee772c2ce7';

describe('AssignmentService.getInstructorAssignments', () => {
  let service: AssignmentService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AssignmentService();
  });

  it('combines lecture listing and pagination count into one $facet aggregation', async () => {
    const courseId = new mongoose.Types.ObjectId();
    const lectureId = new mongoose.Types.ObjectId();
    mockedCourseFind.mockReturnValue(chainable([{ _id: courseId }]));
    mockedLectureAggregate.mockResolvedValue([
      {
        items: [
          {
            _id: lectureId,
            title: 'Assignment 1',
            type: 'assignment',
            course: { _id: courseId, title: 'Course A' },
            assignment: { totalMarks: 100, dueDate: null },
          },
        ],
        total: [{ count: 1 }],
      },
    ]);
    mockedSubmissionAggregate.mockResolvedValue([{ _id: lectureId, count: 4 }]);

    const result = await service.getInstructorAssignments(INSTRUCTOR_ID, { page: 1, limit: 10 });

    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0].title).toBe('Assignment 1');
    expect(result.assignments[0].course.title).toBe('Course A');
    expect(result.assignments[0].submissionCount).toBe(4);
    expect(result.pagination).toEqual({ page: 1, limit: 10, total: 1, pages: 1 });

    expect(mockedLectureAggregate).toHaveBeenCalledTimes(1);
    const pipeline = mockedLectureAggregate.mock.calls[0][0];
    expect(pipeline[1].$facet).toHaveProperty('items');
    expect(pipeline[1].$facet).toHaveProperty('total');
  });

  it('returns empty list when the instructor has no assignment lectures', async () => {
    mockedCourseFind.mockReturnValue(chainable([{ _id: new mongoose.Types.ObjectId() }]));
    mockedLectureAggregate.mockResolvedValue([{ items: [], total: [] }]);

    const result = await service.getInstructorAssignments(INSTRUCTOR_ID, { page: 1, limit: 10 });

    expect(result.assignments).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(mockedSubmissionAggregate).not.toHaveBeenCalled();
  });

  it('coerces string page/limit query params into numeric $skip/$limit stages', async () => {
    const courseId = new mongoose.Types.ObjectId();
    mockedCourseFind.mockReturnValue(chainable([{ _id: courseId }]));
    mockedLectureAggregate.mockResolvedValue([{ items: [], total: [{ count: 0 }] }]);

    await service.getInstructorAssignments(INSTRUCTOR_ID, { page: '2', limit: '5' } as any);

    const pipeline = mockedLectureAggregate.mock.calls[0][0];
    const items = pipeline[1].$facet.items;
    const skipStage = items.find((s: any) => typeof s.$skip !== 'undefined');
    const limitStage = items.find((s: any) => typeof s.$limit !== 'undefined');
    expect(skipStage.$skip).toBe(5);
    expect(limitStage.$limit).toBe(5);
  });
});
