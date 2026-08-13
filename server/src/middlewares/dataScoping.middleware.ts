import { Request, Response, NextFunction } from 'express';
import mongoose, { Model } from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { Course } from '../models/course.model';
import { Section } from '../models/section.model';
import { Lecture } from '../models/lecture.model';
import { Note } from '../models/note.model';
import { Enrollment } from '../models/enrollment.model';
import { Certificate } from '../models/certificate.model';
import { AssignmentSubmission } from '../models/assignmentSubmission.model';
import { Coupon } from '../models/coupon.model';
import { Announcement } from '../models/announcement.model';
import { Review } from '../models/review.model';
import { QuizAttempt } from '../models/quizAttempt.model';
import { LiveClass } from '../models/liveClass.model';
import { CodingSubmission } from '../models/codingSubmission.model';
import { Notification } from '../models/notification.model';
import { auditDenied, getUserId, isAdmin } from '../services/dataScoping.service';

// ─── Helpers ─────────────────────────────────────────────────

const notFound = () => ApiError.notFound('Resource not found');
const forbidden = () => ApiError.forbidden('Access denied');

function isValidId(id: string | undefined): id is string {
  return !!id && mongoose.Types.ObjectId.isValid(id);
}

function extractId(req: Request, source: 'params' | 'query' | 'body', field: string): string | undefined {
  if (source === 'params') return req.params[field];
  if (source === 'query') return req.query[field] as string | undefined;
  return (req.body as any)?.[field];
}

// ─── Middleware Factory ──────────────────────────────────────

export interface OwnerMiddlewareConfig {
  model: Model<any>;
  ownerField: string;
  resourceName: string;
  idSource?: 'params' | 'query' | 'body';
  idField?: string;
  adminBypass?: boolean;
  additionalCheck?: (doc: any, req: Request) => boolean | Promise<boolean>;
  skipOwnerCheck?: boolean;
}

export function createOwnerMiddleware(config: OwnerMiddlewareConfig) {
  const {
    model,
    ownerField,
    resourceName,
    idSource = 'params',
    idField = 'id',
    adminBypass = true,
    additionalCheck,
  } = config;

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (adminBypass && isAdmin(req)) return next();

      const resourceId = extractId(req, idSource, idField);
      if (!isValidId(resourceId)) {
        await auditDenied(req, resourceName, resourceId, `Invalid ${resourceName} ID`);
        throw notFound();
      }

      const doc: Record<string, any> | null = await model.findById(resourceId).select(ownerField).lean();
      if (!doc) {
        await auditDenied(req, resourceName, resourceId, `${resourceName} not found`);
        throw notFound();
      }

      if (!config.skipOwnerCheck) {
        const ownerId = doc[ownerField];
        if (!ownerId || ownerId.toString() !== getUserId(req)) {
          await auditDenied(req, resourceName, resourceId, `User does not own this ${resourceName}`);
          throw forbidden();
        }
      }

      if (additionalCheck) {
        const ok = await additionalCheck(doc, req);
        if (!ok) {
          await auditDenied(req, resourceName, resourceId, `Additional check failed for ${resourceName}`);
          throw forbidden();
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// ─── Pre-built Middleware (generated via factory) ────────────

export const verifyCourseOwnership = createOwnerMiddleware({
  model: Course,
  ownerField: 'instructor',
  resourceName: 'Course',
});

function sectionCheck(doc: any, req: Request): boolean {
  const courseId = req.params.id || req.params.courseId;
  return doc.course?.toString() === courseId;
}

export const verifySectionOwnership = createOwnerMiddleware({
  model: Section,
  ownerField: 'course',
  resourceName: 'Section',
  idField: 'sectionId',
  skipOwnerCheck: true,
  additionalCheck: async (doc, req) => {
    if (!sectionCheck(doc, req)) return false;
    const course = await Course.findById(doc.course).select('instructor').lean();
    return !!course && course.instructor.toString() === getUserId(req);
  },
});

export const verifyLectureOwnership = createOwnerMiddleware({
  model: Lecture,
  ownerField: 'course',
  resourceName: 'Lecture',
  idField: 'lectureId',
  skipOwnerCheck: true,
  additionalCheck: async (doc, req) => {
    const courseId = req.params.id;
    if (doc.course?.toString() !== courseId) return false;
    const course = await Course.findById(doc.course).select('instructor').lean();
    return !!course && course.instructor.toString() === getUserId(req);
  },
});

export const verifyNoteOwnership = createOwnerMiddleware({
  model: Note,
  ownerField: 'user',
  resourceName: 'Note',
});

export const verifyReviewOwnership = createOwnerMiddleware({
  model: Review,
  ownerField: 'user',
  resourceName: 'Review',
});

export const verifyCertificateOwnership = createOwnerMiddleware({
  model: Certificate,
  ownerField: 'user',
  resourceName: 'Certificate',
  idField: 'id',
});

export const verifyEnrollmentOwnership = createOwnerMiddleware({
  model: Enrollment,
  ownerField: 'user',
  resourceName: 'Enrollment',
});

export const verifyAssignmentOwnership = createOwnerMiddleware({
  model: AssignmentSubmission,
  ownerField: 'user',
  resourceName: 'Assignment',
  idField: 'id',
});

export const verifyCouponOwnership = createOwnerMiddleware({
  model: Coupon,
  ownerField: 'createdBy',
  resourceName: 'Coupon',
});

export const verifyAnnouncementOwnership = createOwnerMiddleware({
  model: Announcement,
  ownerField: 'instructor',
  resourceName: 'Announcement',
});

// ─── Quiz Attempt Ownership (student-owned) ─────────────────

export const verifyQuizAttemptOwnership = createOwnerMiddleware({
  model: QuizAttempt,
  ownerField: 'user',
  resourceName: 'QuizAttempt',
  idField: 'id',
});

// ─── Live Class Ownership (instructor-owned) ────────────────

export const verifyLiveClassOwnership = createOwnerMiddleware({
  model: LiveClass,
  ownerField: 'instructor',
  resourceName: 'LiveClass',
});

// ─── Coding Submission Ownership (student-owned) ────────────

export const verifyCodingSubmissionOwnership = createOwnerMiddleware({
  model: CodingSubmission,
  ownerField: 'user',
  resourceName: 'CodingSubmission',
  idField: 'submissionId',
});

// ─── Notification Ownership (user-owned) ────────────────────

export const verifyNotificationOwnership = createOwnerMiddleware({
  model: Notification,
  ownerField: 'user',
  resourceName: 'Notification',
});
