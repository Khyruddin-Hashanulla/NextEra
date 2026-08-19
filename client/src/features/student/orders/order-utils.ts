import type { ErrorCategory } from '@/lib/error-utils';
import type { StudentPayment } from '@/types/student';

export function getOrdersErrorDescription(category: ErrorCategory): string {
  switch (category) {
    case 'network':
      return 'Unable to reach the server. Check your connection and try again.';
    case 'not-found':
      return 'We could not find your orders. Please try again.';
    case 'forbidden':
      return 'You do not have permission to view these orders.';
    case 'server':
      return 'Something went wrong on our end. Please try again.';
    default:
      return 'Something unexpected happened. Please try again.';
  }
}

export type OrderStatus = 'success' | 'pending' | 'failed' | 'refunded';

const ORDER_STATUS_LABELS: Record<string, string> = {
  success: 'Success',
  pending: 'Pending',
  failed: 'Failed',
  refunded: 'Refunded',
};

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

export function getOrderItemTitle(order: StudentPayment): string {
  return order.course?.title || order.bundle?.title || order.subscription?.name || 'Order';
}

export function getOrderThumbnail(order: StudentPayment): string | undefined {
  return order.course?.thumbnail?.url || order.bundle?.thumbnail?.url;
}

export function getOrderItemType(order: StudentPayment): string | undefined {
  return order.type;
}

export function getOrderIdDisplay(order: StudentPayment): string {
  const raw = order.razorpayOrderId || order._id;
  if (raw.length > 14) return `${raw.slice(0, 8)}…${raw.slice(-6)}`;
  return raw;
}

export function formatOrderDate(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatPaymentMethod(method?: string): string {
  if (!method) return '—';
  return method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}