import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/providers/ToastProvider';
import { useReplyToForumTopic } from '@/features/community/hooks/useCommunity';

export function ReplyComposer({ topicId, isLocked }: { topicId: string; isLocked: boolean }) {
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const replyMutation = useReplyToForumTopic(topicId);

  const canSubmit = content.trim().length > 0 && !isLocked;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || replyMutation.isPending) return;
    try {
      await replyMutation.mutateAsync(content.trim());
      setContent('');
      addToast({ title: 'Reply posted', variant: 'success' });
    } catch {
      addToast({ title: 'Could not post reply', description: 'Something went wrong. Please try again.', variant: 'error' });
    }
  };

  if (isLocked) {
    return (
      <div className="rounded-2xl border border-border/60 bg-muted/40 p-5 text-center text-sm text-muted-foreground">
        This discussion is locked and no longer accepts new replies.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border/60 bg-card/50 p-4" noValidate>
      <label htmlFor="reply-content" className="mb-2 block text-sm font-medium text-foreground">
        Post a reply
      </label>
      <Textarea
        id="reply-content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Share your answer or insight…"
        rows={3}
      />
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" className="gap-1.5" loading={replyMutation.isPending} disabled={!canSubmit}>
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          Post Reply
        </Button>
      </div>
    </form>
  );
}