import crypto from 'crypto';
import QRCode from 'qrcode';
import { env } from '../config/env';
import { logger } from './logger';

export interface CertificatePayload {
  certificateId: string;
  userId: string;
  courseId: string;
  issuedAt: string;
  version: number;
}

export function generateCertificateSignature(data: CertificatePayload): string {
  const payload = `${data.certificateId}|${data.userId}|${data.courseId}|${data.issuedAt}|v${data.version}`;
  return crypto.createHmac('sha256', env.certificateSecret || 'cert-default-secret').update(payload).digest('hex');
}

export function verifyCertificateSignature(data: CertificatePayload, signature: string): boolean {
  const expected = generateCertificateSignature(data);
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    });
  } catch {
    const external = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
    logger.warn('qrcode generation failed, falling back to external QR API', { text });
    return external;
  }
}

export async function generateQrCodePngBuffer(text: string): Promise<Buffer> {
  try {
    return await QRCode.toBuffer(text, {
      width: 300,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
      type: 'png',
    });
  } catch (error) {
    logger.error('qrcode buffer generation failed', { error });
    throw error;
  }
}

export function getVerificationUrl(certificateId: string): string {
  return `${env.clientUrl || 'http://localhost:5173'}/certificates/verify/${certificateId}`;
}

export function getQrCodeImageUrl(certificateId: string): string {
  const serverUrl = env.serverUrl || `http://localhost:${env.port || 5000}`;
  return `${serverUrl}/api/v1/student/certificates/verify/${certificateId}/qr.png`;
}
