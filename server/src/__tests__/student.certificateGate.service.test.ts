import mongoose from 'mongoose';
import { studentService } from '../services/student.service';
import { Course } from '../models/course.model';
import { Enrollment } from '../models/enrollment.model';
import { ApiError } from '../utils/ApiError';

jest.mock('../utils/transaction', () => ({
  withTransaction: (fn: any) => fn({ __fakeSession: true }),
}));

jest.mock('../models/course.model', () => ({
  Course: { findById: jest.fn() },
}));
jest.mock('../models/enrollment.model', () => ({
  Enrollment: { findOne: jest.fn(), findByIdAndUpdate: jest.fn() },
}));
jest.mock('../models/certificate.model', () => ({
  Certificate: { findOne: jest.fn(), findById: jest.fn(), create: jest.fn() },
}));
jest.mock('../models/user.model', () => ({
  User: { findById: jest.fn() },
}));

jest.mock('../utils/certificate', () => ({
  generateCertificateSignature: jest.fn(),
  generateQrCodePngBuffer: jest.fn().mockResolvedValue(Buffer.from('qr')),
  getQrCodeImageUrl: jest.fn(),
  verifyCertificateSignature: jest.fn(),
  getVerificationUrl: jest.fn(),
}));
jest.mock('../utils/certificateIdGenerator', () => ({
  generateCertificateId: jest.fn().mockResolvedValue('CERT-123'),
}));
jest.mock('../utils/pdfGenerator', () => ({
  generateCertificatePdf: jest.fn().mockResolvedValue('/tmp/cert.pdf'),
  getCertificateUrl: jest.fn(),
  getCertificateFilePath: jest.fn(),
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
const mockedEnrollmentFindOne = Enrollment.findOne as jest.Mock;

const userId = new mongoose.Types.ObjectId().toString();
const courseId = new mongoose.Types.ObjectId().toString();

function chain(value: any) {
  return {
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(value),
  };
}

describe('StudentService.generateCertificate content gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEnrollmentFindOne.mockResolvedValue({ _id: new mongoose.Types.ObjectId(), isCompleted: true });
    const { User } = require('../models/user.model');
    (User.findById as jest.Mock).mockReturnValue(chain({ name: 'Student', _id: userId }));
  });

  it('rejects IN_PROGRESS courses with a forbidden error and does not create a certificate', async () => {
    mockedCourseFindById.mockReturnValue(
      chain({
        _id: courseId,
        title: 'Course',
        isApproved: true,
        status: 'published',
        contentStatus: 'IN_PROGRESS',
      })
    );

    const { Certificate } = require('../models/certificate.model');
    await expect(studentService.generateCertificate(userId, courseId)).rejects.toThrow(ApiError);
    await expect(studentService.generateCertificate(userId, courseId)).rejects.toMatchObject({ statusCode: 403 });
    expect(Certificate.create).not.toHaveBeenCalled();
  });

  it('allows legacy courses without a contentStatus to proceed (backward compatible)', async () => {
    mockedCourseFindById.mockReturnValue(
      chain({
        _id: courseId,
        title: 'Legacy Course',
        isApproved: true,
        status: 'published',
        contentStatus: undefined,
        level: 'beginner',
        totalDuration: 120,
      })
    );

    const { Certificate } = require('../models/certificate.model');
    Certificate.findOne.mockResolvedValue(null);
    Certificate.create.mockResolvedValue([{ _id: 'cert' }]);
    Certificate.findById.mockReturnValue(chain({ _id: 'cert' }));

    const result = await studentService.generateCertificate(userId, courseId);
    expect(result).toBeDefined();
    expect(Certificate.create).toHaveBeenCalledTimes(1);
  });
});
