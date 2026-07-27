import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useToast } from '@/providers/ToastProvider';
import { Star } from 'lucide-react';

export function ReviewsModerationPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [moderateTarget, setModerateTarget] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, statusFilter],
    queryFn: () => adminApi.listReviews({ page, limit: 10, status: statusFilter || undefined }),
   });

  const moderateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.moderateReview(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }); addToast({ title: 'Review moderated', variant: 'success' }); setModerateTarget(null); },
   });

  const reviews = data?.data?.data?.reviews || [];
  const pagination = data?.data?.data?.pagination;

  const columns = [
    { header: 'User', accessor: (r: any) => r.user?.name || 'Unknown' },
    { header: 'Course', accessor: (r: any) => r.course?.title || '-' },
    { header: 'Rating', accessor: (r: any) => (
      <div className="flex items-center gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />)}</div>
    ) },
    { header: 'Review', accessor: (r: any) => (
      <p className="max-w-[300px] truncate text-sm text-muted-foreground">{r.review}</p>
    ) },
    { header: 'Status', accessor: (r: any) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span>
    ) },
    { header: 'Actions', accessor: (r: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className="text-green-600" onClick={() => setModerateTarget({ id: r._id, action: 'approved' })}>Approve</Button>
        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setModerateTarget({ id: r._id, action: 'rejected' })}>Reject</Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reviews Moderation</h1>
      <div className="flex gap-2">
        <Button variant={statusFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter(''); setPage(1); }}>All</Button>
        <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter('pending'); setPage(1); }}>Pending</Button>
        <Button variant={statusFilter === 'approved' ? 'default' : 'outline'} size="sm" onClick={() => { setStatusFilter('approved'); setPage(1); }}>Approved</Button>
      </div>
      <DataTable columns={columns} data={reviews} isLoading={isLoading} pagination={pagination} page={page} onPageChange={setPage} />

      <ConfirmDialog open={!!moderateTarget} onOpenChange={() => setModerateTarget(null)} onConfirm={() => moderateMutation.mutate({ id: moderateTarget!.id, status: moderateTarget!.action })}
        title={moderateTarget?.action === 'approved' ? 'Approve Review' : 'Reject Review'}
        description={`Are you sure you want to ${moderateTarget?.action} this review?`}
        variant={moderateTarget?.action === 'rejected' ? 'destructive' : 'default'} />
    </div>
  );
}
