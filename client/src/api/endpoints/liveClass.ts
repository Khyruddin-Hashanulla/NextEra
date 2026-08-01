import axiosInstance from '../axiosInstance';
import { ApiResponse } from '@/types/api';
import { LiveClass, LiveClassRecording, LiveClassJoinData } from '@/types/liveClass';

export const liveClassApi = {
  listInstructorLiveClasses: (params?: { page?: number; limit?: number; courseId?: string; status?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ classes: LiveClass[]; pagination: any }>>('/live-classes/instructor', { params, signal }),

  listInstructorRecordings: (params?: { page?: number; limit?: number; courseId?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ recordings: LiveClassRecording[]; pagination: any }>>('/live-classes/instructor/recordings', { params, signal }),

  createLiveClass: (data: Partial<LiveClass>, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<LiveClass>>('/live-classes', data, { signal }),

  updateLiveClass: (id: string, data: Partial<LiveClass>, signal?: AbortSignal) =>
    axiosInstance.put<ApiResponse<LiveClass>>(`/live-classes/${id}`, data, { signal }),

  getLiveClass: (id: string, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<LiveClass>>(`/live-classes/${id}`, { signal }),

  cancelLiveClass: (id: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<LiveClass>>(`/live-classes/${id}/cancel`, undefined, { signal }),

  startLiveClass: (id: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<LiveClass>>(`/live-classes/${id}/start`, undefined, { signal }),

  endLiveClass: (id: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<LiveClass>>(`/live-classes/${id}/end`, undefined, { signal }),

  addRecording: (data: { liveClass: string; course: string; title: string; url: string; password?: string; duration?: number; format?: string; thumbnailUrl?: string }, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<LiveClassRecording>>('/live-classes/instructor/recordings', data, { signal }),

  deleteRecording: (id: string, signal?: AbortSignal) =>
    axiosInstance.delete<ApiResponse<null>>(`/live-classes/instructor/recordings/${id}`, { signal }),

  syncRecordings: (liveClassId: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<{ liveClassId: string; recordings: LiveClassRecording[] }>>('/live-classes/instructor/recordings/sync', { liveClassId }, { signal }),

  getInstructorRecording: (id: string, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<LiveClassRecording>>(`/live-classes/instructor/recordings/${id}`, { signal }),

  listStudentLiveClasses: (params?: { page?: number; limit?: number; filter?: 'upcoming' | 'past' | 'all' }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ classes: LiveClass[]; pagination: any }>>('/live-classes/student', { params, signal }),

  listStudentRecordings: (params?: { page?: number; limit?: number; courseId?: string }, signal?: AbortSignal) =>
    axiosInstance.get<ApiResponse<{ recordings: LiveClassRecording[]; pagination: any }>>('/live-classes/student/recordings', { params, signal }),

  joinLiveClass: (id: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<LiveClassJoinData>>(`/live-classes/${id}/join`, undefined, { signal }),

  leaveLiveClass: (id: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<null>>(`/live-classes/${id}/leave`, undefined, { signal }),

  incrementRecordingView: (id: string, signal?: AbortSignal) =>
    axiosInstance.post<ApiResponse<null>>(`/live-classes/recordings/${id}/view`, undefined, { signal }),
};
