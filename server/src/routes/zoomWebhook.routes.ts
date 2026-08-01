import { Router, Request, Response } from 'express';
import express from 'express';
import { liveClassService } from '../services/liveClass.service';
import { verifyZoomWebhookSignature } from '../utils/zoomWebhook';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';
import { logger } from '../utils/logger';
import { zoomWebhookLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

// Zoom cloud recording webhook. No auth - the signature is verified against the
// raw request body. Must be mounted before express.json() so the raw body is
// available for signature verification.
router.post(
  '/live-classes/webhook/zoom',
  zoomWebhookLimiter,
  express.raw({ type: 'application/json', limit: '10mb' }),
  asyncHandler(async (req: Request, res: Response) => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
    const signature = req.headers['x-zm-signature'] as string;
    const timestamp = req.headers['x-zm-request-timestamp'] as string;

    const valid = verifyZoomWebhookSignature({
      secret: process.env.ZOOM_WEBHOOK_SECRET || '',
      signature,
      timestamp,
      rawBody,
    });
    if (!valid) {
      logger.warn('Zoom webhook rejected: invalid signature');
      throw ApiError.unauthorized('Invalid webhook signature');
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      throw ApiError.badRequest('Invalid JSON body');
    }

    const data = await liveClassService.handleZoomRecordingWebhook(payload);

    // Zoom endpoint validation expects a plain JSON response (not wrapped).
    if (payload?.event === 'endpoint.url_validation') {
      res.status(HTTP_STATUS.OK).json(data);
      return;
    }

    res.status(HTTP_STATUS.OK).json(ApiResponse.success('Webhook received', data));
  })
);

export default router;
