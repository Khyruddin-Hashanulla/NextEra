import { instructorService } from '../services/instructor.service';
import { InstructorApplication } from '../models/instructorApplication.model';
import { User } from '../models/user.model';

jest.mock('../services/subscriptionPermission.service', () => ({
  subscriptionPermissionService: {
    requireAdvancedAnalyticsPermission: jest.fn(),
  },
}));

jest.mock('../models/instructorApplication.model', () => ({
  InstructorApplication: { findOne: jest.fn(), create: jest.fn() },
}));

jest.mock('../models/user.model', () => ({
  User: { findById: jest.fn() },
}));

const mockedFindOne = InstructorApplication.findOne as jest.Mock;
const mockedCreate = InstructorApplication.create as jest.Mock;
const mockedUserFindById = User.findById as jest.Mock;

function mockUserRole(role: string | null) {
  mockedUserFindById.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(role ? { role } : null),
    }),
  });
}

const payload = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1 555 0100',
  address: '123 Test St',
  qualification: 'MSc Computer Science',
  experience: '5 years',
};

describe('InstructorService.apply', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws a conflict when an approved application exists and the user is still an instructor', async () => {
    const save = jest.fn();
    mockedFindOne.mockResolvedValue({ _id: 'app1', user: 'u1', status: 'approved', save });
    mockUserRole('instructor');

    await expect(instructorService.apply('u1', payload)).rejects.toMatchObject({
      message: 'You are already an instructor',
    });
    expect(mockedUserFindById).toHaveBeenCalledWith('u1');
    expect(save).not.toHaveBeenCalled();
  });

  it('reopens an approved application as pending when the instructor role was revoked', async () => {
    const save = jest.fn().mockResolvedValue({ _id: 'app1' });
    mockedFindOne.mockResolvedValue({ _id: 'app1', user: 'u1', status: 'approved', save });
    mockUserRole('student');

    await instructorService.apply('u1', payload);

    expect(mockedUserFindById).toHaveBeenCalledWith('u1');
    expect(save.mock.contexts[0]).toMatchObject({ status: 'pending' });
  });

  it('throws a conflict when an application is already pending', async () => {
    const save = jest.fn();
    mockedFindOne.mockResolvedValue({ _id: 'app1', user: 'u1', status: 'pending', save });

    await expect(instructorService.apply('u1', payload)).rejects.toMatchObject({
      message: 'Application already pending',
    });
    expect(mockedUserFindById).not.toHaveBeenCalled();
  });

  it('creates a new application when none exists', async () => {
    mockedFindOne.mockResolvedValue(null);
    mockedCreate.mockResolvedValue({ _id: 'app1' });

    await instructorService.apply('u1', payload);

    expect(mockedCreate).toHaveBeenCalledWith({ user: 'u1', ...payload });
    expect(mockedUserFindById).not.toHaveBeenCalled();
  });
});
