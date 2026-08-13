import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { Course } from '../models/course.model';
import { Section } from '../models/section.model';
import { Lecture } from '../models/lecture.model';
import { auditDenied, getUserId, isAdmin } from '../services/dataScoping.service';

// Re-export the factory-based middleware from the new dataScoping module
export {
  createOwnerMiddleware,
  OwnerMiddlewareConfig,
  verifyCourseOwnership,
  verifySectionOwnership,
  verifyLectureOwnership,
  verifyNoteOwnership,
  verifyReviewOwnership,
  verifyCertificateOwnership,
  verifyEnrollmentOwnership,
  verifyAssignmentOwnership,
  verifyCouponOwnership,
  verifyAnnouncementOwnership,
  verifyQuizAttemptOwnership,
  verifyLiveClassOwnership,
  verifyCodingSubmissionOwnership,
  verifyNotificationOwnership,
} from './dataScoping.middleware';

// ─── Deprecated: legacy middleware kept for backward compatibility ───
// All new development should use the factory-based middleware from dataScoping.middleware.ts
// The functions below replicate the factory logic but with explicit models for clarity.
// They include audit logging on denial.

const notFound = (name: string) => ApiError.notFound(`${name} not found`);
const forbidden = () => ApiError.forbidden('Access denied');
const isValidId = (id: string | undefined): id is string => !!id && mongoose.Types.ObjectId.isValid(id);

async function verifyField<T>(
  model: mongoose.Model<T>,
  resourceId: string | undefined,
  field: keyof T & string,
  expectedId: string,
  resourceName: string,
  req: Request
): Promise<void> {
  if (!isValidId(resourceId)) {
    await auditDenied(req, resourceName, resourceId, `Invalid ${resourceName} ID`);
    throw notFound(resourceName);
  }
  const doc = await model.findById(resourceId).select(field).lean();
  if (!doc) {
    await auditDenied(req, resourceName, resourceId, `${resourceName} not found`);
    throw notFound(resourceName);
  }
  const ownerId = (doc as any)[field];
  if (!ownerId || ownerId.toString() !== expectedId) {
    await auditDenied(req, resourceName, resourceId, `User does not own this ${resourceName}`);
    throw forbidden();
  }
}

export const _verifyCourseOwnershipLegacy = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (isAdmin(req)) return next();
    await verifyField(Course, req.params.id, 'instructor', getUserId(req), 'Course', req);
    next();
  } catch (error) {
    next(error);
  }
};

export const _verifySectionOwnershipLegacy = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (isAdmin(req)) return next();
    const courseId = req.params.id;
    const sectionId = req.params.sectionId;
    if (!isValidId(sectionId)) {
      await auditDenied(req, 'Section', sectionId, 'Invalid Section ID');
      throw notFound('Section');
    }
    const section = await Section.findById(sectionId).select('course').lean();
    if (!section) {
      await auditDenied(req, 'Section', sectionId, 'Section not found');
      throw notFound('Section');
    }
    if (section.course.toString() !== courseId) {
      await auditDenied(req, 'Section', sectionId, 'Section does not belong to the specified course');
      throw forbidden();
    }
    await verifyField(Course, courseId, 'instructor', getUserId(req), 'Course', req);
    next();
  } catch (error) {
    next(error);
  }
};

export const _verifyLectureOwnershipLegacy = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (isAdmin(req)) return next();
    const courseId = req.params.id;
    const lectureId = req.params.lectureId;
    if (!isValidId(lectureId)) {
      await auditDenied(req, 'Lecture', lectureId, 'Invalid Lecture ID');
      throw notFound('Lecture');
    }
    const lecture = await Lecture.findById(lectureId).select('course').lean();
    if (!lecture) {
      await auditDenied(req, 'Lecture', lectureId, 'Lecture not found');
      throw notFound('Lecture');
    }
    if (lecture.course.toString() !== courseId) {
      await auditDenied(req, 'Lecture', lectureId, 'Lecture does not belong to the specified course');
      throw forbidden();
    }
    await verifyField(Course, courseId, 'instructor', getUserId(req), 'Course', req);
    next();
  } catch (error) {
    next(error);
  }
};
