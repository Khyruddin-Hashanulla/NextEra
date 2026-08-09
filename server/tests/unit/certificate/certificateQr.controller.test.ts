import type { Request, Response, NextFunction } from 'express';
import { getCertificateQr } from '../../../src/controllers/student.controller';
import { studentService } from '../../../src/services/student.service';
import { ApiError } from '../../../src/utils/ApiError';

vi.mock('../../../src/services/student.service', () => ({
  studentService: {
    getCertificateQrImage: vi.fn(),
  },
}));

function setupController() {
  const headerStore: Record<string, string> = {};
  const res = {
    statusCode: 0,
    _body: null,
    setHeader(k: string, v: string) {
      headerStore[k.toLowerCase()] = String(v);
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(body: unknown) {
      this._body = body;
      return this;
    },
  };
  const req = { params: { certificateId: 'NXLMS-2026-CS-000008' } };
  const next: NextFunction = vi.fn();

  return {
    res: res as unknown as Response,
    req: req as unknown as Request,
    next,
    headerStore,
    status: () => res.statusCode,
    body: () => res._body,
  };
}

describe('getCertificateQr controller', () => {
  afterEach(() => vi.clearAllMocks());

  it('responds 200 with a PNG image and a permissive Cross-Origin-Resource-Policy header', async () => {
    vi.mocked(studentService.getCertificateQrImage as never).mockResolvedValue({
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      filename: 'certificate-NXLMS-2026-CS-000008-qr.png',
    });

    const { res, req, next, headerStore, status, body } = setupController();

    await getCertificateQr(req, res, next);

    expect(status()).toBe(200);
    expect(headerStore['content-type']).toBe('image/png');
    expect(headerStore['cross-origin-resource-policy']).toBe('cross-origin');
    expect(headerStore['content-disposition']).toContain('certificate-NXLMS-2026-CS-000008-qr.png');
    expect(body()).toBeInstanceOf(Buffer);
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards service failures (e.g. unknown certificate) to the error handler', async () => {
    const notFound = ApiError.notFound('Certificate not found');
    vi.mocked(studentService.getCertificateQrImage as never).mockRejectedValue(notFound);

    const { res, req, next } = setupController();

    await getCertificateQr(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(notFound);
  });
});