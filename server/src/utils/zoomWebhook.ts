import crypto from 'crypto';

export const ZOOM_WEBHOOK_REPLAY_WINDOW_MS = 5 * 60 * 1000;

export interface ZoomWebhookVerificationOptions {
  secret: string;
  signature?: string;
  timestamp?: string;
  rawBody: string;
  now?: number;
  windowMs?: number;
}

// Zoom v1 webhook signature: base64(HMAC-SHA256(secret, `${timestamp}.${rawBody}`))
// sent via the `x-zm-signature` header with the `x-zm-request-timestamp` header.
export function verifyZoomWebhookSignature(options: ZoomWebhookVerificationOptions): boolean {
  const { secret, signature, timestamp, rawBody } = options;

  if (!secret || !signature || !timestamp) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;

  const now = options.now ?? Date.now();
  const windowMs = options.windowMs ?? ZOOM_WEBHOOK_REPLAY_WINDOW_MS;
  // Zoom may send the timestamp in either milliseconds or seconds since epoch.
  const delta = Math.abs(now - ts);
  const deltaSeconds = Math.abs(now - ts * 1000);
  if (delta > windowMs && deltaSeconds > windowMs) return false;

  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('base64');

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
