import express from 'express';
import request from 'supertest';
import studentRoutes from '../../../src/routes/student.routes';
import { errorHandler } from '../../../src/middlewares/errorHandler.middleware';
import { studentService } from '../../../src/services/student.service';

vi.mock('../../../src/middlewares/auth.middleware', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.currentUser = { userId: '65f1a1b2c3d4e5f6a7b8c9d0', role: 'student', email: 'student@example.com' };
    next();
  },
  optionalAuthenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.currentUser = { userId: '65f1a1b2c3d4e5f6a7b8c9d0', role: 'student', email: 'student@example.com' };
    next();
  },
}));

vi.mock('../../../src/services/student.service', () => ({
  studentService: {
    initiatePayment: vi.fn(),
    verifyPayment: vi.fn(),
    retryPayment: vi.fn(),
    listMyPayments: vi.fn(),
    getPaymentById: vi.fn(),
    generateInvoice: vi.fn(),
    initiateBundlePayment: vi.fn(),
    verifyBundlePayment: vi.fn(),
    initiateSubscriptionPayment: vi.fn(),
    verifySubscriptionPayment: vi.fn(),
  },
}));

const mockedStudentService = vi.mocked(studentService);

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/student', studentRoutes);
  app.use(errorHandler);
  return app;
}

describe('student payment routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = buildApp();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/student/payments/initiate', () => {
    it('initiates a payment for a valid payload', async () => {
      const order = { orderId: 'order_test_1', amount: 100000, currency: 'INR', key: 'rzp_key', paymentId: 'p1' };
      mockedStudentService.initiatePayment.mockResolvedValue(order as never);

      const res = await request(app)
        .post('/api/v1/student/payments/initiate')
        .send({ courseId: 'c1', couponCode: 'SAVE10' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Payment initiated');
      expect(res.body.data).toEqual(order);
      expect(mockedStudentService.initiatePayment).toHaveBeenCalledWith(
        '65f1a1b2c3d4e5f6a7b8c9d0',
        'c1',
        'SAVE10',
      );
    });

    it('rejects a payload without a courseId', async () => {
      const res = await request(app).post('/api/v1/student/payments/initiate').send({ couponCode: 'SAVE10' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(mockedStudentService.initiatePayment).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/student/payments/verify', () => {
    it('verifies a payment for a valid payload', async () => {
      const result = { success: true, paymentId: 'p1' };
      mockedStudentService.verifyPayment.mockResolvedValue(result as never);

      const res = await request(app)
        .post('/api/v1/student/payments/verify')
        .send({ razorpayOrderId: 'order_test_1', razorpayPaymentId: 'pay_1', razorpaySignature: 'sig' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Payment verified');
      expect(mockedStudentService.verifyPayment).toHaveBeenCalledWith(
        '65f1a1b2c3d4e5f6a7b8c9d0',
        'order_test_1',
        'pay_1',
        'sig',
      );
    });

    it('rejects a payload missing the razorpay signature', async () => {
      const res = await request(app)
        .post('/api/v1/student/payments/verify')
        .send({ razorpayOrderId: 'order_test_1', razorpayPaymentId: 'pay_1' });

      expect(res.status).toBe(400);
      expect(mockedStudentService.verifyPayment).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/student/payments/:id/retry', () => {
    it('retries a failed payment', async () => {
      const retry = { orderId: 'order_test_2', amount: 100000, currency: 'INR', key: 'rzp_key', paymentId: 'p1' };
      mockedStudentService.retryPayment.mockResolvedValue(retry as never);

      const res = await request(app).post('/api/v1/student/payments/p1/retry');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Payment retry initiated');
      expect(mockedStudentService.retryPayment).toHaveBeenCalledWith(
        '65f1a1b2c3d4e5f6a7b8c9d0',
        'p1',
      );
    });
  });

  describe('GET /api/v1/student/payments', () => {
    it('lists the current users payments with query defaults', async () => {
      const data = { payments: [], total: 0 };
      mockedStudentService.listMyPayments.mockResolvedValue(data as never);

      const res = await request(app).get('/api/v1/student/payments');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(data);
      expect(mockedStudentService.listMyPayments).toHaveBeenCalledWith(
        '65f1a1b2c3d4e5f6a7b8c9d0',
        1,
        10,
      );
    });

    it('passes pagination query params through', async () => {
      mockedStudentService.listMyPayments.mockResolvedValue({} as never);
      await request(app).get('/api/v1/student/payments?page=3&limit=50');

      expect(mockedStudentService.listMyPayments).toHaveBeenCalledWith(
        '65f1a1b2c3d4e5f6a7b8c9d0',
        3,
        50,
      );
    });
  });

  describe('GET /api/v1/student/payments/:id', () => {
    it('fetches a single payment', async () => {
      const payment = { _id: 'p1', amount: 1000 };
      mockedStudentService.getPaymentById.mockResolvedValue(payment as never);

      const res = await request(app).get('/api/v1/student/payments/p1');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(payment);
      expect(mockedStudentService.getPaymentById).toHaveBeenCalledWith(
        'p1',
        '65f1a1b2c3d4e5f6a7b8c9d0',
      );
    });
  });

  describe('GET /api/v1/student/payments/:paymentId/invoice', () => {
    it('streams the invoice as an html attachment', async () => {
      mockedStudentService.generateInvoice.mockResolvedValue({
        html: '<html>invoice</html>',
        filename: 'invoice-p1.html',
      } as never);

      const res = await request(app).get('/api/v1/student/payments/p1/invoice');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.headers['content-disposition']).toContain('attachment; filename="invoice-p1.html"');
      expect(res.text).toBe('<html>invoice</html>');
    });
  });

  describe('POST /api/v1/student/bundles/payments/*', () => {
    it('initiates a bundle payment', async () => {
      const order = { orderId: 'order_b', amount: 120000, currency: 'INR', key: 'rzp_key', paymentId: 'p2' };
      mockedStudentService.initiateBundlePayment.mockResolvedValue(order as never);

      const res = await request(app)
        .post('/api/v1/student/bundles/payments/initiate')
        .send({ bundleId: 'b1', couponCode: 'FLAT50' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Bundle payment initiated');
      expect(mockedStudentService.initiateBundlePayment).toHaveBeenCalledWith(
        '65f1a1b2c3d4e5f6a7b8c9d0',
        'b1',
        'FLAT50',
      );
    });

    it('verifies a bundle payment', async () => {
      const result = { success: true, paymentId: 'p2' };
      mockedStudentService.verifyBundlePayment.mockResolvedValue(result as never);

      const res = await request(app)
        .post('/api/v1/student/bundles/payments/verify')
        .send({ razorpayOrderId: 'order_b', razorpayPaymentId: 'pay_2', razorpaySignature: 'sig' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Bundle payment verified');
    });
  });

  describe('POST /api/v1/student/subscriptions/payments/*', () => {
    it('initiates a subscription payment', async () => {
      const order = { orderId: 'order_s', amount: 199900, currency: 'INR', key: 'rzp_key', paymentId: 'p3' };
      mockedStudentService.initiateSubscriptionPayment.mockResolvedValue(order as never);

      const res = await request(app)
        .post('/api/v1/student/subscriptions/payments/initiate')
        .send({ subscriptionId: 's1' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Subscription payment initiated');
      expect(mockedStudentService.initiateSubscriptionPayment).toHaveBeenCalledWith(
        '65f1a1b2c3d4e5f6a7b8c9d0',
        's1',
        undefined,
      );
    });

    it('verifies a subscription payment', async () => {
      const result = { success: true, paymentId: 'p3', subscriptionEnrollment: 'se1' };
      mockedStudentService.verifySubscriptionPayment.mockResolvedValue(result as never);

      const res = await request(app)
        .post('/api/v1/student/subscriptions/payments/verify')
        .send({ razorpayOrderId: 'order_s', razorpayPaymentId: 'pay_3', razorpaySignature: 'sig' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Subscription payment verified');
    });
  });

  describe('authentication', () => {
    it('applies the authenticate middleware before the controller', async () => {
      mockedStudentService.listMyPayments.mockResolvedValue({} as never);
      const res = await request(app).get('/api/v1/student/payments');
      expect(res.status).toBe(200);
      expect(mockedStudentService.listMyPayments).toHaveBeenCalledWith(
        '65f1a1b2c3d4e5f6a7b8c9d0',
        1,
        10,
      );
    });
  });
});
