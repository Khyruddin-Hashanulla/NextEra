import { Link } from 'react-router-dom';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { CheckCircle2, ShieldCheck, Award } from 'lucide-react';
import type { Certificate } from '@/types/student';

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

export function CertificateDocument({ cert, valid = true }: CertificateDocumentProps) {
  const studentName = (cert.user as { name?: string } | undefined)?.name || '';
  const courseTitle = cert.course?.title || '';
  const instructorName = cert.metadata?.instructorName || cert.course?.instructor?.name || '';
  const verificationUrl = cert.verificationUrl || `/certificates/verify/${cert.certificateId}`;

  return (
    <div
      id="certificate-document"
      className={classNames(
        'relative w-full overflow-hidden rounded-sm border border-primary/20 bg-white text-slate-900 shadow-2xl shadow-primary/10',
        'print:shadow-none print:rounded-none print:border-0',
      )}
    >
      <div className="pointer-events-none absolute inset-2.5 rounded-[2px] border border-primary/40 sm:inset-4" aria-hidden="true">
        <div className="absolute inset-[3px] rounded-[1px] border border-primary/15 pointer-events-none" />
      </div>

      {/* Corner decorations */}
      <div aria-hidden="true" className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-primary/60 sm:h-12 sm:w-12" />
      <div aria-hidden="true" className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-primary/60 sm:h-12 sm:w-12" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-primary/60 sm:h-12 sm:w-12" />
      <div aria-hidden="true" className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-primary/60 sm:h-12 sm:w-12" />

      {/* Subtle watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04] print:opacity-[0.04]"
      >
        <Award className="h-[55%] w-auto text-primary" />
      </div>

      <div className="relative flex aspect-[1.414/1] w-full flex-col items-center justify-between px-6 py-6 sm:px-14 sm:py-10">
        {/* Logo / platform banner */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-600 text-sm font-bold text-white shadow-md shadow-primary/25 sm:h-10 sm:w-10">
            N
          </div>
          <span className="text-lg font-bold tracking-tight sm:text-xl">
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">Next</span>
            <span className="text-slate-900">Era</span>
          </span>
          <span className="ml-2 hidden rounded-full border border-primary/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-primary sm:inline-block">
            Learning Platform
          </span>
        </div>

        {/* Avatar status */}
        <div className="absolute right-8 top-6 hidden items-center gap-1 text-xs font-medium sm:inline-flex" aria-hidden="true">
          {valid ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-red-700 ring-1 ring-red-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Not Verified
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
          <p className="text-center text-[9px] font-semibold uppercase tracking-[0.32em] text-primary sm:text-[11px]">
            Certificate of
          </p>
          <h1 className="mt-1 text-center font-display text-2xl font-bold uppercase tracking-[0.08em] text-slate-900 sm:text-4xl">
            Achievement
          </h1>

          <p className="mt-3 max-w-[90%] text-center text-[10px] text-slate-500 sm:mt-4 sm:text-xs">
            This certificate is proudly presented to
          </p>

          {/* Student name */}
          <p className="mt-2 max-w-[95%] text-center font-display text-3xl font-semibold text-primary sm:text-5xl">
            {studentName}
          </p>

          <p className="mt-2 max-w-[90%] text-center text-[10px] text-slate-500 sm:mt-3 sm:text-xs">
            who has successfully completed the course
          </p>

          {/* Course name */}
          <p className="mt-1.5 max-w-[90%] text-center font-display text-lg font-bold text-slate-800 sm:text-2xl">
            {courseTitle}
          </p>

          {cert.metadata?.courseLevel && (
            <p className="mt-1 text-center text-[10px] capitalize text-slate-500 sm:text-xs">
              Level: {cert.metadata.courseLevel.toLowerCase()}
            </p>
          )}
        </div>

        {/* Footer row */}
        <div className="flex w-full items-end justify-between gap-4">
          {/* Issue date + ID */}
          <div className="flex flex-col items-start gap-1">
            <span className="text-[9px] uppercase tracking-[0.16em] text-slate-400 sm:text-[10px]">Issue Date</span>
            <span className="text-[11px] font-semibold text-slate-700 sm:text-sm">
              {formatIssueDate(cert.issuedAt)}
            </span>
            <span className="mt-1 text-[9px] uppercase tracking-[0.16em] text-slate-400 sm:text-[10px]">Certificate ID</span>
            <span className="font-mono text-[10px] font-semibold text-slate-700 sm:text-xs">{cert.certificateId}</span>
          </div>

          {/* Instructor signature */}
          <div className="hidden max-w-[200px] flex-col items-center sm:flex">
            <span className="font-display text-lg italic text-slate-600" aria-hidden="false">
              {instructorName}
            </span>
            <div className="mt-0.5 w-28 border-t border-slate-400" />
            <span className="mt-1 text-[9px] uppercase tracking-[0.14em] text-slate-400">Instructor</span>
          </div>

          {/* QR */}
          <div className="flex flex-col items-end gap-1">
            {cert.qrCodeUrl ? (
              <>
                <OptimizedImage
                  src={cert.qrCodeUrl}
                  alt={`QR code to verify the certificate ${cert.certificateId}`}
                  placeholderType="qrcode"
                  containerClassName="h-14 w-14 shrink-0 rounded bg-white ring-1 ring-primary/20 sm:h-16 sm:w-16"
                  className="rounded"
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