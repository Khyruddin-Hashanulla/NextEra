import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { formatCurrency } from '@/lib/utils';
import { Download, Eye, Loader2, ReceiptText, RotateCcw } from 'lucide-react';
import type { StudentPayment } from '@/types/student';
import { OrderStatusBadge } from './OrderStatusBadge';
import {
  formatOrderDate,
  formatPaymentMethod,
  getOrderIdDisplay,
  getOrderItemTitle,
  getOrderItemType,
  getOrderThumbnail,
} from './order-utils';

interface OrderCardProps {
  order: StudentPayment;
  retrying: boolean;
  onView: (order: StudentPayment) => void;
  onRetry: (orderId: string) => void;
  onDownload: (order: StudentPayment) => void;
}

export function OrderCard({ order, retrying, onView, onRetry, onDownload }: OrderCardProps) {
  const title = getOrderItemTitle(order);
  const thumbnail = getOrderThumbnail(order);
  const type = getOrderItemType(order);
  const amount = formatCurrency(order.amount ?? 0, order.currency);

  return (
    <Card className="overflow-hidden" data-testid="order-card">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {thumbnail ? (
            <OptimizedImage
              src={thumbnail}
              alt={title}
              placeholderType="course"
              containerClassName="h-16 w-28 shrink-0 rounded-lg"
              className="object-cover"
            />
          ) : (
            <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-muted">
              <ReceiptText className="h-6 w-6 text-muted-foreground/50" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">{title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {type && (
                <Badge variant="secondary" className="capitalize">
                  {type}
                </Badge>
              )}
              {order.paymentMethod && <span>{formatPaymentMethod(order.paymentMethod)}</span>}
              <span aria-hidden="true">·</span>
              <span className="font-mono text-xs">{getOrderIdDisplay(order)}</span>
              <span aria-hidden="true">·</span>
              <span>{formatOrderDate(order.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1 sm:shrink-0">
          <p className="text-base font-semibold text-foreground">{amount}</p>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          <Button variant="outline" size="sm" onClick={() => onView(order)} aria-label={`View details for ${title}`}>
            <Eye className="h-4 w-4" />
            Details
          </Button>
          {order.status === 'failed' && (
            <Button
              variant="outline"
              size="sm"
              disabled={retrying}
              onClick={() => onRetry(order._id)}
              aria-label={`Retry payment for ${title}`}
            >
              {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Retry
            </Button>
          )}
          {order.status === 'success' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(order)}
              aria-label={`Download invoice for ${title}`}
            >
              <Download className="h-4 w-4" />
              Invoice
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}