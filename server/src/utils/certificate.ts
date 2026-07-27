import crypto from 'crypto';
import { env } from '../config/env';

export function generateCertificateSignature(data: { certificateId: string; userId: string; courseId: string; issuedAt: string }): string {
  const payload = `${data.certificateId}|${data.userId}|${data.courseId}|${data.issuedAt}`;
  return crypto.createHmac('sha256', env.certificateSecret).update(payload).digest('hex');
}

export function verifyCertificateSignature(
  data: { certificateId: string; userId: string; courseId: string; issuedAt: string },
  signature: string,
): boolean {
  const expected = generateCertificateSignature(data);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function generateQrCodeDataUrl(text: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
}
