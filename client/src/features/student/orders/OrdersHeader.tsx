import { Skeleton } from '@/components/ui/skeleton';
import { ReceiptText } from 'lucide-react';

interface OrdersHeaderProps {
  total?: number;
}

export function OrdersHeader({ total }: OrdersHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">Student</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your purchases, download invoices, and retry failed payments.
        </p>
      </div>
      {total === undefined ? (
        <Skeleton className="h-8 w-28 rounded-full" />
      ) : (
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
          <ReceiptText className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">{total}</span> orders
        </span>
      )}
    </div>
  );
}