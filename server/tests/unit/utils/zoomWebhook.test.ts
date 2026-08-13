import crypto from 'crypto';
import { verifyZoomWebhookSignature, ZOOM_WEBHOOK_REPLAY_WINDOW_MS } from '../../../src/utils/zoomWebhook';

const SECRET = 'test-webhook-secret';

function sign(rawBody: string, timestamp: string | number, secret = SECRET): string {
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('base64');
}

describe('verifyZoomWebhookSignature', () => {
  const rawBody = JSON.stringify({ event: 'recording.ready' });

  it('returns true for a valid signature with millisecond timestamp', () => {
    const timestamp = String(Date.now());
    const signature = sign(rawBody, timestamp);
    expect(verifyZoomWebhookSignature({ secret: SECRET, signature, timestamp, rawBody })).toBe(true);
  });

  it('returns true for a valid signature with second timestamp', () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = sign(rawBody, timestamp);
    expect(verifyZoomWebhookSignature({ secret: SECRET, signature, timestamp, rawBody })).toBe(true);
  });

  it('returns false for an invalid signature', () => {
    const timestamp = String(Date.now());
    const signature = sign(rawBody, timestamp, 'wrong-secret');
    expect(verifyZoomWebhookSignature({ secret: SECRET, signature, timestamp, rawBody })).toBe(false);
  });

  it('returns false when the signature does not match the body', () => {
    const timestamp = String(Date.now());
    const signature = sign(JSON.stringify({ event: 'other' }), timestamp);
    expect(verifyZoomWebhookSignature({ secret: SECRET, signature, timestamp, rawBody })).toBe(false);
  });

  it('returns false for a replayed (stale) timestamp', () => {
    const stale = Date.now() - ZOOM_WEBHOOK_REPLAY_WINDOW_MS - 1000;
    const timestamp = String(stale);
    const signature = sign(rawBody, timestamp);
    expect(verifyZoomWebhookSignature({ secret: SECRET, signature, timestamp, rawBody, now: Date.now() })).toBe(false);
  });

  it('returns false when timestamp is not a number', () => {
    const signature = sign(rawBody, 'not-a-number');
    expect(verifyZoomWebhookSignature({ secret: SECRET, signature, timestamp: 'not-a-number', rawBody })).toBe(false);
  });

  it('returns false when secret is empty', () => {
    const timestamp = String(Date.now());
    const signature = sign(rawBody, timestamp);
    expect(verifyZoomWebhookSignature({ secret: '', signature, timestamp, rawBody })).toBe(false);
  });

  it('returns false when signature or timestamp headers are missing', () => {
    expect(verifyZoomWebhookSignature({ secret: SECRET, signature: undefined, timestamp: undefined, rawBody })).toBe(
      false
    );
  });
});
