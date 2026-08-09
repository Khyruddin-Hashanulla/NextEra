import { studentService } from '../../../src/services/student.service';
import { Certificate } from '../../../src/models/certificate.model';
import { ApiError } from '../../../src/utils/ApiError';
import { generateQrCodePngBuffer, getVerificationUrl } from '../../../src/utils/certificate';

vi.mock('../../../src/models/certificate.model', () => ({
  Certificate: { findOne: vi.fn() },
}));

vi.mock('../../../src/utils/certificate', () => ({
  generateCertificateSignature: vi.fn(),
  generateQrCodeDataUrl: vi.fn(),
  generateQrCodePngBuffer: vi.fn(),
  getQrCodeImageUrl: vi.fn(),
  verifyCertificateSignature: vi.fn(),
  getVerificationUrl: vi.fn(),
}));

function mockQuery(value: unknown) {
  return { lean: vi.fn().mockResolvedValue(value) };
}

describe('StudentService.getCertificateQrImage', () => {
  afterEach(() => vi.clearAllMocks());

  it('returns a PNG buffer and a descriptive filename for an existing certificate', async () => {
    vi.mocked(Certificate.findOne as never).mockReturnValue(
      mockQuery({
        certificateId: 'NXLMS-2026-CS-000008',
        verificationUrl: 'http://localhost:5173/certificates/verify/NXLMS-2026-CS-000008',
      }) as never,
    );
    vi.mocked(generateQrCodePngBuffer).mockResolvedValue(Buffer.from('png-bytes'));

    const result = await studentService.getCertificateQrImage('NXLMS-2026-CS-000008');

    expect(result.buffer).toEqual(Buffer.from('png-bytes'));
    expect(result.filename).toBe('certificate-NXLMS-2026-CS-000008-qr.png');
  });

  it('encodes the canonical verification URL (derived from the current client origin) into the QR', async () => {
    vi.mocked(Certificate.findOne as never).mockReturnValue(
      mockQuery({ certificateId: 'NXLMS-2026-CS-000008' }) as never,
    );
    vi.mocked(generateQrCodePngBuffer).mockResolvedValue(Buffer.from('png-bytes'));
    vi.mocked(getVerificationUrl).mockReturnValue(
      'http://localhost:5173/certificates/verify/NXLMS-2026-CS-000008',
    );

    await studentService.getCertificateQrImage('NXLMS-2026-CS-000008');

    expect(getVerificationUrl).toHaveBeenCalledWith('NXLMS-2026-CS-000008');
    expect(generateQrCodePngBuffer).toHaveBeenCalledWith(
      'http://localhost:5173/certificates/verify/NXLMS-2026-CS-000008',
    );
  });

  it('throws a not-found error when the certificate does not exist', async () => {
    vi.mocked(Certificate.findOne as never).mockReturnValue(mockQuery(null) as never);

    await expect(studentService.getCertificateQrImage('MISSING-000001')).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(studentService.getCertificateQrImage('MISSING-000001')).rejects.toBeInstanceOf(ApiError);
    expect(generateQrCodePngBuffer).not.toHaveBeenCalled();
  });
});