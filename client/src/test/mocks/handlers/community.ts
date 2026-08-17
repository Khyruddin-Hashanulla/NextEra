import { http } from 'msw';
import { failure, success } from '../helpers';
import {
  communityTopic,
  communityTopicLocked,
  communityTopicSolved,
  communityCategories,
  communityStats,
} from '@/test/fixtures';

export const communityHandlers = [
  http.get('/api/v1/forum', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    const category = url.searchParams.get('category');
    const solved = url.searchParams.get('solved');

    let topics = [communityTopic, communityTopicSolved, communityTopicLocked];
    if (search) topics = topics.filter((t) => t.title.toLowerCase().includes(search));
    if (category) topics = topics.filter((t) => t.category === category);
    if (solved === 'true') topics = topics.filter((t) => t.isSolved);
    return success({
      discussions: topics,
      pagination: { page: 1, pages: 1, total: topics.length, limit: 10 },
    });
  }),

  http.get('/api/v1/forum/categories', () => {
    return success(communityCategories);
  }),

  http.get('/api/v1/forum/stats', () => {
    return success(communityStats);
  }),

  http.get('/api/v1/forum/:topicId', ({ params }) => {
    const topic = [communityTopic, communityTopicSolved, communityTopicLocked].find(
      (t) => t._id === params.topicId
    );
    if (!topic) return failure('Discussion not found', 404);
    return success(topic);
  }),

  http.post('/api/v1/forum', async ({ request }) => {
    const body = (await request.json()) as { title?: string; content?: string; category?: string };
    if (!body.title || !body.content || !body.category) {
      return failure('Title, content and category are required', 400);
    }
    return success({ ...communityTopic, title: body.title, content: body.content });
  }),

  http.post('/api/v1/forum/:topicId/reply', async ({ request }) => {
    const body = (await request.json()) as { content?: string };
    if (!body.content) return failure('Reply content is required', 400);
    const newReply = { _id: 'reply-new', content: body.content };
    return success({
      ...communityTopic,
      replyCount: communityTopic.replyCount + 1,
      replies: [...(communityTopic.replies ?? []), newReply],
    });
  }),

  http.post('/api/v1/forum/:topicId/like', () => {
    return success({ liked: true, likeCount: 4 });
  }),

  http.patch('/api/v1/forum/:topicId/solved', () => {
    return success({ ...communityTopic, isSolved: true });
  }),

  http.patch('/api/v1/forum/:topicId/pin', () => {
    return success({ ...communityTopic, isPinned: true });
  }),

  http.patch('/api/v1/forum/:topicId/lock', () => {
    return success({ ...communityTopic, isLocked: true });
  }),

  http.patch('/api/v1/forum/:topicId/best-answer', () => {
    return success({
      ...communityTopicSolved,
      bestReplyId: 'reply-2',
      replies: (communityTopicSolved.replies ?? []).map((r) => ({
        ...r,
        isBestAnswer: r._id === 'reply-2',
      })),
    });
  }),

  http.delete('/api/v1/forum/:topicId', () => success(null)),
  http.delete('/api/v1/forum/:topicId/replies/:replyId', () => success(null)),
];