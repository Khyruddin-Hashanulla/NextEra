import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from '../../../src/config/env';
import { PaymentService } from '../../../src/services/payment.service';
import { Course } from '../../../src/models/course.model';
import { Bundle } from '../../../src/models/bundle.model';
import { Enrollment } from '../../../src/models/enrollment.model';
import { Payment } from '../../../src/models/payment.model';
import { PlatformWallet } from '../../../src/models/platformWallet.model';
import { Payout } from '../../../src/models/payout.model';
import { Subscription } from '../../../src/models/subscription.model';
import { SubscriptionEnrollment } from '../../../src/models/subscriptionEnrollment.model';
import { Coupon } from '../../../src/models/coupon.model';
import { Refund } from '../../../src/models/refund.model';
import { WebhookEvent } from '../../../src/models/webhookEvent.model';
import { Notification } from '../../../src/models/notification.model';
import { AuditLog } from '../../../src/models/auditLog.model';
import { User } from '../../../src/models/user.model';
import { platformSettingsService } from '../../../src/services/platformSettings.service';
import { affiliateService } from '../../../src/services/affiliate.service';
import { cacheManager } from '../../../src/cache/cacheManager';
import { MockRazorpay } from '../../mocks/razorpay';

vi.mock('razorpay', () => ({ default: MockRazorpay }));

vi.mock('../../../src/models/course.model', () => ({
  Course: { findById: vi.fn(), find: vi.fn(), findByIdAndUpdate: vi.fn(), updateMany: vi.fn() },
}));

vi.mock('../../../src/models/bundle.model', () => ({
  Bundle: { findById: vi.fn(), findByIdAndUpdate: vi.fn() },
}));

vi.mock('../../../src/models/enrollment.model', () => ({
  Enrollment: {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    insertMany: vi.fn(),
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock('../../../src/models/payment.model', () => ({
  Payment: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../../../src/models/platformWallet.model', () => ({
  PlatformWallet: { findOne: vi.fn(), create: vi.fn(), findByIdAndUpdate: vi.fn() },
}));

vi.mock('../../../src/models/payout.model', () => ({
  Payout: {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
    insertMany: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock('../../../src/models/subscription.model', () => ({
  Subscription: { findById: vi.fn(), findByIdAndUpdate: vi.fn() },
}));

vi.mock('../../../src/models/subscriptionEnrollment.model', () => ({
  SubscriptionEnrollment: { findOne: vi.fn(), create: vi.fn(), deleteOne: vi.fn() },
}));

vi.mock('../../../src/models/coupon.model', () => ({
  Coupon: { findOne: vi.fn(), findByIdAndUpdate: vi.fn() },
}));

vi.mock('../../../src/models/refund.model', () => ({
  Refund: { findOne: vi.fn(), create: vi.fn(), findByIdAndUpdate: vi.fn() },
}));

vi.mock('../../../src/models/webhookEvent.model', () => ({
  WebhookEvent: { findOne: vi.fn(), create: vi.fn() },
}));

vi.mock('../../../src/models/notification.model', () => ({
  Notification: { insertMany: vi.fn() },
}));

vi.mock('../../../src/models/auditLog.model', () => ({
  AuditLog: { create: vi.fn() },
}));

vi.mock('../../../src/models/user.model', () => ({
  User: { findById: vi.fn(), find: vi.fn() },
}));

vi.mock('../../../src/utils/transaction', () => ({
  withTransaction: vi.fn(async (fn: (session: unknown) => Promise<unknown>) => fn({})),
}));

vi.mock('../../../src/services/platformSettings.service', () => ({
  platformSettingsService: { getCommissionPercentage: vi.fn() },
}));

vi.mock('../../../src/services/affiliate.service', () => ({
  affiliateService: {
    processPurchaseCommission: vi.fn().mockResolvedValue(undefined),
    reverseCommissionOnRefund: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../src/cache/cacheManager', () => ({
  cacheManager: {
    invalidateStudentCache: vi.fn(),
    invalidateAdminCache: vi.fn(),
    invalidateRevenueCache: vi.fn(),
    invalidateCourseCache: vi.fn(),
    invalidateStudentCourseList: vi.fn(),
    invalidateInstructorCache: vi.fn(),
  },
}));

const service = new PaymentService();

const walletDoc = {
  _id: 'w1',
  totalRevenue: 0,
  totalCommissionCollected: 0,
  totalPayoutsMade: 0,
  currentBalance: 0,
  pendingPayouts: 0,
};

const paymentDoc = {
  _id: 'p1',
  user: 'u1',
  type: 'course',
  course: 'c1',
  bundle: null,
  subscription: null,
  amount: 1000,
  discountAmount: 0,
  razorpayOrderId: 'order_test_1',
  razorpayPaymentId: 'pay_1',
  status: 'pending',
  totalCommissionAmount: 200,
  totalInstructorShare: 800,
  commissionSplits: [{ instructor: 'i1', instructorShare: 800, commissionAmount: 200, baseAmount: 1000 }],
  walletCredited: false,
  save: vi.fn(),
};

const courseDoc = {
  _id: 'c1',
  title: 'React',
  price: 1000,
  status: 'published',
  isApproved: true,
  instructor: { toString: () => 'i1' },
};

function query(value: unknown) {
  const q = Promise.resolve(value) as any;
  q.populate = vi.fn().mockReturnValue(q);
  q.select = vi.fn().mockReturnValue(q);
  q.sort = vi.fn().mockReturnValue(q);
  q.skip = vi.fn().mockReturnValue(q);
  q.limit = vi.fn().mockReturnValue(q);
  q.session = vi.fn().mockReturnValue(q);
  q.lean = vi.fn().mockReturnValue(value);
  q.exec = vi.fn().mockResolvedValue(value);
  return q;
}

function makeSession() {
  return {
    startTransaction: vi.fn(),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    abortTransaction: vi.fn().mockResolvedValue(undefined),
    endSession: vi.fn(),
  };
}

function paymentSignature(orderId: string, paymentId: string): string {
  return crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

function webhookSignature(payload: unknown): string {
  return crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

beforeEach(() => {
  MockRazorpay.reset();
  vi.spyOn(mongoose, 'startSession').mockResolvedValue(makeSession() as never);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('calculateCommission', () => {
  it('splits the amount by commission percent', () => {
    expect(service.calculateCommission(1000, 20)).toEqual({
      commissionPercent: 20,
      commissionAmount: 200,
      instructorShare: 800,
    });
  });

  it('rounds the commission amount', () => {
    expect(service.calculateCommission(333, 10).commissionAmount).toBe(33);
  });
});

describe('getOrCreateWallet', () => {
  it('returns the existing wallet', async () => {
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(walletDoc);
    await expect(service.getOrCreateWallet()).resolves.toBe(walletDoc);
    expect(PlatformWallet.create).not.toHaveBeenCalled();
  });

  it('creates a fresh wallet when none exists', async () => {
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(null);
    vi.mocked(PlatformWallet.create as never).mockResolvedValue(walletDoc);
    await expect(service.getOrCreateWallet()).resolves.toBe(walletDoc);
    expect(PlatformWallet.create).toHaveBeenCalledWith({
      totalRevenue: 0,
      totalCommissionCollected: 0,
      totalPayoutsMade: 0,
      currentBalance: 0,
      pendingPayouts: 0,
    });
  });
});

describe('validateCoupon', () => {
  it('returns a passthrough when no code is given', async () => {
    await expect(service.validateCoupon(undefined, 1000)).resolves.toEqual({
      coupon: null,
      discountAmount: 0,
      finalAmount: 1000,
    });
    expect(Coupon.findOne).not.toHaveBeenCalled();
  });

  it('rejects an unknown coupon', async () => {
    vi.mocked(Coupon.findOne as never).mockResolvedValue(null);
    await expect(service.validateCoupon('SAVE10', 1000)).rejects.toThrow('Invalid coupon code');
  });

  it('rejects an expired coupon', async () => {
    vi.mocked(Coupon.findOne as never).mockResolvedValue({ expiresAt: new Date(Date.now() - 1000) });
    await expect(service.validateCoupon('SAVE10', 1000)).rejects.toThrow('Coupon has expired');
  });

  it('rejects a coupon that hit its usage limit', async () => {
    vi.mocked(Coupon.findOne as never).mockResolvedValue({
      expiresAt: new Date(Date.now() + 1000),
      maxUses: 5,
      usedCount: 5,
    });
    await expect(service.validateCoupon('SAVE10', 1000)).rejects.toThrow(
      'Coupon usage limit reached',
    );
  });

  it('rejects a coupon below the minimum amount', async () => {
    vi.mocked(Coupon.findOne as never).mockResolvedValue({
      expiresAt: new Date(Date.now() + 1000),
      maxUses: 0,
      usedCount: 0,
      minAmount: 500,
    });
    await expect(service.validateCoupon('SAVE10', 100)).rejects.toThrow(
      'Minimum amount not met for coupon',
    );
  });

  it('applies a percentage discount', async () => {
    vi.mocked(Coupon.findOne as never).mockResolvedValue({
      expiresAt: new Date(Date.now() + 1000),
      maxUses: 0,
      usedCount: 0,
      minAmount: 0,
      discountType: 'percentage',
      discountValue: 10,
    });
    const result = await service.validateCoupon('SAVE10', 1000);
    expect(result.discountAmount).toBe(100);
    expect(result.finalAmount).toBe(900);
  });

  it('applies a fixed discount and clamps to zero', async () => {
    vi.mocked(Coupon.findOne as never).mockResolvedValue({
      expiresAt: new Date(Date.now() + 1000),
      maxUses: 0,
      usedCount: 0,
      minAmount: 0,
      discountType: 'fixed',
      discountValue: 2000,
    });
    const result = await service.validateCoupon('BIG', 1000);
    expect(result.discountAmount).toBe(2000);
    expect(result.finalAmount).toBe(0);
  });

  it('looks up coupons by uppercased code', async () => {
    vi.mocked(Coupon.findOne as never).mockResolvedValue({
      expiresAt: new Date(Date.now() + 1000),
      maxUses: 0,
      usedCount: 0,
      minAmount: 0,
      discountType: 'fixed',
      discountValue: 0,
    });
    await service.validateCoupon('save10', 1000);
    expect(Coupon.findOne).toHaveBeenCalledWith({ code: 'SAVE10', isActive: true });
  });
});

describe('initiateCoursePayment', () => {
  it('rejects an unknown course', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(query(null));
    await expect(service.initiateCoursePayment('u1', 'c1')).rejects.toThrow('Course not found');
  });

  it('rejects an unpublished course', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(query({ ...courseDoc, status: 'draft' }));
    await expect(service.initiateCoursePayment('u1', 'c1')).rejects.toThrow(
      'Course is not available for purchase',
    );
  });

  it('rejects already-enrolled users', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(query(courseDoc));
    vi.mocked(Enrollment.findOne as never).mockResolvedValue({ _id: 'e1' });
    await expect(service.initiateCoursePayment('u1', 'c1')).rejects.toThrow(
      'Already enrolled in this course',
    );
  });

  it('enrolls for free courses', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(query({ ...courseDoc, price: 0 }));
    vi.mocked(Enrollment.findOne as never).mockResolvedValue(null);
    vi.mocked(Enrollment.create as never).mockResolvedValue([{ _id: 'e1' }]);

    const result = await service.initiateCoursePayment('u1', 'c1');

    expect(result).toEqual({ free: true, enrollment: { _id: 'e1' } });
    expect(Enrollment.create).toHaveBeenCalled();
    expect(Course.findByIdAndUpdate).toHaveBeenCalledWith(
      'c1',
      { $inc: { totalEnrollments: 1 } },
      expect.any(Object),
    );
  });

  it('creates a razorpay order and a pending payment for paid courses', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(query(courseDoc));
    vi.mocked(Enrollment.findOne as never).mockResolvedValue(null);
    vi.mocked(platformSettingsService.getCommissionPercentage).mockResolvedValue(20);
    vi.mocked(Payment.create as never).mockResolvedValue([{ _id: 'p1' }]);

    const result = await service.initiateCoursePayment('u1', 'c1');

    expect(result).toEqual({
      orderId: 'order_test_1',
      amount: 100000,
      currency: 'INR',
      key: env.razorpayKeyId,
      paymentId: 'p1',
    });
    const payment = (Payment.create as any).mock.calls[0][0][0];
    expect(payment).toEqual(
      expect.objectContaining({
        user: 'u1',
        type: 'course',
        course: 'c1',
        amount: 1000,
        status: 'pending',
        totalCommissionAmount: 200,
        totalInstructorShare: 800,
      }),
    );
    expect(payment.commissionSplits[0]).toEqual(
      expect.objectContaining({ instructor: 'i1', baseAmount: 1000, instructorShare: 800 }),
    );
    expect(platformSettingsService.getCommissionPercentage).toHaveBeenCalled();
  });

  it('applies a coupon discount and increments usage', async () => {
    vi.mocked(Course.findById as never).mockReturnValue(query(courseDoc));
    vi.mocked(Enrollment.findOne as never).mockResolvedValue(null);
    vi.mocked(platformSettingsService.getCommissionPercentage).mockResolvedValue(20);
    vi.mocked(Coupon.findOne as never).mockResolvedValue({
      _id: 'cp1',
      expiresAt: new Date(Date.now() + 1000),
      maxUses: 0,
      usedCount: 0,
      minAmount: 0,
      discountType: 'percentage',
      discountValue: 10,
    });
    vi.mocked(Payment.create as never).mockResolvedValue([{ _id: 'p1' }]);

    await service.initiateCoursePayment('u1', 'c1', 'SAVE10');

    const payment = (Payment.create as any).mock.calls[0][0][0];
    expect(payment.amount).toBe(900);
    expect(payment.discountAmount).toBe(100);
    expect(payment.coupon).toBe('cp1');
    expect(Coupon.findByIdAndUpdate).toHaveBeenCalledWith(
      'cp1',
      { $inc: { usedCount: 1 } },
      expect.any(Object),
    );
  });
});

describe('verifyCoursePayment', () => {
  it('rejects an invalid signature', async () => {
    await expect(
      service.verifyCoursePayment('u1', 'order_test_1', 'pay_1', 'bad-signature'),
    ).rejects.toThrow('Invalid payment signature');
  });

  it('rejects when the payment is missing', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue(null);
    const sig = paymentSignature('order_test_1', 'pay_1');
    await expect(service.verifyCoursePayment('u1', 'order_test_1', 'pay_1', sig)).rejects.toThrow(
      'Payment not found',
    );
  });

  it('rejects a non-course payment', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue({ ...paymentDoc, type: 'bundle' });
    const sig = paymentSignature('order_test_1', 'pay_1');
    await expect(service.verifyCoursePayment('u1', 'order_test_1', 'pay_1', sig)).rejects.toThrow(
      'Not a course payment',
    );
  });

  it('is idempotent when the payment was already claimed', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue(paymentDoc);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue(null);
    vi.mocked(Course.find as never).mockReturnValue(query([]));
    const sig = paymentSignature('order_test_1', 'pay_1');

    const result = await service.verifyCoursePayment('u1', 'order_test_1', 'pay_1', sig);

    expect(result).toEqual({ success: true, paymentId: 'p1' });
    expect(Enrollment.create).not.toHaveBeenCalled();
  });

  it('enrolls the user, credits the wallet and invalidates caches', async () => {
    const claimed = { ...paymentDoc, status: 'success' };
    vi.mocked(Payment.findOne as never).mockResolvedValue(paymentDoc);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue(claimed);
    vi.mocked(Enrollment.findOne as never).mockResolvedValue(null);
    vi.mocked(Enrollment.create as never).mockResolvedValue([{ _id: 'e1' }]);
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(walletDoc);
    vi.mocked(Course.find as never).mockReturnValue(
      query([{ instructor: { toString: () => 'i1' } }]),
    );

    const sig = paymentSignature('order_test_1', 'pay_1');
    const result = await service.verifyCoursePayment('u1', 'order_test_1', 'pay_1', sig);

    expect(result).toEqual({ success: true, paymentId: 'p1' });
    expect(Enrollment.create).toHaveBeenCalledWith(
      [{ user: 'u1', course: 'c1' }],
      expect.any(Object),
    );
    expect(Course.findByIdAndUpdate).toHaveBeenCalledWith(
      'c1',
      { $inc: { totalEnrollments: 1 } },
      expect.any(Object),
    );
    expect(PlatformWallet.findByIdAndUpdate).toHaveBeenCalledWith(
      'w1',
      expect.objectContaining({
        $inc: expect.objectContaining({
          totalRevenue: 1000,
          totalCommissionCollected: 200,
          currentBalance: 1000,
        }),
      }),
      expect.any(Object),
    );
    expect(Payout.insertMany).toHaveBeenCalled();
    expect(affiliateService.processPurchaseCommission).toHaveBeenCalledWith('p1', expect.anything());
    expect(cacheManager.invalidateStudentCache).toHaveBeenCalled();
  });
});

describe('initiateBundlePayment', () => {
  const bundleDoc = {
    _id: 'b1',
    title: 'Full Stack',
    price: 1500,
    discountedPrice: 1200,
    status: 'published',
    courses: [{ _id: 'c1', price: 1000, instructor: 'i1' }, { _id: 'c2', price: 500, instructor: 'i2' }],
  };

  it('rejects an unknown bundle', async () => {
    vi.mocked(Bundle.findById as never).mockReturnValue(query(null));
    await expect(service.initiateBundlePayment('u1', 'b1')).rejects.toThrow('Bundle not found');
  });

  it('rejects an unpublished bundle', async () => {
    vi.mocked(Bundle.findById as never).mockReturnValue(query({ ...bundleDoc, status: 'draft' }));
    await expect(service.initiateBundlePayment('u1', 'b1')).rejects.toThrow(
      'Bundle is not available',
    );
  });

  it('rejects when already enrolled in a course of the bundle', async () => {
    vi.mocked(Bundle.findById as never).mockReturnValue(query(bundleDoc));
    vi.mocked(Enrollment.find as never).mockReturnValue(query([{ _id: 'e1' }]));
    await expect(service.initiateBundlePayment('u1', 'b1')).rejects.toThrow(
      'already enrolled in one or more courses in this bundle',
    );
  });

  it('enrolls for a free bundle', async () => {
    vi.mocked(Bundle.findById as never).mockReturnValue(
      query({ ...bundleDoc, price: 0, discountedPrice: 0 }),
    );
    vi.mocked(Enrollment.find as never).mockReturnValue(query([]));
    vi.mocked(Enrollment.insertMany as never).mockResolvedValue([{ _id: 'e1' }, { _id: 'e2' }]);

    const result = await service.initiateBundlePayment('u1', 'b1');

    expect(result).toEqual({ free: true, enrollments: [{ _id: 'e1' }, { _id: 'e2' }] });
    expect(Enrollment.insertMany).toHaveBeenCalled();
    expect(Bundle.findByIdAndUpdate).toHaveBeenCalledWith(
      'b1',
      { $inc: { totalEnrollments: 1 } },
      expect.any(Object),
    );
    expect(Course.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['c1', 'c2'] } },
      { $inc: { totalEnrollments: 1 } },
      expect.any(Object),
    );
  });

  it('creates an order for a paid bundle with commission splits', async () => {
    MockRazorpay.orderToReturn = { id: 'order_test_1', amount: 120000, currency: 'INR' };
    vi.mocked(Bundle.findById as never).mockReturnValue(query(bundleDoc));
    vi.mocked(Enrollment.find as never).mockReturnValue(query([]));
    vi.mocked(platformSettingsService.getCommissionPercentage).mockResolvedValue(20);
    vi.mocked(Payment.create as never).mockResolvedValue([{ _id: 'p1' }]);

    const result = await service.initiateBundlePayment('u1', 'b1');

    expect(result).toEqual({
      orderId: 'order_test_1',
      amount: 120000,
      currency: 'INR',
      key: env.razorpayKeyId,
      paymentId: 'p1',
    });
    const payment = (Payment.create as any).mock.calls[0][0][0];
    expect(payment).toEqual(
      expect.objectContaining({
        user: 'u1',
        type: 'bundle',
        bundle: 'b1',
        amount: 1200,
        totalCommissionAmount: 240,
        totalInstructorShare: 960,
      }),
    );
    expect(payment.commissionSplits).toHaveLength(2);
  });
});

describe('initiateSubscriptionPayment', () => {
  const planDoc = { _id: 's1', title: 'Pro', price: 1999, status: 'active' };

  it('rejects an unknown subscription', async () => {
    vi.mocked(Subscription.findById as never).mockReturnValue(query(null));
    await expect(service.initiateSubscriptionPayment('u1', 's1')).rejects.toThrow(
      'Subscription plan not found',
    );
  });

  it('creates an order for a subscription plan', async () => {
    vi.mocked(Subscription.findById as never).mockReturnValue(query(planDoc));
    vi.mocked(Payment.create as never).mockResolvedValue([{ _id: 'p1' }]);

    const result = await service.initiateSubscriptionPayment('u1', 's1');

    expect(result.paymentId).toBe('p1');
    const payment = (Payment.create as any).mock.calls[0][0][0];
    expect(payment).toEqual(
      expect.objectContaining({ user: 'u1', type: 'subscription', subscription: 's1', amount: 1999 }),
    );
  });
});

describe('handleWebhook', () => {
  const capturedPayload = {
    event: 'payment.captured',
    event_id: 'evt_1',
    payload: {
      payment: {
        entity: { id: 'pay_1', order_id: 'order_test_1', amount: 100000, status: 'captured' },
      },
    },
  };

  it('throws on an invalid signature', async () => {
    await expect(service.handleWebhook('payment.captured', capturedPayload, 'bad-sig')).rejects.toThrow(
      'Invalid webhook signature',
    );
    expect(WebhookEvent.create).not.toHaveBeenCalled();
  });

  it('accepts a webhook without event id', async () => {
    const payload = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1' } } } };
    const sig = webhookSignature(payload);
    const result = await service.handleWebhook('payment.captured', payload, sig);
    expect(result).toEqual({ received: true });
    expect(WebhookEvent.create).not.toHaveBeenCalled();
  });

  it('is idempotent when the event already exists', async () => {
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query({ _id: 'w1' }));
    const sig = webhookSignature(capturedPayload);
    const result = await service.handleWebhook('payment.captured', capturedPayload, sig);
    expect(result).toEqual({ received: true, duplicate: true });
    expect(WebhookEvent.create).not.toHaveBeenCalled();
  });

  it('handles payment.captured and records the event', async () => {
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(Payment.findOne as never).mockReturnValue(query(paymentDoc));
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue(paymentDoc);
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(walletDoc);
    vi.mocked(Course.find as never).mockReturnValue(query([{ instructor: { toString: () => 'i1' } }]));
    vi.mocked(Enrollment.findOne as never).mockResolvedValue(null);
    vi.mocked(Enrollment.create as never).mockResolvedValue([{ _id: 'e1' }]);

    const sig = webhookSignature(capturedPayload);
    const result = await service.handleWebhook('payment.captured', capturedPayload, sig);

    expect(result).toEqual({ received: true, processed: true });
    expect(WebhookEvent.create).toHaveBeenCalled();
    expect(Payment.findOneAndUpdate).toHaveBeenCalled();
  });

  it('returns received true for an unknown event type', async () => {
    const payload = {
      event: 'payment.unknown',
      event_id: 'evt_2',
      payload: { payment: { entity: { id: 'pay_1' } } },
    };
    const sig = webhookSignature(payload);
    const result = await service.handleWebhook('payment.unknown', payload, sig);
    expect(result).toEqual({ received: true });
  });
});

describe('retryPayment', () => {
  it('rejects when the payment is missing', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue(null);
    await expect(service.retryPayment('u1', 'p1')).rejects.toThrow('Payment not found');
  });

  it('rejects a payment that is not failed', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue({ ...paymentDoc, status: 'pending' });
    await expect(service.retryPayment('u1', 'p1')).rejects.toThrow('Only failed payments can be retried');
  });

  it('re-creates a razorpay order for a failed payment', async () => {
    const failedPayment = { ...paymentDoc, status: 'failed', save: vi.fn().mockResolvedValue(undefined) };
    vi.mocked(Payment.findOne as never).mockResolvedValue(failedPayment);

    const result = await service.retryPayment('u1', 'p1');

    expect(Payment.findOne).toHaveBeenCalledWith({ _id: 'p1', user: 'u1' });
    expect(result).toEqual({
      orderId: 'order_test_1',
      amount: 100000,
      currency: 'INR',
      key: env.razorpayKeyId,
      paymentId: 'p1',
    });
    expect(failedPayment.status).toBe('pending');
    expect(failedPayment.save).toHaveBeenCalled();
  });
});

describe('payouts', () => {
  it('lists payouts for an instructor with summary', async () => {
    vi.mocked(Payout.find as never).mockReturnValue(query([{ _id: 'x1', amount: 500 }]));
    vi.mocked(Payout.countDocuments as never).mockResolvedValue(1);
    vi.mocked(Payout.aggregate as never).mockResolvedValue([
      { totalPaid: 500, totalPending: 0, totalOverall: 500 },
    ]);

    const result = await service.getInstructorPayouts('i1');

    expect(Payout.find).toHaveBeenCalledWith({ instructor: 'i1' });
    expect(result.payouts).toHaveLength(1);
    expect(result.summary).toEqual({ totalPaid: 500, totalPending: 0, totalOverall: 500 });
    expect(result.total).toBe(1);
  });

  it('lists all payouts for admins', async () => {
    vi.mocked(Payout.find as never).mockReturnValue(query([{ _id: 'x1' }]));
    vi.mocked(Payout.countDocuments as never).mockResolvedValue(1);
    vi.mocked(Payout.aggregate as never).mockResolvedValue([{ totalPaid: 0 }]);

    await service.getAllPayouts();

    expect(Payout.find).toHaveBeenCalledWith({});
  });

  it('rejects processing a missing payout', async () => {
    vi.mocked(Payout.findById as never).mockReturnValue(query(null));
    await expect(service.processPayout('px')).rejects.toThrow('Payout not found');
  });

  it('rejects processing a payout that is not pending', async () => {
    vi.mocked(Payout.findById as never).mockReturnValue(query({ _id: 'px', status: 'completed' }));
    await expect(service.processPayout('px')).rejects.toThrow('Payout is not in pending status');
  });
});

describe('processRefundPayment', () => {
  const successPayment = { ...paymentDoc, status: 'success' };

  it('rejects a refund for an unknown payment', async () => {
    vi.mocked(Payment.findById as never).mockReturnValue(query(null));
    await expect(service.processRefundPayment('p1', 100, 'user requested', 'partial', 'admin1')).rejects.toThrow(
      'Payment not found',
    );
  });

  it('rejects refunds for already-refunded payments', async () => {
    vi.mocked(Payment.findById as never).mockReturnValue(
      query({ ...successPayment, status: 'refunded' }),
    );
    await expect(service.processRefundPayment('p1', 100, 'user requested', 'partial', 'admin1')).rejects.toThrow(
      'Payment has already been refunded',
    );
  });

  it('rejects a payment without a razorpay payment id', async () => {
    vi.mocked(Payment.findById as never).mockReturnValue(
      query({ ...successPayment, razorpayPaymentId: undefined }),
    );
    await expect(service.processRefundPayment('p1', 100, 'user requested', 'partial', 'admin1')).rejects.toThrow(
      'Payment has no Razorpay payment ID',
    );
  });

  it('rejects an invalid refund amount', async () => {
    vi.mocked(Payment.findById as never).mockReturnValue(query(successPayment));
    await expect(service.processRefundPayment('p1', 0, 'user requested', 'partial', 'admin1')).rejects.toThrow(
      'Refund amount must be between 1 and 1000',
    );
  });

  it('rejects refunds for a payment already being processed', async () => {
    vi.mocked(Payment.findById as never).mockReturnValue(query(successPayment));
    vi.mocked(Refund.findOne as never).mockResolvedValue({ _id: 'r1' });
    await expect(service.processRefundPayment('p1', 100, 'user requested', 'partial', 'admin1')).rejects.toThrow(
      'A refund is already being processed for this payment',
    );
  });

  it('processes a full refund through razorpay and reverses commissions', async () => {
    vi.mocked(Payment.findById as never).mockReturnValue(query({ ...successPayment, walletCredited: true }));
    vi.mocked(Refund.findOne as never).mockResolvedValue(null);
    vi.mocked(Refund.create as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Refund.findByIdAndUpdate as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue(successPayment);
    vi.mocked(PlatformWallet.findOne as never).mockReturnValue(query(walletDoc));
    vi.mocked(Payout.updateMany as never).mockResolvedValue({ modifiedCount: 1 });
    vi.mocked(Enrollment.deleteOne as never).mockResolvedValue({ deletedCount: 1 });
    vi.mocked(Course.findByIdAndUpdate as never).mockResolvedValue({});
    vi.mocked(User.find as never).mockReturnValue(query([]));

    const result = await service.processRefundPayment('p1', 1000, 'user requested', 'full', 'admin1');

    expect(result).toBeDefined();
    expect(Refund.findByIdAndUpdate).toHaveBeenCalledWith(
      'r1',
      expect.objectContaining({ status: 'processed', razorpayRefundId: 'refund_1' }),
      expect.any(Object),
    );
    expect(Payment.findByIdAndUpdate).toHaveBeenCalledWith(
      'p1',
      { $set: expect.objectContaining({ status: 'refunded' }) },
      expect.any(Object),
    );
    expect(PlatformWallet.findByIdAndUpdate).toHaveBeenCalledWith(
      'w1',
      expect.objectContaining({
        $inc: expect.objectContaining({ currentBalance: -1000, totalRevenue: -1000 }),
      }),
      expect.any(Object),
    );
    expect(affiliateService.reverseCommissionOnRefund).toHaveBeenCalledWith('p1', expect.anything());
    expect(Notification.insertMany).toHaveBeenCalled();
    expect(AuditLog.create).toHaveBeenCalled();
  });

  it('rejects refunds for payments that are not successful', async () => {
    vi.mocked(Payment.findById as never).mockReturnValue(
      query({ ...successPayment, status: 'failed' }),
    );
    await expect(
      service.processRefundPayment('p1', 100, 'user requested', 'partial', 'admin1'),
    ).rejects.toThrow('Only successful payments can be refunded');
  });

  it('processes a partial refund without flipping the payment status', async () => {
    vi.mocked(Payment.findById as never).mockReturnValue(
      query({ ...successPayment, walletCredited: true }),
    );
    vi.mocked(Refund.findOne as never).mockResolvedValue(null);
    vi.mocked(Refund.create as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Refund.findByIdAndUpdate as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue(successPayment);
    vi.mocked(PlatformWallet.findOne as never).mockReturnValue(query(walletDoc));
    vi.mocked(Payout.updateMany as never).mockResolvedValue({ modifiedCount: 1 });
    vi.mocked(User.find as never).mockReturnValue(query([]));

    const result = await service.processRefundPayment('p1', 100, 'user requested', 'partial', 'admin1');

    expect(result).toEqual(
      expect.objectContaining({ success: true, isFullRefund: false, status: 'processed', amount: 100 }),
    );
    expect(Payment.findByIdAndUpdate).toHaveBeenCalledWith(
      'p1',
      { $set: expect.objectContaining({ refundedAt: expect.any(Date) }) },
      expect.any(Object),
    );
    const walletUpdate = (PlatformWallet.findByIdAndUpdate as any).mock.calls[0][1];
    expect(walletUpdate.$inc.currentBalance).toBe(-100);
    expect(Payout.updateMany).toHaveBeenCalledWith(
      { sourcePayment: 'p1', status: 'pending' },
      { status: 'cancelled' },
      expect.any(Object),
    );
  });

  it('rejects the refund when the gateway call fails', async () => {
    vi.mocked(Payment.findById as never).mockReturnValue(query(successPayment));
    vi.mocked(Refund.findOne as never).mockResolvedValue(null);
    vi.mocked(Refund.create as never).mockResolvedValue({ _id: 'r1' });
    MockRazorpay.refundError = new Error('gateway down');

    await expect(
      service.processRefundPayment('p1', 100, 'user requested', 'partial', 'admin1'),
    ).rejects.toThrow('Refund failed at payment gateway: gateway down');
    expect(Refund.findByIdAndUpdate).toHaveBeenCalledWith(
      'r1',
      { status: 'rejected', adminNote: 'Gateway error: gateway down' },
    );
  });

  it('reverses enrollments for a bundle refund', async () => {
    const bundlePayment = {
      ...successPayment,
      type: 'bundle',
      course: null,
      bundle: { _id: 'b1', title: 'Full Stack', courses: ['c1', 'c2'] },
      commissionSplits: [{ instructor: 'i1' }, { instructor: 'i2' }],
      walletCredited: true,
    };
    vi.mocked(Payment.findById as never).mockReturnValue(query(bundlePayment));
    vi.mocked(Refund.findOne as never).mockResolvedValue(null);
    vi.mocked(Refund.create as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Refund.findByIdAndUpdate as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue(bundlePayment);
    vi.mocked(Enrollment.deleteMany as never).mockResolvedValue({ deletedCount: 2 });
    vi.mocked(Bundle.findByIdAndUpdate as never).mockResolvedValue({});
    vi.mocked(Course.updateMany as never).mockResolvedValue({});
    vi.mocked(PlatformWallet.findOne as never).mockReturnValue(query(walletDoc));
    vi.mocked(Payout.updateMany as never).mockResolvedValue({ modifiedCount: 1 });
    vi.mocked(User.find as never).mockReturnValue(query([]));

    await service.processRefundPayment('p1', 1000, 'user requested', 'full', 'admin1');

    expect(Enrollment.deleteMany).toHaveBeenCalledWith(
      { user: 'u1', course: { $in: ['c1', 'c2'] } },
      expect.any(Object),
    );
    expect(Bundle.findByIdAndUpdate).toHaveBeenCalledWith(
      'b1',
      { $inc: { totalEnrollments: -1 } },
      expect.any(Object),
    );
    expect(Course.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['c1', 'c2'] } },
      { $inc: { totalEnrollments: -1 } },
      expect.any(Object),
    );
    expect(Notification.insertMany).toHaveBeenCalled();
  });

  it('reverses subscription enrollment for a refund', async () => {
    const subPayment = {
      ...successPayment,
      type: 'subscription',
      course: null,
      bundle: null,
      subscription: 's1',
      commissionSplits: [],
      totalCommissionAmount: 0,
      totalInstructorShare: 0,
      walletCredited: false,
    };
    vi.mocked(Payment.findById as never).mockReturnValue(query(subPayment));
    vi.mocked(Refund.findOne as never).mockResolvedValue(null);
    vi.mocked(Refund.create as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Refund.findByIdAndUpdate as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue(subPayment);
    vi.mocked(SubscriptionEnrollment.deleteOne as never).mockResolvedValue({ deletedCount: 1 });
    vi.mocked(Subscription.findByIdAndUpdate as never).mockResolvedValue({});
    vi.mocked(User.find as never).mockReturnValue(query([]));

    await service.processRefundPayment('p1', 1000, 'user requested', 'full', 'admin1');

    expect(SubscriptionEnrollment.deleteOne).toHaveBeenCalledWith(
      { user: 'u1', subscription: 's1' },
      expect.any(Object),
    );
    expect(Subscription.findByIdAndUpdate).toHaveBeenCalledWith(
      's1',
      { $inc: { totalSubscribers: -1 } },
      expect.any(Object),
    );
  });

  it('notifies the course instructor and other admins of a refund', async () => {
    const coursePayment = {
      ...successPayment,
      course: { _id: 'c1', title: 'React', instructor: 'i1' },
      walletCredited: false,
    };
    vi.mocked(Payment.findById as never).mockReturnValue(query(coursePayment));
    vi.mocked(Refund.findOne as never).mockResolvedValue(null);
    vi.mocked(Refund.create as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Refund.findByIdAndUpdate as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue(coursePayment);
    vi.mocked(Enrollment.deleteOne as never).mockResolvedValue({ deletedCount: 1 });
    vi.mocked(Course.findByIdAndUpdate as never).mockResolvedValue({});
    vi.mocked(User.find as never).mockReturnValue(query([{ _id: 'admin2' }, { _id: 'admin1' }]));

    await service.processRefundPayment('p1', 500, 'user requested', 'partial', 'admin1');

    const notifications = (Notification.insertMany as any).mock.calls.flatMap((c) => c[0]);
    const userIds = notifications.map((n: any) => n.user);
    expect(userIds).toContain('u1');
    expect(userIds).toContain('i1');
    expect(userIds).toContain('admin2');
    expect(userIds).not.toContain('admin1');
  });
});

describe('getWallet', () => {
  it('delegates to getOrCreateWallet', async () => {
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(walletDoc);
    await expect(service.getWallet()).resolves.toBe(walletDoc);
    expect(PlatformWallet.findOne).toHaveBeenCalled();
  });
});

describe('verifyCoursePayment edge cases', () => {
  it('aborts the transaction when side effects throw', async () => {
    const session = makeSession();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session as never);
    vi.mocked(Payment.findOne as never).mockResolvedValue(paymentDoc);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue({
      ...paymentDoc,
      status: 'success',
    });
    vi.mocked(Enrollment.findOne as never).mockResolvedValue(null);
    vi.mocked(Enrollment.create as never).mockRejectedValue(new Error('db boom'));

    const sig = paymentSignature('order_test_1', 'pay_1');
    await expect(
      service.verifyCoursePayment('u1', 'order_test_1', 'pay_1', sig),
    ).rejects.toThrow('db boom');
    expect(session.abortTransaction).toHaveBeenCalled();
  });

  it('skips wallet crediting when the payment is already credited', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue({ ...paymentDoc, course: null });
    vi.mocked(Payment.findOneAndUpdate as never)
      .mockResolvedValueOnce({ ...paymentDoc, course: null, status: 'success' })
      .mockResolvedValueOnce(null);
    vi.mocked(Course.find as never).mockReturnValue(query([]));

    const sig = paymentSignature('order_test_1', 'pay_1');
    const result = await service.verifyCoursePayment('u1', 'order_test_1', 'pay_1', sig);

    expect(result).toEqual({ success: true, paymentId: 'p1' });
    expect(PlatformWallet.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe('verifyBundlePayment', () => {
  const bundlePayment = { ...paymentDoc, type: 'bundle', bundle: 'b1', course: null };

  it('rejects an invalid signature', async () => {
    await expect(
      service.verifyBundlePayment('u1', 'order_test_1', 'pay_1', 'bad-sig'),
    ).rejects.toThrow('Invalid payment signature');
  });

  it('rejects when the payment is missing', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue(null);
    const sig = paymentSignature('order_test_1', 'pay_1');
    await expect(service.verifyBundlePayment('u1', 'order_test_1', 'pay_1', sig)).rejects.toThrow(
      'Payment not found',
    );
  });

  it('rejects a non-bundle payment', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue(paymentDoc);
    const sig = paymentSignature('order_test_1', 'pay_1');
    await expect(service.verifyBundlePayment('u1', 'order_test_1', 'pay_1', sig)).rejects.toThrow(
      'Not a bundle payment',
    );
  });

  it('is idempotent when already claimed', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue(bundlePayment);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue(null);
    const sig = paymentSignature('order_test_1', 'pay_1');
    const result = await service.verifyBundlePayment('u1', 'order_test_1', 'pay_1', sig);
    expect(result).toEqual({ success: true, paymentId: 'p1' });
  });

  it('enrolls the user for all courses in the bundle', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue(bundlePayment);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue({ ...bundlePayment, status: 'success' });
    vi.mocked(Bundle.findById as never).mockReturnValue(query({ _id: 'b1', courses: ['c1', 'c2'] }));
    vi.mocked(Enrollment.find as never).mockResolvedValue([]);
    vi.mocked(Enrollment.insertMany as never).mockResolvedValue([{ _id: 'e1' }, { _id: 'e2' }]);
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(walletDoc);
    vi.mocked(Course.find as never).mockReturnValue(
      query([{ instructor: { toString: () => 'i1' } }]),
    );

    const sig = paymentSignature('order_test_1', 'pay_1');
    const result = await service.verifyBundlePayment('u1', 'order_test_1', 'pay_1', sig);

    expect(result).toEqual({ success: true, paymentId: 'p1' });
    expect(Enrollment.insertMany).toHaveBeenCalled();
    expect(Course.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['c1', 'c2'] } },
      { $inc: { totalEnrollments: 1 } },
      expect.any(Object),
    );
    expect(Bundle.findByIdAndUpdate).toHaveBeenCalledWith(
      'b1',
      { $inc: { totalEnrollments: 1 } },
      expect.any(Object),
    );
  });

  it('skips courses already enrolled in the bundle', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue(bundlePayment);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue({ ...bundlePayment, status: 'success' });
    vi.mocked(Bundle.findById as never).mockReturnValue(query({ _id: 'b1', courses: ['c1', 'c2'] }));
    vi.mocked(Enrollment.find as never).mockResolvedValue([
      { _id: 'e1', course: { toString: () => 'c1' } },
    ]);
    vi.mocked(Enrollment.insertMany as never).mockResolvedValue([{ _id: 'e2' }]);
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(walletDoc);
    vi.mocked(Course.find as never).mockReturnValue(query([]));

    const sig = paymentSignature('order_test_1', 'pay_1');
    await service.verifyBundlePayment('u1', 'order_test_1', 'pay_1', sig);

    const inserted = (Enrollment.insertMany as any).mock.calls[0][0];
    expect(inserted).toEqual([{ user: 'u1', course: 'c2' }]);
  });

  it('does nothing when all courses are already enrolled', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue(bundlePayment);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue({ ...bundlePayment, status: 'success' });
    vi.mocked(Bundle.findById as never).mockReturnValue(query({ _id: 'b1', courses: ['c1', 'c2'] }));
    vi.mocked(Enrollment.find as never).mockResolvedValue([
      { _id: 'e1', course: { toString: () => 'c1' } },
      { _id: 'e2', course: { toString: () => 'c2' } },
    ]);
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(walletDoc);
    vi.mocked(Course.find as never).mockReturnValue(query([]));

    const sig = paymentSignature('order_test_1', 'pay_1');
    await service.verifyBundlePayment('u1', 'order_test_1', 'pay_1', sig);

    expect(Enrollment.insertMany).not.toHaveBeenCalled();
    expect(Bundle.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('does nothing when the bundle is missing', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue(bundlePayment);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue({ ...bundlePayment, status: 'success' });
    vi.mocked(Bundle.findById as never).mockReturnValue(query(null));
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(walletDoc);
    vi.mocked(Course.find as never).mockReturnValue(query([]));

    const sig = paymentSignature('order_test_1', 'pay_1');
    await service.verifyBundlePayment('u1', 'order_test_1', 'pay_1', sig);

    expect(Enrollment.insertMany).not.toHaveBeenCalled();
  });

  it('handles a bundle payment without a bundle id', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue({ ...bundlePayment, bundle: null });
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue({
      ...bundlePayment,
      bundle: null,
      status: 'success',
    });
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(walletDoc);
    vi.mocked(Course.find as never).mockReturnValue(query([]));

    const sig = paymentSignature('order_test_1', 'pay_1');
    const result = await service.verifyBundlePayment('u1', 'order_test_1', 'pay_1', sig);

    expect(result).toEqual({ success: true, paymentId: 'p1' });
  });
});

describe('initiateSubscriptionPayment edge cases', () => {
  const planDoc = { _id: 's1', title: 'Pro', price: 1999, status: 'active', durationDays: 30 };

  it('rejects when the user already has an active subscription', async () => {
    vi.mocked(Subscription.findById as never).mockReturnValue(query(planDoc));
    vi.mocked(SubscriptionEnrollment.findOne as never).mockResolvedValue({ _id: 'se1' });
    await expect(service.initiateSubscriptionPayment('u1', 's1')).rejects.toThrow(
      'You already have an active subscription',
    );
  });

  it('uses the discounted price', async () => {
    vi.mocked(Subscription.findById as never).mockReturnValue(
      query({ ...planDoc, price: 1999, discountedPrice: 1499 }),
    );
    vi.mocked(Payment.create as never).mockResolvedValue([{ _id: 'p1' }]);

    await service.initiateSubscriptionPayment('u1', 's1');

    const payment = (Payment.create as any).mock.calls[0][0][0];
    expect(payment.amount).toBe(1499);
  });

  it('applies a coupon to a subscription and increments usage', async () => {
    vi.mocked(Subscription.findById as never).mockReturnValue(query(planDoc));
    vi.mocked(Coupon.findOne as never).mockResolvedValue({
      _id: 'cp1',
      expiresAt: new Date(Date.now() + 1000),
      maxUses: 0,
      usedCount: 0,
      minAmount: 0,
      discountType: 'percentage',
      discountValue: 10,
    });
    vi.mocked(Payment.create as never).mockResolvedValue([{ _id: 'p1' }]);

    await service.initiateSubscriptionPayment('u1', 's1', 'SAVE10');

    const payment = (Payment.create as any).mock.calls[0][0][0];
    expect(payment.amount).toBe(1799);
    expect(payment.discountAmount).toBe(200);
    expect(payment.coupon).toBe('cp1');
    expect(Coupon.findByIdAndUpdate).toHaveBeenCalledWith(
      'cp1',
      { $inc: { usedCount: 1 } },
      expect.any(Object),
    );
  });

  it('creates a free subscription enrollment', async () => {
    vi.mocked(Subscription.findById as never).mockReturnValue(
      query({ ...planDoc, price: 0, discountedPrice: 0 }),
    );
    vi.mocked(SubscriptionEnrollment.create as never).mockResolvedValue([{ _id: 'se1' }]);
    vi.mocked(Subscription.findByIdAndUpdate as never).mockResolvedValue({});
    vi.mocked(Course.find as never).mockReturnValue(query([]));

    const result = await service.initiateSubscriptionPayment('u1', 's1');

    expect(result).toEqual({ free: true, subscriptionEnrollment: { _id: 'se1' } });
    expect(Subscription.findByIdAndUpdate).toHaveBeenCalledWith(
      's1',
      { $inc: { totalSubscribers: 1 } },
      expect.any(Object),
    );
    expect(cacheManager.invalidateStudentCache).toHaveBeenCalled();
  });
});

describe('verifySubscriptionPayment', () => {
  const subPayment = {
    ...paymentDoc,
    type: 'subscription',
    subscription: 's1',
    course: null,
    bundle: null,
    commissionSplits: [],
    totalCommissionAmount: 0,
    totalInstructorShare: 0,
  };

  it('rejects an invalid signature', async () => {
    await expect(
      service.verifySubscriptionPayment('u1', 'order_test_1', 'pay_1', 'bad-sig'),
    ).rejects.toThrow('Invalid payment signature');
  });

  it('rejects when the payment is missing', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue(null);
    const sig = paymentSignature('order_test_1', 'pay_1');
    await expect(
      service.verifySubscriptionPayment('u1', 'order_test_1', 'pay_1', sig),
    ).rejects.toThrow('Payment not found');
  });

  it('rejects a non-subscription payment', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue(paymentDoc);
    const sig = paymentSignature('order_test_1', 'pay_1');
    await expect(
      service.verifySubscriptionPayment('u1', 'order_test_1', 'pay_1', sig),
    ).rejects.toThrow('Not a subscription payment');
  });

  it('is idempotent when already claimed', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue(subPayment);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue(null);
    const sig = paymentSignature('order_test_1', 'pay_1');
    const result = await service.verifySubscriptionPayment('u1', 'order_test_1', 'pay_1', sig);
    expect(result).toEqual({ success: true, paymentId: 'p1' });
  });

  it('activates the subscription enrollment', async () => {
    const claimed = {
      ...subPayment,
      status: 'success',
      save: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(Payment.findOne as never).mockResolvedValue(subPayment);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue(claimed);
    vi.mocked(SubscriptionEnrollment.findOne as never).mockResolvedValue(null);
    vi.mocked(Subscription.findById as never).mockReturnValue(
      query({ _id: 's1', durationDays: 30 }),
    );
    vi.mocked(SubscriptionEnrollment.create as never).mockResolvedValue([{ _id: 'se1' }]);
    vi.mocked(Subscription.findByIdAndUpdate as never).mockResolvedValue({});
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(walletDoc);

    const sig = paymentSignature('order_test_1', 'pay_1');
    const result = await service.verifySubscriptionPayment('u1', 'order_test_1', 'pay_1', sig);

    expect(result).toEqual({ success: true, paymentId: 'p1', subscriptionEnrollment: 'se1' });
    expect(claimed.save).toHaveBeenCalled();
    expect(Subscription.findByIdAndUpdate).toHaveBeenCalledWith(
      's1',
      { $inc: { totalSubscribers: 1 } },
      expect.any(Object),
    );
  });

  it('skips when the subscription enrollment already exists', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue(subPayment);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue({ ...subPayment, status: 'success' });
    vi.mocked(SubscriptionEnrollment.findOne as never).mockResolvedValue({ _id: 'se1' });
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(walletDoc);

    const sig = paymentSignature('order_test_1', 'pay_1');
    await service.verifySubscriptionPayment('u1', 'order_test_1', 'pay_1', sig);

    expect(SubscriptionEnrollment.create).not.toHaveBeenCalled();
  });

  it('skips when the plan is missing', async () => {
    vi.mocked(Payment.findOne as never).mockResolvedValue(subPayment);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue({ ...subPayment, status: 'success' });
    vi.mocked(SubscriptionEnrollment.findOne as never).mockResolvedValue(null);
    vi.mocked(Subscription.findById as never).mockReturnValue(query(null));
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(walletDoc);

    const sig = paymentSignature('order_test_1', 'pay_1');
    await service.verifySubscriptionPayment('u1', 'order_test_1', 'pay_1', sig);

    expect(SubscriptionEnrollment.create).not.toHaveBeenCalled();
    expect(Subscription.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe('initiateBundlePayment edge cases', () => {
  const bundleDoc = {
    _id: 'b1',
    title: 'Full Stack',
    price: 1500,
    discountedPrice: 1200,
    status: 'published',
    courses: [{ _id: 'c1', price: 1000, instructor: 'i1' }, { _id: 'c2', price: 500, instructor: 'i2' }],
  };

  it('applies a coupon to a paid bundle and increments usage', async () => {
    MockRazorpay.orderToReturn = { id: 'order_test_1', amount: 108000, currency: 'INR' };
    vi.mocked(Bundle.findById as never).mockReturnValue(query(bundleDoc));
    vi.mocked(Enrollment.find as never).mockReturnValue(query([]));
    vi.mocked(platformSettingsService.getCommissionPercentage).mockResolvedValue(20);
    vi.mocked(Coupon.findOne as never).mockResolvedValue({
      _id: 'cp1',
      expiresAt: new Date(Date.now() + 1000),
      maxUses: 0,
      usedCount: 0,
      minAmount: 0,
      discountType: 'percentage',
      discountValue: 10,
    });
    vi.mocked(Payment.create as never).mockResolvedValue([{ _id: 'p1' }]);

    await service.initiateBundlePayment('u1', 'b1', 'SAVE10');

    const payment = (Payment.create as any).mock.calls[0][0][0];
    expect(payment.amount).toBe(1080);
    expect(payment.discountAmount).toBe(120);
    expect(payment.coupon).toBe('cp1');
    expect(Coupon.findByIdAndUpdate).toHaveBeenCalledWith(
      'cp1',
      { $inc: { usedCount: 1 } },
      expect.any(Object),
    );
  });

  it('splits commission evenly for bundles with no priced courses', async () => {
    MockRazorpay.orderToReturn = { id: 'order_test_1', amount: 10000, currency: 'INR' };
    const zeroBundle = {
      _id: 'b1',
      title: 'Z',
      price: 100,
      discountedPrice: 100,
      status: 'published',
      courses: [
        { _id: 'c1', price: 0, instructor: 'i1' },
        { _id: 'c2', price: 0, instructor: 'i2' },
      ],
    };
    vi.mocked(Bundle.findById as never).mockReturnValue(query(zeroBundle));
    vi.mocked(Enrollment.find as never).mockReturnValue(query([]));
    vi.mocked(platformSettingsService.getCommissionPercentage).mockResolvedValue(20);
    vi.mocked(Payment.create as never).mockResolvedValue([{ _id: 'p1' }]);

    await service.initiateBundlePayment('u1', 'b1');

    const payment = (Payment.create as any).mock.calls[0][0][0];
    expect(payment.amount).toBe(100);
    expect(payment.commissionSplits[0].baseAmount).toBe(50);
    expect(payment.commissionSplits[1].baseAmount).toBe(50);
  });
});

describe('handleWebhook additional events', () => {
  const sig = webhookSignature;

  function payloadFor(event: string, entity: Record<string, unknown>, extra?: Record<string, unknown>) {
    return {
      event,
      event_id: `evt_${event.replace(/\W/g, '_')}`,
      payload: { payment: { entity } },
      ...extra,
    };
  }

  it('accepts payment.captured without an order id', async () => {
    const payload = payloadFor('payment.captured', { id: 'pay_1' });
    const result = await service.handleWebhook('payment.captured', payload, sig(payload));
    expect(result).toEqual({ received: true });
  });

  it('accepts payment.captured when the payment is missing', async () => {
    const payload = payloadFor('payment.captured', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(null));
    const result = await service.handleWebhook('payment.captured', payload, sig(payload));
    expect(result).toEqual({ received: true });
  });

  it('accepts payment.captured when the payment is already claimed', async () => {
    const payload = payloadFor('payment.captured', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(paymentDoc));
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue(null);
    const result = await service.handleWebhook('payment.captured', payload, sig(payload));
    expect(result).toEqual({ received: true });
  });

  it('treats a concurrent duplicate payment.captured as duplicate', async () => {
    const payload = payloadFor('payment.captured', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(paymentDoc));
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue({
      ...paymentDoc,
      save: vi.fn().mockRejectedValue({ code: 11000 }),
    });
    const result = await service.handleWebhook('payment.captured', payload, sig(payload));
    expect(result).toEqual({ received: true, duplicate: true });
  });

  it('rethrows unexpected errors from payment.captured', async () => {
    const payload = payloadFor('payment.captured', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(paymentDoc));
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue({
      ...paymentDoc,
      save: vi.fn().mockRejectedValue(new Error('gateway timeout')),
    });
    await expect(service.handleWebhook('payment.captured', payload, sig(payload))).rejects.toThrow(
      'gateway timeout',
    );
  });

  it('processes payment.authorized with an order id', async () => {
    const payload = payloadFor('payment.authorized', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue({ _id: 'p1' });
    const result = await service.handleWebhook('payment.authorized', payload, sig(payload));
    expect(result).toEqual({ received: true, processed: true });
    expect(Payment.findOneAndUpdate).toHaveBeenCalled();
  });

  it('processes payment.authorized without an order id', async () => {
    const payload = payloadFor('payment.authorized', { id: 'pay_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    const result = await service.handleWebhook('payment.authorized', payload, sig(payload));
    expect(result).toEqual({ received: true, processed: true });
    expect(Payment.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('returns duplicate for an already recorded payment.authorized', async () => {
    const payload = payloadFor('payment.authorized', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query({ _id: 'wh1' }));
    const result = await service.handleWebhook('payment.authorized', payload, sig(payload));
    expect(result).toEqual({ received: true, duplicate: true });
  });

  it('accepts payment.pending without an order id', async () => {
    const payload = payloadFor('payment.pending', { id: 'pay_1' });
    const result = await service.handleWebhook('payment.pending', payload, sig(payload));
    expect(result).toEqual({ received: true });
  });

  it('returns duplicate for an already recorded payment.pending', async () => {
    const payload = payloadFor('payment.pending', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query({ _id: 'wh1' }));
    const result = await service.handleWebhook('payment.pending', payload, sig(payload));
    expect(result).toEqual({ received: true, duplicate: true });
  });

  it('accepts payment.pending when the payment is missing', async () => {
    const payload = payloadFor('payment.pending', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(null));
    const result = await service.handleWebhook('payment.pending', payload, sig(payload));
    expect(result).toEqual({ received: true });
  });

  it('processes payment.pending and notifies users', async () => {
    const payload = payloadFor('payment.pending', {
      id: 'pay_1',
      order_id: 'order_test_1',
      status_reason: 'Awaiting bank confirmation',
    });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(paymentDoc));
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue({ _id: 'p1' });
    vi.mocked(User.findById as never).mockReturnValue(
      query({ name: 'Bob', email: 'bob@x.com' }),
    );
    vi.mocked(User.find as never).mockReturnValue(query([{ _id: 'a1' }]));

    const result = await service.handleWebhook('payment.pending', payload, sig(payload));

    expect(result).toEqual({ received: true, processed: true });
    expect(Payment.findByIdAndUpdate).toHaveBeenCalledWith(
      'p1',
      { $set: { status: 'pending', pendingReason: 'Awaiting bank confirmation' } },
      expect.any(Object),
    );
    expect(AuditLog.create).toHaveBeenCalled();
    expect(Notification.insertMany).toHaveBeenCalled();
  });

  it('accepts payment.failed without an order id or payment id', async () => {
    const payload = payloadFor('payment.failed', {});
    const result = await service.handleWebhook('payment.failed', payload, sig(payload));
    expect(result).toEqual({ received: true });
  });

  it('returns duplicate for an already recorded payment.failed', async () => {
    const payload = payloadFor('payment.failed', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query({ _id: 'wh1' }));
    const result = await service.handleWebhook('payment.failed', payload, sig(payload));
    expect(result).toEqual({ received: true, duplicate: true });
  });

  it('accepts payment.failed when the payment is missing', async () => {
    const payload = payloadFor('payment.failed', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(null));
    const result = await service.handleWebhook('payment.failed', payload, sig(payload));
    expect(result).toEqual({ received: true });
  });

  it('processes payment.failed for a course purchase and notifies the instructor', async () => {
    const payload = payloadFor('payment.failed', {
      id: 'pay_1',
      order_id: 'order_test_1',
      failure_code: 'BAD_CNF',
      failure_reason: 'Insufficient funds',
      method: 'card',
      card: { last4: '4242', network: 'Visa', issuer: 'HDFC' },
      acquirer_data: { vpa: 'u@okhdfcbank' },
    });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(paymentDoc));
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue({ _id: 'p1' });
    vi.mocked(User.findById as never).mockReturnValue(query({ name: 'Bob', email: 'bob@x.com' }));
    vi.mocked(Course.findById as never).mockReturnValue(
      query({ title: 'React', instructor: { _id: 'i1', name: 'Ira' } }),
    );
    vi.mocked(User.find as never).mockReturnValue(query([{ _id: 'a1' }]));

    const result = await service.handleWebhook('payment.failed', payload, sig(payload));

    expect(result).toEqual({ received: true, processed: true });
    expect(Payment.findByIdAndUpdate).toHaveBeenCalled();
    const notifications = (Notification.insertMany as any).mock.calls.flatMap((c) => c[0]);
    const userIds = notifications.map((n: any) => n.user);
    expect(userIds).toContain('i1');
    expect(userIds).toContain('a1');
  });

  it('processes payment.failed without an instructor on the course', async () => {
    const payload = payloadFor('payment.failed', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(paymentDoc));
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue({ _id: 'p1' });
    vi.mocked(User.findById as never).mockReturnValue(query({ name: 'Bob', email: 'bob@x.com' }));
    vi.mocked(Course.findById as never).mockReturnValue(query({ title: 'React', instructor: null }));
    vi.mocked(User.find as never).mockReturnValue(query([{ _id: 'a1' }]));

    const result = await service.handleWebhook('payment.failed', payload, sig(payload));

    expect(result).toEqual({ received: true, processed: true });
  });

  it('processes payment.failed for a bundle purchase', async () => {
    const bundlePayment = {
      ...paymentDoc,
      type: 'bundle',
      course: null,
      bundle: 'b1',
    };
    const payload = payloadFor('payment.failed', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(bundlePayment));
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue({ _id: 'p1' });
    vi.mocked(User.findById as never).mockReturnValue(query({ name: 'Bob', email: 'bob@x.com' }));
    vi.mocked(Bundle.findById as never).mockReturnValue(
      query({ _id: 'b1', title: 'Full Stack', courses: ['c1', 'c2'] }),
    );
    vi.mocked(Course.find as never).mockReturnValue(
      query([
        { instructor: { _id: 'i1', name: 'Ira' } },
        { instructor: { _id: 'i2', name: 'Ike' } },
      ]),
    );
    vi.mocked(User.find as never).mockReturnValue(query([{ _id: 'a1' }]));

    const result = await service.handleWebhook('payment.failed', payload, sig(payload));

    expect(result).toEqual({ received: true, processed: true });
    const notifications = (Notification.insertMany as any).mock.calls.flatMap((c) => c[0]);
    const userIds = notifications.map((n: any) => n.user);
    expect(userIds).toContain('i1');
    expect(userIds).toContain('i2');
  });

  it('processes payment.failed for a bundle without instructors', async () => {
    const bundlePayment = { ...paymentDoc, type: 'bundle', course: null, bundle: 'b1' };
    const payload = payloadFor('payment.failed', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(bundlePayment));
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue({ _id: 'p1' });
    vi.mocked(User.findById as never).mockReturnValue(query({ name: 'Bob', email: 'bob@x.com' }));
    vi.mocked(Bundle.findById as never).mockReturnValue(
      query({ _id: 'b1', title: 'Full Stack', courses: ['c1', 'c2'] }),
    );
    vi.mocked(Course.find as never).mockReturnValue(query([{ instructor: null }, {}]));
    vi.mocked(User.find as never).mockReturnValue(query([{ _id: 'a1' }]));

    const result = await service.handleWebhook('payment.failed', payload, sig(payload));

    expect(result).toEqual({ received: true, processed: true });
  });

  it('processes payment.failed keyed by payment id when there is no order id', async () => {
    const payload = payloadFor('payment.failed', { id: 'pay_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(paymentDoc));
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue({ _id: 'p1' });
    vi.mocked(User.findById as never).mockReturnValue(query({ name: 'Bob', email: 'bob@x.com' }));
    vi.mocked(Course.findById as never).mockReturnValue(query({ title: 'React', instructor: null }));
    vi.mocked(User.find as never).mockReturnValue(query([{ _id: 'a1' }]));

    const result = await service.handleWebhook('payment.failed', payload, sig(payload));

    expect(Payment.findOne).toHaveBeenCalledWith({ razorpayPaymentId: 'pay_1' });
    expect(result).toEqual({ received: true, processed: true });
  });

  it('records non-critical webhooks like order.paid', async () => {
    const payload = payloadFor('order.paid', { id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    const result = await service.handleWebhook('order.paid', payload, sig(payload));
    expect(result).toEqual({ received: true });
    expect(WebhookEvent.create).toHaveBeenCalled();
  });

  it('returns duplicate for an already recorded order.paid', async () => {
    const payload = payloadFor('order.paid', { id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query({ _id: 'wh1' }));
    const result = await service.handleWebhook('order.paid', payload, sig(payload));
    expect(result).toEqual({ received: true, duplicate: true });
  });

  it('processes payment.refunded and updates the payment status', async () => {
    const payload = payloadFor('payment.refunded', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue({ _id: 'p1' });
    const result = await service.handleWebhook('payment.refunded', payload, sig(payload));
    expect(result).toEqual({ received: true, processed: true });
    expect(Payment.findOneAndUpdate).toHaveBeenCalledWith(
      { razorpayOrderId: 'order_test_1', status: 'success' },
      { $set: { status: 'refunded' } },
      expect.any(Object),
    );
  });

  it('processes payment.refunded without an order id', async () => {
    const payload = payloadFor('payment.refunded', { id: 'pay_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    const result = await service.handleWebhook('payment.refunded', payload, sig(payload));
    expect(result).toEqual({ received: true, processed: true });
    expect(Payment.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('returns duplicate for an already recorded payment.refunded', async () => {
    const payload = payloadFor('payment.refunded', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query({ _id: 'wh1' }));
    const result = await service.handleWebhook('payment.refunded', payload, sig(payload));
    expect(result).toEqual({ received: true, duplicate: true });
  });

  it('reads camelCase event ids and order entities', async () => {
    const payload = {
      event: 'order.paid',
      eventId: 'evt_order_2',
      payload: { order: { entity: { id: 'order_test_2', order_id: 'order_test_2' } } },
    };
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    const result = await service.handleWebhook('order.paid', payload, sig(payload));
    expect(result).toEqual({ received: true });
    expect(WebhookEvent.create).toHaveBeenCalledWith(
      [expect.objectContaining({ eventId: 'evt_order_2' })],
      expect.any(Object),
    );
  });

  it('handles a payload with no entity', async () => {
    const payload = { event: 'order.paid', event_id: 'evt_3', payload: {} };
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    const result = await service.handleWebhook('order.paid', payload, sig(payload));
    expect(result).toEqual({ received: true });
  });
});

describe('payout processing', () => {
  const instructorDoc = {
    _id: 'i1',
    name: 'Ira',
    email: 'ira@x.com',
    bankAccountNumber: '12345',
    ifscCode: 'IFSC0001',
    toString: () => 'i1',
  };

  it('processes a payout through razorpay and updates the wallet', async () => {
    const payout = {
      _id: 'px',
      status: 'pending',
      amount: 500,
      instructor: instructorDoc,
      save: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(Payout.findById as never).mockReturnValue(query(payout));
    vi.mocked(Payout.findByIdAndUpdate as never).mockResolvedValue({ _id: 'px', status: 'completed' });
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(walletDoc);

    const result = await service.processPayout('px');

    expect(result).toEqual({ _id: 'px', status: 'completed' });
    expect(payout.status).toBe('processing');
    expect(MockRazorpay.last()?.payouts.create).toHaveBeenCalled();
    expect(PlatformWallet.findByIdAndUpdate).toHaveBeenCalledWith(
      'w1',
      expect.objectContaining({
        $inc: expect.objectContaining({
          totalPayoutsMade: 500,
          pendingPayouts: -500,
          currentBalance: -500,
        }),
      }),
      expect.any(Object),
    );
    expect(cacheManager.invalidateRevenueCache).toHaveBeenCalled();
    expect(cacheManager.invalidateInstructorCache).toHaveBeenCalledWith('i1');
  });

  it('uses fallback bank details and empty utr when not provided', async () => {
    MockRazorpay.payoutToReturn = { id: 'payout_1', utr: '', status: 'processed' };
    const payout = {
      _id: 'px',
      status: 'pending',
      amount: 500,
      instructor: { _id: 'i1', name: 'Ira', email: 'ira@x.com', toString: () => 'i1' },
      save: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(Payout.findById as never).mockReturnValue(query(payout));
    vi.mocked(Payout.findByIdAndUpdate as never).mockResolvedValue({ _id: 'px', status: 'completed' });
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(walletDoc);

    await service.processPayout('px');

    const payoutCall = (MockRazorpay.last()?.payouts.create as any).mock.calls[0][0];
    expect(payoutCall.fund_account.bank_account.account_number).toBe('00000000000');
    expect(payoutCall.fund_account.bank_account.ifsc).toBe('SBIN0000000');
  });

  it('marks a payout failed when razorpay rejects', async () => {
    const payout = {
      _id: 'px',
      status: 'pending',
      amount: 500,
      instructor: { _id: 'i1', name: 'Ira', email: 'ira@x.com', toString: () => 'i1' },
      save: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(Payout.findById as never).mockReturnValue(query(payout));
    MockRazorpay.payoutError = new Error('payout down');

    await expect(service.processPayout('px')).rejects.toThrow('Payout failed: payout down');
    expect(Payout.findByIdAndUpdate).toHaveBeenCalledWith(
      'px',
      { status: 'failed', notes: 'payout down' },
    );
  });

  it('processes all pending payouts and collects failures', async () => {
    const good = {
      _id: 'px1',
      status: 'pending',
      amount: 500,
      instructor: { _id: 'i1', name: 'Ira', email: 'ira@x.com', toString: () => 'i1' },
      save: vi.fn().mockResolvedValue(undefined),
    };
    const bad = {
      _id: 'px2',
      status: 'pending',
      amount: 200,
      instructor: { _id: 'i2', name: 'Ike', email: 'ike@x.com', toString: () => 'i2' },
      save: vi.fn().mockRejectedValue(new Error('save fail')),
    };
    vi.mocked(Payout.find as never).mockResolvedValue([good, bad]);
    vi.mocked(Payout.findById as never).mockImplementation((id: any) =>
      query(id === 'px1' ? good : bad),
    );
    vi.mocked(Payout.findByIdAndUpdate as never).mockResolvedValue({ _id: 'px1', status: 'completed' });
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue(walletDoc);

    const result = await service.processAllPendingPayouts();

    expect(result).toEqual({ success: 1, failed: 1, errors: [expect.stringContaining('save fail')] });
  });
});

describe('payout listing edge cases', () => {
  it('falls back to an empty instructor summary', async () => {
    vi.mocked(Payout.find as never).mockReturnValue(query([]));
    vi.mocked(Payout.countDocuments as never).mockResolvedValue(0);
    vi.mocked(Payout.aggregate as never).mockResolvedValue([]);

    const result = await service.getInstructorPayouts('i1');

    expect(result.summary).toEqual({ totalPaid: 0, totalPending: 0, totalOverall: 0 });
    expect(result.totalPages).toBe(0);
  });

  it('lists all payouts with a status filter', async () => {
    vi.mocked(Payout.find as never).mockReturnValue(query([{ _id: 'x1' }]));
    vi.mocked(Payout.countDocuments as never).mockResolvedValue(1);
    vi.mocked(Payout.aggregate as never).mockResolvedValue([
      { totalPaid: 0, totalPending: 100, totalProcessing: 0, totalFailed: 0, count: 1 },
    ]);

    const result = await service.getAllPayouts(1, 20, 'pending');

    expect(Payout.find).toHaveBeenCalledWith({ status: 'pending' });
    expect(result.summary.totalPending).toBe(100);
    expect(result.totalPages).toBe(1);
  });

  it('falls back to an empty admin summary', async () => {
    vi.mocked(Payout.find as never).mockReturnValue(query([]));
    vi.mocked(Payout.countDocuments as never).mockResolvedValue(0);
    vi.mocked(Payout.aggregate as never).mockResolvedValue([]);

    const result = await service.getAllPayouts();

    expect(result.summary).toEqual({
      totalPaid: 0,
      totalPending: 0,
      totalProcessing: 0,
      totalFailed: 0,
      count: 0,
    });
  });
});

describe('getCommissionSettings', () => {
  it('returns commission and wallet totals', async () => {
    vi.mocked(platformSettingsService.getCommissionPercentage).mockResolvedValue(20);
    vi.mocked(PlatformWallet.findOne as never).mockResolvedValue({
      ...walletDoc,
      totalRevenue: 5000,
      totalCommissionCollected: 1000,
      totalPayoutsMade: 200,
      currentBalance: 3000,
      pendingPayouts: 400,
    });

    const result = await service.getCommissionSettings();

    expect(result).toEqual({
      commissionPercent: 20,
      platformCommission: 1000,
      totalRevenue: 5000,
      totalPayoutsMade: 200,
      currentBalance: 3000,
      pendingPayouts: 400,
    });
  });
});

describe('getWalletTransactions', () => {
  it('lists successful payments', async () => {
    vi.mocked(Payment.find as never).mockReturnValue(query([{ _id: 'p1', amount: 1000 }]));
    vi.mocked(Payment.countDocuments as never).mockResolvedValue(1);

    const result = await service.getWalletTransactions();

    expect(Payment.find).toHaveBeenCalledWith({ status: 'success' });
    expect(result.payments).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });
});

describe('remaining branch coverage', () => {
  const bundlePayment = { ...paymentDoc, type: 'bundle', bundle: 'b1', course: null };
  const subPayment = {
    ...paymentDoc,
    type: 'subscription',
    subscription: 's1',
    course: null,
    bundle: null,
    commissionSplits: [],
    totalCommissionAmount: 0,
    totalInstructorShare: 0,
  };
  const planDoc = { _id: 's1', title: 'Pro', price: 1999, status: 'active', durationDays: 30 };

  function payloadFor(event: string, entity: Record<string, unknown>) {
    return { event, event_id: `evt_${event.replace(/\W/g, '_')}`, payload: { payment: { entity } } };
  }

  it('aborts the transaction when bundle side effects throw', async () => {
    const session = makeSession();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session as never);
    vi.mocked(Payment.findOne as never).mockResolvedValue(bundlePayment);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue({
      ...bundlePayment,
      status: 'success',
    });
    vi.mocked(Bundle.findById as never).mockReturnValue(query({ _id: 'b1', courses: ['c1'] }));
    vi.mocked(Enrollment.find as never).mockResolvedValue([]);
    vi.mocked(Enrollment.insertMany as never).mockRejectedValue(new Error('bundle boom'));

    const sig = paymentSignature('order_test_1', 'pay_1');
    await expect(service.verifyBundlePayment('u1', 'order_test_1', 'pay_1', sig)).rejects.toThrow(
      'bundle boom',
    );
    expect(session.abortTransaction).toHaveBeenCalled();
  });

  it('rejects an inactive subscription plan', async () => {
    vi.mocked(Subscription.findById as never).mockReturnValue(
      query({ ...planDoc, status: 'inactive' }),
    );
    await expect(service.initiateSubscriptionPayment('u1', 's1')).rejects.toThrow(
      'Subscription plan is not active',
    );
  });

  it('aborts the transaction when subscription side effects throw', async () => {
    const session = makeSession();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session as never);
    vi.mocked(Payment.findOne as never).mockResolvedValue(subPayment);
    vi.mocked(Payment.findOneAndUpdate as never).mockResolvedValue({
      ...subPayment,
      status: 'success',
    });
    vi.mocked(SubscriptionEnrollment.findOne as never).mockRejectedValue(new Error('sub boom'));

    const sig = paymentSignature('order_test_1', 'pay_1');
    await expect(
      service.verifySubscriptionPayment('u1', 'order_test_1', 'pay_1', sig),
    ).rejects.toThrow('sub boom');
    expect(session.abortTransaction).toHaveBeenCalled();
  });

  it('rethrows unexpected errors from payment.authorized', async () => {
    const payload = payloadFor('payment.authorized', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(Promise.reject(new Error('db down'))));
    await expect(service.handleWebhook('payment.authorized', payload, webhookSignature(payload))).rejects.toThrow(
      'db down',
    );
  });

  it('treats a concurrent duplicate payment.authorized as duplicate', async () => {
    const payload = payloadFor('payment.authorized', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(
      query(Promise.reject({ code: 11000, message: 'E11000' })),
    );
    const result = await service.handleWebhook('payment.authorized', payload, webhookSignature(payload));
    expect(result).toEqual({ received: true, duplicate: true });
  });

  it('rethrows unexpected errors from payment.pending', async () => {
    const payload = payloadFor('payment.pending', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(Promise.reject(new Error('db down'))));
    await expect(service.handleWebhook('payment.pending', payload, webhookSignature(payload))).rejects.toThrow(
      'db down',
    );
  });

  it('rethrows unexpected errors from payment.failed', async () => {
    const payload = payloadFor('payment.failed', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(Promise.reject(new Error('db down'))));
    await expect(service.handleWebhook('payment.failed', payload, webhookSignature(payload))).rejects.toThrow(
      'db down',
    );
  });

  it('rethrows unexpected errors from order.paid', async () => {
    const payload = payloadFor('order.paid', { id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(Promise.reject(new Error('db down'))));
    await expect(service.handleWebhook('order.paid', payload, webhookSignature(payload))).rejects.toThrow(
      'db down',
    );
  });

  it('rethrows unexpected errors from payment.refunded', async () => {
    const payload = payloadFor('payment.refunded', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(Promise.reject(new Error('db down'))));
    await expect(service.handleWebhook('payment.refunded', payload, webhookSignature(payload))).rejects.toThrow(
      'db down',
    );
  });

  it('uses the entity description as the pending reason', async () => {
    const payload = payloadFor('payment.pending', {
      id: 'pay_1',
      order_id: 'order_test_1',
      description: 'Bank processing',
    });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(paymentDoc));
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue({ _id: 'p1' });
    vi.mocked(User.findById as never).mockReturnValue(query({ name: 'Bob', email: 'bob@x.com' }));
    vi.mocked(User.find as never).mockReturnValue(query([{ _id: 'a1' }]));

    const result = await service.handleWebhook('payment.pending', payload, webhookSignature(payload));

    expect(result).toEqual({ received: true, processed: true });
    expect(Payment.findByIdAndUpdate).toHaveBeenCalledWith(
      'p1',
      { $set: { status: 'pending', pendingReason: 'Bank processing' } },
      expect.any(Object),
    );
  });

  it('falls back to a default pending reason', async () => {
    const payload = payloadFor('payment.pending', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(paymentDoc));
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue({ _id: 'p1' });
    vi.mocked(User.findById as never).mockReturnValue(query({ name: 'Bob', email: 'bob@x.com' }));
    vi.mocked(User.find as never).mockReturnValue(query([{ _id: 'a1' }]));

    await service.handleWebhook('payment.pending', payload, webhookSignature(payload));

    expect(Payment.findByIdAndUpdate).toHaveBeenCalledWith(
      'p1',
      { $set: { status: 'pending', pendingReason: 'Payment is pending processing' } },
      expect.any(Object),
    );
  });

  it('keeps the existing payment id when the failed entity has none', async () => {
    const payload = payloadFor('payment.failed', { order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(paymentDoc));
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue({ _id: 'p1' });
    vi.mocked(User.findById as never).mockReturnValue(query({ name: 'Bob', email: 'bob@x.com' }));
    vi.mocked(Course.findById as never).mockReturnValue(query({ title: 'React', instructor: null }));
    vi.mocked(User.find as never).mockReturnValue(query([{ _id: 'a1' }]));

    const result = await service.handleWebhook('payment.failed', payload, webhookSignature(payload));

    expect(result).toEqual({ received: true, processed: true });
    expect(Payment.findByIdAndUpdate).toHaveBeenCalledWith(
      'p1',
      { $set: expect.objectContaining({ razorpayPaymentId: 'pay_1' }) },
      expect.any(Object),
    );
  });

  it('processes payment.failed when the course cannot be found', async () => {
    const payload = payloadFor('payment.failed', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(paymentDoc));
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue({ _id: 'p1' });
    vi.mocked(User.findById as never).mockReturnValue(query({ email: 'bob@x.com' }));
    vi.mocked(Course.findById as never).mockReturnValue(query(null));
    vi.mocked(User.find as never).mockReturnValue(query([{ _id: 'a1' }]));

    const result = await service.handleWebhook('payment.failed', payload, webhookSignature(payload));

    expect(result).toEqual({ received: true, processed: true });
  });

  it('falls back to an unknown student name in failure notices', async () => {
    const payload = payloadFor('payment.failed', { id: 'pay_1', order_id: 'order_test_1' });
    vi.mocked(WebhookEvent.findOne as never).mockReturnValue(query(null));
    vi.mocked(WebhookEvent.create as never).mockResolvedValue([{ _id: 'wh1' }]);
    vi.mocked(Payment.findOne as never).mockReturnValue(query(paymentDoc));
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue({ _id: 'p1' });
    vi.mocked(User.findById as never).mockReturnValue(query({ email: 'bob@x.com' }));
    vi.mocked(Course.findById as never).mockReturnValue(
      query({ title: 'React', instructor: { _id: 'i1', name: 'Ira' } }),
    );
    vi.mocked(User.find as never).mockReturnValue(query([{ _id: 'a1' }]));

    const result = await service.handleWebhook('payment.failed', payload, webhookSignature(payload));

    expect(result).toEqual({ received: true, processed: true });
  });

  it('falls back to a default payout failure note', async () => {
    const payout = {
      _id: 'px',
      status: 'pending',
      amount: 500,
      instructor: { _id: 'i1', name: 'Ira', email: 'ira@x.com', toString: () => 'i1' },
      save: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(Payout.findById as never).mockReturnValue(query(payout));
    MockRazorpay.payoutError = new Error();

    await expect(service.processPayout('px')).rejects.toThrow('Payout failed:');
    expect(Payout.findByIdAndUpdate).toHaveBeenCalledWith(
      'px',
      { status: 'failed', notes: 'Payout processing failed' },
    );
  });

  it('appends gateway errors to existing admin notes', async () => {
    vi.mocked(Payment.findById as never).mockReturnValue(query({ ...paymentDoc, status: 'success' }));
    vi.mocked(Refund.findOne as never).mockResolvedValue(null);
    vi.mocked(Refund.create as never).mockResolvedValue({ _id: 'r1' });
    MockRazorpay.refundError = new Error('gateway down');

    await expect(
      service.processRefundPayment('p1', 100, 'user requested', 'partial', 'admin1', 'extra note'),
    ).rejects.toThrow('Refund failed at payment gateway: gateway down');
    expect(Refund.findByIdAndUpdate).toHaveBeenCalledWith(
      'r1',
      { status: 'rejected', adminNote: 'extra note | Gateway error: gateway down' },
    );
  });

  it('records the razorpay refund speed when provided', async () => {
    MockRazorpay.refundToReturn = {
      id: 'refund_1',
      status: 'processed',
      speed: 'normal',
      created_at: 1234567890,
    };
    vi.mocked(Payment.findById as never).mockReturnValue(query({ ...paymentDoc, status: 'success' }));
    vi.mocked(Refund.findOne as never).mockResolvedValue(null);
    vi.mocked(Refund.create as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Refund.findByIdAndUpdate as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue(paymentDoc);
    vi.mocked(Enrollment.deleteOne as never).mockResolvedValue({ deletedCount: 1 });
    vi.mocked(Course.findByIdAndUpdate as never).mockResolvedValue({});
    vi.mocked(User.find as never).mockReturnValue(query([]));

    await service.processRefundPayment('p1', 1000, 'user requested', 'full', 'admin1');

    expect(Refund.findByIdAndUpdate).toHaveBeenCalledWith(
      'r1',
      expect.objectContaining({ razorpayRefundSpeed: 'normal' }),
      expect.any(Object),
    );
  });

  it('reverses enrollments for a bundle refund without course ids', async () => {
    const bundlePayment = {
      ...paymentDoc,
      status: 'success',
      type: 'bundle',
      course: null,
      bundle: { _id: 'b1' },
      commissionSplits: undefined,
      walletCredited: false,
    };
    vi.mocked(Payment.findById as never).mockReturnValue(query(bundlePayment));
    vi.mocked(Refund.findOne as never).mockResolvedValue(null);
    vi.mocked(Refund.create as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Refund.findByIdAndUpdate as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue(bundlePayment);
    vi.mocked(Enrollment.deleteMany as never).mockResolvedValue({ deletedCount: 0 });
    vi.mocked(Bundle.findByIdAndUpdate as never).mockResolvedValue({});
    vi.mocked(Course.updateMany as never).mockResolvedValue({});
    vi.mocked(User.find as never).mockReturnValue(query([]));

    await service.processRefundPayment('p1', 1000, 'user requested', 'full', 'admin1');

    expect(Enrollment.deleteMany).toHaveBeenCalledWith(
      { user: 'u1', course: { $in: [] } },
      expect.any(Object),
    );
    expect(Notification.insertMany).toHaveBeenCalled();
  });

  it('reverses a wallet credit when there is no commission', async () => {
    const payment = {
      ...paymentDoc,
      status: 'success',
      walletCredited: true,
      totalCommissionAmount: 0,
      totalInstructorShare: 0,
      commissionSplits: [],
    };
    vi.mocked(Payment.findById as never).mockReturnValue(query(payment));
    vi.mocked(Refund.findOne as never).mockResolvedValue(null);
    vi.mocked(Refund.create as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Refund.findByIdAndUpdate as never).mockResolvedValue({ _id: 'r1' });
    vi.mocked(Payment.findByIdAndUpdate as never).mockResolvedValue(payment);
    vi.mocked(PlatformWallet.findOne as never).mockReturnValue(query(walletDoc));
    vi.mocked(Enrollment.deleteOne as never).mockResolvedValue({ deletedCount: 1 });
    vi.mocked(Course.findByIdAndUpdate as never).mockResolvedValue({});
    vi.mocked(User.find as never).mockReturnValue(query([]));

    await service.processRefundPayment('p1', 1000, 'user requested', 'full', 'admin1');

    expect(Payout.updateMany).not.toHaveBeenCalled();
  });
});
