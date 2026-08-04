import { HTTP_STATUS } from '../../../src/constants/httpStatus';
import { getMyPayouts } from '../../../src/controllers/instructor.controller';
import { paymentService } from '../../../src/services/payment.service';
import { mockRequest, mockResponse, mockNext } from '../../helpers/requestHelpers';

vi.mock('../../../src/services/payment.service', () => ({
  paymentService: {
    getInstructorPayouts: vi.fn(),
  },
}));

const mockedPaymentService = vi.mocked(paymentService);
const instructorId = '65f1a1b2c3d4e5f6a7b8c9d1';

describe('instructor payment controller', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyPayouts', () => {
    it('returns the payout history for the current instructor', async () => {
      const data = { payouts: [], summary: { totalPaid: 100 }, total: 0 };
      mockedPaymentService.getInstructorPayouts.mockResolvedValue(data as never);

      const req = mockRequest({
        currentUser: { userId: instructorId, role: 'instructor', email: 'instructor@example.com' },
        query: { page: '2', limit: '25' },
      });
      const res = mockResponse();

      await getMyPayouts(req, res as never, mockNext());

      expect(mockedPaymentService.getInstructorPayouts).toHaveBeenCalledWith(instructorId, 2, 25);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json.mock.calls[0][0]).toEqual({
        success: true,
        message: 'Payouts fetched',
        data,
      });
    });

    it('defaults page and limit when the query is empty', async () => {
      mockedPaymentService.getInstructorPayouts.mockResolvedValue({} as never);
      const req = mockRequest({
        currentUser: { userId: instructorId, role: 'instructor', email: 'instructor@example.com' },
        query: {},
      });
      const res = mockResponse();

      await getMyPayouts(req, res as never, mockNext());

      expect(mockedPaymentService.getInstructorPayouts).toHaveBeenCalledWith(instructorId, 1, 20);
    });
  });
});
