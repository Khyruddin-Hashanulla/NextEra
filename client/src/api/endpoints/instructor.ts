import axiosInstance from '../axiosInstance';
import { ApiResponse } from '@/types/api';
import {
  Course, Section, Lecture, InstructorDashboard, InstructorRevenue,
  InstructorPayoutsResponse, InstructorAnalytics, InstructorStudent,
  InstructorCoupon, InstructorReview, Announcement, InstructorProfile,
  InstructorCertificate, SubscriptionStatus,
  InstructorAssignmentDashboardResponse, InstructorAssignmentStats,
  InstructorSubmissionsResponse, InstructorSubmissionDetail,
  InstructorAssignmentStatus,
} from '@/types/instructor';
import { InstructorRevenueDetail, InstructorSubscription } from '@/types/revenue';

export const instructorApi = {
  apply: (data: Record<string, any>, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<any>>('/instructor/apply', data, { signal }),

  getApplicationStatus: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ applied: boolean; status?: string; application?: any }>>('/instructor/application-status', { signal }),

  getDashboard: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<InstructorDashboard>>('/instructor/dashboard', { signal }),

  getRevenue: (startDate?: string, endDate?: string, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<InstructorRevenue>>('/instructor/revenue', { params: { startDate, endDate }, signal }),

  getAnalytics: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<InstructorAnalytics>>('/instructor/analytics', { signal }),

  getMyPayouts: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<InstructorPayoutsResponse>>('/instructor/payouts', { params, signal }),

  listMyCourses: (status?: string, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<Course[]>>('/courses/instructor', { params: { status }, signal }),

  getCourse: (id: string, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<Course>>(`/courses/${id}`, { signal }),

  createCourse: (data: Partial<Course>, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<Course>>('/courses', data, { signal }),

  updateCourse: (id: string, data: Partial<Course>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<Course>>(`/courses/${id}`, data, { signal }),

  deleteCourse: (id: string, signal?: AbortSignal) =>
    axiosInstance.delete<ApiResponse<null>>(`/courses/${id}`, { signal }),

  duplicateCourse: (id: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<Course>>(`/courses/${id}/duplicate`, undefined, { signal }),

  submitForReview: (id: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<Course>>(`/courses/${id}/submit`, undefined, { signal }),

  publish: (id: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<Course>>(`/courses/${id}/publish`, undefined, { signal }),

  unpublishCourse: (id: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<Course>>(`/courses/${id}/unpublish`, undefined, { signal }),

  archive: (id: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<Course>>(`/courses/${id}/archive`, undefined, { signal }),

  getCurriculum: (id: string, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<Section[]>>(`/courses/${id}/curriculum`, { signal }),

  getSection: (courseId: string, sectionId: string, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<Section>>(`/courses/${courseId}/sections/${sectionId}`, { signal }),

  createSection: (courseId: string, data: { title: string; description?: string; objective?: string }, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<Section>>(`/courses/${courseId}/sections`, data, { signal }),

  updateSection: (courseId: string, sectionId: string, data: Record<string, any>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<Section>>(`/courses/${courseId}/sections/${sectionId}`, data, { signal }),

  deleteSection: (courseId: string, sectionId: string, signal?: AbortSignal) =>
    axiosInstance.delete<ApiResponse<null>>(`/courses/${courseId}/sections/${sectionId}`, { signal }),

  reorderSections: (courseId: string, sectionOrder: { sectionId: string; order: number }[], signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<null>>(`/courses/${courseId}/sections/reorder`, { sectionOrder }, { signal }),

  createLecture: (courseId: string, sectionId: string, data: Record<string, any>, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<Lecture>>(`/courses/${courseId}/sections/${sectionId}/lectures`, data, { signal }),

  updateLecture: (courseId: string, lectureId: string, data: Record<string, any>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<Lecture>>(`/courses/${courseId}/lectures/${lectureId}`, data, { signal }),

  deleteLecture: (courseId: string, lectureId: string, signal?: AbortSignal) =>
    axiosInstance.delete<ApiResponse<null>>(`/courses/${courseId}/lectures/${lectureId}`, { signal }),

  reorderLectures: (courseId: string, sectionId: string, lectureOrder: { lectureId: string; order: number }[], signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<null>>(`/courses/${courseId}/sections/${sectionId}/lectures/reorder`, { lectureOrder }, { signal }),

  getLecture: (courseId: string, lectureId: string, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<Lecture>>(`/courses/${courseId}/lectures/${lectureId}`, { signal }),

  getStudents: (params?: { page?: number; limit?: number; search?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ students: InstructorStudent[]; pagination: any }>>('/instructor/students', { params, signal }),

  listCoupons: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ coupons: InstructorCoupon[]; pagination: any }>>('/instructor/coupons', { params, signal }),

  createCoupon: (data: Partial<InstructorCoupon>, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<InstructorCoupon>>('/instructor/coupons', data, { signal }),

  updateCoupon: (id: string, data: Partial<InstructorCoupon>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<InstructorCoupon>>(`/instructor/coupons/${id}`, data, { signal }),

  deleteCoupon: (id: string, signal?: AbortSignal) =>
    axiosInstance.delete<ApiResponse<null>>(`/instructor/coupons/${id}`, { signal }),

  getReviews: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ reviews: InstructorReview[]; pagination: any }>>('/instructor/reviews', { params, signal }),

  replyToReview: (reviewId: string, reply: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<InstructorReview>>(`/instructor/reviews/${reviewId}/reply`, { reply }, { signal }),

  listAnnouncements: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ announcements: Announcement[]; pagination: any }>>('/instructor/announcements', { params, signal }),

  createAnnouncement: (data: { course: string; title: string; message: string; sendEmail?: boolean }, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<Announcement>>('/instructor/announcements', data, { signal }),

  deleteAnnouncement: (id: string, signal?: AbortSignal) =>
    axiosInstance.delete<ApiResponse<null>>(`/instructor/announcements/${id}`, { signal }),

  getProfile: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<InstructorProfile>>('/instructor/profile', { signal }),

  updateProfile: (data: Partial<InstructorProfile>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<InstructorProfile>>('/instructor/profile', data, { signal }),

  getSubscriptionStatus: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<SubscriptionStatus>>('/instructor/subscription', { signal }),

  listCertificates: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ certificates: InstructorCertificate[]; pagination: any }>>('/instructor/certificates', { params, signal }),

  issueCertificate: (data: { user: string; course: string }, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<InstructorCertificate>>('/instructor/certificates', data, { signal }),

  getRevenueDetail: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<InstructorRevenueDetail>>('/instructor/revenue/detail', { signal }),

  getMyInstructorSubscription: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<InstructorSubscription>>('/instructor/my-subscription', { signal }),

  purchaseInstructorSubscription: (planId: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<any>>('/instructor/my-subscription/purchase', { planId }, { signal }),

  cancelInstructorSubscription: (signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<any>>('/instructor/my-subscription/cancel', undefined, { signal }),

  getAssignments: (params?: { page?: number; limit?: number; search?: string; status?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<InstructorAssignmentDashboardResponse>>('/instructor/assignments', { params, signal }),

  getAssignmentStats: (signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<InstructorAssignmentStats>>('/instructor/assignments/stats', { signal }),

  getLectureSubmissions: (lectureId: string, params?: { page?: number; limit?: number; status?: string; search?: string; sort?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<InstructorSubmissionsResponse>>(`/instructor/assignments/${lectureId}/submissions`, { params, signal }),

  getSubmissionDetail: (submissionId: string, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<InstructorSubmissionDetail>>(`/instructor/assignments/submissions/${submissionId}`, { signal }),

  updateSubmissionStatus: (submissionId: string, data: { status: 'under_review' | 'rejected'; privateNotes?: string }, signal?: AbortSignal) =>
    axiosInstance.patch<ApiResponse<InstructorSubmissionDetail>>(`/instructor/assignments/submissions/${submissionId}/status`, data, { signal }),

  gradeSubmission: (submissionId: string, data: {
    grade: number;
    maxMarks?: number;
    feedback?: string;
    privateNotes?: string;
    letterGrade?: string;
    customGradeScale?: string;
    rubric?: { criteria: string; maxPoints: number; obtainedPoints: number; comment?: string }[];
    gradedFiles?: { url: string; publicId: string; name: string }[];
    publish?: boolean;
  }, signal?: AbortSignal) =>
    axiosInstance.patch<ApiResponse<InstructorSubmissionDetail>>(`/instructor/assignments/submissions/${submissionId}/grade`, data, { signal }),

  returnForResubmission: (submissionId: string, data: { feedback?: string; privateNotes?: string; resubmissionDeadline?: string }, signal?: AbortSignal) =>
    axiosInstance.patch<ApiResponse<InstructorSubmissionDetail>>(`/instructor/assignments/submissions/${submissionId}/return`, data, { signal }),
};
