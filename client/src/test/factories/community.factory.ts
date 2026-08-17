import type { ForumTopic, ForumReply, ForumAuthor, ForumCategory, ForumStats } from '@/types/community';

export function buildForumAuthor(overrides: Partial<ForumAuthor> = {}): ForumAuthor {
  const id = overrides._id ?? 'author-1';
  return {
    _id: id,
    name: 'Test Author',
    avatar: { url: 'https://example.com/author.jpg' },
    role: 'student',
    ...overrides,
  };
}

export function buildForumReply(overrides: Partial<ForumReply> = {}): ForumReply {
  const id = overrides._id ?? 'reply-1';
  return {
    _id: id,
    author: buildForumAuthor({ _id: 'author-1', name: 'Test Author' }),
    content: 'This is a helpful reply.',
    createdAt: '2026-06-10T09:00:00.000Z',
    isBestAnswer: false,
    ...overrides,
  };
}

export function buildForumTopic(overrides: Partial<ForumTopic> = {}): ForumTopic {
  const id = overrides._id ?? 'topic-1';
  return {
    _id: id,
    author: buildForumAuthor({ _id: 'author-1', name: 'Test Author' }),
    category: 'general',
    categoryName: 'General',
    title: 'How do I start with MERN?',
    content: 'I want to learn the MERN stack but do not know where to begin.',
    tags: ['mern', 'beginner'],
    views: 42,
    likeCount: 3,
    likedByMe: false,
    replyCount: 2,
    isPinned: false,
    isLocked: false,
    isSolved: false,
    replies: [buildForumReply()],
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-10T09:00:00.000Z',
    ...overrides,
  };
}

export function buildForumCategory(overrides: Partial<ForumCategory> = {}): ForumCategory {
  return { slug: 'general', name: 'General', count: 5, ...overrides };
}

export function buildForumStats(overrides: Partial<ForumStats> = {}): ForumStats {
  return { members: 120, discussions: 45, replies: 320, ...overrides };
}