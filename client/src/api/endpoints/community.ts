import axiosInstance from '@/api/axiosInstance';
import type {
  CreateForumTopicInput,
  ForumCategory,
  ForumStats,
  ForumTopic,
  ForumTopicFilters,
  ForumTopicListResponse,
} from '@/types/community';

export const communityApi = {
  listTopics: (params: ForumTopicFilters = {}, signal?: AbortSignal) =>
    axiosInstance.get<{ data: ForumTopicListResponse }>('/forum', {
      params: {
        page: params.page,
        limit: params.limit,
        sort: params.sort,
        category: params.category,
        search: params.search,
        solved: params.solved === undefined ? undefined : String(params.solved),
        instructor: params.instructor === undefined ? undefined : String(params.instructor),
      },
      signal,
    }),

  listCategories: (signal?: AbortSignal) =>
    axiosInstance.get<{ data: ForumCategory[] }>('/forum/categories', { signal }),

  getStats: (signal?: AbortSignal) => axiosInstance.get<{ data: ForumStats }>('/forum/stats', { signal }),

  getTopic: (id: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: ForumTopic }>(`/forum/${id}`, { signal }),

  createTopic: (data: CreateForumTopicInput, signal?: AbortSignal) =>
    axiosInstance.post<{ data: ForumTopic }>('/forum', data, { signal }),

  replyToTopic: (id: string, content: string, signal?: AbortSignal) =>
    axiosInstance.post<{ data: ForumTopic }>(`/forum/${id}/reply`, { content }, { signal }),

  toggleLike: (id: string, signal?: AbortSignal) =>
    axiosInstance.post<{ data: { liked: boolean; likeCount: number } }>(`/forum/${id}/like`, undefined, { signal }),

  markSolved: (id: string, solved: boolean, signal?: AbortSignal) =>
    axiosInstance.patch<{ data: ForumTopic }>(`/forum/${id}/solved`, { solved }, { signal }),

  markBestAnswer: (id: string, replyId: string, signal?: AbortSignal) =>
    axiosInstance.patch<{ data: ForumTopic }>(`/forum/${id}/best-answer`, { replyId }, { signal }),

  setPinned: (id: string, pinned: boolean, signal?: AbortSignal) =>
    axiosInstance.patch<{ data: ForumTopic }>(`/forum/${id}/pin`, { pinned }, { signal }),

  setLocked: (id: string, locked: boolean, signal?: AbortSignal) =>
    axiosInstance.patch<{ data: ForumTopic }>(`/forum/${id}/lock`, { locked }, { signal }),

  deleteTopic: (id: string, signal?: AbortSignal) =>
    axiosInstance.delete<{ data: { success: boolean } }>(`/forum/${id}`, { signal }),

  deleteReply: (id: string, replyId: string, signal?: AbortSignal) =>
    axiosInstance.delete<{ data: { success: boolean } }>(`/forum/${id}/replies/${replyId}`, { signal }),
};