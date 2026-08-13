import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CertificateSkeleton } from '@/components/skeletons/CertificateSkeleton';
import { Award, Download, Search, ChevronLeft, ChevronRight, Calendar, BookOpen } from 'lucide-react';

export function CertificatesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-certificates', page],
    queryFn: ({ signal }) => studentApi.getCertificates({ page, limit: 12 }, signal).then((r) => r.data.data),
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
      console.error('Download failed');
    }
  };

  const filtered = data?.certificates?.filter(
    (c) =>
      c.certificateId.toLowerCase().includes(search.toLowerCase()) ||
      c.course?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
            <p className="text-muted-foreground mt-1">View and download your course completion certificates</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search certificates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <CertificateSkeleton />
        ) : !filtered || filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <Award className="h-16 w-16 text-muted-foreground mx-auto" />
              <CardTitle className="text-xl">No certificates yet</CardTitle>
              <p className="text-muted-foreground max-w-md mx-auto">
                Complete a course to earn your certificate of completion
              </p>
              <Button asChild>
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((cert) => (
                <Card key={cert._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base line-clamp-1">{cert.course?.title || 'Course'}</CardTitle>
                        <p className="text-sm text-muted-foreground">{cert.metadata?.instructorName || ''}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        <Award className="h-3 w-3 mr-1 text-primary" />v{cert.version}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      {cert.certificateId}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownload(cert.certificateId)}
                      >
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/certificate/${cert.certificateId}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
