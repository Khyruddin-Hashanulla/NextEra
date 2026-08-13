import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  ShoppingBag,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/providers/ToastProvider';
import { loadRazorpayScript } from '@/lib/razorpay';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  pending: { icon: Clock, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  failed: { icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export function OrderHistoryPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'payments', page],
    queryFn: () => studentApi.listMyPayments({ page, limit: 10 }).then((r: any) => r.data.data),
  });

  const retryMutation = useMutation({
    mutationFn: (paymentId: string) => studentApi.retryPayment(paymentId),
    onSuccess: async (res, _paymentId) => {
      const data = res.data.data;
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        addToast({ title: 'Failed to load payment gateway', variant: 'error' });
        setRetryingId(null);
        return;
      }
      const rzp = new (window as any).Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'NextEra LMS',
        description: 'Retry Payment',
        order_id: data.orderId,
        handler: async (response: any) => {
          try {
            await studentApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            addToast({ title: 'Payment successful!', variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['student', 'payments'] });
          } catch {
            addToast({ title: 'Payment verification failed', variant: 'error' });
          }
        },
        modal: {
          ondismiss: () => setRetryingId(null),
        },
      });
      rzp.open();
    },
    onError: () => {
      addToast({ title: 'Failed to initiate retry', variant: 'error' });
      setRetryingId(null);
    },
  });

  const handleRetry = useCallback(
    (paymentId: string) => {
      setRetryingId(paymentId);
      retryMutation.mutate(paymentId);
    },
    [retryMutation]
  );

  const handleDownloadInvoice = async (paymentId: string) => {
    try {
      const response = await studentApi.generateInvoice(paymentId);
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${paymentId}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const payments = data?.payments || [];
  const totalPages = data?.totalPages || 1;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Order History</h1>
        <p className="mt-1 text-muted-foreground">View your payment history and download invoices</p>
      </motion.div>

      {!payments.length ? (
        <motion.div variants={item}>
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8" />}
            title="No orders yet"
            description="Enroll in a course to get started"
            action={{ label: 'Browse Courses', href: '/courses' }}
          />
        </motion.div>
      ) : (
        <>
          <motion.div variants={item} className="space-y-3">
            {payments.map((payment: any) => {
              const StatusIcon = statusConfig[payment.status]?.icon || Clock;
              return (
                <Card key={payment._id} className="transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <ShoppingBag className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{payment.course?.title || 'Course Payment'}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.razorpayOrderId ? `ID: ${payment.razorpayOrderId.slice(-12)}` : ''}
                          {' · '}
                          {new Date(payment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">₹{payment.amount?.toLocaleString() ?? 0}</p>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                            statusConfig[payment.status]?.className || 'bg-muted text-muted-foreground'
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {payment.status}
                        </span>
                      </div>
                      {payment.status === 'success' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice(payment._id)}
                          title="Download Invoice"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {payment.status === 'failed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetry(payment._id)}
                          disabled={retryingId === payment._id}
                          title="Retry Payment"
                        >
                          <RotateCcw className={`h-4 w-4 ${retryingId === payment._id ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>

          {totalPages > 1 && (
            <motion.div variants={item} className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                      page === i + 1 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
