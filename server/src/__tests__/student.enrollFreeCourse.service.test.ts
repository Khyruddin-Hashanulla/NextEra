import mongoose from 'mongoose';
import { studentService } from '../services/student.service';
import { Course } from '../models/course.model';
import { Enrollment } from '../models/enrollment.model';
import { ApiError } from '../utils/ApiError';

jest.mock('../utils/transaction', () => ({
  withTransaction: (fn: any) => fn({ __fakeSession: true }),
}));

jest.mock('../models/course.model', () => ({
  Course: { findById: jest.fn(), findByIdAndUpdate: jest.fn() },
}));
jest.mock('../models/enrollment.model', () => ({
  Enrollment: { findOne: jest.fn(), create: jest.fn() },
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

const mockedCourseFindById = Course.findById as jest.Mock;
const mockedCourseFindByIdAndUpdate = Course.findByIdAndUpdate as jest.Mock;
const mockedEnrollmentFindOne = Enrollment.findOne as jest.Mock;
const mockedEnrollmentCreate = Enrollment.create as jest.Mock;

const userId = new mongoose.Types.ObjectId().toString();
const courseId = new mongoose.Types.ObjectId().toString();
const enrollmentId = new mongoose.Types.ObjectId();

function courseDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(courseId),
    title: 'Free Course',
    price: 0,
    courseType: 'free',
    status: 'published',
    isApproved: true,
    ...overrides,
  };
}

describe('StudentService.enrollFreeCourse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCourseFindByIdAndUpdate.mockResolvedValue({});
  });

  it('throws not-found when the course does not exist', async () => {
    mockedCourseFindById.mockResolvedValue(null);
    await expect(studentService.enrollFreeCourse(userId, courseId)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects unpublished or unapproved courses', async () => {
    mockedCourseFindById.mockResolvedValue(courseDoc({ status: 'draft' }));
    await expect(studentService.enrollFreeCourse(userId, courseId)).rejects.toMatchObject({ statusCode: 400 });
    mockedCourseFindById.mockResolvedValue(courseDoc({ isApproved: false }));
    await expect(studentService.enrollFreeCourse(userId, courseId)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects paid courses, sending them through the payment flow instead', async () => {
    mockedCourseFindById.mockResolvedValue(courseDoc({ price: 1999, courseType: 'paid' }));
    await expect(studentService.enrollFreeCourse(userId, courseId)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('is idempotent and returns the existing enrollment without creating a duplicate', async () => {
    const existing = { _id: enrollmentId, user: userId, course: courseId };
    mockedCourseFindById.mockResolvedValue(courseDoc());
    mockedEnrollmentFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(existing) });

    const result = await studentService.enrollFreeCourse(userId, courseId);

    expect(result.alreadyEnrolled).toBe(true);
    expect(result.enrollment._id).toEqual(enrollmentId);
    expect(mockedEnrollmentCreate).not.toHaveBeenCalled();
    expect(mockedEnrollmentFindOne).toHaveBeenCalledWith({ user: userId, course: courseId });
  });

  it('creates an enrollment and bumps totalEnrollments for a free course', async () => {
    const created = [{ _id: enrollmentId, user: userId, course: courseId }];
    const instructorId = new mongoose.Types.ObjectId();
    const query: any = {
      lean: jest.fn(() => Promise.resolve({ instructor: instructorId })),
      then: (resolve: any) => resolve(courseDoc()),
    };
    query.select = jest.fn(() => query);
    mockedCourseFindById.mockImplementation(() => query);
    mockedEnrollmentFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockedEnrollmentCreate.mockResolvedValue(created);

    const result = await studentService.enrollFreeCourse(userId, courseId);

    expect(result.alreadyEnrolled).toBe(false);
    expect(result.enrollment._id).toEqual(enrollmentId);
    expect(mockedEnrollmentCreate).toHaveBeenCalledWith(
      [{ user: userId, course: courseId }],
      { session: { __fakeSession: true } },
    );
    expect(mockedCourseFindByIdAndUpdate).toHaveBeenCalledWith(
      courseId,
      { $inc: { totalEnrollments: 1 } },
      { session: { __fakeSession: true } },
    );
  });

  it('does not create an enrollment when the payment guard is hit (ApiError, not a crash)', async () => {
    mockedCourseFindById.mockResolvedValue(courseDoc({ price: 500, courseType: 'paid' }));
    const error = await studentService.enrollFreeCourse(userId, courseId).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(mockedEnrollmentCreate).not.toHaveBeenCalled();
  });

  it('handles the E11000 duplicate-key race by returning the winning enrollment (idempotent, no 500)', async () => {
    const winner = { _id: enrollmentId, user: userId, course: courseId };
    const instructorId = new mongoose.Types.ObjectId();
    const query: any = {
      lean: jest.fn(() => Promise.resolve({ instructor: instructorId })),
      then: (resolve: any) => resolve(courseDoc()),
    };
    query.select = jest.fn(() => query);
    mockedCourseFindById.mockImplementation(() => query);
    mockedEnrollmentFindOne
      .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) }) // first findOne: nothing yet
      .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(winner) }); // recovery re-query after index conflict

    const duplicateError = new Error('E11000 duplicate key error');
    (duplicateError as any).code = 11000;
    mockedEnrollmentCreate.mockRejectedValue(duplicateError);

    const result = await studentService.enrollFreeCourse(userId, courseId);

    expect(result.alreadyEnrolled).toBe(true);
    expect(result.enrollment._id).toEqual(enrollmentId);
    expect(mockedEnrollmentCreate).toHaveBeenCalledTimes(1);
  });
});
