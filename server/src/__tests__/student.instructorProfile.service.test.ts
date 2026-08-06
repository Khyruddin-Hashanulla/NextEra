import mongoose from 'mongoose';
import { studentService } from '../services/student.service';
import { User } from '../models/user.model';
import { Course } from '../models/course.model';
import { ROLES } from '../constants/roles';
import { ApiError } from '../utils/ApiError';

jest.mock('../models/user.model', () => ({
  User: { findOne: jest.fn() },
}));

jest.mock('../models/course.model', () => ({
  Course: { aggregate: jest.fn() },
}));

const mockedUserFindOne = User.findOne as jest.Mock;
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

const instructorDoc = {
  _id: instructorId,
  name: 'Priya Sharma',
  email: 'priya@example.com',
  phone: '+1 555 0100',
  address: '123 Test St',
  avatar: { url: '/a.png', publicId: 'a' },
  bio: 'Frontend architect',
  socialLinks: { youtube: '', twitter: '', linkedin: '/in/priya', github: '', portfolio: '', website: '' },
  instructorProfile: {
    qualification: 'MSc Computer Science',
    experience: '5 years',
    expertise: ['React', 'TypeScript'],
    teachingCategories: ['Development'],
    completedCourses: 2,
    totalStudents: 1200,
    rating: 4.8,
    bankDetails: { accountNumber: 'secret' },
    taxDetails: { pan: 'secret' },
  },
};

describe('StudentService.getInstructorProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the full public profile with course stats', async () => {
    mockedUserFindOne.mockReturnValue(chainable(instructorDoc));
    mockedCourseAggregate.mockResolvedValue([
      { _id: instructorId, coursesCount: 3, studentsCount: 120, reviewsCount: 10, avgRatingSum: 14.7 },
    ]);

    const result = await studentService.getInstructorProfile(instructorId.toString());

    expect(mockedUserFindOne).toHaveBeenCalledWith({
      _id: instructorId.toString(),
      role: ROLES.INSTRUCTOR,
      isActive: true,
      isDeleted: false,
    });

    expect(result).toMatchObject({
      _id: instructorId,
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '+1 555 0100',
      address: '123 Test St',
      avatar: { url: '/a.png', publicId: 'a' },
      bio: 'Frontend architect',
      socialLinks: { linkedin: '/in/priya' },
      instructorProfile: {
        qualification: 'MSc Computer Science',
        experience: '5 years',
        expertise: ['React', 'TypeScript'],
        teachingCategories: ['Development'],
        completedCourses: 2,
        totalStudents: 1200,
        rating: 4.8,
      },
      specialties: ['React', 'TypeScript'],
      totalCourses: 3,
      totalStudents: 120,
      totalReviews: 10,
      averageRating: 4.9,
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('bankDetails');
    expect(serialized).not.toContain('taxDetails');
    expect(serialized).not.toContain('accountNumber');
    expect(serialized).not.toContain('"pan"');
  });

  it('throws not found when the user is missing or not an approved instructor', async () => {
    mockedUserFindOne.mockReturnValue(chainable(null));

    await expect(studentService.getInstructorProfile(instructorId.toString())).rejects.toBeInstanceOf(ApiError);
    expect(mockedCourseAggregate).not.toHaveBeenCalled();
  });

  it('throws not found for an invalid ObjectId without querying the database', async () => {
    await expect(studentService.getInstructorProfile('not-an-object-id')).rejects.toBeInstanceOf(ApiError);
    expect(mockedUserFindOne).not.toHaveBeenCalled();
  });
});
