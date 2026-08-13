import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';

jest.mock('../models/course.model');
jest.mock('../models/section.model');
jest.mock('../models/lecture.model');
jest.mock('../models/user.model');

jest.mock('../services/subscriptionPermission.service', () => ({
  subscriptionPermissionService: {
    getInstructorPlanInfo: jest.fn(),
    requirePaidCoursePermission: jest.fn().mockResolvedValue(undefined),
    requirePublishPermission: jest.fn().mockResolvedValue(undefined),
  },
}));

import { subscriptionPermissionService } from '../services/subscriptionPermission.service';

const mockModels = {
  Course: jest.requireMock('../models/course.model').Course,
  Section: jest.requireMock('../models/section.model').Section,
  Lecture: jest.requireMock('../models/lecture.model').Lecture,
};

const ACTIVE_PRO_PLAN = {
  status: 'active',
  planName: 'Pro',
  features: {
    freeCoursesLimit: 10,
    unlimitedCourses: true,
    storageLimitMB: 5000,
    advancedAnalytics: true,
    coupons: true,
    liveClasses: true,
    featuredInstructor: false,
    prioritySupport: true,
    unlimitedStorage: false,
    premiumMarketing: false,
  },
};

const OWNER = new mongoose.Types.ObjectId().toString();
const COURSE_ID = new mongoose.Types.ObjectId().toString();

function makeCourse(overrides: any = {}) {
  return {
    _id: COURSE_ID,
    instructor: OWNER,
    status: 'draft',
    isApproved: false,
    isActive: true,
    visibility: 'private',
    courseType: 'draft',
    price: 0,
    rejectionReason: '',
    publishedAt: null,
    archivedAt: null,
    lastActivity: new Date(),
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();

  mockModels.Lecture.find.mockResolvedValue([]);
  mockModels.Section.find.mockResolvedValue([]);
  mockModels.Lecture.countDocuments.mockResolvedValue(0);
  mockModels.Section.countDocuments.mockResolvedValue(0);

  const chainResult = (val: any) => ({
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(val),
  });
  mockModels.Course.findByIdAndUpdate.mockReturnValue(chainResult(makeCourse()));
  (subscriptionPermissionService.getInstructorPlanInfo as jest.Mock).mockResolvedValue(ACTIVE_PRO_PLAN);
});

describe('Course State Machine', () => {
  describe('submitForReview', () => {
    it('transitions draft to review', async () => {
      const course = makeCourse({ status: 'draft' });
      mockModels.Course.findById.mockResolvedValue(course);
      mockModels.Section.countDocuments.mockResolvedValue(1);
      mockModels.Lecture.countDocuments.mockResolvedValue(2);
      mockModels.Lecture.countDocuments.mockResolvedValueOnce(2);
      mockModels.Lecture.countDocuments.mockResolvedValueOnce(1);

      const { courseService } = await import('../services/course.service');
      await courseService.submitForReview(COURSE_ID);

      expect(course.status).toBe('review');
      expect(course.lastActivity).toBeInstanceOf(Date);
      expect(course.save).toHaveBeenCalled();
    });

    it('transitions rejected to review', async () => {
      const course = makeCourse({ status: 'rejected' });
      mockModels.Course.findById.mockResolvedValue(course);
      mockModels.Section.countDocuments.mockResolvedValue(1);
      mockModels.Lecture.countDocuments.mockResolvedValue(2);
      mockModels.Lecture.countDocuments.mockResolvedValueOnce(2);
      mockModels.Lecture.countDocuments.mockResolvedValueOnce(1);

      const { courseService } = await import('../services/course.service');
      await courseService.submitForReview(COURSE_ID);

      expect(course.status).toBe('review');
      expect(course.rejectionReason).toBe('');
      expect(course.save).toHaveBeenCalled();
    });

    it('rejects transition from published', async () => {
      const course = makeCourse({ status: 'published' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.submitForReview(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });

    it('rejects transition from approved', async () => {
      const course = makeCourse({ status: 'approved' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.submitForReview(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });

    it('requires at least one section', async () => {
      const course = makeCourse({ status: 'draft' });
      mockModels.Course.findById.mockResolvedValue(course);
      mockModels.Section.countDocuments.mockResolvedValue(0);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.submitForReview(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });

    it('requires at least one video lecture', async () => {
      const course = makeCourse({ status: 'draft' });
      mockModels.Course.findById.mockResolvedValue(course);
      mockModels.Section.countDocuments.mockResolvedValue(1);
      mockModels.Lecture.countDocuments.mockResolvedValue(2);
      mockModels.Lecture.countDocuments.mockResolvedValueOnce(2);
      mockModels.Lecture.countDocuments.mockResolvedValueOnce(0);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.submitForReview(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('transitions review to approved', async () => {
      const course = makeCourse({ status: 'review' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await courseService.approve(COURSE_ID);

      expect(course.status).toBe('approved');
      expect(course.lastActivity).toBeInstanceOf(Date);
      expect(course.save).toHaveBeenCalled();
    });

    it('rejects transition from draft', async () => {
      const course = makeCourse({ status: 'draft' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.approve(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });

    it('rejects transition from published', async () => {
      const course = makeCourse({ status: 'published' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.approve(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });

    it('rejects transition from rejected', async () => {
      const course = makeCourse({ status: 'rejected' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.approve(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('transitions review to rejected with reason', async () => {
      const course = makeCourse({ status: 'review' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await courseService.reject(COURSE_ID, 'Incomplete content');

      expect(course.status).toBe('rejected');
      expect(course.rejectionReason).toBe('Incomplete content');
      expect(course.lastActivity).toBeInstanceOf(Date);
      expect(course.save).toHaveBeenCalled();
    });

    it('transitions review to rejected without reason', async () => {
      const course = makeCourse({ status: 'review' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await courseService.reject(COURSE_ID);

      expect(course.status).toBe('rejected');
      expect(course.rejectionReason).toBe('');
      expect(course.save).toHaveBeenCalled();
    });

    it('rejects transition from draft', async () => {
      const course = makeCourse({ status: 'draft' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.reject(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('transitions approved to published', async () => {
      const course = makeCourse({ status: 'approved', price: 2999 });
      mockModels.Course.findById.mockResolvedValue(course);
      mockModels.Section.countDocuments.mockResolvedValue(1);
      mockModels.Lecture.countDocuments.mockResolvedValue(2);

      const { courseService } = await import('../services/course.service');
      await courseService.publish(COURSE_ID);

      expect(course.status).toBe('published');
      expect(course.courseType).toBe('paid');
      expect(course.lastActivity).toBeInstanceOf(Date);
      expect(course.save).toHaveBeenCalled();
    });

    it('transitions approved to published (free)', async () => {
      const course = makeCourse({ status: 'approved', price: 0 });
      mockModels.Course.findById.mockResolvedValue(course);
      mockModels.Section.countDocuments.mockResolvedValue(1);
      mockModels.Lecture.countDocuments.mockResolvedValue(2);

      const { courseService } = await import('../services/course.service');
      await courseService.publish(COURSE_ID);

      expect(course.status).toBe('published');
      expect(course.courseType).toBe('free');
      expect(course.save).toHaveBeenCalled();
    });

    it('rejects transition from draft', async () => {
      const course = makeCourse({ status: 'draft' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.publish(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });

    it('rejects transition from review', async () => {
      const course = makeCourse({ status: 'review' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.publish(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });

    it('rejects when no sections exist', async () => {
      const course = makeCourse({ status: 'approved' });
      mockModels.Course.findById.mockResolvedValue(course);
      mockModels.Section.countDocuments.mockResolvedValue(0);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.publish(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    it('transitions published to archived', async () => {
      const course = makeCourse({ status: 'published' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await courseService.archive(COURSE_ID);

      expect(course.status).toBe('archived');
      expect(course.lastActivity).toBeInstanceOf(Date);
      expect(course.save).toHaveBeenCalled();
    });

    it('transitions approved to archived', async () => {
      const course = makeCourse({ status: 'approved' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await courseService.archive(COURSE_ID);

      expect(course.status).toBe('archived');
      expect(course.save).toHaveBeenCalled();
    });

    it('rejects transition from draft', async () => {
      const course = makeCourse({ status: 'draft' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.archive(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });

    it('rejects transition from review', async () => {
      const course = makeCourse({ status: 'review' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.archive(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });

    it('rejects transition from rejected', async () => {
      const course = makeCourse({ status: 'rejected' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.archive(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });
  });

  describe('unpublish', () => {
    it('transitions published to draft', async () => {
      const course = makeCourse({ status: 'published' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await courseService.unpublish(COURSE_ID);

      expect(course.status).toBe('draft');
      expect(course.lastActivity).toBeInstanceOf(Date);
      expect(course.save).toHaveBeenCalled();
    });

    it('rejects transition from draft', async () => {
      const course = makeCourse({ status: 'draft' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.unpublish(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('transitions archived to draft', async () => {
      const course = makeCourse({ status: 'archived' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await courseService.restore(COURSE_ID);

      expect(course.status).toBe('draft');
      expect(course.lastActivity).toBeInstanceOf(Date);
      expect(course.save).toHaveBeenCalled();
    });

    it('rejects transition from published', async () => {
      const course = makeCourse({ status: 'published' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.restore(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });
  });

  describe('update strips protected fields', () => {
    it('removes status, isApproved, isActive from update payload', async () => {
      const chainResult = (val: any) => ({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(val),
      });
      const mockUpdate = jest.fn().mockReturnValue(chainResult(makeCourse({ status: 'draft' })));
      mockModels.Course.findByIdAndUpdate = mockUpdate;
      mockModels.Course.findById.mockReturnValue(chainResult(makeCourse({ status: 'draft' })));

      const { courseService } = await import('../services/course.service');
      await courseService.update(COURSE_ID, { title: 'New Title', status: 'published', isApproved: true });

      const updateCall = mockUpdate.mock.calls[0];
      const $set = updateCall[1].$set;
      expect($set.title).toBe('New Title');
      expect($set.status).toBeUndefined();
      expect($set.isApproved).toBeUndefined();
      expect($set.isActive).toBeUndefined();
      expect($set.publishedAt).toBeUndefined();
      expect($set.archivedAt).toBeUndefined();
      expect($set.rejectionReason).toBeUndefined();
    });
  });

  describe('markCourseContentCompleted', () => {
    it('finalizes content for a course with lectures', async () => {
      const course = makeCourse({ status: 'published', contentStatus: 'IN_PROGRESS' });
      mockModels.Course.findById.mockResolvedValue(course);
      mockModels.Lecture.countDocuments.mockResolvedValue(2);

      const { courseService } = await import('../services/course.service');
      await courseService.markCourseContentCompleted(COURSE_ID);

      expect(course.contentStatus).toBe('COMPLETED');
      expect(course.lastActivity).toBeInstanceOf(Date);
      expect(course.save).toHaveBeenCalled();
    });

    it('rejects draft courses', async () => {
      const course = makeCourse({ status: 'draft', contentStatus: 'IN_PROGRESS' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.markCourseContentCompleted(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });

    it('rejects rejected courses', async () => {
      const course = makeCourse({ status: 'rejected', contentStatus: 'IN_PROGRESS' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.markCourseContentCompleted(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });

    it('rejects archived courses', async () => {
      const course = makeCourse({ status: 'archived', contentStatus: 'IN_PROGRESS' });
      mockModels.Course.findById.mockResolvedValue(course);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.markCourseContentCompleted(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });

    it('rejects when no lectures exist', async () => {
      const course = makeCourse({ status: 'published', contentStatus: 'IN_PROGRESS' });
      mockModels.Course.findById.mockResolvedValue(course);
      mockModels.Lecture.countDocuments.mockResolvedValue(0);

      const { courseService } = await import('../services/course.service');
      await expect(courseService.markCourseContentCompleted(COURSE_ID)).rejects.toThrow(ApiError);
      expect(course.save).not.toHaveBeenCalled();
    });
  });
});
