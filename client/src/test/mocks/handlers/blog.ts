import { http } from 'msw';
import { failure, jsonResponse, success } from '../helpers';
import { publishedBlogPost, approvedComment, blogCategory, featuredBlogPost } from '@/test/fixtures';

export const blogHandlers = [
  http.get('/api/v1/blogs', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    let posts = [publishedBlogPost, featuredBlogPost];
    if (search) posts = posts.filter((p) => p.title.toLowerCase().includes(search));
    return jsonResponse({ blogs: posts, pagination: { page: 1, pages: 1, total: posts.length, limit: 9 } });
  }),

  http.get('/api/v1/blogs/featured', () => {
    return jsonResponse({ blogs: [featuredBlogPost] });
  }),

  http.get('/api/v1/blogs/:slug', ({ params }) => {
    if (params.slug === 'not-found') return failure('Blog not found', 404);
    return jsonResponse({ data: publishedBlogPost });
  }),

  http.get('/api/v1/blogs/categories', () => {
    return jsonResponse({ categories: [blogCategory] });
  }),

  http.get('/api/v1/blogs/:blogId/comments', () => {
    return jsonResponse({ comments: [approvedComment], pagination: { page: 1, pages: 1, total: 1, limit: 20 } });
  }),

  http.post('/api/v1/blogs/:blogId/comments', async ({ request }) => {
    const body = (await request.json()) as { content?: string };
    if (!body.content) return failure('Comment content is required', 400);
    return jsonResponse({ data: { ...approvedComment, content: body.content } });
  }),

  http.put('/api/v1/blogs/comments/:commentId', async ({ request }) => {
    const body = (await request.json()) as { content?: string };
    if (!body.content) return failure('Comment content is required', 400);
    return jsonResponse({ data: { ...approvedComment, content: body.content } });
  }),

  http.delete('/api/v1/blogs/comments/:commentId', () => success(null)),

  http.post('/api/v1/blogs/comments/:commentId/like', () => {
    return jsonResponse({ liked: true, likeCount: 1 });
  }),

  http.post('/api/v1/blogs/:blogId/bookmark', () => {
    return jsonResponse({ bookmarked: true });
  }),

  http.get('/api/v1/bookmarks', () => {
    return jsonResponse({ blogs: [publishedBlogPost], pagination: { page: 1, pages: 1, total: 1, limit: 20 } });
  }),
];
