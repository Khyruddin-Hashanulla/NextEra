import axiosInstance from '../axiosInstance';
import type { BlogPost, BlogComment, BlogCategory } from '@/types/blog';

export const blogApi = {
  listPublished: (params?: { page?: number; limit?: number; category?: string; tag?: string; search?: string }) =>
    axiosInstance.get<{ blogs: BlogPost[]; pagination: any }>('/blogs', { params }),

  getFeatured: (limit?: number) =>
    axiosInstance.get<{ blogs: BlogPost[] }>('/blogs/featured', { params: { limit } }),

  getBySlug: (slug: string) =>
    axiosInstance.get<{ data: BlogPost }>(`/blogs/${slug}`),

  getCategories: () =>
    axiosInstance.get<{ categories: BlogCategory[] }>('/blogs/categories'),

  getComments: (blogId: string, params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ comments: BlogComment[]; pagination: any }>(`/blogs/${blogId}/comments`, { params }),

  createComment: (blogId: string, data: { content: string; parent?: string }) =>
    axiosInstance.post<{ data: BlogComment }>(`/blogs/${blogId}/comments`, data),

  updateComment: (commentId: string, data: { content: string }) =>
    axiosInstance.put<{ data: BlogComment }>(`/blogs/comments/${commentId}`, data),

  deleteComment: (commentId: string) =>
    axiosInstance.delete(`/blogs/comments/${commentId}`),

  toggleLike: (commentId: string) =>
    axiosInstance.post<{ liked: boolean; likeCount: number }>(`/blogs/comments/${commentId}/like`),

  toggleBookmark: (blogId: string) =>
    axiosInstance.post<{ bookmarked: boolean }>(`/blogs/${blogId}/bookmark`),

  getBookmarks: (params?: { page?: number; limit?: number }) =>
    axiosInstance.get<{ blogs: BlogPost[]; pagination: any }>('/bookmarks', { params }),
};
