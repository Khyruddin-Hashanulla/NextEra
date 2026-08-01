import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { blogApi } from '@/api/endpoints/blog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Section, Container } from '@/components/common/Section';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { ResourceNotFound } from '@/components/common/ResourceNotFound';
import { PageTransition } from '@/components/common/PageTransition';
import { categorizeError } from '@/lib/error-utils';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { cn, formatDate, getInitials } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { BlogDetailSkeleton } from '@/components/skeletons/BlogDetailSkeleton';
import {
  Loader2,
  Calendar,
  Clock,
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
  ChevronLeft,
  Eye,
  ThumbsUp,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { articleSchema, breadcrumbListSchema } from '@/lib/schema';
import type { BlogPost, BlogComment } from '@/types/blog';

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [commentText, setCommentText] = useState('');

  const { data: blogData, isLoading, error, refetch } = useQuery({
    queryKey: ['blog-detail', slug],
    queryFn: ({ signal }) => blogApi.getBySlug(slug!, signal).then((r) => r.data.data),
    enabled: !!slug,
  });

  const blog = blogData;
  const relatedPosts = blog?.relatedPosts || [];
  const tags = blog?.tags || [];

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['blog-comments', blog?._id],
    queryFn: ({ signal }) => blogApi.getComments(blog!._id, undefined, signal).then((r) => r.data.comments),
    enabled: !!blog?._id,
  });

  const comments = commentsData || [];

  const createCommentMutation = useMutation({
    mutationFn: (content: string) => blogApi.createComment(blog!._id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-comments', blog?._id] });
      setCommentText('');
      addToast({ title: 'Comment posted', variant: 'success' });
    },
    onError: () => {
      addToast({ title: 'Failed to post comment', variant: 'error' });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => blogApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-comments', blog?._id] });
      addToast({ title: 'Comment deleted', variant: 'success' });
    },
    onError: () => {
      addToast({ title: 'Failed to delete comment', variant: 'error' });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: (commentId: string) => blogApi.toggleLike(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-comments', blog?._id] });
    },
  });

  const toggleBookmarkMutation = useMutation({
    mutationFn: () => blogApi.toggleBookmark(blog!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-detail', slug] });
      addToast({ title: blog?.isBookmarked ? 'Bookmark removed' : 'Article bookmarked', variant: 'success' });
    },
  });

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    createCommentMutation.mutate(commentText.trim());
  };

  if (isLoading) {
    return <BlogDetailSkeleton />;
  }

  if (error || !blog) {
    if (!blog && (!error || categorizeError(error) === 'not-found')) {
      return <ResourceNotFound resourceType="blog" />;
    }
    const category = categorizeError(error);
    if (category === 'network') {
      return (
        <PageTransition>
          <ErrorState
            title="Connection Error"
            message="Unable to connect to the server. Please check your internet connection and try again."
            onRetry={() => refetch()}
          />
        </PageTransition>
      );
    }
    return (
      <PageTransition>
        <ErrorState
          title="Failed to load article"
          message="We could not find this article. It may have been removed or the link is broken."
          onRetry={() => refetch()}
        />
      </PageTransition>
    );
  }

  const contentParagraphs = blog.content.split('\n').filter(Boolean);
  const blogTitle = blog?.seo?.metaTitle || blog?.title || '';
  const blogDescription = blog?.seo?.metaDescription || blog?.excerpt || '';
  const blogImage = blog?.seo?.ogImage || blog?.featuredImage?.url || '';
  const blogCanonical = blog?.seo?.canonicalUrl || `/blog/${slug}`;

  return (
    <PageTransition>
      <SEO
        title={blogTitle}
        description={blogDescription}
        image={blogImage}
        url={`/blog/${slug}`}
        canonical={blogCanonical}
        type="article"
        publishedTime={blog?.publishedAt}
        author={blog?.author?.name}
      />
      <StructuredData schemas={[
        articleSchema(blog),
        breadcrumbListSchema([
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: blog.title, path: `/blog/${blog.slug}` },
        ]),
      ]} />
      <div className="min-h-screen">
        <Section size="sm" className="bg-gradient-to-br from-primary/10 via-background to-background">
          <Container>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Link
                to="/blog"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Blog
              </Link>

              <div className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden shadow-lg mb-8">
                {blog.featuredImage?.url ? (
                  <OptimizedImage
                    src={blog.featuredImage?.url}
                    alt={`${blog.title} featured image`}
                    placeholderType="blog"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {blog.categories?.slice(0, 1).map((cat) => (
                <Badge key={cat} variant="default" className="mb-3">
                  {cat}
                </Badge>
              ))}

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mt-4">
                {blog.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-6 text-sm">
                <div className="flex items-center gap-2">
                    {blog.author?.avatar?.url ? (
                    <OptimizedImage
                      src={blog.author.avatar.url}
                      alt={`Profile photo of ${blog.author.name}`}
                      placeholderType="avatar"
                      className="rounded-full object-cover"
                      containerClassName="h-10 w-10"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                      {getInitials(blog.author?.name || 'A')}
                    </div>
                  )}
                  <span className="font-medium text-foreground">{blog.author?.name}</span>
                </div>
                <span className="text-muted-foreground/70">|</span>
                <span className="flex items-center gap-1 text-muted-foreground/70">
                  <Calendar className="h-4 w-4" />
                  {formatDate(blog.publishedAt || blog.createdAt)}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground/70">
                  <Clock className="h-4 w-4" />
                  {blog.readingTime} min read
                </span>
                <span className="flex items-center gap-1 text-muted-foreground/70">
                  <Eye className="h-4 w-4" />
                  {blog.readCount || 0} views
                </span>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleBookmarkMutation.mutate()}
                  className={cn(blog.isBookmarked && 'text-primary border-primary')}
                >
                  <Bookmark className={cn('h-4 w-4 mr-1', blog.isBookmarked && 'fill-current')} />
                  {blog.isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </motion.div>
          </Container>
        </Section>

        <Section size="md">
          <Container>
            <div className="lg:grid lg:grid-cols-3 lg:gap-12">
              <div className="col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  {contentParagraphs.map((paragraph, idx) => (
                    <p key={idx} className="text-foreground/80 leading-relaxed mb-4 text-base sm:text-lg">
                      {paragraph}
                    </p>
                  ))}
                </motion.div>

                {tags.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border"
                  >
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </motion.div>
                )}
              </div>

              <aside className="col-span-1 mt-12 lg:mt-0">
                <div className="sticky top-24 space-y-8">
                  <div className="p-6 rounded-2xl bg-background border border-border shadow-sm">
                    <h3 className="font-semibold text-foreground mb-4">Table of Contents</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {contentParagraphs.slice(0, 5).map((_, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
                          Section {idx + 1}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 rounded-2xl bg-background border border-border shadow-sm">
                    <h3 className="font-semibold text-foreground mb-4">Share this article</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-1" />
                        Copy Link
                      </Button>
                      <Button variant="outline" size="iconSm">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </Container>
        </Section>

        <Section size="md" background="muted">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-8">Comments</h2>

              {isAuthenticated ? (
                <div className="mb-8 p-6 rounded-2xl bg-background border border-border shadow-sm">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[100px] rounded-2xl border-border bg-background mb-4"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handlePostComment}
                      disabled={!commentText.trim() || createCommentMutation.isPending}
                      className="bg-primary hover:bg-primary-700 text-white shadow-sm rounded-full"
                    >
                      {createCommentMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      Post Comment
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-8 p-6 rounded-2xl bg-background border border-border shadow-sm text-center">
                  <p className="text-muted-foreground mb-3">Sign in to leave a comment</p>
                  <Button asChild variant="outline">
                    <Link to="/auth/login">Sign In</Link>
                  </Button>
                </div>
              )}

              {commentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/70" />
                </div>
              ) : comments.length === 0 ? (
                <EmptyState
                  icon={<MessageCircle className="h-12 w-12 text-muted-foreground/50" />}
                  title="No comments yet"
                  description="Be the first to share your thoughts on this article."
                />
              ) : (
                <div className="space-y-4">
                  {comments.map((comment: BlogComment) => {
                    const isOwner = user?._id === comment.user?._id;
                    const hasLiked = comment.likes?.includes(user?._id || '');
                    return (
                      <motion.div
                        key={comment._id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-5 rounded-2xl bg-background border border-border shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            {comment.user?.avatar?.url ? (
                              <AvatarImage src={comment.user.avatar.url} alt={`Profile photo of ${comment.user.name}`} />
                            ) : (
                              <AvatarFallback>{getInitials(comment.user?.name || 'U')}</AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-foreground">{comment.user?.name}</span>
                              <span className="text-xs text-muted-foreground/70">{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="text-sm text-foreground/80 mt-2">{comment.content}</p>
                            <div className="flex items-center gap-4 mt-3">
                              <button
                                onClick={() => toggleLikeMutation.mutate(comment._id)}
                                className={cn(
                                  'flex items-center gap-1 text-xs transition-colors',
                                  hasLiked ? 'text-primary' : 'text-muted-foreground/70 hover:text-muted-foreground'
                                )}
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                                {comment.likeCount || 0}
                              </button>
                              {isOwner && (
                                <button
                                  onClick={() => deleteCommentMutation.mutate(comment._id)}
                                  className="flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-red-500 transition-colors"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </Container>
        </Section>

        {relatedPosts.length > 0 && (
          <Section size="md">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-8">Related Articles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedPosts.slice(0, 3).map((related: BlogPost, index: number) => (
                    <motion.div
                      key={related._id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link to={`/blog/${related.slug}`}>
                        <article className="rounded-2xl bg-background border border-border shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full">
                          <div className="h-48 overflow-hidden">
                              <OptimizedImage
                                src={related.featuredImage?.url || '/placeholder-blog.jpg'}
                                alt={`${related.title} featured image`}
                                placeholderType="blog"
                                className="object-cover"
                              />
                          </div>
                          <div className="p-5">
                            <span className="text-xs text-muted-foreground/70">{formatDate(related.publishedAt || related.createdAt)}</span>
                            {related.categories?.slice(0, 1).map((cat) => (
                              <span
                                key={cat}
                                className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full inline-block mb-2 ml-2"
                              >
                                {cat}
                              </span>
                            ))}
                            <h3 className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
                              {related.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {related.excerpt}
                            </p>
                            <span className="text-xs text-muted-foreground/70 mt-3 block">
                              {related.readingTime} min read
                            </span>
                          </div>
                        </article>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </Container>
          </Section>
        )}

        <Section size="sm" background="muted">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Button
                asChild
                variant="outline"
                className="rounded-full"
              >
                <Link to="/blog">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Back to All Articles
                </Link>
              </Button>
            </motion.div>
          </Container>
        </Section>
      </div>
    </PageTransition>
  );
}
