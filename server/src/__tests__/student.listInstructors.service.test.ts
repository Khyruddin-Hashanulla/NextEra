import mongoose from 'mongoose';
import { studentService } from '../services/student.service';
import { User } from '../models/user.model';
import { Course } from '../models/course.model';
import { ROLES } from '../constants/roles';

jest.mock('../models/user.model', () => ({
  User: { find: jest.fn() },
}));

jest.mock('../models/course.model', () => ({
  Course: { aggregate: jest.fn() },
}));

const mockedUserFind = User.find as jest.Mock;
const mockedCourseAggregate = Course.aggregate as jest.Mock;

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
const instructorId2 = new mongoose.Types.ObjectId();

describe('StudentService.listInstructors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns only active, non-deleted instructors with course stats', async () => {
    mockedUserFind.mockReturnValue(
      chainable([
        { _id: instructorId, name: 'Priya Sharma', email: 'priya@example.com', avatar: { url: '/a.png', publicId: 'a' }, bio: 'Bio', instructorProfile: { qualification: 'MSc', expertise: ['React'], teachingCategories: [] } },
        { _id: instructorId2, name: 'Ghost Instructor', email: 'ghost@example.com', avatar: { url: '', publicId: '' }, bio: '', instructorProfile: {} },
      ])
    );
    mockedCourseAggregate.mockResolvedValue([
      { _id: instructorId, coursesCount: 3, studentsCount: 120, reviewsCount: 10, avgRatingSum: 14.7 },
    ]);

    const result = await studentService.listInstructors();

    expect(mockedUserFind).toHaveBeenCalledWith({
      role: ROLES.INSTRUCTOR,
      isActive: true,
      isDeleted: false,
    });
    expect(mockedCourseAggregate).toHaveBeenCalledTimes(1);

    expect(result).toHaveLength(2);
    const [first, second] = result;

    expect(first).toMatchObject({
      _id: instructorId,
      name: 'Priya Sharma',
      email: 'priya@example.com',
      avatar: '/a.png',
      bio: 'Bio',
      title: 'MSc',
      specialties: ['React'],
      rating: 4.9,
      coursesCount: 3,
      studentsCount: 120,
      totalReviews: 10,
    });

    expect(second).toMatchObject({
      _id: instructorId2,
      name: 'Ghost Instructor',
      avatar: '',
      title: '',
      specialties: [],
      rating: 0,
      coursesCount: 0,
      studentsCount: 0,
      totalReviews: 0,
    });
  });

  it('returns an empty array when there are no instructors', async () => {
    mockedUserFind.mockReturnValue(chainable([]));
    mockedCourseAggregate.mockResolvedValue([]);

    const result = await studentService.listInstructors();

    expect(result).toEqual([]);
    expect(mockedCourseAggregate).toHaveBeenCalledTimes(1);
  });
});
