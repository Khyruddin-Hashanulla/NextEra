import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { QUERY_KEYS } from '@/lib/constants';
import { loadRazorpayScript, openRazorpayCheckout } from '@/lib/razorpay';
import { useToast } from '@/providers/ToastProvider';
import type { StudentOrdersResponse } from '@/types/student';

export const ORDERS_PAGE_SIZE = 10;

export function useOrders(page: number) {
  return useQuery({
    queryKey: QUERY_KEYS.student.orders({ page }),
    queryFn: ({ signal }) =>
      studentApi
        .listMyPayments({ page, limit: ORDERS_PAGE_SIZE }, signal)
        .then((res) => res.data.data as StudentOrdersResponse),
    placeholderData: (prev) => prev,
  });
}

export function useRetryPayment() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Could not load the payment gateway. Please try again.');
      }
      const { data } = await studentApi.retryPayment(paymentId);
      const checkout = data.data as { key?: string; amount?: number; currency?: string; orderId?: string; message?: string };
      if (!checkout?.key || !checkout?.orderId) {
        throw new Error(checkout?.message || 'Could not start payment. Please try again.');
      }
      await openRazorpayCheckout({
        key: checkout.key,
        amount: checkout.amount ?? 0,
        currency: checkout.currency,
        orderId: checkout.orderId,
        onSuccess: async (response) => {
          try {
            await studentApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.orders() });
            addToast({ title: 'Payment successful', variant: 'success' });
          } catch {
            addToast({ title: 'Payment verification failed. Please contact support.', variant: 'error' });
          }
        },
      });
    },
    onError: (err: unknown) => {
      addToast({
        title: err instanceof Error ? err.message : 'Payment failed. Please try again.',
        variant: 'error',
      });
    },
  });
}