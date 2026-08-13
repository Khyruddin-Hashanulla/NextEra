import { Router, Request, Response } from 'express';
import express from 'express';
import { paymentService } from '../services/payment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { razorpayWebhookLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

// Razorpay webhook (no auth - verified by signature against raw body)
// Must be mounted before express.json() so the raw body is available for signature verification.
router.post(
  '/webhook/razorpay',
  razorpayWebhookLimiter,
  express.raw({ type: 'application/json', limit: '10mb' }),
  asyncHandler(async (req: Request, res: Response) => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
    const signature = req.headers['x-razorpay-signature'] as string;

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (_error) {
      logger.warn('Razorpay webhook: invalid JSON body');
      throw ApiError.badRequest('Invalid JSON body');
    }

    const { event } = payload;
    const data = await paymentService.handleWebhook(event, payload, signature, rawBody);

    res.status(HTTP_STATUS.OK).json(ApiResponse.success('Webhook received', data));
  })
);

export default router;
