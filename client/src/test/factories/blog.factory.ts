import type { BlogPost, BlogComment, BlogCategory } from '@/types/blog';

export function buildBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  const id = overrides._id ?? 'post-1';
  return {
    _id: id,
    title: 'Getting Started with React',
    slug: `getting-started-with-react-${id}`,
    content: '<p>Full article content here.</p>',
    excerpt: 'A concise introduction to building interfaces with React.',
    featuredImage: { url: 'https://example.com/blog.jpg', publicId: 'blog-1' },
    author: {
      _id: 'author-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      avatar: { url: 'https://example.com/jane.jpg' },
      bio: 'Frontend engineer',
    },
    tags: ['react', 'javascript'],
    categories: ['frontend'],
    status: 'published',
    isFeatured: false,
    readCount: 1200,
    readingTime: 5,
    seo: {
      metaTitle: 'Getting Started with React',
      metaDescription: 'A concise introduction to React.',
      canonicalUrl: '/blog/getting-started-with-react',
      ogImage: 'https://example.com/blog-og.jpg',
    },
    publishedAt: '2026-06-01T10:00:00.000Z',
    createdAt: '2026-05-20T10:00:00.000Z',
    commentCount: 4,
    ...overrides,
  };
}

export function buildBlogComment(overrides: Partial<BlogComment> = {}): BlogComment {
  const id = overrides._id ?? 'comment-1';
  return {
    _id: id,
    blog: 'post-1',
    user: { _id: 'user-1', name: 'Alex Student', avatar: { url: 'https://example.com/alex.jpg' } },
    content: 'Great article, thanks for sharing!',
    likes: [],
    likeCount: 0,
    isApproved: true,
    createdAt: '2026-06-02T09:00:00.000Z',
    ...overrides,
  };
}

export function buildBlogCategory(overrides: Partial<BlogCategory> = {}): BlogCategory {
  return { name: 'frontend', count: 10, ...overrides };
}
