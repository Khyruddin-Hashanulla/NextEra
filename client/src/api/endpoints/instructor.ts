import axiosInstance from '../axiosInstance';
import { ApiResponse } from '@/types/api';
import {
  Course, Section, Lecture, InstructorDashboard, InstructorRevenue,
  InstructorPayoutsResponse, InstructorAnalytics, InstructorStudent,
  InstructorCoupon, InstructorReview, Announcement, InstructorProfile,
  InstructorCertificate, SubscriptionStatus,
} from '@/types/instructor';
import { InstructorRevenueDetail, InstructorSubscription } from '@/types/revenue';

export const instructorApi = {
  apply: (data: Record<string, any>) =>
    axiosInstance.post<ApiResponse<any>>('/instructor/apply', data),

  getApplicationStatus: () =>
    axiosInstance.get<ApiResponse<{ applied: boolean; status?: string; application?: any }>>('/instructor/application-status'),

  getDashboard: () =>
    axiosInstance.get<ApiResponse<InstructorDashboard>>('/instructor/dashboard'),

  getRevenue: (startDate?: string, endDate?: string) =>
    axiosInstance.get<ApiResponse<InstructorRevenue>>('/instructor/revenue', { params: { startDate, endDate } }),

  getAnalytics: () =>
    axiosInstance.get<ApiResponse<InstructorAnalytics>>('/instructor/analytics'),

  getMyPayouts: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<ApiResponse<InstructorPayoutsResponse>>('/instructor/payouts', { params }),

  // Courses
  listMyCourses: (status?: string) =>
    axiosInstance.get<ApiResponse<Course[]>>('/courses/instructor', { params: { status } }),

  getCourse: (id: string) =>
    axiosInstance.get<ApiResponse<Course>>(`/courses/${id}`),

  createCourse: (data: Partial<Course>) =>
    axiosInstance.post<ApiResponse<Course>>('/courses', data),

  updateCourse: (id: string, data: Partial<Course>) =>
    axiosInstance.put<ApiResponse<Course>>(`/courses/${id}`, data),

  deleteCourse: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/courses/${id}`),

  duplicateCourse: (id: string) =>
    axiosInstance.post<ApiResponse<Course>>(`/courses/${id}/duplicate`),

  submitForReview: (id: string) =>
    axiosInstance.post<ApiResponse<Course>>(`/courses/${id}/submit`),

  publish: (id: string) =>
    axiosInstance.post<ApiResponse<Course>>(`/courses/${id}/publish`),

  unpublishCourse: (id: string) =>
    axiosInstance.post<ApiResponse<Course>>(`/courses/${id}/unpublish`),

  archive: (id: string) =>
    axiosInstance.post<ApiResponse<Course>>(`/courses/${id}/archive`),

  // Curriculum
  getCurriculum: (id: string) =>
    axiosInstance.get<ApiResponse<Section[]>>(`/courses/${id}/curriculum`),

  getSection: (courseId: string, sectionId: string) =>
    axiosInstance.get<ApiResponse<Section>>(`/courses/${courseId}/sections/${sectionId}`),

  createSection: (courseId: string, data: { title: string; description?: string; objective?: string }) =>
    axiosInstance.post<ApiResponse<Section>>(`/courses/${courseId}/sections`, data),

  updateSection: (courseId: string, sectionId: string, data: Record<string, any>) =>
    axiosInstance.put<ApiResponse<Section>>(`/courses/${courseId}/sections/${sectionId}`, data),

  deleteSection: (courseId: string, sectionId: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/courses/${courseId}/sections/${sectionId}`),

  reorderSections: (courseId: string, sectionOrder: { sectionId: string; order: number }[]) =>
    axiosInstance.put<ApiResponse<null>>(`/courses/${courseId}/sections/reorder`, { sectionOrder }),

  createLecture: (courseId: string, sectionId: string, data: Record<string, any>) =>
    axiosInstance.post<ApiResponse<Lecture>>(`/courses/${courseId}/sections/${sectionId}/lectures`, data),

  updateLecture: (courseId: string, lectureId: string, data: Record<string, any>) =>
    axiosInstance.put<ApiResponse<Lecture>>(`/courses/${courseId}/lectures/${lectureId}`, data),

  deleteLecture: (courseId: string, lectureId: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/courses/${courseId}/lectures/${lectureId}`),

  reorderLectures: (courseId: string, sectionId: string, lectureOrder: { lectureId: string; order: number }[]) =>
    axiosInstance.put<ApiResponse<null>>(`/courses/${courseId}/sections/${sectionId}/lectures/reorder`, { lectureOrder }),

  getLecture: (courseId: string, lectureId: string) =>
    axiosInstance.get<ApiResponse<Lecture>>(`/courses/${courseId}/lectures/${lectureId}`),

  // Students
  getStudents: (params?: { page?: number; limit?: number; search?: string }) =>
    axiosInstance.get<ApiResponse<{ students: InstructorStudent[]; pagination: any }>>('/instructor/students', { params }),

  // Coupons
  listCoupons: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<ApiResponse<{ coupons: InstructorCoupon[]; pagination: any }>>('/instructor/coupons', { params }),

  createCoupon: (data: Partial<InstructorCoupon>) =>
    axiosInstance.post<ApiResponse<InstructorCoupon>>('/instructor/coupons', data),

  updateCoupon: (id: string, data: Partial<InstructorCoupon>) =>
    axiosInstance.put<ApiResponse<InstructorCoupon>>(`/instructor/coupons/${id}`, data),

  deleteCoupon: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/instructor/coupons/${id}`),

  // Reviews
  getReviews: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<ApiResponse<{ reviews: InstructorReview[]; pagination: any }>>('/instructor/reviews', { params }),

  replyToReview: (reviewId: string, reply: string) =>
    axiosInstance.post<ApiResponse<InstructorReview>>(`/instructor/reviews/${reviewId}/reply`, { reply }),

  // Announcements
  listAnnouncements: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<ApiResponse<{ announcements: Announcement[]; pagination: any }>>('/instructor/announcements', { params }),

  createAnnouncement: (data: { course: string; title: string; message: string; sendEmail?: boolean }) =>
    axiosInstance.post<ApiResponse<Announcement>>('/instructor/announcements', data),

  deleteAnnouncement: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/instructor/announcements/${id}`),

  // Profile
  getProfile: () =>
    axiosInstance.get<ApiResponse<InstructorProfile>>('/instructor/profile'),

  updateProfile: (data: Partial<InstructorProfile>) =>
    axiosInstance.put<ApiResponse<InstructorProfile>>('/instructor/profile', data),

  // Subscription
  getSubscriptionStatus: () =>
    axiosInstance.get<ApiResponse<SubscriptionStatus>>('/instructor/subscription'),

  // Certificates
  listCertificates: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<ApiResponse<{ certificates: InstructorCertificate[]; pagination: any }>>('/instructor/certificates', { params }),

  issueCertificate: (data: { user: string; course: string }) =>
    axiosInstance.post<ApiResponse<InstructorCertificate>>('/instructor/certificates', data),

  // Revenue Detail
  getRevenueDetail: () =>
    axiosInstance.get<ApiResponse<InstructorRevenueDetail>>('/instructor/revenue/detail'),

  // Instructor Subscription (Self-Service)
  getMyInstructorSubscription: () =>
    axiosInstance.get<ApiResponse<InstructorSubscription>>('/instructor/my-subscription'),

  purchaseInstructorSubscription: (planId: string) =>
    axiosInstance.post<ApiResponse<any>>('/instructor/my-subscription/purchase', { planId }),

  cancelInstructorSubscription: () =>
    axiosInstance.post<ApiResponse<any>>('/instructor/my-subscription/cancel'),
};
