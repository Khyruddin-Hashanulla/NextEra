import axiosInstance from '../axiosInstance';
import { ApiResponse } from '@/types/api';
import { LiveClass, LiveClassRecording, LiveClassJoinData } from '@/types/liveClass';

export const liveClassApi = {
  // ─── Instructor ─────────────────────────────────────────────
  listInstructorLiveClasses: (params?: { page?: number; limit?: number; courseId?: string; status?: string }) =>
    axiosInstance.get<ApiResponse<{ classes: LiveClass[]; pagination: any }>>('/live-classes/instructor', { params }),

  listInstructorRecordings: (params?: { page?: number; limit?: number; courseId?: string }) =>
    axiosInstance.get<ApiResponse<{ recordings: LiveClassRecording[]; pagination: any }>>('/live-classes/instructor/recordings', { params }),

  createLiveClass: (data: Partial<LiveClass>) =>
    axiosInstance.post<ApiResponse<LiveClass>>('/live-classes', data),

  updateLiveClass: (id: string, data: Partial<LiveClass>) =>
    axiosInstance.put<ApiResponse<LiveClass>>(`/live-classes/${id}`, data),

  getLiveClass: (id: string) =>
    axiosInstance.get<ApiResponse<LiveClass>>(`/live-classes/${id}`),

  cancelLiveClass: (id: string) =>
    axiosInstance.post<ApiResponse<LiveClass>>(`/live-classes/${id}/cancel`),

  startLiveClass: (id: string) =>
    axiosInstance.post<ApiResponse<LiveClass>>(`/live-classes/${id}/start`),

  endLiveClass: (id: string) =>
    axiosInstance.post<ApiResponse<LiveClass>>(`/live-classes/${id}/end`),

  addRecording: (data: { liveClass: string; course: string; title: string; url: string; password?: string; duration?: number; format?: string; thumbnailUrl?: string }) =>
    axiosInstance.post<ApiResponse<LiveClassRecording>>('/live-classes/instructor/recordings', data),

  deleteRecording: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/live-classes/instructor/recordings/${id}`),

  // ─── Student ────────────────────────────────────────────────
  listStudentLiveClasses: (params?: { page?: number; limit?: number; filter?: 'upcoming' | 'past' | 'all' }) =>
    axiosInstance.get<ApiResponse<{ classes: LiveClass[]; pagination: any }>>('/live-classes/student', { params }),

  listStudentRecordings: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<ApiResponse<{ recordings: LiveClassRecording[]; pagination: any }>>('/live-classes/student/recordings', { params }),

  joinLiveClass: (id: string) =>
    axiosInstance.post<ApiResponse<LiveClassJoinData>>(`/live-classes/${id}/join`),

  leaveLiveClass: (id: string) =>
    axiosInstance.post<ApiResponse<null>>(`/live-classes/${id}/leave`),

  incrementRecordingView: (id: string) =>
    axiosInstance.post<ApiResponse<null>>(`/live-classes/recordings/${id}/view`),
};
