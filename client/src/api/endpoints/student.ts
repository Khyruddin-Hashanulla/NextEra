import axiosInstance from '../axiosInstance';
import type { StudentDashboard, EnrolledCourse, CourseDetail, Note, Bookmark, Discussion, Review, QuizAttempt, AssignmentSubmission, AssignmentOverviewResponse, AssignmentDetailResponse, Certificate, Bundle, SubscriptionPlan, SubscriptionEnrollment } from '@/types/student';

export const studentApi = {
  getDashboard: (signal?: AbortSignal) => axiosInstance.get<{ data: StudentDashboard }>('/student/dashboard', { signal }),

  listCourses: (params?: { search?: string; category?: string; level?: string; sort?: string; featured?: string; page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<{ data: any }>('/student/courses', { params, signal }),

  listInstructors: (signal?: AbortSignal) =>
    axiosInstance.get<{ data: any[] }>('/student/instructors', { signal }),

  getInstructorProfile: (id: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: any }>(`/student/instructors/${id}`, { signal }),

  getCourseDetail: (id: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: CourseDetail }>(`/student/courses/${id}`, { signal }),

  getMyCourses: (signal?: AbortSignal) =>
    axiosInstance.get<{ data: EnrolledCourse[] }>('/student/my-courses', { signal }),

  initiatePayment: (courseId: string, couponCode?: string, signal?: AbortSignal) =>
    axiosInstance.post<{ data: any }>('/student/payments/initiate', { courseId, couponCode }, { signal }),

  enrollFreeCourse: (courseId: string, signal?: AbortSignal) =>
    axiosInstance.post<{ data: any }>(`/student/courses/${courseId}/enroll-free`, undefined, { signal }),

  verifyPayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: { success: boolean } }>('/student/payments/verify', data, { signal }),

  updateProgress: (courseId: string, data: { lectureId: string; position?: number; completed?: boolean; duration?: number }, signal?: AbortSignal) =>
    axiosInstance.put<{ data: any }>(`/student/progress/${courseId}`, data, { signal }),

  getProgress: (courseId: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: any }>(`/student/progress/${courseId}`, { signal }),

  getWatchHistory: (signal?: AbortSignal) =>
    axiosInstance.get<{ data: EnrolledCourse[] }>('/student/watch-history', { signal }),

  createNote: (data: { courseId: string; lectureId: string; content: string; timestamp?: number }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: Note }>('/student/notes', data, { signal }),

  listNotes: (params?: { courseId?: string; lectureId?: string }, signal?: AbortSignal) =>
    axiosInstance.get<{ data: Note[] }>('/student/notes', { params, signal }),

  updateNote: (id: string, data: { content: string; timestamp?: number }, signal?: AbortSignal) =>
    axiosInstance.put<{ data: Note }>(`/student/notes/${id}`, data, { signal }),

  deleteNote: (id: string, signal?: AbortSignal) =>
    axiosInstance.delete(`/student/notes/${id}`, { signal }),

  toggleBookmark: (data: { courseId: string; lectureId: string }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: { bookmarked: boolean } }>('/student/bookmarks', data, { signal }),

  listBookmarks: (params?: { courseId?: string }, signal?: AbortSignal) =>
    axiosInstance.get<{ data: Bookmark[] }>('/student/bookmarks', { params, signal }),

  createDiscussion: (data: { courseId: string; lectureId?: string; title: string; content: string }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: Discussion }>('/student/discussions', data, { signal }),

  listDiscussions: (courseId: string, params?: { lectureId?: string; page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<{ data: any }>(`/student/discussions/${courseId}`, { params, signal }),

  replyToDiscussion: (id: string, content: string, signal?: AbortSignal) =>
    axiosInstance.post<{ data: Discussion }>(`/student/discussions/${id}/reply`, { content }, { signal }),

  createReview: (data: { courseId: string; rating: number; review?: string }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: Review }>('/student/reviews', data, { signal }),

  updateReview: (id: string, data: { rating: number; review?: string }, signal?: AbortSignal) =>
    axiosInstance.put<{ data: Review }>(`/student/reviews/${id}`, data, { signal }),

  listReviews: (courseId: string, params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<{ data: any }>(`/student/reviews/${courseId}`, { params, signal }),

  submitQuiz: (data: { courseId: string; lectureId: string; answers: { question: string; selectedAnswer: string }[] }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: QuizAttempt }>('/student/quiz', data, { signal }),

  getQuizAttempts: (lectureId: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: QuizAttempt[] }>(`/student/quiz/${lectureId}/attempts`, { signal }),

  getQuizzes: (signal?: AbortSignal) =>
    axiosInstance.get<{ data: any }>('/quiz/overview', { signal }),

  submitAssignment: (data: { courseId: string; lectureId: string; content?: string; files?: { url: string; publicId: string; name: string }[] }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: AssignmentSubmission }>('/student/assignments', data, { signal }),

  uploadAssignmentFile: (file: File, onProgress?: (percent: number) => void, signal?: AbortSignal) => {
    const fd = new FormData();
    fd.append('file', file);
    return axiosInstance.post<{ data: { url: string; publicId: string; name: string } }>('/upload/assignment', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal,
      onUploadProgress: (e) => {
        if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100));
      },
    });
  },

  getAssignments: (params?: { courseId?: string }, signal?: AbortSignal) =>
    axiosInstance.get<{ data: AssignmentSubmission[] }>('/student/assignments', { params, signal }),

  getAssignmentsOverview: (params?: { page?: number; limit?: number; courseId?: string; status?: string }, signal?: AbortSignal) =>
    axiosInstance.get<{ data: AssignmentOverviewResponse }>('/student/assignments/overview', { params, signal }),

  getAssignmentDetail: (lectureId: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: AssignmentDetailResponse }>(`/student/assignments/${lectureId}`, { signal }),

  generateCertificate: (courseId: string, signal?: AbortSignal) =>
    axiosInstance.post<{ data: Certificate }>(`/student/certificates/${courseId}`, undefined, { signal }),

  getCertificates: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<{ data: { certificates: Certificate[]; total: number; page: number; limit: number; totalPages: number } }>('/student/certificates', { params, signal }),

  verifyCertificate: (certificateId: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: Certificate }>(`/student/certificates/verify/${certificateId}`, { signal }),

  downloadCertificate: (certificateId: string, signal?: AbortSignal) =>
    axiosInstance.get(`/student/certificates/download/${certificateId}`, { responseType: 'blob', signal }),

  toggleWishlist: (courseId: string, signal?: AbortSignal) =>
    axiosInstance.post<{ data: { wishlisted: boolean } }>('/student/wishlist', { courseId }, { signal }),

  listWishlist: (signal?: AbortSignal) =>
    axiosInstance.get<{ data: any[] }>('/student/wishlist', { signal }),

  listMyPayments: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<{ data: { payments: any[]; total: number; page: number; totalPages: number } }>('/student/payments', { params, signal }),

  getPaymentById: (id: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: any }>(`/student/payments/${id}`, { signal }),

  retryPayment: (paymentId: string, signal?: AbortSignal) =>
    axiosInstance.post<{ data: any }>(`/student/payments/${paymentId}/retry`, undefined, { signal }),

  generateInvoice: (paymentId: string, signal?: AbortSignal) =>
    axiosInstance.get(`/student/payments/${paymentId}/invoice`, { responseType: 'blob', signal }),

  getLectureResources: (lectureId: string, courseId: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: any[] }>(`/student/resources/${lectureId}`, { params: { courseId }, signal }),

  listNotifications: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<{ data: { notifications: any[]; unreadCount: number; total: number } }>('/student/notifications', { params, signal }),

  markNotificationRead: (id: string, signal?: AbortSignal) =>
    axiosInstance.put<{ data: any }>(`/student/notifications/${id}/read`, undefined, { signal }),

  markAllNotificationsRead: (signal?: AbortSignal) =>
    axiosInstance.put<{ data: { success: boolean } }>('/student/notifications/read-all', undefined, { signal }),

  listBundles: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<{ data: { bundles: Bundle[]; total: number; page: number; totalPages: number } }>('/student/bundles', { params, signal }),
  getBundleById: (id: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: Bundle }>(`/student/bundles/${id}`, { signal }),
  initiateBundlePayment: (bundleId: string, couponCode?: string, signal?: AbortSignal) =>
    axiosInstance.post<{ data: any }>('/student/bundles/payments/initiate', { bundleId, couponCode }, { signal }),
  verifyBundlePayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: { success: boolean; paymentId: string; enrollments: any[] } }>('/student/bundles/payments/verify', data, { signal }),

  listSubscriptionPlans: (signal?: AbortSignal) =>
    axiosInstance.get<{ data: SubscriptionPlan[] }>('/student/subscriptions/plans', { signal }),
  getMySubscription: (signal?: AbortSignal) =>
    axiosInstance.get<{ data: SubscriptionEnrollment | null }>('/student/subscriptions/my', { signal }),
  initiateSubscriptionPayment: (subscriptionId: string, couponCode?: string, signal?: AbortSignal) =>
    axiosInstance.post<{ data: any }>('/student/subscriptions/payments/initiate', { subscriptionId, couponCode }, { signal }),
  verifySubscriptionPayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: { success: boolean; paymentId: string; subscriptionEnrollment: any } }>('/student/subscriptions/payments/verify', data, { signal }),
};
