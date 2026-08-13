import mongoose from 'mongoose';
import { adminService } from '../services/admin.service';
import { cacheService } from '../cache/cache.service';
import { User } from '../models/user.model';
import { Course } from '../models/course.model';
import { Enrollment } from '../models/enrollment.model';
import { Payment } from '../models/payment.model';

jest.mock('../models/user.model', () => ({
  User: {
    aggregate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));
jest.mock('../models/course.model', () => ({
  Course: {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));
jest.mock('../models/enrollment.model', () => ({
  Enrollment: { countDocuments: jest.fn(), aggregate: jest.fn() },
}));
jest.mock('../models/payment.model', () => ({
  Payment: { aggregate: jest.fn(), find: jest.fn() },
}));

const mockedUserAggregate = User.aggregate as jest.Mock;
const mockedCourseAggregate = Course.aggregate as jest.Mock;
const mockedEnrollmentAggregate = Enrollment.aggregate as jest.Mock;
const mockedPaymentAggregate = Payment.aggregate as jest.Mock;

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

describe('AdminService.getDashboardStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    void cacheService.invalidatePattern('admin:*');
    void cacheService.invalidatePattern('revenue:*');
  });

  it('aggregates user and course counts via single facet queries', async () => {
    mockedUserAggregate.mockResolvedValue([
      {
        roles: [
          { _id: 'admin', count: 1 },
          { _id: 'instructor', count: 2 },
          { _id: 'student', count: 10 },
        ],
        total: [{ count: 13 }],
      },
    ]);
    mockedCourseAggregate.mockResolvedValue([
      {
        byStatus: [
          { _id: 'published', count: 4 },
          { _id: 'review', count: 1 },
          { _id: 'draft', count: 2 },
        ],
        total: [{ count: 7 }],
      },
    ]);
    (Enrollment.countDocuments as jest.Mock).mockResolvedValue(25);
    mockedPaymentAggregate.mockResolvedValue([{ total: 50000 }]);
    (User.find as jest.Mock).mockReturnValue(
      chainable([{ _id: 'u1', name: 'A', email: 'a@x.com', role: 'student', createdAt: new Date() }])
    );
    (Payment.find as jest.Mock).mockReturnValue(
      chainable([{ _id: 'p1', amount: 100, status: 'success', user: { name: 'A', email: 'a@x.com' } }])
    );

    const result = await adminService.getDashboardStats();

    expect(result.users).toEqual({ total: 13, students: 10, instructors: 2, admins: 1 });
    expect(result.courses).toEqual({ total: 7, published: 4, pending: 1 });
    expect(result.enrollments).toBe(25);
    expect(result.revenue).toBe(50000);
    expect(result.recentUsers).toHaveLength(1);
    expect(result.recentPayments).toHaveLength(1);
    expect(mockedUserAggregate).toHaveBeenCalledTimes(1);
    expect(mockedCourseAggregate).toHaveBeenCalledTimes(1);
    expect(mockedPaymentAggregate).toHaveBeenCalledTimes(1);

    const userPipeline = mockedUserAggregate.mock.calls[0][0];
    expect(userPipeline[0].$facet).toHaveProperty('roles');
    expect(userPipeline[0].$facet).toHaveProperty('total');
    const coursePipeline = mockedCourseAggregate.mock.calls[0][0];
    expect(coursePipeline[0].$facet).toHaveProperty('byStatus');
    expect(coursePipeline[0].$facet).toHaveProperty('total');
  });

  it('returns zeroed stats for empty collections', async () => {
    mockedUserAggregate.mockResolvedValue([{ roles: [], total: [] }]);
    mockedCourseAggregate.mockResolvedValue([{ byStatus: [], total: [] }]);
    (Enrollment.countDocuments as jest.Mock).mockResolvedValue(0);
    mockedPaymentAggregate.mockResolvedValue([]);
    (User.find as jest.Mock).mockReturnValue(chainable([]));
    (Payment.find as jest.Mock).mockReturnValue(chainable([]));

    const result = await adminService.getDashboardStats();

    expect(result.users).toEqual({ total: 0, students: 0, instructors: 0, admins: 0 });
    expect(result.courses).toEqual({ total: 0, published: 0, pending: 0 });
    expect(result.enrollments).toBe(0);
    expect(result.revenue).toBe(0);
  });
});

describe('AdminService.getUserAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    void cacheService.invalidatePattern('admin:*');
    void cacheService.invalidatePattern('revenue:*');
  });

  it('combines user growth and role distribution into one facet aggregation', async () => {
    mockedUserAggregate.mockResolvedValue([
      {
        userGrowth: [{ _id: '2026-08-01', count: 2 }],
        roleDistribution: [{ _id: 'student', count: 1 }],
      },
    ]);

    const result = await adminService.getUserAnalytics();

    expect(result.userGrowth).toEqual([{ _id: '2026-08-01', count: 2 }]);
    expect(result.roleDistribution).toEqual([{ _id: 'student', count: 1 }]);
    expect(mockedUserAggregate).toHaveBeenCalledTimes(1);
    const pipeline = mockedUserAggregate.mock.calls[0][0];
    expect(pipeline[0].$facet).toHaveProperty('userGrowth');
    expect(pipeline[0].$facet).toHaveProperty('roleDistribution');
  });
});

describe('AdminService.listStudents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enriches enrollment counts with a single aggregation instead of N count queries', async () => {
    const id1 = new mongoose.Types.ObjectId();
    const id2 = new mongoose.Types.ObjectId();
    (User.find as jest.Mock).mockReturnValue(
      chainable([
        { _id: id1, name: 'S1' },
        { _id: id2, name: 'S2' },
      ])
    );
    (User.countDocuments as jest.Mock).mockResolvedValue(2);
    mockedEnrollmentAggregate.mockResolvedValue([{ _id: id1, count: 3 }]);

    const result = await adminService.listStudents(1, 10);

    expect(result.students[0].totalEnrollments).toBe(3);
    expect(result.students[1].totalEnrollments).toBe(0);
    expect(result.pagination.total).toBe(2);
    expect(mockedEnrollmentAggregate).toHaveBeenCalledTimes(1);
    expect(Enrollment.countDocuments).not.toHaveBeenCalled();
    const pipeline = mockedEnrollmentAggregate.mock.calls[0][0];
    expect(pipeline[1].$group).toEqual({ _id: '$user', count: { $sum: 1 } });
  });
});
