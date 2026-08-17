import { useState } from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/providers/ToastProvider';
import { AuthorBadge } from '@/features/community/components/AuthorBadge';
import type { ForumAuthor, ForumReply, ForumTopic } from '@/types/community';

export function ReplyItem({
  reply,
  currentUserId,
  currentUserRole,
  onMarkBest,
  onDelete,
}: {
  reply: ForumReply;
  topic: ForumTopic;
  currentUserId?: string;
  currentUserRole?: ForumAuthor['role'];
  onMarkBest?: () => void;
  onDelete?: () => void;
}) {
  const { addToast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const isReplyOwner = currentUserId !== undefined && reply.author?._id === currentUserId;
  const canMarkBest = currentUserRole === 'instructor' || currentUserRole === 'admin';
  const canDelete = isReplyOwner || currentUserRole === 'admin';

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
      addToast({ title: 'Reply deleted', variant: 'success' });
    } catch {
      setDeleting(false);
      addToast({ title: 'Could not delete reply', description: 'Something went wrong. Please try again.', variant: 'error' });
    }
  };

  return (
    <article
      className={cn(
        'rounded-2xl border bg-card/50 p-5',
        reply.isBestAnswer ? 'border-success/50' : 'border-border/60'
      )}
    >
      {reply.isBestAnswer && (
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Best answer
        </span>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AuthorBadge author={reply.author} showRole />
        <span className="text-xs text-muted-foreground">{formatRelativeTime(reply.createdAt)}</span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{reply.content}</p>
      {(canMarkBest || canDelete) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
          {canMarkBest && onMarkBest && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onMarkBest}>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {reply.isBestAnswer ? 'Remove best answer' : 'Mark as best answer'}
            </Button>
          )}
          {canDelete && onDelete && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive" onClick={handleDelete} loading={deleting}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete
            </Button>
          )}
        </div>
      )}
    </article>
  );
}