import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CertificateVerifySkeleton } from '@/components/skeletons/CertificateSkeleton';
import {
  CheckCircle2,
  XCircle,
  Award,
  User,
  BookOpen,
  Calendar,
  Fingerprint,
  Shield,
  ExternalLink,
  Download,
  Printer,
  Link2,
  Check,
} from 'lucide-react';
import { CertificateDocument } from '@/features/certificates/components/CertificateDocument';
import { CertificateQrCode } from '@/features/certificates/components/CertificateQrCode';
import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';

export function CertificateVerifyPage() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  const {
    data: cert,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['certificate-verify', certificateId],
    queryFn: ({ signal }) => studentApi.verifyCertificate(certificateId!, signal).then((r) => r.data.data),
    enabled: !!certificateId,
  });

  const handleDownload = async () => {
    if (!cert?.certificateId) return;
    try {
      const response = await studentApi.downloadCertificate(cert.certificateId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${cert.certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyUrl = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      addToast({ title: 'Verification link copied', variant: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({ title: 'Could not copy link', variant: 'error' });
    }
  };

  if (isLoading) {
    return <CertificateVerifySkeleton />;
  }

  if (error || !cert) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <XCircle className="h-16 w-16 text-red-400 mx-auto" />
        <h1 className="text-2xl font-bold">Certificate Not Found</h1>
        <p className="text-muted-foreground">
          This certificate could not be verified. The certificate ID may be invalid or the certificate has been revoked.
        </p>
        <Button asChild variant="link">
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  const isValid = cert.signatureValid && !cert.isRevoked;

  return (
    <div className="w-full px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Certificate preview */}
        <section aria-label="Certificate" className="print:mb-0 print:!m-0">
          <CertificateDocument cert={cert} valid={isValid} />
        </section>

        <Card className="border-2 shadow-lg print:hidden">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4">
              {isValid ? (
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Certificate of Completion</CardTitle>
            </div>
            <Badge variant={isValid ? 'default' : 'destructive'} className="mt-2">
              {isValid ? 'Verified' : cert.isRevoked ? 'Revoked' : 'Invalid Signature'}
            </Badge>
            {cert.isRevoked && cert.revokedReason && (
              <p className="text-sm text-red-500 mt-2">Reason: {cert.revokedReason}</p>
            )}
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Student</p>
                  <p className="font-medium">{(cert.user as any)?.name || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Course</p>
                  <p className="font-medium">{cert.course?.title || 'N/A'}</p>
                </div>
              </div>

              {cert.metadata?.courseLevel && (
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Level</p>
                    <p className="font-medium capitalize">{cert.metadata.courseLevel}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Issued On</p>
                  <p className="font-medium">
                    {cert.issuedAt
                      ? new Date(cert.issuedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Certificate ID</p>
                  <p className="font-mono text-sm">{cert.certificateId}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Digital Signature</p>
                  <p className={`font-medium ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {isValid
                      ? 'Authentic — Certificate has not been tampered with'
                      : cert.isRevoked
                        ? 'Certificate has been revoked'
                        : 'Invalid — Certificate may have been altered'}
                  </p>
                </div>
              </div>

              {cert.version > 1 && (
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Version</p>
                    <p className="font-medium">v{cert.version}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {cert.qrCodeUrl && (
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">Scan QR to verify</p>
                <div className="inline-block border rounded-lg p-2 bg-white">
                  <CertificateQrCode
                    certificateId={cert.certificateId}
                    qrCodeUrl={cert.qrCodeUrl}
                    alt="Verification QR Code"
                    className="w-32 h-32"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/">Home</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyUrl} aria-label="Copy verification link">
                {copied ? <Check className="h-4 w-4 mr-1 text-green-600" /> : <Link2 className="h-4 w-4 mr-1" />}
                {copied ? 'Copied' : 'Copy Link'}
              </Button>
              {isValid && (
                <Button variant="default" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" /> Download PDF
                </Button>
              )}
              {cert.certificateUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" /> View Certificate
                  </a>
                </Button>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              This certificate verification is provided by NextEra Learning Platform
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
