import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { blogApi } from '@/api/endpoints/blog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Section, Container } from '@/components/common/Section';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { ResourceNotFound } from '@/components/common/ResourceNotFound';
import { PageTransition } from '@/components/common/PageTransition';
import { categorizeError } from '@/lib/error-utils';
import { cn, formatDate, getInitials } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { BlogDetailSkeleton } from '@/components/skeletons/BlogDetailSkeleton';
import { Loader2, MessageCircle, ThumbsUp, ArrowRight } from 'lucide-react';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { articleSchema, breadcrumbListSchema } from '@/lib/schema';
import { BlogDetailHeader } from '@/features/public/components/blog/BlogDetailHeader';
import { BlogFeaturedImage } from '@/features/public/components/blog/BlogFeaturedImage';
import { BlogArticleContent } from '@/features/public/components/blog/BlogArticleContent';
import { BlogArticleSidebar } from '@/features/public/components/blog/BlogArticleSidebar';
import { BlogAuthorCard } from '@/features/public/components/blog/BlogAuthorCard';
import { BlogRelatedArticles } from '@/features/public/components/blog/BlogRelatedArticles';
import type { BlogComment } from '@/types/blog';

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [commentText, setCommentText] = useState('');

  const {
    data: blog,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['blog-detail', slug],
    queryFn: ({ signal }) => blogApi.getBySlug(slug!, signal).then((r) => r.data.data),
    enabled: !!slug,
  });

  const relatedPosts = blog?.relatedPosts || [];

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
      <StructuredData
        schemas={[
          articleSchema(blog),
          breadcrumbListSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: blog.title, path: `/blog/${blog.slug}` },
          ]),
        ]}
      />
      <div className="min-h-screen">
        <Section size="sm" background="gradient">
          <Container>
            <div className="mx-auto max-w-5xl">
              <BlogDetailHeader
                blog={blog}
                isBookmarked={!!blog.isBookmarked}
                isBookmarkPending={toggleBookmarkMutation.isPending}
                onToggleBookmark={() => toggleBookmarkMutation.mutate()}
              />
            </div>
          </Container>
        </Section>

        <Section size="sm" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto max-w-5xl">
              <BlogFeaturedImage blog={blog} />
            </div>
          </Container>
        </Section>

        <Section size="md" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-10">
                <article className="min-w-0">
                  <BlogArticleContent content={blog.content} />
                </article>
                <aside className="mt-12 lg:sticky lg:top-24 lg:mt-0">
                  <BlogArticleSidebar blog={blog} />
                </aside>
              </div>
            </div>
          </Container>
        </Section>

        <Section size="sm" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto max-w-5xl">
              <BlogAuthorCard author={blog.author} />
            </div>
          </Container>
        </Section>

        <Section size="md" background="muted">
          <Container>
            <div className="mx-auto max-w-5xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="mb-8 text-2xl font-bold text-foreground">Comments</h2>

                {isAuthenticated ? (
                  <div className="mb-8 rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-md">
                    <Textarea
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="mb-4 min-h-[100px] rounded-2xl border-border bg-card/50"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handlePostComment}
                        disabled={!commentText.trim()}
                        loading={createCommentMutation.isPending}
                        className="rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 rounded-2xl border border-border/50 bg-card/30 p-6 text-center backdrop-blur-md">
                    <p className="mb-3 text-muted-foreground">Sign in to leave a comment</p>
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
                          className="rounded-2xl border border-border/50 bg-card/30 p-5 backdrop-blur-md"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 shrink-0 border border-border/50">
                              {comment.user?.avatar?.url ? (
                                <AvatarImage
                                  src={comment.user.avatar.url}
                                  alt={`Profile photo of ${comment.user.name}`}
                                />
                              ) : (
                                <AvatarFallback>{getInitials(comment.user?.name || 'U')}</AvatarFallback>
                              )}
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-sm font-medium text-foreground">{comment.user?.name}</span>
                                <span className="text-xs text-muted-foreground/70">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-foreground/80">{comment.content}</p>
                              <div className="mt-3 flex items-center gap-4 border-t border-border/50 pt-3">
                                <button
                                  onClick={() => toggleLikeMutation.mutate(comment._id)}
                                  aria-pressed={hasLiked}
                                  aria-label={hasLiked ? 'Unlike comment' : 'Like comment'}
                                  className={cn(
                                    'flex items-center gap-1.5 text-xs transition-colors',
                                    hasLiked ? 'text-primary' : 'text-muted-foreground/70 hover:text-muted-foreground'
                                  )}
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                  {comment.likeCount || 0}
                                </button>
                                {isOwner && (
                                  <button
                                    onClick={() => deleteCommentMutation.mutate(comment._id)}
                                    aria-label="Delete comment"
                                    className="flex items-center gap-1 text-xs text-muted-foreground/70 transition-colors hover:text-red-500"
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
            </div>
          </Container>
        </Section>

        <BlogRelatedArticles posts={relatedPosts} />

        <Section size="sm" background="muted">
          <Container>
            <div className="mx-auto max-w-5xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/blog">
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    Back to All Articles
                  </Link>
                </Button>
              </motion.div>
            </div>
          </Container>
        </Section>
      </div>
    </PageTransition>
  );
}