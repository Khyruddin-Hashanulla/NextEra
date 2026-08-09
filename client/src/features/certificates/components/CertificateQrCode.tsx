import { useState } from 'react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/constants';
import { QrCode } from 'lucide-react';

interface CertificateQrCodeProps {
  certificateId: string;
  qrCodeUrl?: string;
  className?: string;
  alt?: string;
}

function buildApiQrUrl(certificateId: string): string {
  return `${API_BASE_URL}/student/certificates/verify/${encodeURIComponent(certificateId)}/qr.png`;
}

export function CertificateQrCode({ certificateId, qrCodeUrl, className, alt }: CertificateQrCodeProps) {
  const apiUrl = buildApiQrUrl(certificateId);
  const [src, setSrc] = useState(qrCodeUrl || apiUrl);
  const [usedFallback, setUsedFallback] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleLoad = () => {
    setFailed(false);
    setLoaded(true);
  };

  const handleError = () => {
    // Stale records may carry a QR URL from an older server route. Fall back to
    // the canonical endpoint routed through the SPA origin before giving up.
    if (!usedFallback && src !== apiUrl) {
      setUsedFallback(true);
      setLoaded(false);
      setSrc(apiUrl);
      return;
    }
    setLoaded(false);
    setFailed(true);
  };

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`QR code unavailable for certificate ${certificateId}`}
        className={cn(
          'flex flex-col items-center justify-center gap-1 rounded bg-white text-muted-foreground',
          className,
        )}
      >
        <QrCode className="h-5 w-5" />
        <span className="text-[9px] font-medium uppercase tracking-wide">Unavailable</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded bg-white', className)}>
      {!loaded && (
        <div
          className="absolute inset-0 flex animate-pulse items-center justify-center bg-muted/60"
          aria-hidden="true"
        >
          <QrCode className="h-5 w-5 text-muted-foreground/50" />
        </div>
      )}
      <img
        src={src}
        alt={alt ?? `QR code to verify certificate ${certificateId}`}
        className={cn('h-full w-full object-contain', loaded ? 'opacity-100' : 'opacity-0')}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}