import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { DataTable } from '@/features/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { useToast } from '@/providers/ToastProvider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function RefundManagementPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [processTarget, setProcessTarget] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [detailRefund, setDetailRefund] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-refunds', page, statusFilter],
    queryFn: ({ signal }) =>
      adminApi.listRefundRequests({ page, limit: 10, status: statusFilter || undefined }, signal),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => adminApi.approveRefund(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      addToast({ title: 'Refund approved', variant: 'success' });
      setProcessTarget(null);
      setAdminNote('');
    },
    onError: (err: any) => {
      addToast({ title: err?.response?.data?.message || 'Failed to approve refund', variant: 'error' });
      setProcessTarget(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => adminApi.rejectRefund(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      addToast({ title: 'Refund rejected', variant: 'success' });
      setProcessTarget(null);
      setAdminNote('');
    },
    onError: (err: any) => {
      addToast({ title: err?.response?.data?.message || 'Failed to reject refund', variant: 'error' });
      setProcessTarget(null);
    },
  });

  const refunds = data?.data?.data?.refunds || [];
  const pagination = data?.data?.data?.pagination;

  const columns = [
    { header: 'User', accessor: (r: any) => r.user?.name || 'Unknown' },
    { header: 'Amount', accessor: (r: any) => <span className="font-medium">₹{r.amount}</span> },
    { header: 'Item', accessor: (r: any) => r.course?.title || r.bundle?.title || '-' },
    { header: 'Reason', accessor: (r: any) => <p className="max-w-[200px] truncate text-sm">{r.reason}</p> },
    {
      header: 'Status',
      accessor: (r: any) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : r.status === 'processed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}
        >
          {r.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (r: any) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setDetailRefund(r)}>
            View
          </Button>
          {r.status === 'pending' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600"
                onClick={() => setProcessTarget({ id: r._id, action: 'approve' })}
              >
                Approve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => setProcessTarget({ id: r._id, action: 'reject' })}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Refund Management</h1>
      <div className="flex gap-2">
        <Button
          variant={statusFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('');
            setPage(1);
          }}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('pending');
            setPage(1);
          }}
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('approved');
            setPage(1);
          }}
        >
          Approved
        </Button>
        <Button
          variant={statusFilter === 'rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('rejected');
            setPage(1);
          }}
        >
          Rejected
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={refunds}
        isLoading={isLoading}
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />

      <Dialog open={!!detailRefund} onOpenChange={() => setDetailRefund(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Details</DialogTitle>
          </DialogHeader>
          {detailRefund && (
            <div className="space-y-3 text-sm">
              <div>
                <strong>User:</strong> {detailRefund.user?.name} ({detailRefund.user?.email})
              </div>
              <div>
                <strong>Amount:</strong> ₹{detailRefund.amount}
              </div>
              <div>
                <strong>Reason:</strong> {detailRefund.reason}
              </div>
              <div>
                <strong>Status:</strong> {detailRefund.status}
              </div>
              {detailRefund.adminNote && (
                <div>
                  <strong>Admin Note:</strong> {detailRefund.adminNote}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!processTarget}
        onOpenChange={() => {
          setProcessTarget(null);
          setAdminNote('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{processTarget?.action === 'approve' ? 'Approve Refund' : 'Reject Refund'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Admin Note (optional)</Label>
              <Input value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
            </div>
            <Button
              onClick={() => {
                if (processTarget?.action === 'approve')
                  approveMutation.mutate({ id: processTarget!.id, note: adminNote || undefined });
                else rejectMutation.mutate({ id: processTarget!.id, note: adminNote || undefined });
              }}
              variant={processTarget?.action === 'reject' ? 'destructive' : 'default'}
              className="w-full"
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {approveMutation.isPending || rejectMutation.isPending
                ? 'Processing...'
                : processTarget?.action === 'approve'
                  ? 'Approve Refund'
                  : 'Reject Refund'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
