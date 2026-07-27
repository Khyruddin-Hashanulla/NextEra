import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, XCircle, Award, User, BookOpen, Calendar, Fingerprint, Shield, ExternalLink } from 'lucide-react';

export function CertificateVerifyPage() {
  const { certificateId } = useParams<{ certificateId: string }>();

  const { data: certData, isLoading, error } = useQuery({
    queryKey: ['certificate-verify', certificateId],
    queryFn: () => studentApi.verifyCertificate(certificateId!).then(r => r.data),
    enabled: !!certificateId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !certData) {
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

  const cert = certData as any;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card className="border-2 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            {cert.signatureValid ? (
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
          <Badge variant={cert.signatureValid ? 'default' : 'destructive'} className="mt-2">
            {cert.signatureValid ? 'Verified' : 'Invalid Signature'}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Student</p>
                <p className="font-medium">{cert.user?.name || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Course</p>
                <p className="font-medium">{cert.course?.title || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Issued On</p>
                <p className="font-medium">
                  {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric',
                  }) : 'N/A'}
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
                <p className="text-xs text-muted-foreground">Digital Signature Status</p>
                <p className={`font-medium ${cert.signatureValid ? 'text-green-600' : 'text-red-600'}`}>
                  {cert.signatureValid ? 'Authentic — Certificate has not been tampered with' : 'Invalid — Certificate may have been altered'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {cert.qrCodeUrl && (
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">Scan QR to verify</p>
              <div className="inline-block border rounded-lg p-2 bg-white">
                <img src={cert.qrCodeUrl} alt="Verification QR Code" className="w-32 h-32 mx-auto" />
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/">Home</Link>
            </Button>
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
  );
}
