import express from 'express';
import request from 'supertest';
import adminRoutes from '../../../src/routes/admin.routes';
import { errorHandler } from '../../../src/middlewares/errorHandler.middleware';
import { adminService } from '../../../src/services/admin.service';
import { paymentService } from '../../../src/services/payment.service';

let mockCurrentUserRole = 'admin';

vi.mock('../../../src/middlewares/auth.middleware', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.currentUser = {
      userId: '65f1a1b2c3d4e5f6a7b8c9d2',
      role: mockCurrentUserRole,
      email: 'admin@example.com',
    };
    next();
  },
}));

vi.mock('../../../src/middlewares/audit.middleware', () => ({
  audit: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  auditMiddleware: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  previousDataLoader: () => () => Promise.resolve(undefined),
}));

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

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/admin', adminRoutes);
  app.use(errorHandler);
  return app;
}

describe('admin payment routes', () => {
  let app: express.Express;

  beforeEach(() => {
    mockCurrentUserRole = 'admin';
    app = buildApp();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('authorization', () => {
    it('rejects non-admin roles with 403', async () => {
      mockCurrentUserRole = 'student';

      const res = await request(app).get('/api/v1/admin/payouts');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(mockedPaymentService.getAllPayouts).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/admin/wallet', () => {
    it('returns the platform wallet', async () => {
      const wallet = { currentBalance: 5000 };
      mockedPaymentService.getWallet.mockResolvedValue(wallet as never);

      const res = await request(app).get('/api/v1/admin/wallet');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(wallet);
    });
  });

  describe('GET /api/v1/admin/wallet/transactions', () => {
    it('returns wallet transactions with parsed pagination', async () => {
      mockedPaymentService.getWalletTransactions.mockResolvedValue({} as never);

      await request(app).get('/api/v1/admin/wallet/transactions?page=2&limit=40');

      expect(mockedPaymentService.getWalletTransactions).toHaveBeenCalledWith(2, 40);
    });
  });

  describe('GET /api/v1/admin/wallet/commission', () => {
    it('returns commission settings', async () => {
      const settings = { commissionPercentage: 20, gstPercentage: 18 };
      mockedPaymentService.getCommissionSettings.mockResolvedValue(settings as never);

      const res = await request(app).get('/api/v1/admin/wallet/commission');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(settings);
    });
  });

  describe('GET /api/v1/admin/payouts', () => {
    it('lists payouts and passes the status filter', async () => {
      const data = { payouts: [], summary: {}, total: 0 };
      mockedPaymentService.getAllPayouts.mockResolvedValue(data as never);

      const res = await request(app).get('/api/v1/admin/payouts?status=pending');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Payouts fetched');
      expect(mockedPaymentService.getAllPayouts).toHaveBeenCalledWith(1, 20, 'pending');
    });

    it('defaults pagination and omits the status filter', async () => {
      mockedPaymentService.getAllPayouts.mockResolvedValue({} as never);

      await request(app).get('/api/v1/admin/payouts');

      expect(mockedPaymentService.getAllPayouts).toHaveBeenCalledWith(1, 20, undefined);
    });
  });

  describe('POST /api/v1/admin/payouts/:id/process', () => {
    it('processes a payout', async () => {
      const payout = { _id: 'px1', status: 'processed', utr: 'UTR123' };
      mockedPaymentService.processPayout.mockResolvedValue(payout as never);

      const res = await request(app).post('/api/v1/admin/payouts/px1/process');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Payout processed');
      expect(mockedPaymentService.processPayout).toHaveBeenCalledWith('px1');
    });
  });

  describe('POST /api/v1/admin/payouts/process-all', () => {
    it('processes all pending payouts', async () => {
      mockedPaymentService.processAllPendingPayouts.mockResolvedValue({ processed: 3 } as never);

      const res = await request(app).post('/api/v1/admin/payouts/process-all');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Pending payouts processed');
    });
  });

  describe('GET /api/v1/admin/refunds', () => {
    it('lists refund requests with filters', async () => {
      const data = { refunds: [], total: 0 };
      mockedAdminService.listRefundRequests.mockResolvedValue(data as never);

      const res = await request(app).get('/api/v1/admin/refunds?status=approved');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Refund requests fetched');
      expect(mockedAdminService.listRefundRequests).toHaveBeenCalledWith(1, 10, 'approved');
    });
  });

  describe('PUT /api/v1/admin/refunds/:id/approve', () => {
    it('approves a refund with an optional note', async () => {
      const refund = { _id: 'r1', status: 'approved' };
      mockedAdminService.approveRefund.mockResolvedValue(refund as never);

      const res = await request(app).put('/api/v1/admin/refunds/r1/approve').send({ adminNote: 'looks legit' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Refund approved');
      expect(mockedAdminService.approveRefund).toHaveBeenCalledWith('r1', '65f1a1b2c3d4e5f6a7b8c9d2', 'looks legit');
    });

    it('accepts an empty body (note optional)', async () => {
      mockedAdminService.approveRefund.mockResolvedValue({} as never);

      const res = await request(app).put('/api/v1/admin/refunds/r1/approve').send({});

      expect(res.status).toBe(200);
      expect(mockedAdminService.approveRefund).toHaveBeenCalledWith('r1', '65f1a1b2c3d4e5f6a7b8c9d2', undefined);
    });
  });

  describe('PUT /api/v1/admin/refunds/:id/reject', () => {
    it('rejects a refund with an optional note', async () => {
      mockedAdminService.rejectRefund.mockResolvedValue({ _id: 'r1' } as never);

      const res = await request(app).put('/api/v1/admin/refunds/r1/reject').send({ adminNote: 'not eligible' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Refund rejected');
      expect(mockedAdminService.rejectRefund).toHaveBeenCalledWith('r1', '65f1a1b2c3d4e5f6a7b8c9d2', 'not eligible');
    });
  });

  describe('POST /api/v1/admin/payments/:id/refund', () => {
    const validBody = { amount: 500, reason: 'student_request', refundType: 'partial', adminNote: 'ok' };

    it('issues a refund through the payment service', async () => {
      const refund = { _id: 'r2', status: 'processed', amount: 500 };
      mockedPaymentService.processRefundPayment.mockResolvedValue(refund as never);

      const res = await request(app).post('/api/v1/admin/payments/p1/refund').send(validBody);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Refund processed');
      expect(mockedPaymentService.processRefundPayment).toHaveBeenCalledWith(
        'p1',
        500,
        'student_request',
        'partial',
        '65f1a1b2c3d4e5f6a7b8c9d2',
        'ok'
      );
    });

    it('defaults refundType to full', async () => {
      const { refundType: _refundType, ...body } = validBody;
      mockedPaymentService.processRefundPayment.mockResolvedValue({} as never);

      await request(app).post('/api/v1/admin/payments/p1/refund').send(body);

      expect(mockedPaymentService.processRefundPayment).toHaveBeenCalledWith(
        'p1',
        500,
        'student_request',
        'full',
        '65f1a1b2c3d4e5f6a7b8c9d2',
        'ok'
      );
    });

    it('rejects an invalid refund reason', async () => {
      const res = await request(app)
        .post('/api/v1/admin/payments/p1/refund')
        .send({ ...validBody, reason: 'not-a-real-reason' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(mockedPaymentService.processRefundPayment).not.toHaveBeenCalled();
    });

    it('rejects a non-positive amount', async () => {
      const res = await request(app)
        .post('/api/v1/admin/payments/p1/refund')
        .send({ ...validBody, amount: 0 });

      expect(res.status).toBe(400);
      expect(mockedPaymentService.processRefundPayment).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('maps service errors to 500 through the error handler', async () => {
      mockedPaymentService.processPayout.mockRejectedValue(new Error('gateway down'));

      const res = await request(app).post('/api/v1/admin/payouts/px1/process');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
