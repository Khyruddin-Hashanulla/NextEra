import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { categorizeError } from '@/lib/error-utils';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, Clock, ReceiptText, XCircle } from 'lucide-react';
import type { StudentPayment } from '@/types/student';
import { OrderStatusBadge } from './OrderStatusBadge';
import {
  formatOrderDate,
  formatPaymentMethod,
  getOrderItemTitle,
  getOrderThumbnail,
  getOrderItemType,
  getOrdersErrorDescription,
} from './order-utils';

interface OrderDetailsDialogProps {
  order: StudentPayment | null;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function OrderDetailsDialog({ order, onOpenChange }: OrderDetailsDialogProps) {
  const id = order?._id ?? '';

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['student', 'order-detail', id],
    queryFn: ({ signal }) => studentApi.getPaymentById(id, signal).then((res) => res.data.data as StudentPayment),
    enabled: Boolean(id),
  });

  const payment = data ?? order;
  const failure = categorizeError(error);

  return (
    <Dialog open={Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent className="grid-cols-[minmax(0,1fr)] overflow-x-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            {payment
              ? `${getOrderItemTitle(payment)} · ${formatOrderDate(payment.createdAt)}`
              : 'Loading order details'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3" role="status" aria-label="Loading order details">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center py-8 text-center" role="alert">
            <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
            <p className="font-medium text-foreground">Could not load order details</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {getOrdersErrorDescription(failure)}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : payment ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              {getOrderThumbnail(payment) ? (
                <OptimizedImage
                  src={getOrderThumbnail(payment)!}
                  alt={getOrderItemTitle(payment)}
                  placeholderType="course"
                  containerClassName="h-14 w-24 shrink-0 rounded-lg"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <ReceiptText className="h-5 w-5 text-muted-foreground/50" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{getOrderItemTitle(payment)}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {getOrderItemType(payment) ? <Badge variant="secondary" className="mr-1 capitalize">{getOrderItemType(payment)}</Badge> : null}
                  {formatOrderDate(payment.createdAt)}
                </p>
              </div>
              <p className="shrink-0 text-base font-semibold text-foreground">
                {formatCurrency(payment.amount ?? 0, payment.currency)}
              </p>
            </div>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <DetailRow label="Status">
                <OrderStatusBadge status={payment.status} />
              </DetailRow>
              {payment.razorpayOrderId && (
                <DetailRow label="Order ID">
                  <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs">{payment.razorpayOrderId}</code>
                </DetailRow>
              )}
              {payment.razorpayPaymentId && (
                <DetailRow label="Payment ID">
                  <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs">{payment.razorpayPaymentId}</code>
                </DetailRow>
              )}
              <DetailRow label="Payment Method">{formatPaymentMethod(payment.paymentMethod)}</DetailRow>
              <DetailRow label="Currency">{payment.currency || 'INR'}</DetailRow>
            </dl>

            {payment.status === 'failed' && payment.failureDetails && (
              <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <XCircle className="h-4 w-4" />
                  Payment failed
                </p>
                <div className="space-y-1.5 text-sm">
                  {payment.failureDetails.failureReason && (
                    <p>
                      <span className="text-muted-foreground">Reason: </span>
                      {payment.failureDetails.failureReason}
                    </p>
                  )}
                  {payment.failureDetails.failureDescription && (
                    <p>
                      <span className="text-muted-foreground">Description: </span>
                      {payment.failureDetails.failureDescription}
                    </p>
                  )}
                  {payment.failureDetails.failureCode && (
                    <p>
                      <span className="text-muted-foreground">Code: </span>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {payment.failureDetails.failureCode}
                      </code>
                    </p>
                  )}
                  {payment.failureDetails.paymentMethod && (
                    <p>
                      <span className="text-muted-foreground">Method: </span>
                      {payment.failureDetails.paymentMethod}
                    </p>
                  )}
                  {payment.failureDetails.bank && (
                    <p>
                      <span className="text-muted-foreground">Bank: </span>
                      {payment.failureDetails.bank}
                    </p>
                  )}
                  {payment.failureDetails.cardLast4 && (
                    <p>
                      <span className="text-muted-foreground">Card: </span>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        ....{payment.failureDetails.cardLast4}
                      </code>{' '}
                      {payment.failureDetails.cardNetwork || ''}
                    </p>
                  )}
                  {payment.failureDetails.failedAt && (
                    <p>
                      <span className="text-muted-foreground">Failed at: </span>
                      {formatOrderDate(payment.failureDetails.failedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {payment.status === 'pending' && payment.pendingReason && (
              <div className="space-y-2 rounded-lg border border-warning/30 bg-warning/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-warning">
                  <Clock className="h-4 w-4" />
                  Payment pending
                </p>
                <p className="text-sm text-foreground">{payment.pendingReason}</p>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}