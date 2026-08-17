import { buildForumTopic, buildForumCategory, buildForumStats, buildForumReply } from '../factories/community.factory';

export const communityTopic = buildForumTopic({
  _id: 'topic-1',
  title: 'How do I start with MERN?',
  category: 'web-development',
  categoryName: 'Web Development',
});

export const communityTopicSolved = buildForumTopic({
  _id: 'topic-2',
  title: 'Solved question about React hooks',
  category: 'programming',
  categoryName: 'Programming',
  isSolved: true,
  bestReplyId: 'reply-2',
  replies: [buildForumReply({ _id: 'reply-2', content: 'This solved it for me!', isBestAnswer: true })],
});

export const communityTopicLocked = buildForumTopic({
  _id: 'topic-3',
  title: 'Announcement: New cohort starting soon',
  category: 'announcements',
  categoryName: 'Announcements',
  isLocked: true,
});

export const communityCategories = [
  buildForumCategory({ slug: 'general', name: 'General', count: 5 }),
  buildForumCategory({ slug: 'web-development', name: 'Web Development', count: 2 }),
  buildForumCategory({ slug: 'programming', name: 'Programming', count: 3 }),
];

export const communityStats = buildForumStats({ members: 120, discussions: 45, replies: 320 });