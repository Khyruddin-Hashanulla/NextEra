import { useState } from 'react';
import { studentApi } from '@/api/endpoints/student';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { StaggerContainer, StaggerItem } from '@/components/common/PageTransition';
import { categorizeError } from '@/lib/error-utils';
import { ReceiptText } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import type { StudentPayment } from '@/types/student';
import { OrderCard } from '../orders/OrderCard';
import { OrderDetailsDialog } from '../orders/OrderDetailsDialog';
import { OrdersHeader } from '../orders/OrdersHeader';
import { OrdersPagination } from '../orders/OrdersPagination';
import { OrdersSkeleton } from '../orders/OrdersSkeleton';
import { getOrdersErrorDescription } from '../orders/order-utils';
import { useOrders, useRetryPayment } from '../orders/useOrders';

export function OrderHistoryPage() {
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<StudentPayment | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useOrders(page);
  const retryMutation = useRetryPayment();

  const orders = data?.payments ?? [];
  const failure = categorizeError(error);

  const handleRetry = (orderId: string) => {
    setRetryingId(orderId);
    retryMutation.mutate(orderId, {
      onSettled: () => setRetryingId(null),
    });
  };

  const handleDownloadInvoice = async (order: StudentPayment) => {
    try {
      const response = await studentApi.generateInvoice(order._id);
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order._id}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast({ title: 'Invoice downloaded', variant: 'success' });
    } catch {
      addToast({ title: 'Could not download invoice. Please try again.', variant: 'error' });
    }
  };

  return (
    <StaggerContainer>
      <div className="space-y-6">
        <OrdersHeader total={data?.total} />

        {isLoading ? (
          <OrdersSkeleton />
        ) : isError ? (
          <ErrorState
            title="Could not load your orders"
            message={getOrdersErrorDescription(failure)}
            onRetry={refetch}
          />
        ) : !orders.length ? (
          <EmptyState
            icon={<ReceiptText className="h-8 w-8" />}
            title="No orders yet"
            description="When you purchase a course, bundle, or subscription it will show up here with its invoice."
            action={{ label: 'Browse Courses', href: '/courses' }}
          />
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((order) => (
                <StaggerItem key={order._id}>
                  <OrderCard
                    order={order}
                    retrying={retryingId === order._id}
                    onView={setSelectedOrder}
                    onRetry={handleRetry}
                    onDownload={handleDownloadInvoice}
                  />
                </StaggerItem>
              ))}
            </div>

            {data && data.totalPages > 1 && (
              <OrdersPagination page={data.page} pages={data.totalPages} total={data.total} onPageChange={setPage} />
            )}
          </>
        )}

        <OrderDetailsDialog order={selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)} />
      </div>
    </StaggerContainer>
  );
}