import axiosInstance from '../axiosInstance';
import type { BlogPost, BlogComment, BlogCategory } from '@/types/blog';

export const blogApi = {
  listPublished: (params?: { page?: number; limit?: number; category?: string; tag?: string; search?: string }, signal?: AbortSignal) =>
    axiosInstance.get<{ blogs: BlogPost[]; pagination: any }>('/blogs', { params, signal }),

  getFeatured: (limit?: number, signal?: AbortSignal) =>
    axiosInstance.get<{ blogs: BlogPost[] }>('/blogs/featured', { params: { limit }, signal }),

  getBySlug: (slug: string, signal?: AbortSignal) =>
    axiosInstance.get<{ data: BlogPost }>(`/blogs/${slug}`, { signal }),

  getCategories: (signal?: AbortSignal) =>
    axiosInstance.get<{ categories: BlogCategory[] }>('/blogs/categories', { signal }),

  getComments: (blogId: string, params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<{ comments: BlogComment[]; pagination: any }>(`/blogs/${blogId}/comments`, { params, signal }),

  createComment: (blogId: string, data: { content: string; parent?: string }, signal?: AbortSignal) =>
    axiosInstance.post<{ data: BlogComment }>(`/blogs/${blogId}/comments`, data, { signal }),

  updateComment: (commentId: string, data: { content: string }, signal?: AbortSignal) =>
    axiosInstance.put<{ data: BlogComment }>(`/blogs/comments/${commentId}`, data, { signal }),

  deleteComment: (commentId: string, signal?: AbortSignal) =>
    axiosInstance.delete(`/blogs/comments/${commentId}`, { signal }),

  toggleLike: (commentId: string, signal?: AbortSignal) =>
    axiosInstance.post<{ liked: boolean; likeCount: number }>(`/blogs/comments/${commentId}/like`, undefined, { signal }),

  toggleBookmark: (blogId: string, signal?: AbortSignal) =>
    axiosInstance.post<{ bookmarked: boolean }>(`/blogs/${blogId}/bookmark`, undefined, { signal }),

  getBookmarks: (params?: { page?: number; limit?: number }, signal?: AbortSignal) =>
    axiosInstance.get<{ blogs: BlogPost[]; pagination: any }>('/bookmarks', { params, signal }),
};
