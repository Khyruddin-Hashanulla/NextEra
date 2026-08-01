import crypto from 'crypto';
import QRCode from 'qrcode';
import { env } from '../config/env';

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
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
  }
}

export function getVerificationUrl(certificateId: string): string {
  return `${env.clientUrl || 'http://localhost:5173'}/verify-certificate/${certificateId}`;
}
