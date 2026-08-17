import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, Heart, Lock, MessageSquare, Pin } from 'lucide-react';
import { cn, formatRelativeTime, truncate } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { ForumCategoryBadge } from '@/features/community/components/ForumCategoryBadge';
import { AuthorBadge } from '@/features/community/components/AuthorBadge';
import type { ForumTopic } from '@/types/community';

export function TopicCard({ topic, className }: { topic: ForumTopic; className?: string }) {
  const time = topic.lastActivityAt ?? topic.updatedAt;

  return (
    <Link
      to={ROUTES.COMMUNITY_TOPIC(topic._id)}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm transition-colors duration-300 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <AuthorBadge author={topic.author} showRole />
        <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(time)}</span>
      </div>

      <h3 className="mt-3 text-heading-sm font-semibold text-foreground text-balance group-hover:text-primary">
        {topic.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {truncate(topic.content, 180)}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ForumCategoryBadge category={topic.category} />
        {topic.isPinned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
            <Pin className="h-3 w-3" aria-hidden="true" />
            Pinned
          </span>
        )}
        {topic.isLocked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Locked
          </span>
        )}
        {topic.isSolved && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Solved
          </span>
        )}
        {topic.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-border/40 pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          {topic.replyCount} {topic.replyCount === 1 ? 'reply' : 'replies'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          {topic.views} views
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Heart className={cn('h-3.5 w-3.5', topic.likedByMe && 'fill-primary text-primary')} aria-hidden="true" />
          {topic.likeCount}
        </span>
      </div>
    </Link>
  );
}