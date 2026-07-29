import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { motion } from 'framer-motion';
import { Star, Reply, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="mt-1 text-muted-foreground">Student reviews on your courses</p>
      </motion.div>

      {isLoading ? (
        <motion.div variants={item} className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </motion.div>
      ) : !data?.reviews?.length ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium">No reviews yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Reviews will appear here once students leave them</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={item}>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Course</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Rating</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Review</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Reply</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.reviews.map((review: any) => (
                      <tr key={review._id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {review.user?.avatar?.url && (
                              <img src={review.user.avatar.url} alt="" className="h-7 w-7 rounded-full object-cover" />
                            )}
                            <span className="font-medium">{review.user?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{review.course?.title}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
                            ))}
                          </div>
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3">{review.review}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {review.instructorReply ? (
                            <div className="max-w-[180px] truncate text-xs text-muted-foreground">{review.instructorReply.reply}</div>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => setReplyFor(review)}>
                              <Reply className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data?.pagination && data.pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= (data.pagination.pages || 1)} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {replyFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Reply to Review</h2>
            <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">{replyFor.user?.name}</p>
              <p className="mt-1 text-muted-foreground">{replyFor.review}</p>
              <div className="mt-1 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < replyFor.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
                ))}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium">Your Reply</label>
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setReplyFor(null); setReplyText(''); }}>Cancel</Button>
              <Button onClick={() => replyMutation.mutate({ reviewId: replyFor._id, reply: replyText })} disabled={!replyText || replyMutation.isPending} loading={replyMutation.isPending}>
                Send Reply
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
