import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/providers/ToastProvider';
import { Loader2, Award, Download, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CertificatesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['student', 'certificates'],
    queryFn: () => studentApi.getCertificates().then((r: any) => r.data.data),
  });

  const { data: courses } = useQuery({
    queryKey: ['student', 'my-courses'],
    queryFn: () => studentApi.getMyCourses().then((r: any) => r.data.data),
  });

  const generateMutation = useMutation({
    mutationFn: (courseId: string) => studentApi.generateCertificate(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'certificates'] });
      addToast({ title: 'Certificate generated!', variant: 'success' });
    },
    onError: (err: any) => addToast({
      title: 'Failed',
      description: err?.response?.data?.message || 'Complete the course first',
      variant: 'error',
    }),
  });

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const completedCourses = courses?.filter((e: any) => e.isCompleted) || [];
  const hasUncertified = completedCourses.some((c: any) => !certificates?.some((cert: any) => cert.course?._id === c.course?._id));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Certificates</h1>
        <p className="text-muted-foreground">Download your course completion certificates</p>
      </div>

      {hasUncertified && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium">Generate certificates for completed courses</p>
              <p className="text-xs text-muted-foreground">You have completed courses that don't have certificates yet.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!certificates?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No certificates yet. Complete a course to earn your certificate!
            <div className="mt-2">
              <Link to="/student/my-courses" className="text-sm text-primary hover:underline">View My Courses</Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert: any) => (
            <Card key={cert._id} className="overflow-hidden">
              <div className="flex aspect-[1.4] items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-6">
                <div className="text-center">
                  <Award className="mx-auto h-12 w-12 text-orange-500" />
                  <p className="mt-2 text-xs font-medium text-orange-600">Certificate of Completion</p>
                  <p className="mt-1 text-sm font-semibold line-clamp-2">{cert.course?.title}</p>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs text-muted-foreground">{cert.certificateId}</CardTitle>
                  {cert.qrCodeUrl && <img src={cert.qrCodeUrl} alt="QR" className="h-10 w-10" />}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Issued: {new Date(cert.issuedAt).toLocaleDateString()}</p>
                <div className="mt-2 flex gap-2">
                  <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full"><ExternalLink className="mr-1 h-3 w-3" /> View</Button>
                  </a>
                  <a href={`/api/v1/student/certificates/${cert.course?._id}/download`} download>
                    <Button size="sm" variant="outline"><Download className="h-3 w-3" /></Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {completedCourses.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-semibold">Completed Courses</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {completedCourses.filter((c: any) => !certificates?.some((cert: any) => cert.course?._id === c.course?._id)).map((enrollment: any) => (
              <Card key={enrollment._id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-medium">{enrollment.course?.title}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <Button size="sm" onClick={() => generateMutation.mutate(enrollment.course?._id)}>
                    <Award className="mr-1 h-4 w-4" /> Get Certificate
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
