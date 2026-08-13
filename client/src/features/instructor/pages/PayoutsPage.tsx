import { useQuery } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { motion } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
import { CheckCircle, Clock, Banknote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const summaryCards = [
  {
    key: 'totalPaid',
    label: 'Total Paid',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    key: 'totalPending',
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  {
    key: 'totalOverall',
    label: 'Total Overall',
    icon: Banknote,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  },
];

export function InstructorPayoutsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['instructor-payouts', page],
    queryFn: ({ signal }) => instructorApi.getMyPayouts({ page, limit: 15 }, signal).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load payouts"
        message="We couldn't fetch your payout history. Please try again."
        onRetry={refetch}
        showHomeLink={false}
      />
    );
  }

  const summary = data?.summary;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">My Payouts</h1>
        <p className="mt-1 text-muted-foreground">Track your earnings and payout history</p>
      </motion.div>

      {summary && (
        <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((s) => (
            <Card key={s.key} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', s.color)}>
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tracking-tight">
                    {formatCurrency(summary?.[s.key as keyof typeof summary] || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Payout History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                      Scheduled
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">UTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.payouts?.map((payout: any) => (
                    <tr key={payout._id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{formatCurrency(payout.amount || 0)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border px-2 py-0.5 text-xs font-medium capitalize">
                          {payout.sourceType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[payout.status] || ''}`}
                        >
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(payout.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{payout.utr || '-'}</td>
                    </tr>
                  ))}
                  {(!data?.payouts || data.payouts.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No payouts yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {data.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= (data?.totalPages || 1)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
