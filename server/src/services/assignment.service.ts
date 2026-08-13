import mongoose from 'mongoose';
import { AssignmentSubmission } from '../models/assignmentSubmission.model';
import { Lecture } from '../models/lecture.model';
import { Course } from '../models/course.model';
import { User } from '../models/user.model';
import { Notification } from '../models/notification.model';
import { ApiError } from '../utils/ApiError';
import { escapeRegex } from '../utils/escapeRegex';
import {
  AssignmentStatus,
  computePercentage,
  computePassFail,
  computeLetterGrade,
  assertValidGrade,
  getDefaultMaxMarks,
} from '../utils/grading';

// ─── Interfaces ────────────────────────────────────────────────

interface GradePayload {
  grade: number;
  maxMarks?: number;
  feedback?: string;
  privateNotes?: string;
  letterGrade?: string;
  customGradeScale?: string;
  rubric?: { criteria: string; maxPoints: number; obtainedPoints: number; comment?: string }[];
  gradedFiles?: { url: string; publicId: string; name: string }[];
  publish?: boolean;
}

interface ReturnPayload {
  feedback?: string;
  privateNotes?: string;
  resubmissionDeadline?: string;
}

interface ListQuery {
  page: number;
  limit: number;
  status?: AssignmentStatus;
  search?: string;
  sort?: string;
  courseId?: string;
}

// ─── Service ───────────────────────────────────────────────────

export class AssignmentService {
  // ─── Instructor: Assignment Dashboard ──────────────────────────

  async getInstructorAssignments(
    instructorId: string,
    { page = 1, limit = 10, search, status }: { page?: number; limit?: number; search?: string; status?: string }
  ) {
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 10));
    const courseIds = await this.getInstructorCourseIds(instructorId);
    const matchQuery: any = { course: { $in: courseIds }, type: 'assignment' };

    if (search) {
      const escaped = escapeRegex(search);
      const matchingLectures = await Lecture.find({ title: { $regex: escaped, $options: 'i' } })
        .select('_id')
        .lean();
      matchQuery._id = { $in: matchingLectures.map((l) => l._id) };
    }

    const skip = (pageNum - 1) * limitNum;
    const [lectureResult] = await Lecture.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          items: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limitNum },
            { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'course' } },
            {
              $addFields: {
                course: {
                  $let: {
                    vars: { c: { $arrayElemAt: ['$course', 0] } },
                    in: {
                      $cond: [{ $eq: ['$$c', null] }, null, { _id: '$$c._id', title: '$$c.title' }],
                    },
                  },
                },
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const lectures: any[] = (lectureResult?.items ?? []) as any[];
    const total = lectureResult?.total?.[0]?.count ?? 0;

    const lectureIds = lectures.map((l) => l._id);

    let submissionCounts: Record<string, number> = {};
    if (lectureIds.length > 0) {
      const match: any = { lecture: { $in: lectureIds } };
      if (status && status !== 'assigned') match.status = status;
      const counts = await AssignmentSubmission.aggregate([
        { $match: match },
        { $group: { _id: '$lecture', count: { $sum: 1 } } },
      ]);
      submissionCounts = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
    }

    const items = lectures.map((lecture) => ({
      _id: lecture._id,
      title: lecture.title,
      course: lecture.course,
      assignment: lecture.assignment,
      submissionCount: submissionCounts[lecture._id.toString()] || 0,
    }));

    return {
      assignments: items,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    };
  }

  async getInstructorAssignmentStats(instructorId: string) {
    const courseIds = await this.getInstructorCourseIds(instructorId);
    const lectures = await Lecture.find({ course: { $in: courseIds }, type: 'assignment' })
      .select('_id')
      .lean();
    const lectureIds = lectures.map((l) => l._id);

    if (lectureIds.length === 0) {
      return {
        totalLectures: 0,
        totalSubmissions: 0,
        pending: 0,
        graded: 0,
        returned: 0,
        rejected: 0,
        underReview: 0,
      };
    }

    const counts = await AssignmentSubmission.aggregate([
      { $match: { lecture: { $in: lectureIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    const totalSubmissions = counts.reduce((sum, c) => sum + c.count, 0);

    return {
      totalLectures: lectureIds.length,
      totalSubmissions,
      pending: (statusMap['submitted'] || 0) + (statusMap['late_submission'] || 0),
      graded: statusMap['graded'] || 0,
      returned: statusMap['returned_for_resubmission'] || 0,
      rejected: statusMap['rejected'] || 0,
      underReview: statusMap['under_review'] || 0,
    };
  }

  // ─── Instructor: Submissions ───────────────────────────────────

  async getLectureSubmissions(instructorId: string, lectureId: string, query: ListQuery): Promise<any> {
    const lecture = await this.verifyInstructorOwnsLecture(instructorId, lectureId);
    const { page = 1, limit = 10, status, search, sort } = query;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 10));

    const matchQuery: any = { lecture: lectureId };
    if (status) matchQuery.status = status;

    if (search) {
      const escaped = escapeRegex(search);
      const users = await User.find({
        $or: [{ name: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }],
      })
        .select('_id')
        .lean();
      matchQuery.user = { $in: users.map((u) => u._id) };
    }

    let sortQuery: any = { submittedAt: -1 };
    if (sort === 'submittedAt') sortQuery = { submittedAt: 1 };
    else if (sort === '-submittedAt') sortQuery = { submittedAt: -1 };
    else if (sort === 'grade') sortQuery = { grade: 1 };
    else if (sort === '-grade') sortQuery = { grade: -1 };

    const skip = (pageNum - 1) * limitNum;
    const [submissions, total] = await Promise.all([
      AssignmentSubmission.find(matchQuery)
        .populate('user', 'name email avatar')
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AssignmentSubmission.countDocuments(matchQuery),
    ]);

    const sanitized = submissions.map((s) => ({
      ...s,
      privateNotes: undefined,
    }));

    return {
      lecture: {
        _id: lecture._id,
        title: lecture.title,
        assignment: lecture.assignment,
      },
      submissions: sanitized,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    };
  }

  async getSubmissionDetail(instructorId: string, submissionId: string) {
    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('user', 'name email avatar')
      .populate('course', 'title')
      .populate('lecture', 'title assignment')
      .lean();

    if (!submission) throw ApiError.notFound('Submission not found');

    const lectureId = (submission.lecture as any)?._id || submission.lecture;
    await this.verifyInstructorOwnsLecture(instructorId, lectureId.toString());

    return submission;
  }

  async updateSubmissionStatus(
    instructorId: string,
    submissionId: string,
    { status, privateNotes }: { status: AssignmentStatus; privateNotes?: string }
  ) {
    const submission = await AssignmentSubmission.findById(submissionId);
    if (!submission) throw ApiError.notFound('Submission not found');

    await this.verifyInstructorOwnsLecture(instructorId, submission.lecture.toString());

    const allowedStatuses: AssignmentStatus[] = ['under_review', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      throw ApiError.badRequest(`Cannot set status to ${status} via this endpoint`);
    }

    submission.status = status;
    if (privateNotes !== undefined) submission.privateNotes = privateNotes;
    if (status === 'under_review') submission.reviewedAt = new Date();

    await submission.save();

    if (status === 'rejected') {
      await this.notifyStudent(
        submission.user.toString(),
        'Assignment Rejected',
        'Your assignment submission has been rejected.',
        submission._id.toString()
      );
    }

    return submission;
  }

  async gradeSubmission(instructorId: string, submissionId: string, payload: GradePayload) {
    const submission = await AssignmentSubmission.findById(submissionId);
    if (!submission) throw ApiError.notFound('Submission not found');

    await this.verifyInstructorOwnsLecture(instructorId, submission.lecture.toString());

    const lecture = await Lecture.findById(submission.lecture).lean();
    const maxMarks = payload.maxMarks || getDefaultMaxMarks(lecture, 100);

    assertValidGrade(payload.grade, maxMarks);

    const percentage = computePercentage(payload.grade, maxMarks);
    const passingMarks = lecture?.assignment?.passingMarks;
    const passFail = computePassFail(payload.grade, passingMarks, maxMarks);
    const letterGrade = payload.letterGrade || computeLetterGrade(percentage);

    const shouldPublish = payload.publish === true;
    const wasPreviouslyGraded = submission.status === 'graded' && submission.publishedAt;

    submission.grade = payload.grade;
    submission.maxMarks = maxMarks;
    submission.percentage = percentage;
    submission.passFail = passFail;
    submission.letterGrade = letterGrade;
    if (payload.customGradeScale) submission.customGradeScale = payload.customGradeScale;
    if (payload.feedback !== undefined) submission.feedback = payload.feedback;
    if (payload.privateNotes !== undefined) submission.privateNotes = payload.privateNotes;
    if (payload.rubric) submission.rubric = payload.rubric;
    if (payload.gradedFiles) submission.gradedFiles = payload.gradedFiles;
    submission.gradedBy = new mongoose.Types.ObjectId(instructorId);
    submission.gradedAt = new Date();

    if (shouldPublish) {
      submission.status = 'graded';
      submission.publishedAt = new Date();
      submission.publishedBy = new mongoose.Types.ObjectId(instructorId);

      submission.gradingHistory.push({
        grade: payload.grade,
        maxMarks,
        percentage,
        passFail,
        letterGrade,
        customGradeScale: payload.customGradeScale,
        feedback: payload.feedback,
        privateNotes: payload.privateNotes,
        status: 'graded',
        gradedBy: new mongoose.Types.ObjectId(instructorId),
        gradedAt: new Date(),
      });

      const notificationTitle = wasPreviouslyGraded ? 'Grade Updated' : 'Assignment Graded';
      const notificationMessage = wasPreviouslyGraded
        ? `Your grade has been updated for "${lecture?.title || 'assignment'}".`
        : `Your assignment "${lecture?.title || 'assignment'}" has been graded.`;

      await this.notifyStudent(
        submission.user.toString(),
        notificationTitle,
        notificationMessage,
        submission._id.toString()
      );
    } else {
      if (submission.status !== 'graded') {
        submission.status = 'under_review';
      }
    }

    await submission.save();
    return submission;
  }

  async returnForResubmission(instructorId: string, submissionId: string, payload: ReturnPayload) {
    const submission = await AssignmentSubmission.findById(submissionId);
    if (!submission) throw ApiError.notFound('Submission not found');

    await this.verifyInstructorOwnsLecture(instructorId, submission.lecture.toString());

    submission.status = 'returned_for_resubmission';
    if (payload.feedback !== undefined) submission.feedback = payload.feedback;
    if (payload.privateNotes !== undefined) submission.privateNotes = payload.privateNotes;
    if (payload.resubmissionDeadline) {
      submission.resubmissionDeadline = new Date(payload.resubmissionDeadline);
    }

    submission.gradingHistory.push({
      grade: submission.grade || 0,
      maxMarks: submission.maxMarks || 100,
      percentage: submission.percentage || 0,
      passFail: submission.passFail || 'fail',
      letterGrade: submission.letterGrade || 'F',
      feedback: payload.feedback,
      privateNotes: payload.privateNotes,
      status: 'returned_for_resubmission',
      gradedBy: new mongoose.Types.ObjectId(instructorId),
      gradedAt: new Date(),
    });

    await submission.save();

    const lecture = await Lecture.findById(submission.lecture).lean();
    await this.notifyStudent(
      submission.user.toString(),
      'Assignment Returned',
      `Your assignment "${lecture?.title || ''}" has been returned for resubmission.`,
      submission._id.toString()
    );

    return submission;
  }

  // ─── Admin ────────────────────────────────────────────────────

  async listAllSubmissions(query: ListQuery & { courseId?: string }): Promise<any> {
    const { page = 1, limit = 10, status, search, sort, courseId } = query;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 10));

    const matchQuery: any = {};
    if (status) matchQuery.status = status;
    if (courseId) matchQuery.course = courseId;

    if (search) {
      const escaped = escapeRegex(search);
      const users = await User.find({
        $or: [{ name: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }],
      })
        .select('_id')
        .lean();
      matchQuery.user = { $in: users.map((u) => u._id) };
    }

    let sortQuery: any = { submittedAt: -1 };
    if (sort === 'submittedAt') sortQuery = { submittedAt: 1 };
    else if (sort === '-submittedAt') sortQuery = { submittedAt: -1 };
    else if (sort === 'grade') sortQuery = { grade: 1 };
    else if (sort === '-grade') sortQuery = { grade: -1 };

    const skip = (pageNum - 1) * limitNum;
    const [submissions, total] = await Promise.all([
      AssignmentSubmission.find(matchQuery)
        .populate('user', 'name email')
        .populate('course', 'title')
        .populate('lecture', 'title')
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AssignmentSubmission.countDocuments(matchQuery),
    ]);

    const sanitized = submissions.map((s) => ({
      ...s,
      privateNotes: undefined,
    }));

    return {
      submissions: sanitized,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    };
  }

  async getSubmissionForAdmin(submissionId: string) {
    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('user', 'name email avatar')
      .populate('course', 'title')
      .populate('lecture', 'title assignment')
      .populate('gradedBy', 'name')
      .populate('publishedBy', 'name')
      .lean();

    if (!submission) throw ApiError.notFound('Submission not found');
    return submission;
  }

  async overrideGrade(adminId: string, submissionId: string, payload: GradePayload) {
    const submission = await AssignmentSubmission.findById(submissionId);
    if (!submission) throw ApiError.notFound('Submission not found');

    const lecture = await Lecture.findById(submission.lecture).lean();
    const maxMarks = payload.maxMarks || getDefaultMaxMarks(lecture, 100);

    assertValidGrade(payload.grade, maxMarks);

    const percentage = computePercentage(payload.grade, maxMarks);
    const passingMarks = lecture?.assignment?.passingMarks;
    const passFail = computePassFail(payload.grade, passingMarks, maxMarks);
    const letterGrade = payload.letterGrade || computeLetterGrade(percentage);

    submission.grade = payload.grade;
    submission.maxMarks = maxMarks;
    submission.percentage = percentage;
    submission.passFail = passFail;
    submission.letterGrade = letterGrade;
    if (payload.customGradeScale) submission.customGradeScale = payload.customGradeScale;
    if (payload.feedback !== undefined) submission.feedback = payload.feedback;
    if (payload.privateNotes !== undefined) submission.privateNotes = payload.privateNotes;
    if (payload.rubric) submission.rubric = payload.rubric;
    if (payload.gradedFiles) submission.gradedFiles = payload.gradedFiles;
    submission.gradedBy = new mongoose.Types.ObjectId(adminId);
    submission.gradedAt = new Date();
    submission.status = 'graded';
    submission.publishedAt = new Date();
    submission.publishedBy = new mongoose.Types.ObjectId(adminId);

    submission.gradingHistory.push({
      grade: payload.grade,
      maxMarks,
      percentage,
      passFail,
      letterGrade,
      customGradeScale: payload.customGradeScale,
      feedback: payload.feedback,
      privateNotes: payload.privateNotes,
      status: 'graded',
      gradedBy: new mongoose.Types.ObjectId(adminId),
      gradedAt: new Date(),
    });

    await submission.save();

    await this.notifyStudent(
      submission.user.toString(),
      'Grade Updated (Admin Override)',
      'Your grade has been updated by an administrator.',
      submission._id.toString()
    );

    return submission;
  }

  async getSubmissionAnalytics(query: { courseId?: string }) {
    const matchQuery: any = {};
    if (query.courseId) matchQuery.course = query.courseId;

    const [statusCounts, averageGrade, total] = await Promise.all([
      AssignmentSubmission.aggregate([{ $match: matchQuery }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      AssignmentSubmission.aggregate([
        { $match: { ...matchQuery, status: 'graded', grade: { $exists: true } } },
        {
          $group: {
            _id: null,
            avgGrade: { $avg: '$grade' },
            avgPercentage: { $avg: '$percentage' },
            passCount: { $sum: { $cond: [{ $eq: ['$passFail', 'pass'] }, 1, 0] } },
            failCount: { $sum: { $cond: [{ $eq: ['$passFail', 'fail'] }, 1, 0] } },
          },
        },
      ]),
      AssignmentSubmission.countDocuments(matchQuery),
    ]);

    const statusMap = Object.fromEntries(statusCounts.map((c) => [c._id, c.count]));
    const stats = averageGrade[0] || { avgGrade: 0, avgPercentage: 0, passCount: 0, failCount: 0 };

    return {
      total,
      byStatus: {
        submitted: statusMap['submitted'] || 0,
        lateSubmission: statusMap['late_submission'] || 0,
        underReview: statusMap['under_review'] || 0,
        graded: statusMap['graded'] || 0,
        returnedForResubmission: statusMap['returned_for_resubmission'] || 0,
        rejected: statusMap['rejected'] || 0,
      },
      gradingStats: {
        averageGrade: Math.round(stats.avgGrade * 100) / 100,
        averagePercentage: Math.round(stats.avgPercentage * 100) / 100,
        passCount: stats.passCount,
        failCount: stats.failCount,
        passRate:
          stats.passCount + stats.failCount > 0
            ? Math.round((stats.passCount / (stats.passCount + stats.failCount)) * 10000) / 100
            : 0,
      },
    };
  }

  async getGradingLogs(query: { page: number; limit: number; courseId?: string }) {
    const { page, limit, courseId } = query;

    const matchQuery: any = { 'gradingHistory.0': { $exists: true } };
    if (courseId) matchQuery.course = courseId;

    const skip = (page - 1) * limit;
    const [submissions, total] = await Promise.all([
      AssignmentSubmission.find(matchQuery)
        .populate('user', 'name email')
        .populate('course', 'title')
        .populate('lecture', 'title')
        .populate('gradingHistory.gradedBy', 'name')
        .sort({ 'gradingHistory.gradedAt': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AssignmentSubmission.countDocuments(matchQuery),
    ]);

    const logs = submissions.flatMap((s) =>
      (s.gradingHistory || []).map((h) => ({
        submissionId: s._id,
        user: s.user,
        course: s.course,
        lecture: s.lecture,
        ...h,
      }))
    );

    logs.sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime());

    return {
      logs: logs.slice(0, limit),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private async getInstructorCourseIds(instructorId: string): Promise<mongoose.Types.ObjectId[]> {
    const courses = await Course.find({ instructor: instructorId }).select('_id').lean();
    return courses.map((c) => c._id);
  }

  private async verifyInstructorOwnsLecture(instructorId: string, lectureId: string) {
    const lecture = await Lecture.findById(lectureId).lean();
    if (!lecture) throw ApiError.notFound('Lecture not found');

    if (lecture.type !== 'assignment') {
      throw ApiError.badRequest('This lecture is not an assignment');
    }

    const course = await Course.findById(lecture.course).lean();
    if (!course) throw ApiError.notFound('Course not found');
    if (course.instructor.toString() !== instructorId) {
      throw ApiError.forbidden('You do not have access to this assignment');
    }

    return { ...lecture, course };
  }

  private async notifyStudent(userId: string, title: string, message: string, link?: string) {
    try {
      await Notification.create({
        user: userId,
        title,
        message,
        type: 'assignment',
        link: link ? `/student/assignments/${link}` : undefined,
      });
    } catch {
      // Fire and forget - notification failure should not block grading
    }
  }
}

export const assignmentService = new AssignmentService();
