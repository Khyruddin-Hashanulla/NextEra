import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getOrderStatusLabel } from './order-utils';

const STATUS_VARIANTS: Record<string, BadgeProps['variant']> = {
  success: 'success',
  pending: 'warning',
  failed: 'destructive',
  refunded: 'info',
};

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status] || 'secondary'} className={cn('capitalize', className)}>
      {getOrderStatusLabel(status)}
    </Badge>
  );
}