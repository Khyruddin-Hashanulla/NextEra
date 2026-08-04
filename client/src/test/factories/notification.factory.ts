export type NotificationVariant = 'info' | 'success' | 'warning' | 'error';

export interface TestNotification {
  _id: string;
  title: string;
  message: string;
  type: NotificationVariant;
  read: boolean;
  link?: string;
  createdAt: string;
}

export function buildNotification(overrides: Partial<TestNotification> = {}): TestNotification {
  const id = overrides._id ?? 'notification-1';
  return {
    _id: id,
    title: 'New course available',
    message: 'A new course has been published.',
    type: 'info',
    read: false,
    createdAt: '2026-07-01T08:00:00.000Z',
    ...overrides,
  };
}

export function buildPayment(
  overrides: Partial<{
    _id: string;
    orderId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'success' | 'failed' | 'refunded';
    method: string;
    createdAt: string;
    course: { _id: string; title: string };
  }> = {}
) {
  return {
    _id: 'payment-1',
    orderId: 'order_123',
    amount: 1999,
    currency: 'INR',
    status: 'success' as const,
    method: 'razorpay',
    createdAt: '2026-07-02T12:00:00.000Z',
    course: { _id: 'course-1', title: 'Introduction to React' },
    ...overrides,
  };
}
