import { useQuery } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export function InstructorPayoutsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['instructor-payouts', page],
    queryFn: () => instructorApi.getMyPayouts({ page, limit: 15 }).then((r) => r.data.data),
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
      <div>
        <h1 className="text-2xl font-bold">My Payouts</h1>
        <p className="text-muted-foreground">Track your earnings and payout history</p>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-green-50 p-2"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold text-green-600">${summary.totalPaid?.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Paid</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-yellow-50 p-2"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">${summary.totalPending?.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-blue-50 p-2"><DollarSign className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">${summary.totalOverall?.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Total Overall</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Payout History</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Scheduled</th>
                  <th className="pb-3 font-medium">UTR</th>
                </tr>
              </thead>
              <tbody>
                {data?.payouts?.map((payout: any) => (
                  <tr key={payout._id} className="border-b last:border-0">
                    <td className="py-3 font-medium">${payout.amount?.toFixed(2)}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="capitalize">{payout.sourceType}</Badge>
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[payout.status] || ''}`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">{new Date(payout.scheduledDate).toLocaleDateString()}</td>
                    <td className="py-3 text-xs text-muted-foreground">{payout.utr || '-'}</td>
                  </tr>
                ))}
                {(!data?.payouts || data.payouts.length === 0) && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No payouts yet</td></tr>
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
