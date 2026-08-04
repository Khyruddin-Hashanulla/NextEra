import { HTTP_STATUS } from '../../../src/constants/httpStatus';
import {
  getWallet,
  getCommissionSettings,
  getWalletTransactions,
  getAllPayouts,
  processPayout,
  processAllPendingPayouts,
  listRefundRequests,
  approveRefund,
  rejectRefund,
  issueRefund,
} from '../../../src/controllers/admin.controller';
import { adminService } from '../../../src/services/admin.service';
import { paymentService } from '../../../src/services/payment.service';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

vi.mock('../../../src/services/admin.service', () => ({
  adminService: {
    listRefundRequests: vi.fn(),
    approveRefund: vi.fn(),
    rejectRefund: vi.fn(),
  },
}));

vi.mock('../../../src/services/payment.service', () => ({
  paymentService: {
    getWallet: vi.fn(),
    getCommissionSettings: vi.fn(),
    getWalletTransactions: vi.fn(),
    getAllPayouts: vi.fn(),
    processPayout: vi.fn(),
    processAllPendingPayouts: vi.fn(),
    processRefundPayment: vi.fn(),
  },
}));

const mockedAdminService = vi.mocked(adminService);
const mockedPaymentService = vi.mocked(paymentService);
const adminId = '65f1a1b2c3d4e5f6a7b8c9d2';

function adminReq(overrides: Record<string, unknown> = {}) {
  return mockRequest({
    currentUser: { userId: adminId, role: 'admin', email: 'admin@example.com' },
    ...overrides,
  });
}

describe('admin payment controllers', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getWallet', () => {
    it('returns the platform wallet', async () => {
      const wallet = { currentBalance: 5000 };
      mockedPaymentService.getWallet.mockResolvedValue(wallet as never);

      const res = mockResponse();
      await getWallet(mockRequest() as never, res as never, mockNext());

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json.mock.calls[0][0]).toEqual({
        success: true,
        message: 'Wallet fetched',
        data: wallet,
      });
    });
  });

  describe('getCommissionSettings', () => {
    it('returns commission settings', async () => {
      const settings = { commissionPercentage: 20, gstPercentage: 18 };
      mockedPaymentService.getCommissionSettings.mockResolvedValue(settings as never);

      const res = mockResponse();
      await getCommissionSettings(mockRequest() as never, res as never, mockNext());

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json.mock.calls[0][0].message).toBe('Commission settings fetched');
    });
  });

  describe('getWalletTransactions', () => {
    it('defaults page and limit', async () => {
      const data = { transactions: [], total: 0 };
      mockedPaymentService.getWalletTransactions.mockResolvedValue(data as never);

      const req = adminReq({ query: {} });
      const res = mockResponse();

      await getWalletTransactions(req, res as never, mockNext());

      expect(mockedPaymentService.getWalletTransactions).toHaveBeenCalledWith(1, 20);
      expect(res.json.mock.calls[0][0].message).toBe('Wallet transactions fetched');
    });

    it('parses page and limit from the query string', async () => {
      mockedPaymentService.getWalletTransactions.mockResolvedValue({} as never);
      const req = adminReq({ query: { page: '3', limit: '50' } });
      const res = mockResponse();

      await getWalletTransactions(req, res as never, mockNext());

      expect(mockedPaymentService.getWalletTransactions).toHaveBeenCalledWith(3, 50);
    });
  });

  describe('getAllPayouts', () => {
    it('passes page, limit and status through to the service', async () => {
      const data = { payouts: [], summary: {}, total: 0 };
      mockedPaymentService.getAllPayouts.mockResolvedValue(data as never);

      const req = adminReq({ query: { page: '2', limit: '30', status: 'pending' } });
      const res = mockResponse();

      await getAllPayouts(req, res as never, mockNext());

      expect(mockedPaymentService.getAllPayouts).toHaveBeenCalledWith(2, 30, 'pending');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json.mock.calls[0][0].message).toBe('Payouts fetched');
    });

    it('omits the status filter when absent', async () => {
      mockedPaymentService.getAllPayouts.mockResolvedValue({} as never);
      const req = adminReq({ query: {} });
      const res = mockResponse();

      await getAllPayouts(req, res as never, mockNext());

      expect(mockedPaymentService.getAllPayouts).toHaveBeenCalledWith(1, 20, undefined);
    });
  });

  describe('processPayout', () => {
    it('processes a payout by id', async () => {
      const payout = { _id: 'px1', status: 'processed', utr: 'UTR123' };
      mockedPaymentService.processPayout.mockResolvedValue(payout as never);

      const req = adminReq({ params: { id: 'px1' } });
      const res = mockResponse();

      await processPayout(req, res as never, mockNext());

      expect(mockedPaymentService.processPayout).toHaveBeenCalledWith('px1');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json.mock.calls[0][0].message).toBe('Payout processed');
    });
  });

  describe('processAllPendingPayouts', () => {
    it('processes all pending payouts', async () => {
      const result = { processed: 3, failed: 0 };
      mockedPaymentService.processAllPendingPayouts.mockResolvedValue(result as never);

      const res = mockResponse();
      await processAllPendingPayouts(mockRequest() as never, res as never, mockNext());

      expect(mockedPaymentService.processAllPendingPayouts).toHaveBeenCalledOnce();
      expect(res.json.mock.calls[0][0].message).toBe('Pending payouts processed');
    });
  });

  describe('listRefundRequests', () => {
    it('lists refund requests with filters', async () => {
      const data = { refunds: [], total: 0 };
      mockedAdminService.listRefundRequests.mockResolvedValue(data as never);

      const req = adminReq({ query: { page: '1', limit: '15', status: 'pending' } });
      const res = mockResponse();

      await listRefundRequests(req, res as never, mockNext());

      expect(mockedAdminService.listRefundRequests).toHaveBeenCalledWith(1, 15, 'pending');
      expect(res.json.mock.calls[0][0].message).toBe('Refund requests fetched');
    });
  });

  describe('approveRefund', () => {
    it('approves a refund with the admin id and note', async () => {
      const refund = { _id: 'r1', status: 'approved' };
      mockedAdminService.approveRefund.mockResolvedValue(refund as never);

      const req = adminReq({ params: { id: 'r1' }, body: { adminNote: 'looks legit' } });
      const res = mockResponse();

      await approveRefund(req, res as never, mockNext());

      expect(mockedAdminService.approveRefund).toHaveBeenCalledWith('r1', adminId, 'looks legit');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json.mock.calls[0][0].message).toBe('Refund approved');
    });

    it('passes an undefined note when the body omits it', async () => {
      mockedAdminService.approveRefund.mockResolvedValue({} as never);
      const req = adminReq({ params: { id: 'r1' }, body: {} });
      const res = mockResponse();

      await approveRefund(req, res as never, mockNext());

      expect(mockedAdminService.approveRefund).toHaveBeenCalledWith('r1', adminId, undefined);
    });
  });

  describe('rejectRefund', () => {
    it('rejects a refund with the admin id and note', async () => {
      const refund = { _id: 'r1', status: 'rejected' };
      mockedAdminService.rejectRefund.mockResolvedValue(refund as never);

      const req = adminReq({ params: { id: 'r1' }, body: { adminNote: 'not eligible' } });
      const res = mockResponse();

      await rejectRefund(req, res as never, mockNext());

      expect(mockedAdminService.rejectRefund).toHaveBeenCalledWith('r1', adminId, 'not eligible');
      expect(res.json.mock.calls[0][0].message).toBe('Refund rejected');
    });
  });

  describe('issueRefund', () => {
    const baseBody = { amount: 500, reason: 'student_request', refundType: 'partial', adminNote: 'ok' };

    it('processes a refund against a payment', async () => {
      const refund = { _id: 'r2', status: 'processed', amount: 500 };
      mockedPaymentService.processRefundPayment.mockResolvedValue(refund as never);

      const req = adminReq({ params: { id: 'p1' }, body: baseBody });
      const res = mockResponse();

      await issueRefund(req, res as never, mockNext());

      expect(mockedPaymentService.processRefundPayment).toHaveBeenCalledWith(
        'p1',
        500,
        'student_request',
        'partial',
        adminId,
        'ok',
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json.mock.calls[0][0]).toEqual({
        success: true,
        message: 'Refund processed',
        data: refund,
      });
    });

    it('defaults the refund type to full', async () => {
      const { refundType, ...body } = baseBody;
      mockedPaymentService.processRefundPayment.mockResolvedValue({} as never);

      const req = adminReq({ params: { id: 'p1' }, body });
      const res = mockResponse();

      await issueRefund(req, res as never, mockNext());

      expect(mockedPaymentService.processRefundPayment).toHaveBeenCalledWith(
        'p1',
        500,
        'student_request',
        'full',
        adminId,
        'ok',
      );
    });

    it('forwards gateway errors to next', async () => {
      const error = new Error('Refund failed at payment gateway: down');
      mockedPaymentService.processRefundPayment.mockRejectedValue(error);

      const req = adminReq({ params: { id: 'p1' }, body: baseBody });
      const res = mockResponse();
      const next = mockNext();

      await issueRefund(req, res as never, next);
      await Promise.resolve();

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
