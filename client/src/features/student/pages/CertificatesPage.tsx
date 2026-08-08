import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/providers/ToastProvider';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CertificateDocument } from '@/features/certificates/components/CertificateDocument';
import { Award, Download, ExternalLink, Shield, Loader2, Sparkles, BadgeCheck, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Certificate } from '@/types/student';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export function CertificatesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [preview, setPreview] = useState<Certificate | null>(null);

  const { data: certResult, isLoading: certsLoading } = useQuery({
    queryKey: ['student', 'certificates'],
    queryFn: () => studentApi.getCertificates().then((r) => r.data.data),
  });

  const certificates = certResult?.certificates || [];

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['student', 'my-courses'],
    queryFn: () => studentApi.getMyCourses().then((r: any) => r.data.data),
  });

  const generateMutation = useMutation({
    mutationFn: (courseId: string) => studentApi.generateCertificate(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'certificates'] });
      addToast({ title: 'Certificate generated!', variant: 'success' });
    },
    onError: (err: any) =>
      addToast({
        title: 'Failed',
        description: err?.response?.data?.message || 'Complete the course first',
        variant: 'error',
      }),
  });

  const handleDownload = async (certificateId: string) => {
    try {
      const response = await studentApi.downloadCertificate(certificateId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      addToast({ title: 'Download failed', variant: 'error' });
    }
  };

  const verifyUrl = (cert: Certificate) =>
    cert.verificationUrl || `/certificates/verify/${cert.certificateId}`;

  const isLoading = certsLoading || coursesLoading;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const completedCourses = courses?.filter((e: any) => e.isCompleted) || [];
  const isContentFinalized = (c: any) => (c.course?.contentStatus ?? 'COMPLETED') === 'COMPLETED';
  const uncertifiedCompleted = completedCourses.filter(
    (c: any) => !certificates?.some((cert: Certificate) => cert.course?._id === c.course?._id)
  );
  const generatable = uncertifiedCompleted.filter(isContentFinalized);
  const locked = uncertifiedCompleted.filter((c: any) => !isContentFinalized(c));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div
        variants={item}
        className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent p-6 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Student Dashboard
          </p>
          <h1 className="mt-2 heading-lg">My Certificates</h1>
          <p className="mt-1 text-muted-foreground">
            Your achievements, verified and always accessible.
          </p>
        </div>
        {certificates.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-3 backdrop-blur">
            <BadgeCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold tabular-nums">
                {certificates.filter((cert: Certificate) => cert.status === 'active').length}
                <span className="text-muted-foreground font-normal"> active</span>
              </p>
              <p className="text-xs text-muted-foreground">Verifyable certificates</p>
            </div>
          </div>
        )}
      </motion.div>

      {generatable.length > 0 && (
        <motion.div variants={item} className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Your certificates are ready to claim</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  You have {generatable.length} completed course{generatable.length > 1 ? 's' : ''} without certificates
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/student/my-courses">View courses</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-2 border-t border-primary/10 bg-background/40 px-6 py-4 sm:grid-cols-2">
            {generatable.slice(0, 4).map((enrollment: any) => (
              <div
                key={enrollment._id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
              >
                <span className="truncate text-sm font-medium">{enrollment.course?.title}</span>
                <Button
                  size="sm"
                  className="shrink-0"
                  onClick={() => generateMutation.mutate(enrollment.course?._id)}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Award className="mr-1 h-3 w-3" />
                  )}
                  Generate
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {locked.length > 0 && (
        <motion.div variants={item} className="rounded-2xl border border-muted bg-muted/40 overflow-hidden">
          <div className="flex items-start gap-4 p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Certificates locked</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your instructor has not finalized these courses yet — check back soon.
              </p>
            </div>
          </div>
          <div className="grid gap-2 border-t border-border/60 px-6 py-4 sm:grid-cols-2">
            {locked.slice(0, 4).map((enrollment: any) => (
              <div
                key={enrollment._id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
              >
                <span className="truncate text-sm font-medium">{enrollment.course?.title}</span>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" /> Locked
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!certificates?.length ? (
        <motion.div variants={item}>
          <EmptyState
            icon={<Award className="h-8 w-8" />}
            title="No certificates yet"
            description="Complete a course to earn your certificate"
            action={{ label: 'View My Courses', href: '/student/my-courses' }}
          />
        </motion.div>
      ) : (
        <motion.div variants={container} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {certificates.map((cert: Certificate) => (
            <motion.div key={cert._id} variants={item}>
              <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
                <div className="relative flex aspect-video select-none items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-orange-100 p-6 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-orange-900/10">
                  <div className="absolute inset-3 rounded-xl border border-orange-500/20" />
                  <div className="absolute inset-4 rounded-lg border border-orange-500/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />
                  <div className="relative text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25">
                      <Award className="h-7 w-7" />
                    </div>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-600/80 dark:text-orange-300/80">
                      Certificate of Completion
                    </p>
                    <p className="mx-auto mt-2 line-clamp-2 max-w-[85%] font-semibold text-foreground">
                      {cert.course?.title || 'Course'}
                    </p>
                  </div>
                  {cert.status === 'revoked' && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-destructive/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                      <Shield className="h-3 w-3" /> Revoked
                    </span>
                  )}
                </div>

                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {cert.certificateId}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                      </p>
                      {cert.course?.instructor?.name && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          by {cert.course.instructor.name}
                        </p>
                      )}
                    </div>
                    {cert.qrCodeUrl && (
                      <OptimizedImage
                        src={cert.qrCodeUrl}
                        alt={`QR code for ${cert.course?.title || 'certificate'}`}
                        placeholderType="qrcode"
                        className="rounded-lg border bg-card p-0.5"
                        containerClassName="h-12 w-12 shrink-0"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 border-t border-border/60 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(cert.certificateId)}
                      disabled={cert.status === 'revoked'}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Download
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => setPreview(cert)}>
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      View
                    </Button>
                    <Button size="sm" variant="ghost" asChild aria-label="Verify certificate">
                      <Link to={verifyUrl(cert)} target="_blank">
                        <Shield className="h-4 w-4 text-primary" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="max-w-4xl sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Certificate Preview</DialogTitle>
            <DialogDescription>
              {preview?.course?.title || 'Course completion certificate'}
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <CertificateDocument cert={preview} valid={preview.status === 'active'} />
              <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/certificates/verify/${preview.certificateId}`} target="_blank">
                    <Shield className="mr-1.5 h-3.5 w-3.5" />
                    Verify
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  disabled={preview.status === 'revoked'}
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Print
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDownload(preview.certificateId)}
                  disabled={preview.status === 'revoked'}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}