import axiosInstance from '../axiosInstance';
import type {
  CodingProblemListItem,
  CodingProblemDetail,
  CodingSubmission,
  CreateCodingProblemPayload,
  SubmitCodePayload,
} from '@/types/coding';

export const codingApi = {
  listProblems: (params?: Record<string, any>, signal?: AbortSignal) =>
    axiosInstance.get<{ problems: CodingProblemListItem[]; pagination: any }>('/coding/problems', { params, signal }),

  getProblemById: (id: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: CodingProblemDetail }>(`/coding/problems/${id}`, { signal }),

  getProblemBySlug: (slug: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: CodingProblemDetail }>(`/coding/problems/slug/${slug}`, { signal }),

  createProblem: (data: CreateCodingProblemPayload, signal?: AbortSignal) =>
    axiosInstance.post<{ data: CodingProblemDetail }>('/coding/problems', data, { signal }),

  updateProblem: (id: string, data: Partial<CreateCodingProblemPayload>, signal?: AbortSignal) =>
    axiosInstance.put<{ data: CodingProblemDetail }>(`/coding/problems/${id}`, data, { signal }),

  deleteProblem: (id: string, signal?: AbortSignal) => axiosInstance.delete(`/coding/problems/${id}`, { signal }),

  listInstructorProblems: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<{ problems: CodingProblemListItem[]; pagination: any }>('/coding/my-problems', {
      params,
      signal,
    }),

  submitCode: (problemId: string, data: SubmitCodePayload, signal?: AbortSignal) =>
    axiosInstance.post<{ data: CodingSubmission }>(`/coding/problems/${problemId}/submit`, data, { signal }),

  getSubmissionById: (submissionId: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: CodingSubmission }>(`/coding/submissions/${submissionId}`, { signal }),

  getUserSubmissions: (problemId: string, params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<{ submissions: CodingSubmission[]; pagination: any }>(
      `/coding/problems/${problemId}/submissions`,
      { params, signal }
    ),

  getAllUserSubmissions: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<{ submissions: CodingSubmission[]; pagination: any }>('/coding/submissions', { params, signal }),
};
