import axiosInstance from '../axiosInstance';

export const quizApi = {
  startQuizEnhanced: (data: { courseId: string; lectureId: string }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: any }>('/quiz/start-enhanced', data, { signal }),

  submitQuiz: (data: { attemptId: string; answers: any[]; autoSubmitted?: boolean }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: any }>('/quiz/submit', data, { signal }),

  autoSubmit: (data: { attemptId: string; answers: any[]; autoSubmitted?: boolean }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: any }>('/quiz/auto-submit', data, { signal }),

  resumeQuiz: (data: { attemptId: string }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: any }>('/quiz/resume', data, { signal }),

  getAttemptResult: (attemptId: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: any }>(`/quiz/result/${attemptId}`, { signal }),

  getAttemptDetails: (attemptId: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: any }>(`/quiz/attempts/${attemptId}/details`, { signal }),

  getStudentAnalytics: (lectureId: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: any }>(`/quiz/analytics/${lectureId}`, { signal }),

  getStudentOverview: (signal?: AbortSignal) => axiosInstance.get<{ data: any }>('/quiz/overview', { signal }),

  getLeaderboard: (lectureId: string, params?: { limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<{ data: any }>(`/quiz/leaderboard/${lectureId}`, { params, signal }),

  downloadResult: (attemptId: string, signal?: AbortSignal) =>
    axiosInstance.get(`/quiz/instructor/export/${attemptId}`, { responseType: 'blob', signal }),

  manualGrade: (attemptId: string, data: any, signal?: AbortSignal) =>
    axiosInstance.put<{ data: any }>(`/quiz/manual-grade/${attemptId}`, data, { signal }),

  publishGrade: (attemptId: string, signal?: AbortSignal) =>
    axiosInstance.put<{ data: any }>(`/quiz/publish/${attemptId}`, undefined, { signal }),

  getQuizAnalytics: (lectureId: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: any }>(`/quiz/instructor/analytics/${lectureId}`, { signal }),

  getQuestionStatistics: (lectureId: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: any }>(`/quiz/instructor/questions/${lectureId}`, { signal }),

  getAdminAnalytics: (params?: { courseId?: string }, signal?: AbortSignal) =>
    axiosInstance.get<{ data: any }>('/quiz/admin/analytics', { params, signal }),
};
