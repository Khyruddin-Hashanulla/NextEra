import axiosInstance from '../axiosInstance';
import type {
  CodingProblemListItem,
  CodingProblemDetail,
  CodingSubmission,
  CreateCodingProblemPayload,
  SubmitCodePayload,
} from '@/types/coding';

export const codingApi = {
  listProblems: (params?: Record<string, any>) =>
    axiosInstance.get<{ problems: CodingProblemListItem[]; pagination: any }>('/coding/problems', { params }),

  getProblemById: (id: string) =>
    axiosInstance.get<{ data: CodingProblemDetail }>(`/coding/problems/${id}`),

  getProblemBySlug: (slug: string) =>
    axiosInstance.get<{ data: CodingProblemDetail }>(`/coding/problems/slug/${slug}`),

  createProblem: (data: CreateCodingProblemPayload) =>
    axiosInstance.post<{ data: CodingProblemDetail }>('/coding/problems', data),

  updateProblem: (id: string, data: Partial<CreateCodingProblemPayload>) =>
    axiosInstance.put<{ data: CodingProblemDetail }>(`/coding/problems/${id}`, data),

  deleteProblem: (id: string) =>
    axiosInstance.delete(`/coding/problems/${id}`),

  listInstructorProblems: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ problems: CodingProblemListItem[]; pagination: any }>('/coding/my-problems', { params }),

  submitCode: (problemId: string, data: SubmitCodePayload) =>
    axiosInstance.post<{ data: CodingSubmission }>(`/coding/problems/${problemId}/submit`, data),

  getSubmissionById: (submissionId: string) =>
    axiosInstance.get<{ data: CodingSubmission }>(`/coding/submissions/${submissionId}`),

  getUserSubmissions: (problemId: string, params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ submissions: CodingSubmission[]; pagination: any }>(`/coding/problems/${problemId}/submissions`, { params }),

  getAllUserSubmissions: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ submissions: CodingSubmission[]; pagination: any }>('/coding/submissions', { params }),
};
