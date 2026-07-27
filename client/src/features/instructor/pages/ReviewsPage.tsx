import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/providers/ToastProvider';
import { Loader2, Star, Reply } from 'lucide-react';

export function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [replyFor, setReplyFor] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'reviews', page],
    queryFn: () => instructorApi.getReviews({ page, limit: 10 }).then((r) => r.data.data),
  });

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      instructorApi.replyToReview(reviewId, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'reviews'] });
      addToast({ title: 'Reply sent', variant: 'success' });
      setReplyFor(null);
      setReplyText('');
    },
    onError: () => addToast({ title: 'Reply failed', variant: 'error' }),
  });

  return (
    <div>
      <AdminHeader title="Reviews" description="Student reviews on your courses" />

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <DataTable
          columns={[
            { key: 'user', header: 'Student', render: (item: any) => (
              <div className="flex items-center gap-2">
                {item.user?.avatar?.url && <img src={item.user.avatar.url} alt="" className="h-7 w-7 rounded-full object-cover" />}
                <span className="font-medium">{item.user?.name}</span>
              </div>
            )},
            { key: 'course', header: 'Course', render: (item: any) => item.course?.title },
            { key: 'rating', header: 'Rating', render: (item: any) => (
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
            )},
            { key: 'review', header: 'Review' },
            { key: 'createdAt', header: 'Date', render: (item: any) => new Date(item.createdAt).toLocaleDateString() },
            { key: 'instructorReply', header: 'Reply', render: (item: any) => (
              item.instructorReply ? (
                <div className="max-w-[200px] truncate text-xs text-muted-foreground">{item.instructorReply.reply}</div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setReplyFor(item)}><Reply className="h-4 w-4" /></Button>
              )
            )},
          ]}
          data={data?.reviews || []}
          pagination={{
            page: data?.pagination?.page || 1,
            limit: data?.pagination?.limit || 10,
            total: data?.pagination?.total || 0,
            pages: data?.pagination?.pages || 1,
          }}
          onPageChange={setPage}
          emptyMessage="No reviews yet"
        />
      )}

      <Dialog open={!!replyFor} onOpenChange={(v) => { if (!v) { setReplyFor(null); setReplyText(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reply to Review</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {replyFor && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">{replyFor.user?.name}</p>
                <p className="mt-1 text-muted-foreground">{replyFor.review}</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Reply</label>
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4} />
            </div>
            <Button className="w-full" onClick={() => replyMutation.mutate({ reviewId: replyFor._id, reply: replyText })} disabled={!replyText || replyMutation.isPending}>
              {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
