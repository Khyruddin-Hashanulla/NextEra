export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: { url: string; publicId: string };
  author: { _id: string; name: string; email: string; avatar?: { url: string }; bio?: string };
  tags: string[];
  categories: string[];
  status: 'draft' | 'published';
  isFeatured: boolean;
  readCount: number;
  readingTime: number;
  seo: {
    metaTitle: string;
    metaDescription: string;
    canonicalUrl: string;
    ogImage: string;
  };
  publishedAt: string;
  createdAt: string;
  isBookmarked?: boolean;
  commentCount?: number;
  relatedPosts?: BlogPost[];
}

export interface BlogComment {
  _id: string;
  blog: string;
  user: { _id: string; name: string; avatar?: { url: string } };
  content: string;
  parent?: string;
  likes: string[];
  likeCount: number;
  isApproved: boolean;
  createdAt: string;
  replies?: BlogComment[];
}

export interface BlogCategory {
  name: string;
  count: number;
}
