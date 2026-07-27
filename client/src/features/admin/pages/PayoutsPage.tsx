import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useState } from 'react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle,
  failed: XCircle,
};

export function PayoutsPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payouts', page, statusFilter],
    queryFn: () => adminApi.getAllPayouts({ page, limit: 15, status: statusFilter || undefined }).then((r) => r.data.data),
   });

  const processMutation = useMutation({
    mutationFn: (id: string) => adminApi.processPayout(id),
    onSuccess: () => {
      addToast({ title: 'Payout processed successfully', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['admin-payouts']});
    },
   });

  const processAllMutation = useMutation({
    mutationFn: () => adminApi.processAllPendingPayouts(),
    onSuccess: (res) => {
      const r = res.data.data;
      addToast({ title: `Processed ${r.success} payouts${r.failed > 0 ? `, ${r.failed} failed` : ''}`, variant: r.failed > 0 ? 'error' : 'success' });
      queryClient.invalidateQueries({ queryKey: ['admin-payouts']});
    },
   });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instructor Payouts</h1>
          <p className="text-muted-foreground">Manage and process instructor payouts</p>
        </div>
        <Button onClick={() => processAllMutation.mutate()} disabled={processAllMutation.isPending}>
          {processAllMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Process All Pending'}
        </Button>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-2xl font-bold text-green-600">${summary.totalPaid?.toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Paid</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-2xl font-bold text-yellow-600">${summary.totalPending?.toFixed(2)}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-2xl font-bold text-blue-600">${summary.totalProcessing?.toFixed(2)}</p><p className="text-xs text-muted-foreground">Processing</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-2xl font-bold text-red-600">${summary.totalFailed?.toFixed(2)}</p><p className="text-xs text-muted-foreground">Failed</p></CardContent></Card>
        </div>
      )}

      <div className="flex gap-2">
        {['', 'pending', 'processing', 'completed', 'failed'].map((s) => (
          <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => { setStatusFilter(s); setPage(1); }}>
            {s || 'All'}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Payouts</CardTitle><CardDescription>{data?.total || 0} total payouts</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Instructor</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Commission</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Scheduled</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.payouts?.map((payout: any) => {
                  const StatusIcon = statusIcons[payout.status] || Clock;
                  return (
                    <tr key={payout._id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {payout.instructor?.avatar?.url ? (
                            <img src={payout.instructor.avatar.url} alt="" className="h-6 w-6 rounded-full" />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                              {payout.instructor?.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <span>{payout.instructor?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 font-medium">${payout.amount?.toFixed(2)}</td>
                      <td className="py-3 text-muted-foreground">${payout.commissionAmount?.toFixed(2)}</td>
                      <td className="py-3">
                        <Badge variant="outline" className="capitalize">{payout.sourceType}</Badge>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[payout.status] || ''}`}>
                          <StatusIcon className={`h-3 w-3 ${payout.status === 'processing' ? 'animate-spin' : ''}`} />
                          {payout.status}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">{new Date(payout.scheduledDate).toLocaleDateString()}</td>
                      <td className="py-3">
                        {payout.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => processMutation.mutate(payout._id)}
                            disabled={processMutation.isPending}
                          >
                            Process Now
                          </Button>
                        )}
                        {payout.status === 'failed' && payout.notes && (
                          <span className="text-xs text-muted-foreground" title={payout.notes}>
                            <AlertTriangle className="inline h-3 w-3 text-red-500" /> Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(!data?.payouts || data.payouts.length === 0) && (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No payouts found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button size="sm" variant="outline" disabled={page >= (data?.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
