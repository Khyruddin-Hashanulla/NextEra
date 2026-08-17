export type UserRole = 'student' | 'instructor' | 'admin';

export type ForumCategorySlug =
  | 'general'
  | 'programming'
  | 'dsa'
  | 'web-development'
  | 'mern'
  | 'java'
  | 'career'
  | 'interviews'
  | 'projects'
  | 'courses'
  | 'resources'
  | 'announcements';

export interface ForumAuthor {
  _id: string;
  name: string;
  avatar?: { url: string; publicId?: string };
  role: UserRole;
}

export interface ForumReply {
  _id: string;
  author: ForumAuthor;
  content: string;
  createdAt: string;
  isBestAnswer: boolean;
}

export interface ForumTopic {
  _id: string;
  author?: ForumAuthor;
  category: ForumCategorySlug;
  categoryName: string;
  title: string;
  content: string;
  tags: string[];
  views: number;
  likeCount: number;
  likedByMe: boolean;
  replyCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  bestReplyId?: string | null;
  replies?: ForumReply[];
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
}

export interface ForumCategory {
  slug: ForumCategorySlug;
  name: string;
  count: number;
}

export interface ForumStats {
  members: number;
  discussions: number;
  replies: number;
}

export interface PaginationMeta {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

export interface ForumTopicListResponse {
  discussions: ForumTopic[];
  pagination: PaginationMeta;
}

export type ForumSort = 'latest' | 'active' | 'viewed' | 'discussed' | 'trending';

export interface ForumTopicFilters {
  page?: number;
  limit?: number;
  sort?: ForumSort;
  category?: ForumCategorySlug;
  search?: string;
  solved?: boolean;
  instructor?: boolean;
}

export interface CreateForumTopicInput {
  category: ForumCategorySlug;
  title: string;
  content: string;
  tags?: string[];
}