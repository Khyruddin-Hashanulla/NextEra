import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import type { Certificate } from '@/types/student';
import { CertificateQrCode } from '@/features/certificates/components/CertificateQrCode';

interface CertificateDocumentProps {
  cert: Certificate;
  valid?: boolean;
}

function formatIssueDate(date: string | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function classNames(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

function gradientBorder(): string {
  return 'rounded-sm border-2 border-transparent [background:linear-gradient(#ffffff,#ffffff)_padding-box,linear-gradient(135deg,#f97316,#ec4899_55%,#8b5cf6)_border-box]';
}

export function CertificateDocument({ cert, valid = true }: CertificateDocumentProps) {
  const studentName = (cert.user as { name?: string } | undefined)?.name || '';
  const courseTitle = cert.course?.title || '';
  const instructorName = cert.metadata?.instructorName || cert.course?.instructor?.name || '';
  const verificationUrl = cert.verificationUrl || `/certificates/verify/${cert.certificateId}`;
  const level = cert.metadata?.courseLevel ? cert.metadata.courseLevel.toLowerCase() : '';
  const issuedDate = formatIssueDate(cert.issuedAt);

  return (
    <div
      id="certificate-document"
      className={classNames(
        'relative aspect-[1.414/1] w-full overflow-hidden rounded-sm bg-white text-slate-900 shadow-2xl shadow-primary/10',
        'print:shadow-none print:rounded-none print:border-0'
      )}
    >
      {/* Gradient border */}
      <div aria-hidden="true" className={classNames(gradientBorder(), 'absolute inset-0')} />

      <div className="relative m-1.5 flex h-[calc(100%-12px)] flex-col overflow-hidden rounded-[2px] bg-white sm:m-2 sm:h-[calc(100%-16px)]">
        {/* Decorative gradient curves */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {/* Top-left orange glow */}
          <div
            className="absolute -left-20 -top-24 h-72 w-96 rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(253,186,116,0.5), rgba(253,186,116,0))' }}
          />
          <div
            className="absolute -left-10 -top-16 h-48 w-64 rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(236,72,153,0.28), rgba(236,72,153,0))' }}
          />
          {/* Bottom-right purple glow */}
          <div
            className="absolute -bottom-24 -right-20 h-80 w-[28rem] rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(167,139,250,0.42), rgba(167,139,250,0))' }}
          />
          <div
            className="absolute -bottom-16 -right-12 h-56 w-72 rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(139,92,246,0.28), rgba(139,92,246,0))' }}
          />
        </div>

        {/* Header */}
        <div className="relative flex shrink-0 items-start justify-between px-8 pt-6 sm:px-12 sm:pt-7">
          <div className="flex items-center gap-3">
            <img
              src="/images/NextEra.png"
              alt="NextEra logo"
              className="h-10 w-10 rounded-md object-cover sm:h-12 sm:w-12"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">NextEra</span>
              <span className="text-[9px] font-medium uppercase tracking-[0.28em] text-slate-400 sm:text-[10px]">
                Learning Platform
              </span>
            </div>
          </div>

          {/* Verified badge */}
          <div className="flex flex-col items-center gap-0.5">
            <div
              className={classNames(
                'flex items-center gap-1.5 rounded-full border-2 bg-white px-3 py-1 text-[11px] font-bold sm:px-3.5 sm:py-1 sm:text-xs',
                valid ? 'border-primary text-primary' : 'border-red-400 text-red-600'
              )}
            >
              {valid ? <ShieldCheck className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {valid ? 'Verified' : 'Not Verified'}
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative flex flex-1 flex-col items-center px-6 pt-5 text-center sm:px-14 sm:pt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary sm:text-xs">Certificate of</p>
          <h1 className="mt-1 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 bg-clip-text text-3xl font-bold uppercase tracking-[0.06em] text-transparent sm:text-5xl">
            Achievement
          </h1>
          <div className="mt-2 h-1 w-40 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 sm:mt-3 sm:w-56" />

          <p className="mt-3 text-[10px] text-slate-500 sm:mt-4 sm:text-xs">This certificate is proudly presented to</p>

          {/* Student name */}
          <p className="mt-2 max-w-[95%] font-display text-3xl font-semibold italic text-slate-900 sm:text-5xl">
            {studentName}
          </p>
          <div className="mt-1 h-[2px] w-40 rounded-full bg-primary sm:w-56" />

          <p className="mt-3 text-[10px] text-slate-500 sm:mt-4 sm:text-xs">
            who has successfully completed the course
          </p>

          {/* Course name */}
          <p className="mt-1.5 max-w-[90%] text-lg font-bold text-slate-800 sm:text-2xl">{courseTitle}</p>

          {/* Level badge */}
          {level && (
            <span className="mt-3 inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-violet-500 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:mt-4 sm:text-[11px]">
              {level} level
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="relative flex w-full shrink-0 items-end justify-between gap-4 px-8 pb-6 sm:px-12 sm:pb-7">
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[9px] uppercase tracking-[0.16em] text-slate-400 sm:text-[10px]">Issue Date</span>
            <span className="text-[11px] font-semibold text-slate-700 sm:text-sm">{issuedDate}</span>
            <span className="mt-1 text-[9px] uppercase tracking-[0.16em] text-slate-400 sm:text-[10px]">
              Certificate ID
            </span>
            <span className="font-mono text-[10px] font-semibold text-slate-700 sm:text-xs">{cert.certificateId}</span>
          </div>

          {/* Instructor signature */}
          <div className="hidden max-w-[200px] flex-col items-center sm:flex">
            <span className="font-display text-lg italic text-slate-600">{instructorName}</span>
            <div className="mt-0.5 w-28 border-t border-slate-400" />
            <span className="mt-1 text-[9px] uppercase tracking-[0.14em] text-slate-400">Instructor</span>
          </div>

          {/* QR */}
          <div className="flex flex-col items-end gap-1">
            {cert.qrCodeUrl ? (
              <>
                <CertificateQrCode
                  certificateId={cert.certificateId}
                  qrCodeUrl={cert.qrCodeUrl}
                  alt={`QR code to verify the certificate ${cert.certificateId}`}
                  className="h-16 w-16 ring-1 ring-slate-200 sm:h-20 sm:w-20"
                />
                <span className="text-[9px] uppercase tracking-[0.14em] text-slate-400">Scan to verify</span>
              </>
            ) : (
              <Link
                to={verificationUrl}
                className="rounded bg-primary/10 px-2 py-1 text-[9px] font-semibold text-primary"
              >
                Verify Online
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
