export interface MockRazorpayInstance {
  orders: { create: ReturnType<typeof vi.fn> };
  payouts: { create: ReturnType<typeof vi.fn> };
  payments: { refund: ReturnType<typeof vi.fn> };
}

export class MockRazorpay {
  static instances: MockRazorpayInstance[] = [];
  static orderToReturn: Record<string, unknown> = { id: 'order_test_1', amount: 100000, currency: 'INR' };
  static payoutToReturn: Record<string, unknown> = { id: 'payout_1', utr: 'UTR123', status: 'processed' };
  static refundToReturn: Record<string, unknown> = {
    id: 'refund_1',
    status: 'processed',
    speed_processed: 'instant',
    created_at: 1234567890,
  };
  static refundError: Error | null = null;
  static payoutError: Error | null = null;
  static orderError: Error | null = null;

  orders: MockRazorpayInstance['orders'];
  payouts: MockRazorpayInstance['payouts'];
  payments: MockRazorpayInstance['payments'];

  constructor(..._args: unknown[]) {
    this.orders = {
      create: vi.fn().mockImplementation(() => {
        if (MockRazorpay.orderError) return Promise.reject(MockRazorpay.orderError);
        return Promise.resolve(MockRazorpay.orderToReturn);
      }),
    };
    this.payouts = {
      create: vi.fn().mockImplementation(() => {
        if (MockRazorpay.payoutError) return Promise.reject(MockRazorpay.payoutError);
        return Promise.resolve(MockRazorpay.payoutToReturn);
      }),
    };
    this.payments = {
      refund: vi.fn().mockImplementation(() => {
        if (MockRazorpay.refundError) return Promise.reject(MockRazorpay.refundError);
        return Promise.resolve(MockRazorpay.refundToReturn);
      }),
    };
    MockRazorpay.instances.push(this);
  }

  static reset(): void {
    MockRazorpay.instances = [];
    MockRazorpay.orderToReturn = { id: 'order_test_1', amount: 100000, currency: 'INR' };
    MockRazorpay.payoutToReturn = { id: 'payout_1', utr: 'UTR123', status: 'processed' };
    MockRazorpay.refundToReturn = {
      id: 'refund_1',
      status: 'processed',
      speed_processed: 'instant',
      created_at: 1234567890,
    };
    MockRazorpay.refundError = null;
    MockRazorpay.payoutError = null;
    MockRazorpay.orderError = null;
  }

  static last(): MockRazorpayInstance | undefined {
    return MockRazorpay.instances[MockRazorpay.instances.length - 1];
  }
}
