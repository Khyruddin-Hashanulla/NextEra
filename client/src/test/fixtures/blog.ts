import { buildBlogPost, buildBlogComment, buildBlogCategory } from '../factories/blog.factory';

export const publishedBlogPost = buildBlogPost({
  _id: 'post-1',
  title: 'Understanding React Hooks',
  slug: 'understanding-react-hooks',
});

export const featuredBlogPost = buildBlogPost({
  _id: 'post-2',
  title: 'The Road to Full Stack',
  slug: 'the-road-to-full-stack',
  isFeatured: true,
});

export const draftBlogPost = buildBlogPost({
  _id: 'post-3',
  title: 'Draft Post',
  slug: 'draft-post',
  status: 'draft',
});

export const approvedComment = buildBlogComment({
  _id: 'comment-1',
  content: 'Very helpful walkthrough!',
});

export const pendingComment = buildBlogComment({
  _id: 'comment-2',
  content: 'Awaiting moderation.',
  isApproved: false,
});

export const blogCategory = buildBlogCategory({ name: 'frontend', count: 3 });
