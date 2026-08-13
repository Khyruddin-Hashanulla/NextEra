import mongoose from 'mongoose';
import { instructorService, clearInstructorDashboardCache } from '../services/instructor.service';
import { cacheService } from '../cache/cache.service';
import { cacheKeys } from '../cache/cacheKeys';
import { Course } from '../models/course.model';
import { Enrollment } from '../models/enrollment.model';
import { Payment } from '../models/payment.model';
import { Review } from '../models/review.model';
import { User } from '../models/user.model';

jest.mock('../services/subscriptionPermission.service', () => ({
  subscriptionPermissionService: {
    requireAdvancedAnalyticsPermission: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../models/course.model', () => ({
  Course: { aggregate: jest.fn(), find: jest.fn() },
}));

jest.mock('../models/enrollment.model', () => ({
  Enrollment: { aggregate: jest.fn(), find: jest.fn(), countDocuments: jest.fn() },
}));

jest.mock('../models/user.model', () => ({
  User: { find: jest.fn() },
}));

jest.mock('../models/payment.model', () => ({
  Payment: { aggregate: jest.fn() },
}));

jest.mock('../models/review.model', () => ({
  Review: { aggregate: jest.fn() },
}));

const mockedCourseAggregate = Course.aggregate as jest.Mock;
const mockedCourseFind = Course.find as jest.Mock;
const mockedEnrollmentAggregate = Enrollment.aggregate as jest.Mock;
const mockedEnrollmentFind = (Enrollment as any).find as jest.Mock;
const mockedEnrollmentCount = (Enrollment as any).countDocuments as jest.Mock;
const mockedUserFind = (User as any).find as jest.Mock;
const mockedPaymentAggregate = Payment.aggregate as jest.Mock;
const mockedReviewAggregate = (Review as any).aggregate as jest.Mock;

function chainable(result: unknown) {
  const chain: any = {
    lean: jest.fn().mockResolvedValue(result),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };
  return chain;
}

const instructorId = new mongoose.Types.ObjectId();
const courseId1 = new mongoose.Types.ObjectId();
const courseId2 = new mongoose.Types.ObjectId();

function courseFacetResult() {
  return [
    {
      stats: [{ totalCourses: 2, publishedCourses: 1, totalDuration: 300 }],
      courseIds: [{ _id: courseId1 }, { _id: courseId2 }],
      recentCourses: [
        {
          _id: courseId1,
          title: 'Course A',
          status: 'published',
          totalEnrollments: 3,
          totalDuration: 120,
          createdAt: new Date('2026-08-01T10:00:00Z'),
        },
      ],
    },
  ];
}

describe('InstructorService.getDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearInstructorDashboardCache(instructorId.toString());
  });

  it('returns aggregated dashboard values from a single set of queries', async () => {
    mockedCourseAggregate.mockResolvedValue(courseFacetResult());
    mockedEnrollmentAggregate.mockResolvedValue([
      {
        _id: null,
        total: 5,
        students: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      },
    ]);
    mockedPaymentAggregate.mockResolvedValue([{ _id: null, total: 4200 }]);

    const result = await instructorService.getDashboard(instructorId.toString());

    expect(result).toEqual({
      totalCourses: 2,
      publishedCourses: 1,
      totalEnrollments: 5,
      totalStudents: 3,
      totalRevenue: 4200,
      totalDuration: 300,
      recentCourses: [expect.objectContaining({ _id: courseId1, title: 'Course A' })],
    });
    expect(mockedCourseAggregate).toHaveBeenCalledTimes(1);
    expect(mockedEnrollmentAggregate).toHaveBeenCalledTimes(1);
    expect(mockedPaymentAggregate).toHaveBeenCalledTimes(1);
  });

  it('fetches instructor courses exactly once via a single $facet aggregation', async () => {
    mockedCourseAggregate.mockResolvedValue(courseFacetResult());
    mockedEnrollmentAggregate.mockResolvedValue([{ _id: null, total: 0, students: [] }]);
    mockedPaymentAggregate.mockResolvedValue([]);

    await instructorService.getDashboard(instructorId.toString());

    const [pipeline] = mockedCourseAggregate.mock.calls[0];
    expect(pipeline[0]).toEqual({ $match: { instructor: expect.any(mongoose.Types.ObjectId) } });
    expect(pipeline[1].$facet).toHaveProperty('stats');
    expect(pipeline[1].$facet).toHaveProperty('courseIds');
    expect(pipeline[1].$facet.recentCourses).toEqual([{ $sort: { createdAt: -1 } }, { $limit: 5 }]);
  });

  it('combines enrollment count and distinct students in one aggregation scoped to course ids', async () => {
    mockedCourseAggregate.mockResolvedValue(courseFacetResult());
    mockedEnrollmentAggregate.mockResolvedValue([{ _id: null, total: 2, students: [new mongoose.Types.ObjectId()] }]);
    mockedPaymentAggregate.mockResolvedValue([]);

    await instructorService.getDashboard(instructorId.toString());

    const [enrollmentPipeline] = mockedEnrollmentAggregate.mock.calls[0];
    expect(enrollmentPipeline[0]).toEqual({ $match: { course: { $in: [courseId1, courseId2] } } });
    expect(enrollmentPipeline[1].$group).toEqual({
      _id: null,
      total: { $sum: 1 },
      students: { $addToSet: '$user' },
    });
  });

  it('aggregates revenue only from the instructor net share of successful payments', async () => {
    mockedCourseAggregate.mockResolvedValue(courseFacetResult());
    mockedEnrollmentAggregate.mockResolvedValue([{ _id: null, total: 0, students: [] }]);
    mockedPaymentAggregate.mockResolvedValue([{ _id: null, total: 999 }]);

    await instructorService.getDashboard(instructorId.toString());

    const [paymentPipeline] = mockedPaymentAggregate.mock.calls[0];
    expect(paymentPipeline[0]).toEqual({
      $match: { status: 'success', 'commissionSplits.instructor': instructorId },
    });
    expect(paymentPipeline[1]).toEqual({ $unwind: '$commissionSplits' });
    expect(paymentPipeline[2]).toEqual({
      $match: { 'commissionSplits.instructor': instructorId },
    });
    expect(paymentPipeline[3].$group).toEqual({
      _id: null,
      total: { $sum: '$commissionSplits.instructorShare' },
    });
  });

  it('returns zeroed stats when the instructor has no courses', async () => {
    mockedCourseAggregate.mockResolvedValue([{ stats: [], courseIds: [], recentCourses: [] }]);
    mockedEnrollmentAggregate.mockResolvedValue([]);
    mockedPaymentAggregate.mockResolvedValue([]);

    const result = await instructorService.getDashboard(instructorId.toString());

    expect(result).toEqual({
      totalCourses: 0,
      publishedCourses: 0,
      totalEnrollments: 0,
      totalStudents: 0,
      totalRevenue: 0,
      totalDuration: 0,
      recentCourses: [],
    });
  });

  it('serves subsequent calls from cache without re-querying', async () => {
    mockedCourseAggregate.mockResolvedValue(courseFacetResult());
    mockedEnrollmentAggregate.mockResolvedValue([{ _id: null, total: 2, students: [] }]);
    mockedPaymentAggregate.mockResolvedValue([{ _id: null, total: 100 }]);

    await instructorService.getDashboard(instructorId.toString());
    const second = await instructorService.getDashboard(instructorId.toString());

    expect(mockedCourseAggregate).toHaveBeenCalledTimes(1);
    expect(mockedEnrollmentAggregate).toHaveBeenCalledTimes(1);
    expect(mockedPaymentAggregate).toHaveBeenCalledTimes(1);
    expect(second.totalCourses).toBe(2);
  });

  it('re-queries after the dashboard cache is cleared', async () => {
    mockedCourseAggregate.mockResolvedValue(courseFacetResult());
    mockedEnrollmentAggregate.mockResolvedValue([{ _id: null, total: 2, students: [] }]);
    mockedPaymentAggregate.mockResolvedValue([{ _id: null, total: 100 }]);

    await instructorService.getDashboard(instructorId.toString());
    clearInstructorDashboardCache(instructorId.toString());
    await instructorService.getDashboard(instructorId.toString());

    expect(mockedCourseAggregate).toHaveBeenCalledTimes(2);
    expect(mockedEnrollmentAggregate).toHaveBeenCalledTimes(2);
    expect(mockedPaymentAggregate).toHaveBeenCalledTimes(2);
  });
});

describe('InstructorService.getRevenue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearInstructorDashboardCache(instructorId.toString());
    void cacheService.invalidatePattern(`instructor:revenue:${instructorId.toString()}:*`);
    void cacheService.del(cacheKeys.instructorAnalytics(instructorId.toString()));
  });

  it('merges daily and per-course revenue into a single $facet payment aggregation', async () => {
    mockedCourseFind.mockReturnValue(
      chainable([
        { _id: courseId1, title: 'Course A' },
        { _id: courseId2, title: 'Course B' },
      ])
    );
    mockedPaymentAggregate.mockResolvedValue([
      {
        daily: [
          { _id: '2026-08-01', amount: 100, count: 1 },
          { _id: '2026-08-02', amount: 200, count: 1 },
        ],
        perCourse: [
          { _id: courseId1, amount: 150, count: 2 },
          { _id: courseId2, amount: 150, count: 1 },
        ],
      },
    ]);

    const result = await instructorService.getRevenue(instructorId.toString());

    expect(result.total).toBe(300);
    expect(result.daily).toEqual([
      { _id: '2026-08-01', amount: 100, count: 1 },
      { _id: '2026-08-02', amount: 200, count: 1 },
    ]);
    expect(result.perCourse).toEqual([
      { _id: courseId1, courseTitle: 'Course A', amount: 150, enrollments: 2 },
      { _id: courseId2, courseTitle: 'Course B', amount: 150, enrollments: 1 },
    ]);
    expect(mockedCourseFind).toHaveBeenCalledTimes(1);
    expect(mockedPaymentAggregate).toHaveBeenCalledTimes(1);
    const pipeline = mockedPaymentAggregate.mock.calls[0][0];
    expect(pipeline[0].$facet).toHaveProperty('daily');
    expect(pipeline[0].$facet).toHaveProperty('perCourse');
  });

  it('applies date filters to both facet sub-pipelines', async () => {
    mockedCourseFind.mockReturnValue(chainable([{ _id: courseId1, title: 'Course A' }]));
    mockedPaymentAggregate.mockResolvedValue([{ daily: [], perCourse: [] }]);

    await instructorService.getRevenue(instructorId.toString(), '2026-08-01', '2026-08-31');

    const pipeline = mockedPaymentAggregate.mock.calls[0][0];
    const dailyMatch = pipeline[0].$facet.daily[0].$match;
    expect(dailyMatch.createdAt).toBeDefined();
    expect(dailyMatch.createdAt.$gte).toBeInstanceOf(Date);
    expect(dailyMatch.createdAt.$lte).toBeInstanceOf(Date);
    const perCourseMatch = pipeline[0].$facet.perCourse[0].$match;
    expect(perCourseMatch.createdAt).toBeDefined();
  });
});

describe('InstructorService.getAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    void cacheService.invalidatePattern(`instructor:revenue:${instructorId.toString()}:*`);
    void cacheService.del(cacheKeys.instructorAnalytics(instructorId.toString()));
    void cacheService.del(cacheKeys.instructorDashboard(instructorId.toString()));
  });

  it('combines enrollment trend and student growth in one facet and keeps revenue/top-courses queries', async () => {
    mockedCourseFind.mockReturnValueOnce(chainable([{ _id: courseId1 }, { _id: courseId2 }])).mockReturnValueOnce(
      chainable([
        {
          _id: courseId1,
          title: 'Course A',
          totalEnrollments: 3,
          averageRating: 4.5,
          price: 999,
          totalRevenue: 3000,
        },
      ])
    );
    mockedEnrollmentAggregate.mockResolvedValue([
      {
        stats: [
          {
            _id: null,
            total: 2,
            students: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
          },
        ],
        enrollmentTrend: [{ _id: '2026-08', count: 2 }],
        studentGrowth: [
          { _id: '2026-08', newStudents: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()] },
        ],
      },
    ]);
    mockedPaymentAggregate.mockResolvedValue([{ _id: '2026-08', amount: 100, count: 1 }]);
    mockedReviewAggregate.mockResolvedValue([{ _id: null, averageRating: 4.5 }]);

    const result = await instructorService.getAnalytics(instructorId.toString());

    expect(result.totalViews).toBe(3);
    expect(result.totalStudents).toBe(2);
    expect(result.totalEnrollments).toBe(2);
    expect(result.totalRevenue).toBe(100);
    expect(result.averageRating).toBe(4.5);
    expect(result.totalCourses).toBe(2);
    expect(result.enrollmentTrend).toEqual([{ _id: '2026-08', count: 2 }]);
    expect(result.revenueTrend).toEqual([{ _id: '2026-08', amount: 100, count: 1 }]);
    expect(result.studentGrowth).toEqual([{ month: '2026-08', newStudents: 2, totalStudents: 2 }]);
    expect(result.topPerformingCourses).toHaveLength(1);
    expect(result.topPerformingCourses[0]).toEqual({
      _id: courseId1,
      title: 'Course A',
      enrollments: 3,
      revenue: 0,
    });
    expect(mockedCourseFind).toHaveBeenCalledTimes(2);
    expect(mockedEnrollmentAggregate).toHaveBeenCalledTimes(1);
    expect(mockedPaymentAggregate).toHaveBeenCalledTimes(2);

    const pipeline = mockedEnrollmentAggregate.mock.calls[0][0];
    expect(pipeline[1].$facet).toHaveProperty('stats');
    expect(pipeline[1].$facet).toHaveProperty('enrollmentTrend');
    expect(pipeline[1].$facet).toHaveProperty('studentGrowth');
  });
});

describe('InstructorService.getStudents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function enrollmentQueryChain(result: unknown) {
    const chain: any = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(result),
    };
    return chain;
  }

  it('returns enrollments scoped to the instructor courses with the nested student contract', async () => {
    mockedCourseFind.mockReturnValue(chainable([{ _id: courseId1 }, { _id: courseId2 }]));
    const user = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Alice',
      email: 'alice@test.com',
      avatar: { url: 'a.jpg' },
    };
    const enrollment = {
      _id: new mongoose.Types.ObjectId(),
      user,
      course: { _id: courseId1, title: 'Course A' },
      enrolledAt: new Date('2026-08-01T10:00:00Z'),
      completionPercentage: 42,
      isCompleted: false,
    };
    mockedEnrollmentFind.mockReturnValue(enrollmentQueryChain([enrollment]));
    mockedEnrollmentCount.mockResolvedValue(1);

    const result = await instructorService.getStudents(instructorId.toString(), { page: 1, limit: 10 });

    expect(mockedCourseFind).toHaveBeenCalledTimes(1);
    const courseMatch = mockedCourseFind.mock.calls[0][0];
    expect(courseMatch).toEqual({ instructor: instructorId.toString() });
    const match = mockedEnrollmentFind.mock.calls[0][0];
    expect(match).toEqual({ course: { $in: [courseId1, courseId2] } });
    expect(result.students[0]).toEqual({
      _id: enrollment._id,
      user,
      course: { _id: courseId1, title: 'Course A' },
      enrolledAt: expect.any(Date),
      progress: 42,
      isCompleted: false,
    });
    expect(result.pagination).toEqual({ page: 1, limit: 10, total: 1, pages: 1 });
  });

  it('filters students by name/email search scoped to matching users', async () => {
    mockedCourseFind.mockReturnValue(chainable([{ _id: courseId1 }]));
    const userId = new mongoose.Types.ObjectId();
    mockedUserFind.mockReturnValue(chainable([{ _id: userId }]));
    mockedEnrollmentFind.mockReturnValue(enrollmentQueryChain([]));
    mockedEnrollmentCount.mockResolvedValue(0);

    const result = await instructorService.getStudents(instructorId.toString(), {
      page: 1,
      limit: 10,
      search: 'ali',
    });

    const match = mockedEnrollmentFind.mock.calls[0][0];
    expect(match).toEqual({ course: { $in: [courseId1] }, user: { $in: [userId] } });
    expect(result.students).toEqual([]);
  });

  it('paginates and computes total pages from the scoped count', async () => {
    mockedCourseFind.mockReturnValue(chainable([{ _id: courseId1 }]));
    const enrollmentChain = enrollmentQueryChain([]);
    mockedEnrollmentFind.mockReturnValue(enrollmentChain);
    mockedEnrollmentCount.mockResolvedValue(25);

    const result = await instructorService.getStudents(instructorId.toString(), { page: 3, limit: 10 });

    expect(mockedEnrollmentCount).toHaveBeenCalledWith({ course: { $in: [courseId1] } });
    expect(enrollmentChain.sort).toHaveBeenCalledWith({ enrolledAt: -1 });
    expect(enrollmentChain.skip).toHaveBeenCalledWith(20);
    expect(enrollmentChain.limit).toHaveBeenCalledWith(10);
    expect(result.pagination).toEqual({ page: 3, limit: 10, total: 25, pages: 3 });
  });
});
