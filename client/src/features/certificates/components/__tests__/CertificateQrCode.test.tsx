import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CertificateQrCode } from '../CertificateQrCode';

const CERT_ID = 'NXLMS-2026-CS-000042';

describe('CertificateQrCode', () => {
  it('renders an image pointing at the canonical API URL when no stored URL is provided', () => {
    render(<CertificateQrCode certificateId={CERT_ID} />);

    const img = screen.getByAltText(`QR code to verify certificate ${CERT_ID}`);
    expect(img).toHaveAttribute('src', `/api/v1/student/certificates/verify/${CERT_ID}/qr.png`);
  });

  it('uses the stored qr code url and reveals the image once it loads', () => {
    render(<CertificateQrCode certificateId={CERT_ID} qrCodeUrl={`https://cdn.example/qr-${CERT_ID}.png`} />);

    const img = screen.getByAltText(`QR code to verify certificate ${CERT_ID}`);
    expect(img).toHaveAttribute('src', `https://cdn.example/qr-${CERT_ID}.png`);

    fireEvent.load(img);
    expect(img).toHaveClass('opacity-100');
  });

  it('falls back to the canonical API endpoint when the stored url fails and then loads', () => {
    const staleUrl = 'https://stale-server.example/api/v1/certificates/verify/NXLMS-2026-CS-000009/qr.png';
    render(<CertificateQrCode certificateId={CERT_ID} qrCodeUrl={staleUrl} />);

    let img = screen.getByAltText(`QR code to verify certificate ${CERT_ID}`);
    expect(img).toHaveAttribute('src', staleUrl);

    fireEvent.error(img);

    img = screen.getByAltText(`QR code to verify certificate ${CERT_ID}`);
    expect(img).toHaveAttribute('src', `/api/v1/student/certificates/verify/${CERT_ID}/qr.png`);

    fireEvent.load(img);
    expect(img).toHaveClass('opacity-100');
  });

  it('shows an unavailable state when the canonical URL also fails', () => {
    render(<CertificateQrCode certificateId={CERT_ID} />);

    const img = screen.getByAltText(`QR code to verify certificate ${CERT_ID}`);
    fireEvent.error(img);

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });
});