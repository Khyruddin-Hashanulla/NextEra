export function buildPaymentDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: '65f1a1b2c3d4e5f6a7b8c9d8',
    user: '65f1a1b2c3d4e5f6a7b8c9d0',
    type: 'course',
    course: '65f1a1b2c3d4e5f6a7b8c9d5',
    razorpayOrderId: 'order_test_1',
    razorpayPaymentId: 'pay_test_1',
    amount: 1000,
    discountAmount: 0,
    status: 'success',
    commissionPercent: 20,
    commissionSplits: [
      {
        instructor: '65f1a1b2c3d4e5f6a7b8c9d1',
        baseAmount: 1000,
        commissionPercent: 20,
        commissionAmount: 200,
        instructorShare: 800,
      },
    ],
    totalCommissionAmount: 200,
    totalInstructorShare: 800,
    walletCredited: false,
    currency: 'INR',
    paymentCapturedAt: null,
    ...overrides,
  };
}

export const coursePayment = buildPaymentDoc();
export const bundlePayment = buildPaymentDoc({
  type: 'bundle',
  course: undefined,
  bundle: '65f1a1b2c3d4e5f6a7b8c9d9',
  amount: 4000,
  commissionSplits: [
    {
      instructor: '65f1a1b2c3d4e5f6a7b8c9d1',
      baseAmount: 3000,
      commissionPercent: 20,
      commissionAmount: 600,
      instructorShare: 2400,
    },
    {
      instructor: '65f1a1b2c3d4e5f6a7b8c9d4',
      baseAmount: 1000,
      commissionPercent: 20,
      commissionAmount: 200,
      instructorShare: 800,
    },
  ],
  totalCommissionAmount: 800,
  totalInstructorShare: 3200,
});
export const subscriptionPayment = buildPaymentDoc({
  type: 'subscription',
  course: undefined,
  subscription: '65f1a1b2c3d4e5f6a7b8c9da',
  amount: 500,
  commissionSplits: [],
  totalInstructorShare: 0,
});

export function buildWalletDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: '65f1a1b2c3d4e5f6a7b8c9db',
    totalRevenue: 0,
    totalCommissionCollected: 0,
    totalPayoutsMade: 0,
    currentBalance: 0,
    pendingPayouts: 0,
    lastUpdated: new Date(),
    ...overrides,
  };
}

export const emptyWallet = buildWalletDoc();
