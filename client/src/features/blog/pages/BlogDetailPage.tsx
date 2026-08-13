import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi } from '@/api/endpoints/blog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/providers/ToastProvider';
import { BlogDetailSkeleton } from '@/components/skeletons/BlogDetailSkeleton';
import { Loader2, Calendar, Clock, Bookmark, MessageCircle, Share2, ChevronLeft, Eye, ThumbsUp } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { useAuth } from '@/providers/AuthProvider';

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: blogData, isLoading } = useQuery({
    queryKey: ['blog', slug],
    queryFn: ({ signal }) => blogApi.getBySlug(slug!, signal).then((r) => r.data.data),
    enabled: !!slug,
  });

  const { data: commentsData } = useQuery({
    queryKey: ['blog-comments', blogData?._id],
    queryFn: ({ signal }) => blogApi.getComments(blogData!._id, undefined, signal).then((r) => r.data),
    enabled: !!blogData?._id,
  });

  const commentMutation = useMutation({
    mutationFn: (data: { content: string; parent?: string }) => blogApi.createComment(blogData!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-comments', blogData!._id] });
      setCommentText('');
      setReplyTo(null);
      setReplyText('');
      addToast({ title: 'Comment added', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to add comment', variant: 'error' }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => blogApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-comments', blogData!._id] });
      addToast({ title: 'Comment deleted', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to delete comment', variant: 'error' }),
  });

  const likeMutation = useMutation({
    mutationFn: (commentId: string) => blogApi.toggleLike(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-comments', blogData!._id] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => blogApi.toggleBookmark(blogData!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog', slug] });
      addToast({ title: blogData?.isBookmarked ? 'Bookmark removed' : 'Bookmarked', variant: 'success' });
    },
  });

  if (isLoading) {
    return <BlogDetailSkeleton />;
  }

  if (!blogData) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Article not found
        <div className="mt-2">
          <Button variant="link" asChild>
            <Link to="/blog">Back to blog</Link>
          </Button>
        </div>
      </div>
    );
  }

  const comments = commentsData?.comments || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/blog">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to blog
        </Link>
      </Button>

      <article className="space-y-6">
        {blogData.featuredImage?.url && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <OptimizedImage
              src={blogData.featuredImage.url}
              alt={blogData.title}
              placeholderType="blog"
              className="object-cover"
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {blogData.categories?.map((cat: string) => (
              <Badge key={cat} variant="secondary">
                {cat}
              </Badge>
            ))}
            {blogData.tags?.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{blogData.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={blogData.author?.avatar?.url} alt={blogData.author?.name || ''} />
                <AvatarFallback>{blogData.author?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{blogData.author?.name}</span>
            </div>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(blogData.publishedAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {blogData.readingTime} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {blogData.readCount} views
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {user && (
            <Button variant="outline" size="sm" onClick={() => bookmarkMutation.mutate()}>
              <Bookmark className={`h-4 w-4 mr-1 ${blogData.isBookmarked ? 'fill-current' : ''}`} />
              {blogData.isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              addToast({ title: 'Link copied', variant: 'success' });
            }}
          >
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
        </div>

        <div className="prose prose-gray max-w-none">
          {blogData.content.split('\n').map((line: string, i: number) =>
            line.trim() ? (
              <p key={i} className="text-base leading-relaxed">
                {line}
              </p>
            ) : (
              <br key={i} />
            )
          )}
        </div>
      </article>

      <div className="border-t pt-8">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Comments ({blogData.commentCount || 0})</h2>
        </div>

        {user ? (
          <div className="space-y-3 mb-8">
            <Textarea
              placeholder={replyTo ? `Replying to ${replyTo.name}...` : 'Write a comment...'}
              value={replyTo ? replyText : commentText}
              onChange={(e) => (replyTo ? setReplyText(e.target.value) : setCommentText(e.target.value))}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  commentMutation.mutate({ content: replyTo ? replyText : commentText, parent: replyTo?.id })
                }
                disabled={commentMutation.isPending || !(replyTo ? replyText : commentText).trim()}
              >
                {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Post
              </Button>
              {replyTo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyTo(null);
                    setReplyText('');
                  }}
                >
                  Cancel reply
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-8">
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>{' '}
            to leave a comment
          </p>
        )}

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment: any) => (
              <div key={comment._id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={comment.user?.avatar?.url} alt={comment.user?.name || ''} />
                      <AvatarFallback className="text-xs">{comment.user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{comment.user?.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {user && (user._id === comment.user?._id || user.role === 'admin') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-500 h-auto p-1"
                      onClick={() => deleteCommentMutation.mutate(comment._id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
                <p className="text-sm">{comment.content}</p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-auto p-1"
                    onClick={() => likeMutation.mutate(comment._id)}
                  >
                    <ThumbsUp
                      className={`h-3 w-3 mr-1 ${comment.likes?.includes(user?._id) ? 'fill-primary text-primary' : ''}`}
                    />
                    {comment.likeCount}
                  </Button>
                  {user && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-auto p-1"
                      onClick={() => setReplyTo({ id: comment._id, name: comment.user?.name })}
                    >
                      Reply
                    </Button>
                  )}
                </div>
                {comment.replies?.length > 0 && (
                  <div className="ml-6 space-y-3 pt-2 border-l-2 pl-4">
                    {comment.replies.map((reply: any) => (
                      <div key={reply._id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={reply.user?.avatar?.url} alt={reply.user?.name || ''} />
                            <AvatarFallback className="text-xs">{reply.user?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{reply.user?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {blogData.relatedPosts && blogData.relatedPosts.length > 0 && (
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Related Articles</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {blogData.relatedPosts?.map((post: any) => (
              <Link key={post._id} to={`/blog/${post.slug}`}>
                <Card className="h-full hover:border-primary/50 transition-colors">
                  {post.featuredImage?.url && (
                    <div className="aspect-video bg-muted">
                      <OptimizedImage
                        src={post.featuredImage.url}
                        alt={post.title}
                        placeholderType="blog"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-3 space-y-1">
                    <h3 className="font-medium text-sm line-clamp-2">{post.title}</h3>
                    <p className="text-xs text-muted-foreground">{post.readingTime} min read</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
