import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { CertificateDocument } from '../CertificateDocument';
import type { Certificate } from '@/types/student';

function makeCert(
  overrides: Partial<Omit<Certificate, 'qrCodeUrl'>> & { qrCodeUrl?: string | undefined } = {}
): Certificate {
  return {
    _id: 'cert1',
    user: { _id: 'user-1', name: 'Kharnisha Hashanulla', email: 'kharnisha@example.com' },
    course: {
      _id: 'course-1',
      title: 'Computer Science fundamentals',
      instructor: { _id: 'instructor-1', name: 'Sofia Williams' },
    },
    certificateId: 'NXLMS-2026-CS-000042',
    verificationUrl: 'http://localhost:5173/certificates/verify/NXLMS-2026-CS-000042',
    qrCodeUrl: 'http://localhost:4053/api/v1/student/certificates/verify/NXLMS-2026-CS-000042/qr.png',
    certificateUrl: 'https://example.com/cert.pdf',
    status: 'active',
    version: 1,
    metadata: {
      categoryName: 'Development',
      courseDuration: 1200,
      courseLevel: 'Beginner',
      instructorName: 'Sofia Williams',
    },
    issuedAt: '2026-08-08T00:00:00.000Z',
    ...overrides,
  };
}

describe('CertificateDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the certificate details, course title, level badge and issue date', () => {
    renderWithProviders(<CertificateDocument cert={makeCert()} valid />);

    expect(screen.getByText('Certificate of')).toBeInTheDocument();
    expect(screen.getByText('Achievement')).toBeInTheDocument();
    expect(screen.getByText('Kharnisha Hashanulla')).toBeInTheDocument();
    expect(screen.getByText('Computer Science fundamentals')).toBeInTheDocument();
    expect(screen.getByText('beginner level')).toBeInTheDocument();
    expect(screen.getByText('Sofia Williams')).toBeInTheDocument();
    expect(screen.getByText('NXLMS-2026-CS-000042')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('shows a “Not Verified” badge when the certificate is invalid', () => {
    renderWithProviders(<CertificateDocument cert={makeCert()} valid={false} />);

    expect(screen.getByText('Not Verified')).toBeInTheDocument();
  });

  it('renders the QR via the shared component and reveals it once the image loads', () => {
    renderWithProviders(<CertificateDocument cert={makeCert()} />);

    const img = screen.getByAltText('QR code to verify the certificate NXLMS-2026-CS-000042');
    expect(img).toHaveAttribute(
      'src',
      'http://localhost:4053/api/v1/student/certificates/verify/NXLMS-2026-CS-000042/qr.png'
    );
    fireEvent.load(img);
    expect(img).toHaveClass('opacity-100');
  });

  it('shows a scan-to-verify caption when a qr code url is available', () => {
    renderWithProviders(<CertificateDocument cert={makeCert()} />);

    expect(screen.getByText('Scan to verify')).toBeInTheDocument();
  });

  it('falls back to a verify-online link when no qr code url is stored', () => {
    renderWithProviders(<CertificateDocument cert={makeCert({ qrCodeUrl: undefined, verificationUrl: undefined })} />);

    expect(screen.getByRole('link', { name: 'Verify Online' })).toHaveAttribute(
      'href',
      '/certificates/verify/NXLMS-2026-CS-000042'
    );
  });
});
