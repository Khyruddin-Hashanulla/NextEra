import axiosInstance from '../axiosInstance';
import type { StudentDashboard, EnrolledCourse, CourseDetail, Note, Bookmark, Discussion, Review, QuizAttempt, AssignmentSubmission, Certificate, Bundle, SubscriptionPlan, SubscriptionEnrollment } from '@/types/student';

export const studentApi = {
  getDashboard: () => axiosInstance.get<{ data: StudentDashboard }>('/student/dashboard'),

  listCourses: (params?: { search?: string; category?: string; level?: string; page?: number; limit?: number }) =>
    axiosInstance.get<{ data: any }>('/student/courses', { params }),

  getCourseDetail: (id: string) =>
    axiosInstance.get<{ data: CourseDetail }>(`/student/courses/${id}`),

  getMyCourses: () =>
    axiosInstance.get<{ data: EnrolledCourse[] }>('/student/my-courses'),

  initiatePayment: (courseId: string, couponCode?: string) =>
    axiosInstance.post<{ data: any }>('/student/payments/initiate', { courseId, couponCode }),

  verifyPayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    axiosInstance.post<{ data: { success: boolean } }>('/student/payments/verify', data),

  updateProgress: (courseId: string, data: { lectureId: string; position?: number; completed?: boolean; duration?: number }) =>
    axiosInstance.put<{ data: any }>(`/student/progress/${courseId}`, data),

  getProgress: (courseId: string) =>
    axiosInstance.get<{ data: any }>(`/student/progress/${courseId}`),

  getWatchHistory: () =>
    axiosInstance.get<{ data: EnrolledCourse[] }>('/student/watch-history'),

  createNote: (data: { courseId: string; lectureId: string; content: string; timestamp?: number }) =>
    axiosInstance.post<{ data: Note }>('/student/notes', data),

  listNotes: (params?: { courseId?: string; lectureId?: string }) =>
    axiosInstance.get<{ data: Note[] }>('/student/notes', { params }),

  updateNote: (id: string, data: { content: string; timestamp?: number }) =>
    axiosInstance.put<{ data: Note }>(`/student/notes/${id}`, data),

  deleteNote: (id: string) =>
    axiosInstance.delete(`/student/notes/${id}`),

  toggleBookmark: (data: { courseId: string; lectureId: string }) =>
    axiosInstance.post<{ data: { bookmarked: boolean } }>('/student/bookmarks', data),

  listBookmarks: (params?: { courseId?: string }) =>
    axiosInstance.get<{ data: Bookmark[] }>('/student/bookmarks', { params }),

  createDiscussion: (data: { courseId: string; lectureId?: string; title: string; content: string }) =>
    axiosInstance.post<{ data: Discussion }>('/student/discussions', data),

  listDiscussions: (courseId: string, params?: { lectureId?: string; page?: number; limit?: number }) =>
    axiosInstance.get<{ data: any }>(`/student/discussions/${courseId}`, { params }),

  replyToDiscussion: (id: string, content: string) =>
    axiosInstance.post<{ data: Discussion }>(`/student/discussions/${id}/reply`, { content }),

  createReview: (data: { courseId: string; rating: number; review?: string }) =>
    axiosInstance.post<{ data: Review }>('/student/reviews', data),

  updateReview: (id: string, data: { rating: number; review?: string }) =>
    axiosInstance.put<{ data: Review }>(`/student/reviews/${id}`, data),

  listReviews: (courseId: string, params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ data: any }>(`/student/reviews/${courseId}`, { params }),

  submitQuiz: (data: { courseId: string; lectureId: string; answers: { question: string; selectedAnswer: string }[] }) =>
    axiosInstance.post<{ data: QuizAttempt }>('/student/quiz', data),

  getQuizAttempts: (lectureId: string) =>
    axiosInstance.get<{ data: QuizAttempt[] }>(`/student/quiz/${lectureId}/attempts`),

  submitAssignment: (data: { courseId: string; lectureId: string; content?: string }) =>
    axiosInstance.post<{ data: AssignmentSubmission }>('/student/assignments', data),

  getAssignments: (params?: { courseId?: string }) =>
    axiosInstance.get<{ data: AssignmentSubmission[] }>('/student/assignments', { params }),

  generateCertificate: (courseId: string) =>
    axiosInstance.post<{ data: Certificate }>(`/student/certificates/${courseId}`),

  getCertificates: () =>
    axiosInstance.get<{ data: Certificate[] }>('/student/certificates'),

  verifyCertificate: (certificateId: string) =>
    axiosInstance.get<{ data: Certificate }>(`/student/certificates/verify/${certificateId}`),

  toggleWishlist: (courseId: string) =>
    axiosInstance.post<{ data: { wishlisted: boolean } }>('/student/wishlist', { courseId }),

  listWishlist: () =>
    axiosInstance.get<{ data: any[] }>('/student/wishlist'),

  listMyPayments: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ data: { payments: any[]; total: number; page: number; totalPages: number } }>('/student/payments', { params }),

  getPaymentById: (id: string) =>
    axiosInstance.get<{ data: any }>(`/student/payments/${id}`),

  generateInvoice: (paymentId: string) =>
    axiosInstance.get(`/student/payments/${paymentId}/invoice`, { responseType: 'blob' }),

  getLectureResources: (lectureId: string, courseId: string) =>
    axiosInstance.get<{ data: any[] }>(`/student/resources/${lectureId}`, { params: { courseId } }),

  listNotifications: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ data: { notifications: any[]; unreadCount: number; total: number } }>('/student/notifications', { params }),

  markNotificationRead: (id: string) =>
    axiosInstance.put<{ data: any }>(`/student/notifications/${id}/read`),

  markAllNotificationsRead: () =>
    axiosInstance.put<{ data: { success: boolean } }>('/student/notifications/read-all'),

  // Bundles
  listBundles: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ data: { bundles: Bundle[]; total: number; page: number; totalPages: number } }>('/student/bundles', { params }),
  getBundleById: (id: string) =>
    axiosInstance.get<{ data: Bundle }>(`/student/bundles/${id}`),
  initiateBundlePayment: (bundleId: string, couponCode?: string) =>
    axiosInstance.post<{ data: any }>('/student/bundles/payments/initiate', { bundleId, couponCode }),
  verifyBundlePayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    axiosInstance.post<{ data: { success: boolean; paymentId: string; enrollments: any[] } }>('/student/bundles/payments/verify', data),

  // Subscriptions
  listSubscriptionPlans: () =>
    axiosInstance.get<{ data: SubscriptionPlan[] }>('/student/subscriptions/plans'),
  getMySubscription: () =>
    axiosInstance.get<{ data: SubscriptionEnrollment | null }>('/student/subscriptions/my'),
  initiateSubscriptionPayment: (subscriptionId: string, couponCode?: string) =>
    axiosInstance.post<{ data: any }>('/student/subscriptions/payments/initiate', { subscriptionId, couponCode }),
  verifySubscriptionPayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    axiosInstance.post<{ data: { success: boolean; paymentId: string; subscriptionEnrollment: any } }>('/student/subscriptions/payments/verify', data),
};

