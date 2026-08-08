import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/providers/ToastProvider';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Award, Download, ExternalLink, Shield, Loader2 } from 'lucide-react';
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

  const isLoading = certsLoading || coursesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-[1.4] w-full rounded-t-lg" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">My Certificates</h1>
        <p className="mt-1 text-muted-foreground">Download your course completion certificates</p>
      </motion.div>

      {generatable.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Generate certificates for completed courses</p>
                  <p className="text-xs text-muted-foreground">
                    You have {generatable.length} completed course{generatable.length > 1 ? 's' : ''} without certificates
                  </p>
                </div>
              </div>
            </CardContent>
            <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2">
              {generatable.slice(0, 4).map((enrollment: any) => (
                <div
                  key={enrollment._id}
                  className="flex items-center justify-between rounded-lg border bg-background/50 p-3"
                >
                  <span className="truncate text-sm font-medium">{enrollment.course?.title}</span>
                  <Button
                    size="sm"
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
          </Card>
        </motion.div>
      )}

      {locked.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-muted bg-muted/40">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Certificate Locked</p>
                  <p className="text-xs text-muted-foreground">
                    Your instructor has not finalized this course yet.
                  </p>
                </div>
              </div>
            </CardContent>
            <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2">
              {locked.slice(0, 4).map((enrollment: any) => (
                <div
                  key={enrollment._id}
                  className="flex items-center justify-between rounded-lg border bg-background/50 p-3"
                >
                  <span className="truncate text-sm font-medium">{enrollment.course?.title}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" /> Locked
                  </span>
                </div>
              ))}
            </div>
          </Card>
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
        <motion.div variants={container} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert: Certificate) => (
            <motion.div key={cert._id} variants={item}>
              <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                <div className="relative flex aspect-[1.4] items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-6 dark:from-orange-950/30 dark:to-orange-900/20">
                  <div className="text-center">
                    <Award className="mx-auto h-14 w-14 text-orange-500" />
                    <p className="mt-3 text-xs font-medium uppercase tracking-wider text-orange-600 dark:text-orange-400">
                      Certificate of Completion
                    </p>
                    <p className="mt-2 text-sm font-semibold line-clamp-2">
                      {cert.course?.title}
                    </p>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <CardTitle className="text-xs font-mono text-muted-foreground">
                        {cert.certificateId}
                      </CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {cert.qrCodeUrl && (
                      <OptimizedImage src={cert.qrCodeUrl} alt={`QR Code for ${cert.course?.title || 'certificate'}`} placeholderType="qrcode" className="rounded-lg border" containerClassName="h-12 w-12" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" fullWidth asChild>
                      <Link to={`/certificates/verify/${cert.certificateId}`} target="_blank">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        View
                      </Link>
                    </Button>
                    <Button size="sm" onClick={() => handleDownload(cert.certificateId)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={`/certificates/verify/${cert.certificateId}`} target="_blank">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
