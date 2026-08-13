import { HTTP_STATUS } from '../../../src/constants/httpStatus';
import {
  initiatePayment,
  verifyPayment,
  retryPayment,
  listMyPayments,
  getPaymentById,
  generateInvoice,
  initiateBundlePayment,
  verifyBundlePayment,
  initiateSubscriptionPayment,
  verifySubscriptionPayment,
} from '../../../src/controllers/student.controller';
import { studentService } from '../../../src/services/student.service';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

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
const userId = '65f1a1b2c3d4e5f6a7b8c9d0';

function currentUserReq(overrides: Record<string, unknown> = {}) {
  return mockRequest({
    currentUser: { userId, role: 'student', email: 'student@example.com' },
    ...overrides,
  });
}

describe('student payment controllers', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initiatePayment', () => {
    it('initiates a course payment and returns 200 with the order data', async () => {
      const order = { orderId: 'order_test_1', amount: 100000, currency: 'INR', key: 'rzp_key', paymentId: 'p1' };
      mockedStudentService.initiatePayment.mockResolvedValue(order as never);

      const req = currentUserReq({ body: { courseId: 'c1', couponCode: 'SAVE10' } });
      const res = mockResponse();
      const next = mockNext();

      await initiatePayment(req, res as never, next);

      expect(mockedStudentService.initiatePayment).toHaveBeenCalledWith(userId, 'c1', 'SAVE10');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      const payload = res.json.mock.calls[0][0];
      expect(payload).toEqual({ success: true, message: 'Payment initiated', data: order });
    });

    it('passes undefined coupon when the body omits it', async () => {
      mockedStudentService.initiatePayment.mockResolvedValue({} as never);
      const req = currentUserReq({ body: { courseId: 'c1' } });
      const res = mockResponse();

      await initiatePayment(req, res as never, mockNext());

      expect(mockedStudentService.initiatePayment).toHaveBeenCalledWith(userId, 'c1', undefined);
    });

    it('forwards service failures to next', async () => {
      const error = new Error('Course not found');
      mockedStudentService.initiatePayment.mockRejectedValue(error);
      const req = currentUserReq({ body: { courseId: 'missing' } });
      const res = mockResponse();
      const next = mockNext();

      await initiatePayment(req, res as never, next);
      await Promise.resolve();

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('verifyPayment', () => {
    it('verifies a course payment and returns 200', async () => {
      const result = { success: true, paymentId: 'p1' };
      mockedStudentService.verifyPayment.mockResolvedValue(result as never);

      const req = currentUserReq({
        body: { razorpayOrderId: 'order_test_1', razorpayPaymentId: 'pay_1', razorpaySignature: 'sig' },
      });
      const res = mockResponse();

      await verifyPayment(req, res as never, mockNext());

      expect(mockedStudentService.verifyPayment).toHaveBeenCalledWith(userId, 'order_test_1', 'pay_1', 'sig');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json.mock.calls[0][0]).toEqual(
        expect.objectContaining({ success: true, message: 'Payment verified', data: result })
      );
    });
  });

  describe('retryPayment', () => {
    it('retries a failed payment using the route param', async () => {
      const retry = { orderId: 'order_test_2', amount: 100000, currency: 'INR', key: 'rzp_key', paymentId: 'p1' };
      mockedStudentService.retryPayment.mockResolvedValue(retry as never);

      const req = currentUserReq({ params: { id: 'p1' } });
      const res = mockResponse();

      await retryPayment(req, res as never, mockNext());

      expect(mockedStudentService.retryPayment).toHaveBeenCalledWith(userId, 'p1');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json.mock.calls[0][0].message).toBe('Payment retry initiated');
    });
  });

  describe('listMyPayments', () => {
    it('defaults page and limit', async () => {
      const data = { payments: [], total: 0 };
      mockedStudentService.listMyPayments.mockResolvedValue(data as never);

      const req = currentUserReq({ query: {} });
      const res = mockResponse();

      await listMyPayments(req, res as never, mockNext());

      expect(mockedStudentService.listMyPayments).toHaveBeenCalledWith(userId, 1, 10);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json.mock.calls[0][0].data).toEqual(data);
    });

    it('parses page and limit from the query string', async () => {
      mockedStudentService.listMyPayments.mockResolvedValue({} as never);
      const req = currentUserReq({ query: { page: '2', limit: '25' } });
      const res = mockResponse();

      await listMyPayments(req, res as never, mockNext());

      expect(mockedStudentService.listMyPayments).toHaveBeenCalledWith(userId, 2, 25);
    });
  });

  describe('getPaymentById', () => {
    it('fetches a single payment scoped to the current user', async () => {
      const payment = { _id: 'p1', amount: 1000 };
      mockedStudentService.getPaymentById.mockResolvedValue(payment as never);

      const req = currentUserReq({ params: { id: 'p1' } });
      const res = mockResponse();

      await getPaymentById(req, res as never, mockNext());

      expect(mockedStudentService.getPaymentById).toHaveBeenCalledWith('p1', userId);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json.mock.calls[0][0].message).toBe('Payment fetched');
    });
  });

  describe('generateInvoice', () => {
    it('sends the invoice html as an attachment', async () => {
      mockedStudentService.generateInvoice.mockResolvedValue({
        html: '<html>invoice</html>',
        filename: 'invoice-p1.html',
      } as never);

      const req = currentUserReq({ params: { paymentId: 'p1' } });
      const res = mockResponse();

      await generateInvoice(req, res as never, mockNext());

      expect(mockedStudentService.generateInvoice).toHaveBeenCalledWith('p1', userId);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="invoice-p1.html"');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.send).toHaveBeenCalledWith('<html>invoice</html>');
    });
  });

  describe('initiateBundlePayment', () => {
    it('initiates a bundle payment with an optional coupon', async () => {
      const order = { orderId: 'order_b', amount: 120000, currency: 'INR', key: 'rzp_key', paymentId: 'p2' };
      mockedStudentService.initiateBundlePayment.mockResolvedValue(order as never);

      const req = currentUserReq({ body: { bundleId: 'b1', couponCode: 'FLAT50' } });
      const res = mockResponse();

      await initiateBundlePayment(req, res as never, mockNext());

      expect(mockedStudentService.initiateBundlePayment).toHaveBeenCalledWith(userId, 'b1', 'FLAT50');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json.mock.calls[0][0].message).toBe('Bundle payment initiated');
    });
  });

  describe('verifyBundlePayment', () => {
    it('verifies a bundle payment', async () => {
      const result = { success: true, paymentId: 'p2' };
      mockedStudentService.verifyBundlePayment.mockResolvedValue(result as never);

      const req = currentUserReq({
        body: { razorpayOrderId: 'order_b', razorpayPaymentId: 'pay_2', razorpaySignature: 'sig' },
      });
      const res = mockResponse();

      await verifyBundlePayment(req, res as never, mockNext());

      expect(mockedStudentService.verifyBundlePayment).toHaveBeenCalledWith(userId, 'order_b', 'pay_2', 'sig');
      expect(res.json.mock.calls[0][0].message).toBe('Bundle payment verified');
    });
  });

  describe('initiateSubscriptionPayment', () => {
    it('initiates a subscription payment', async () => {
      const order = { orderId: 'order_s', amount: 199900, currency: 'INR', key: 'rzp_key', paymentId: 'p3' };
      mockedStudentService.initiateSubscriptionPayment.mockResolvedValue(order as never);

      const req = currentUserReq({ body: { subscriptionId: 's1' } });
      const res = mockResponse();

      await initiateSubscriptionPayment(req, res as never, mockNext());

      expect(mockedStudentService.initiateSubscriptionPayment).toHaveBeenCalledWith(userId, 's1', undefined);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json.mock.calls[0][0].message).toBe('Subscription payment initiated');
    });
  });

  describe('verifySubscriptionPayment', () => {
    it('verifies a subscription payment', async () => {
      const result = { success: true, paymentId: 'p3', subscriptionEnrollment: 'se1' };
      mockedStudentService.verifySubscriptionPayment.mockResolvedValue(result as never);

      const req = currentUserReq({
        body: { razorpayOrderId: 'order_s', razorpayPaymentId: 'pay_3', razorpaySignature: 'sig' },
      });
      const res = mockResponse();

      await verifySubscriptionPayment(req, res as never, mockNext());

      expect(mockedStudentService.verifySubscriptionPayment).toHaveBeenCalledWith(userId, 'order_s', 'pay_3', 'sig');
      expect(res.json.mock.calls[0][0].message).toBe('Subscription payment verified');
    });
  });
});
