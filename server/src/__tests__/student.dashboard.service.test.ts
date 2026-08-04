import mongoose from 'mongoose';
import { studentService } from '../services/student.service';
import { cacheService } from '../cache/cache.service';
import { cacheKeys } from '../cache/cacheKeys';
import { Enrollment } from '../models/enrollment.model';
import { Certificate } from '../models/certificate.model';

jest.mock('../models/enrollment.model', () => ({
  Enrollment: { aggregate: jest.fn(), find: jest.fn(), findOne: jest.fn() },
}));
jest.mock('../models/certificate.model', () => ({
  Certificate: { countDocuments: jest.fn(), find: jest.fn(), findOne: jest.fn() },
}));

const mockedEnrollmentAggregate = Enrollment.aggregate as jest.Mock;

const userId = new mongoose.Types.ObjectId();

function enrollmentDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    user: userId,
    course: {
      _id: new mongoose.Types.ObjectId(),
      title: 'Course A',
      thumbnail: { url: 'a.jpg', publicId: 'a' },
      price: 999,
      level: 'beginner',
      totalLectures: 10,
      totalDuration: 500,
    },
    enrolledAt: new Date(),
    completionPercentage: 40,
    isCompleted: false,
    ...overrides,
  };
}

describe('StudentService.getDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    void cacheService.del(cacheKeys.studentDashboard(userId.toString()));
  });

  it('loads enrollments with a $lookup aggregation and counts certificates in one round trip pair', async () => {
    mockedEnrollmentAggregate.mockResolvedValue([
      enrollmentDoc({ completionPercentage: 100, isCompleted: true }),
      enrollmentDoc({ completionPercentage: 40, isCompleted: false }),
      enrollmentDoc({ completionPercentage: 0, isCompleted: false }),
    ]);
    (Certificate.countDocuments as jest.Mock).mockResolvedValue(2);

    const result = await studentService.getDashboard(userId.toString());

    expect(result.totalCourses).toBe(3);
    expect(result.completedCourses).toBe(1);
    expect(result.inProgress).toBe(1);
    expect(result.certificates).toBe(2);
    expect(result.recentCourses).toHaveLength(3);
    expect(result.enrollments).toHaveLength(3);
    expect(result.enrollments[0].course.title).toBe('Course A');
    expect(result.enrollments[0].course).not.toHaveProperty('description');

    expect(mockedEnrollmentAggregate).toHaveBeenCalledTimes(1);
    expect(Certificate.countDocuments).toHaveBeenCalledTimes(1);

    const pipeline = mockedEnrollmentAggregate.mock.calls[0][0];
    expect(pipeline[0]).toEqual({ $match: { user: expect.any(mongoose.Types.ObjectId) } });
    const lookupStage = pipeline.find((s: any) => s.$lookup);
    expect(lookupStage.$lookup.from).toBe('courses');
    expect(lookupStage.$lookup.localField).toBe('course');
  });

  it('returns zeroed counts for a user with no enrollments', async () => {
    mockedEnrollmentAggregate.mockResolvedValue([]);
    (Certificate.countDocuments as jest.Mock).mockResolvedValue(0);

    const result = await studentService.getDashboard(userId.toString());

    expect(result.totalCourses).toBe(0);
    expect(result.completedCourses).toBe(0);
    expect(result.inProgress).toBe(0);
    expect(result.certificates).toBe(0);
    expect(result.recentCourses).toEqual([]);
    expect(result.enrollments).toEqual([]);
  });
});
