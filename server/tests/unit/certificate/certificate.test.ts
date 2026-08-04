import QRCode from 'qrcode';
import {
  generateCertificateSignature,
  verifyCertificateSignature,
  generateQrCodeDataUrl,
  getVerificationUrl,
} from '../../../src/utils/certificate';
import { env } from '../../../src/config/env';

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn() },
}));

const payload = {
  certificateId: 'NXLMS-2026-CS-000001',
  userId: '507f1f77bcf86cd799439011',
  courseId: '507f1f77bcf86cd799439012',
  issuedAt: '2026-08-02T00:00:00.000Z',
  version: 1,
};

describe('generateCertificateSignature', () => {
  it('produces a 64-char hex HMAC-SHA256 signature', () => {
    const sig = generateCertificateSignature(payload);
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic for identical payloads', () => {
    expect(generateCertificateSignature(payload)).toBe(generateCertificateSignature(payload));
  });

  it('changes when any payload field changes', () => {
    const base = generateCertificateSignature(payload);
    expect(generateCertificateSignature({ ...payload, version: 2 })).not.toBe(base);
    expect(generateCertificateSignature({ ...payload, certificateId: 'x' })).not.toBe(base);
    expect(generateCertificateSignature({ ...payload, userId: 'y' })).not.toBe(base);
  });

  it('includes the version in the signed payload', () => {
    const v1 = generateCertificateSignature({ ...payload, version: 1 });
    const v2 = generateCertificateSignature({ ...payload, version: 2 });
    expect(v1).not.toBe(v2);
  });

  it('falls back to a default secret when none is configured', () => {
    const original = env.certificateSecret;
    (env as any).certificateSecret = '';
    try {
      const sig = generateCertificateSignature(payload);
      expect(sig).toMatch(/^[a-f0-9]{64}$/);
    } finally {
      (env as any).certificateSecret = original;
    }
  });
});

describe('verifyCertificateSignature', () => {
  it('accepts a valid signature', () => {
    const sig = generateCertificateSignature(payload);
    expect(verifyCertificateSignature(payload, sig)).toBe(true);
  });

  it('rejects a tampered signature', () => {
    const sig = generateCertificateSignature(payload);
    const flipped = (sig[0] === 'a' ? 'b' : 'a') + sig.slice(1);
    expect(verifyCertificateSignature(payload, flipped)).toBe(false);
  });

  it('rejects a signature with a different length', () => {
    expect(verifyCertificateSignature(payload, 'short')).toBe(false);
    expect(verifyCertificateSignature(payload, '')).toBe(false);
  });

  it('rejects signatures produced for different data', () => {
    const otherSig = generateCertificateSignature({ ...payload, certificateId: 'NXLMS-2026-CS-000002' });
    expect(verifyCertificateSignature(payload, otherSig)).toBe(false);
  });
});

describe('generateQrCodeDataUrl', () => {
  beforeEach(() => {
    vi.mocked(QRCode.toDataURL).mockReset();
  });

  it('returns the qrcode data URL on success', async () => {
    vi.mocked(QRCode.toDataURL).mockResolvedValue('data:image/png;base64,abc');
    await expect(generateQrCodeDataUrl('https://example.com')).resolves.toBe('data:image/png;base64,abc');
  });

  it('falls back to the external QR API when qrcode fails', async () => {
    vi.mocked(QRCode.toDataURL).mockRejectedValue(new Error('failed'));
    const url = await generateQrCodeDataUrl('hello world');
    expect(url).toContain('api.qrserver.com');
    expect(url).toContain(encodeURIComponent('hello world'));
  });

  it('passes sizing options to qrcode', async () => {
    vi.mocked(QRCode.toDataURL).mockResolvedValue('data:image/png;base64,abc');
    await generateQrCodeDataUrl('text');
    expect(vi.mocked(QRCode.toDataURL)).toHaveBeenCalledWith(
      'text',
      expect.objectContaining({ width: 300 }),
    );
  });
});

describe('getVerificationUrl', () => {
  it('builds a verification URL containing the certificate id', () => {
    const url = getVerificationUrl('NXLMS-2026-CS-000001');
    expect(url).toMatch(/https?:\/\/.+\/verify-certificate\/NXLMS-2026-CS-000001$/);
  });

  it('falls back to the local default when clientUrl is not set', () => {
    const original = env.clientUrl;
    (env as any).clientUrl = '';
    try {
      const url = getVerificationUrl('NXLMS-2026-CS-000001');
      expect(url).toBe('http://localhost:5173/verify-certificate/NXLMS-2026-CS-000001');
    } finally {
      (env as any).clientUrl = original;
    }
  });
});
