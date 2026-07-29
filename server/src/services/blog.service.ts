import { Blog } from '../models/blog.model';
import { BlogComment } from '../models/blogComment.model';
import { BlogBookmark } from '../models/blogBookmark.model';
import { ApiError } from '../utils/ApiError';
import { escapeRegex } from '../utils/escapeRegex';

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export const listPublishedBlogs = async (options: {
  page: number;
  limit: number;
  category?: string;
  tag?: string;
  search?: string;
  userId?: string;
}): Promise<any> => {
  const query: Record<string, any> = { status: 'published' };
  if (options.category) query.categories = options.category;
  if (options.tag) query.tags = options.tag;
  if (options.search) {
    const escaped = escapeRegex(options.search);
    query.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { excerpt: { $regex: escaped, $options: 'i' } },
      { content: { $regex: escaped, $options: 'i' } },
    ];
  }

  const total = await Blog.countDocuments(query);
  const blogs = await Blog.find(query)
    .populate('author', 'name avatar')
    .select('-content')
    .sort({ publishedAt: -1 })
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)
    .lean();

  let bookmarkedIds: string[] = [];
  if (options.userId) {
    const bookmarks = await BlogBookmark.find({ user: options.userId }).select('blog').lean();
    bookmarkedIds = bookmarks.map(b => b.blog.toString());
  }

  const blogsWithMeta = blogs.map(blog => ({
    ...blog,
    isBookmarked: bookmarkedIds.includes(blog._id.toString()),
  }));

  return {
    blogs: blogsWithMeta,
    pagination: { page: options.page, limit: options.limit, total, pages: Math.ceil(total / options.limit) },
  };
};

export const getFeaturedBlogs = async (limit = 6) => {
  const blogs = await Blog.find({ status: 'published', isFeatured: true })
    .populate('author', 'name avatar')
    .select('-content')
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();
  return blogs;
};

export const getBlogBySlug = async (slug: string, userId?: string): Promise<any> => {
  const blog = await Blog.findOneAndUpdate(
    { slug, status: 'published' },
    { $inc: { readCount: 1 } },
    { new: true },
  )
    .populate('author', 'name email avatar bio')
    .lean();

  if (!blog) throw ApiError.notFound('Blog not found');

  const commentCount = await BlogComment.countDocuments({ blog: blog._id, isApproved: true });
  let isBookmarked = false;
  if (userId) {
    const bookmark = await BlogBookmark.findOne({ user: userId, blog: blog._id });
    isBookmarked = !!bookmark;
  }

  const related = await Blog.find({
    _id: { $ne: blog._id },
    status: 'published',
    $or: [
      { categories: { $in: blog.categories } },
      { tags: { $in: blog.tags } },
    ],
  })
    .select('title slug excerpt featuredImage publishedAt readingTime')
    .limit(3)
    .lean();

  return { ...blog, commentCount, isBookmarked, relatedPosts: related };
};

export const getBlogCategories = async () => {
  const categories = await Blog.distinct('categories', { status: 'published' });
  const result = await Promise.all(
    categories.map(async (cat) => {
      const count = await Blog.countDocuments({ status: 'published', categories: cat });
      return { name: cat, count };
    }),
  );
  return result.sort((a, b) => b.count - a.count);
};

export const getBlogComments = async (blogId: string, page: number, limit: number): Promise<any> => {
  const total = await BlogComment.countDocuments({ blog: blogId, isApproved: true, parent: null });
  const comments = await BlogComment.find({ blog: blogId, isApproved: true, parent: null })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replies = await BlogComment.find({ parent: comment._id, isApproved: true })
        .populate('user', 'name avatar')
        .sort({ createdAt: 1 })
        .lean();
      return { ...comment, replies };
    }),
  );

  return {
    comments: commentsWithReplies,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const createComment = async (blogId: string, userId: string, content: string, parentId?: string) => {
  const blog = await Blog.findById(blogId);
  if (!blog || blog.status !== 'published') throw ApiError.notFound('Blog not found');

  if (parentId) {
    const parent = await BlogComment.findById(parentId);
    if (!parent || parent.blog.toString() !== blogId) throw ApiError.notFound('Parent comment not found');
  }

  const comment = await BlogComment.create({ blog: blogId, user: userId, content, parent: parentId || null });
  return comment.populate('user', 'name avatar');
};

export const updateComment = async (commentId: string, userId: string, content: string) => {
  const comment = await BlogComment.findById(commentId);
  if (!comment) throw ApiError.notFound('Comment not found');
  if (comment.user.toString() !== userId) throw ApiError.forbidden('Not authorized');

  comment.content = content;
  await comment.save();
  return comment.populate('user', 'name avatar');
};

export const deleteComment = async (commentId: string, userId: string, isAdmin: boolean) => {
  const comment = await BlogComment.findById(commentId);
  if (!comment) throw ApiError.notFound('Comment not found');
  if (comment.user.toString() !== userId && !isAdmin) throw ApiError.forbidden('Not authorized');

  await BlogComment.deleteMany({ parent: commentId });
  await BlogComment.findByIdAndDelete(commentId);
};

export const toggleCommentLike = async (commentId: string, userId: string) => {
  const comment = await BlogComment.findById(commentId);
  if (!comment) throw ApiError.notFound('Comment not found');

  const idx = comment.likes.findIndex(id => id.toString() === userId);
  if (idx > -1) {
    comment.likes.splice(idx, 1);
    comment.likeCount = Math.max(0, comment.likeCount - 1);
  } else {
    comment.likes.push(userId as any);
    comment.likeCount += 1;
  }

  await comment.save();
  return { liked: idx === -1, likeCount: comment.likeCount };
};

export const toggleBookmark = async (blogId: string, userId: string) => {
  const blog = await Blog.findById(blogId);
  if (!blog || blog.status !== 'published') throw ApiError.notFound('Blog not found');

  const existing = await BlogBookmark.findOne({ user: userId, blog: blogId });
  if (existing) {
    await BlogBookmark.findByIdAndDelete(existing._id);
    return { bookmarked: false };
  }
  await BlogBookmark.create({ user: userId, blog: blogId });
  return { bookmarked: true };
};

export const getUserBookmarks = async (userId: string, page: number, limit: number) => {
  const total = await BlogBookmark.countDocuments({ user: userId });
  const bookmarks = await BlogBookmark.find({ user: userId })
    .populate({
      path: 'blog',
      match: { status: 'published' },
      select: 'title slug excerpt featuredImage publishedAt readingTime author',
      populate: { path: 'author', select: 'name avatar' },
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const blogs = bookmarks.filter(b => b.blog).map(b => b.blog);

  return {
    blogs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};
