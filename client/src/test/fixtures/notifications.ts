import { buildNotification, buildPayment } from '../factories/notification.factory';

export const unreadNotification = buildNotification({
  _id: 'notification-1',
  title: 'New course available',
  message: 'Check out our newest course.',
  read: false,
});

export const readNotification = buildNotification({
  _id: 'notification-2',
  title: 'Payment received',
  message: 'Your payment was successful.',
  read: true,
});

export const successPayment = buildPayment({ _id: 'payment-1', status: 'success' });
export const pendingPayment = buildPayment({ _id: 'payment-2', status: 'pending' });
export const failedPayment = buildPayment({ _id: 'payment-3', status: 'failed' });
