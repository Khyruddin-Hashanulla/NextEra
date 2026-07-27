import { Router, Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';

const router = Router();

// Razorpay webhook (no auth - verified by signature)
router.post(
  '/webhook/razorpay',
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const { event, payload } = req.body;
    const data = await paymentService.handleWebhook(event, payload, signature);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success('Webhook received', data));
  })
);

export default router;
