import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/providers/ToastProvider';
import { studentApi } from '@/api/endpoints/student';
import { EmptyState } from '@/components/common/EmptyState';
import { MessageSquare } from 'lucide-react';

interface DiscussionTabProps {
  courseId: string;
  lectureId: string;
}

export function DiscussionTab({ courseId, lectureId }: DiscussionTabProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});

  const { data: discussions } = useQuery({
    queryKey: ['student', 'discussions', lectureId],
    queryFn: () => studentApi.listDiscussions(courseId, { lectureId }).then((r: any) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => studentApi.createDiscussion({ courseId, lectureId, title, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'discussions', lectureId] });
      setTitle('');
      setContent('');
      addToast({ title: 'Question posted', variant: 'success' });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => studentApi.replyToDiscussion(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'discussions', lectureId] });
      setReplyContent({});
      addToast({ title: 'Reply posted', variant: 'success' });
    },
  });

  const discussionList = discussions?.discussions;

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2 rounded-lg border p-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Question title" />
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Your question..." rows={3} />
          <Button onClick={() => createMutation.mutate()} disabled={!title.trim() || !content.trim()}>Post Question</Button>
        </div>
        {!discussionList?.length ? (
          <EmptyState
            icon={<MessageSquare className="h-6 w-6 text-muted-foreground" />}
            title="No questions yet"
            description="Ask a question about this lecture to start a discussion."
          />
        ) : (
          discussionList!.map((d: any) => (
            <div key={d._id} className="rounded-lg border p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-medium">{d.user?.name || 'Anonymous'}</span>
                <span className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm font-medium">{d.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d.content}</p>
              {(d.replies || []).map((reply: any, i: number) => (
                <div key={i} className="ml-4 mt-2 border-l-2 pl-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{reply.user?.name || 'Anonymous'}</span>
                    <span className="text-xs text-muted-foreground">{new Date(reply.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm">{reply.content}</p>
                </div>
              ))}
              <div className="mt-2 flex gap-2">
                <Input
                  value={replyContent[d._id] || ''}
                  onChange={(e) => setReplyContent({ ...replyContent, [d._id]: e.target.value })}
                  placeholder="Write a reply..."
                  className="flex-1"
                />
                <Button size="sm" onClick={() => {
                  if (replyContent[d._id]?.trim()) {
                    replyMutation.mutate({ id: d._id, content: replyContent[d._id] });
                  }
                }}>Reply</Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}