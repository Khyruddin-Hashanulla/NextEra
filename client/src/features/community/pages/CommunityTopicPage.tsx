import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, Heart, Lock, Pin, Trash2 } from 'lucide-react';
import { Section, Container } from '@/components/common/Section';
import { PageBackground } from '@/components/layout/PageBackground';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { SEO } from '@/components/seo/SEO';
import { ROUTES } from '@/lib/constants';
import { cn, formatNumber, formatRelativeTime } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import {
  useDeleteForumReply,
  useDeleteForumTopic,
  useForumTopic,
  useMarkBestAnswer,
  useMarkForumSolved,
  useSetForumLocked,
  useSetForumPinned,
  useToggleForumLike,
} from '@/features/community/hooks/useCommunity';
import { ForumCategoryBadge } from '@/features/community/components/ForumCategoryBadge';
import { AuthorBadge } from '@/features/community/components/AuthorBadge';
import { ReplyComposer } from '@/features/community/components/ReplyComposer';
import { ReplyItem } from '@/features/community/components/ReplyItem';
import { TopicDetailSkeleton } from '@/features/community/components/CommunitySkeleton';
import { MessagesSquare } from 'lucide-react';

export function CommunityTopicPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const topicQuery = useForumTopic(id);
  const likeMutation = useToggleForumLike(id ?? '');
  const solvedMutation = useMarkForumSolved(id ?? '');
  const pinMutation = useSetForumPinned(id ?? '');
  const lockMutation = useSetForumLocked(id ?? '');
  const bestAnswerMutation = useMarkBestAnswer(id ?? '');
  const deleteTopicMutation = useDeleteForumTopic();
  const deleteReplyMutation = useDeleteForumReply(id ?? '');

  const topic = topicQuery.data;
  const isOwner = isAuthenticated && topic?.author?._id === user?._id;
  const isAdmin = user?.role === 'admin';

  const handleToggleLike = () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    likeMutation.mutate(undefined, {
      onError: () => addToast({ title: 'Could not update reaction', variant: 'error' }),
    });
  };

  const handleToggleSolved = () => {
    if (!topic) return;
    solvedMutation.mutate(!topic.isSolved, {
      onError: () => addToast({ title: 'Could not update status', variant: 'error' }),
    });
  };

  const handleDeleteTopic = async () => {
    if (!topic) return;
    if (!window.confirm('Delete this discussion permanently? This cannot be undone.')) return;
    try {
      await deleteTopicMutation.mutateAsync(topic._id);
      addToast({ title: 'Discussion deleted', variant: 'success' });
      navigate(ROUTES.COMMUNITY);
    } catch {
      addToast({ title: 'Could not delete discussion', variant: 'error' });
    }
  };

  const isNotFound = topicQuery.isError && (topicQuery.error as { response?: { status?: number } })?.response?.status === 404;

  const pageTitle = topic?.title ?? 'Community Discussion';

  return (
    <>
      <SEO title={pageTitle} description={topic?.content?.slice(0, 160) ?? 'Community discussion'} />
      <div className="min-h-screen overflow-x-clip">
        <Section size="sm" id="hero" className="relative overflow-hidden">
          <PageBackground variant="hero" className="absolute inset-0" />
          <Container>
            <div className="relative z-10 mx-auto max-w-4xl">
              <Link
                to={ROUTES.COMMUNITY}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Community
              </Link>

              {topicQuery.isLoading ? (
                <div className="mt-6">
                  <TopicDetailSkeleton />
                </div>
              ) : topicQuery.isError ? (
                <div className="mt-6">
                  <ErrorState
                    title={isNotFound ? 'Discussion not found' : "Couldn't load this discussion"}
                    message={
                      isNotFound
                        ? 'This discussion may have been removed.'
                        : 'We ran into a problem fetching this discussion.'
                    }
                    onRetry={isNotFound ? undefined : () => topicQuery.refetch()}
                    showHomeLink
                  />
                </div>
              ) : topic ? (
                <div className="mt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <ForumCategoryBadge category={topic.category} />
                    {topic.isPinned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                        <Pin className="h-3 w-3" aria-hidden="true" />
                        Pinned
                      </span>
                    )}
                    {topic.isLocked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        Locked
                      </span>
                    )}
                    {topic.isSolved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        Solved
                      </span>
                    )}
                  </div>

                  <h1 className="mt-4 text-display-sm font-display font-bold tracking-tight text-foreground text-balance">
                    {topic.title}
                  </h1>

                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <AuthorBadge author={topic.author} size="md" showRole />
                    <span className="text-sm text-muted-foreground">{formatRelativeTime(topic.createdAt)}</span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      {formatNumber(topic.views)} views
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MessagesSquare className="h-4 w-4" aria-hidden="true" />
                      {topic.replyCount} {topic.replyCount === 1 ? 'reply' : 'replies'}
                    </span>
                  </div>

                  {topic.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {topic.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </Container>
        </Section>

        {topic && !topicQuery.isLoading && !topicQuery.isError && (
          <Section size="sm" id="content" className="pt-0 sm:pt-0 lg:pt-0">
            <Container>
              <div className="mx-auto max-w-4xl">
                <article className="rounded-3xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm sm:p-8">
                  <p className="whitespace-pre-wrap text-body leading-relaxed text-foreground">{topic.content}</p>

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-5">
                    <Button
                      variant={topic.likedByMe ? 'default' : 'outline'}
                      size="sm"
                      className="gap-2 rounded-full"
                      onClick={handleToggleLike}
                      loading={likeMutation.isPending}
                    >
                      <Heart
                        className={cn('h-4 w-4', topic.likedByMe && 'fill-primary-foreground')}
                        aria-hidden="true"
                      />
                      {topic.likeCount > 0 ? `${formatNumber(topic.likeCount)} ${topic.likeCount === 1 ? 'like' : 'likes'}` : 'Like'}
                    </Button>

                    <div className="flex flex-wrap items-center gap-2">
                      {isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 rounded-full"
                            onClick={() => pinMutation.mutate(!topic.isPinned)}
                            loading={pinMutation.isPending}
                          >
                            <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                            {topic.isPinned ? 'Unpin' : 'Pin'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 rounded-full"
                            onClick={() => lockMutation.mutate(!topic.isLocked)}
                            loading={lockMutation.isPending}
                          >
                            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                            {topic.isLocked ? 'Unlock' : 'Lock'}
                          </Button>
                        </>
                      )}
                      {isOwner && (
                        <Button
                          variant={topic.isSolved ? 'success' : 'outline'}
                          size="sm"
                          className="gap-1.5 rounded-full"
                          onClick={handleToggleSolved}
                          loading={solvedMutation.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {topic.isSolved ? 'Mark as open' : 'Mark as solved'}
                        </Button>
                      )}
                      {(isOwner || isAdmin) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 rounded-full text-destructive"
                          onClick={handleDeleteTopic}
                          loading={deleteTopicMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </article>

                <section aria-labelledby="replies-heading" className="mt-10">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 id="replies-heading" className="text-heading-md font-semibold text-foreground">
                      Replies
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({topic.replyCount})
                      </span>
                    </h2>
                  </div>

                  {isAuthenticated ? (
                    <ReplyComposer topicId={topic._id} isLocked={topic.isLocked} />
                  ) : (
                    <div className="rounded-2xl border border-border/60 bg-card/50 p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Sign in to join the conversation and reply to this discussion.
                      </p>
                      <Button asChild size="sm" className="mt-4 rounded-full">
                        <Link to={ROUTES.LOGIN}>Sign in to reply</Link>
                      </Button>
                    </div>
                  )}

                  <div className="mt-6 space-y-4">
                    {topic.replies && topic.replies.length > 0 ? (
                      topic.replies.map((reply) => (
                        <ReplyItem
                          key={reply._id}
                          reply={reply}
                          topic={topic}
                          currentUserId={user?._id}
                          currentUserRole={user?.role}
                          onMarkBest={
                            isAuthenticated && (user?.role === 'instructor' || user?.role === 'admin')
                              ? () =>
                                  bestAnswerMutation.mutate(reply._id, {
                                    onError: () => addToast({ title: 'Could not update best answer', variant: 'error' }),
                                  })
                              : undefined
                          }
                          onDelete={
                            isAuthenticated
                              ? () => deleteReplyMutation.mutateAsync(reply._id)
                              : undefined
                          }
                        />
                      ))
                    ) : (
                      <EmptyState
                        icon={<MessagesSquare className="h-6 w-6 text-muted-foreground" />}
                        title="No replies yet"
                        description="Be the first to reply and help the author."
                      />
                    )}
                  </div>
                </section>
              </div>
            </Container>
          </Section>
        )}
      </div>
    </>
  );
}