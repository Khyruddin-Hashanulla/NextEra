import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, Award } from 'lucide-react';

export function MyCoursesPage() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['student', 'my-courses'],
    queryFn: () => studentApi.getMyCourses().then((r: any) => r.data.data),
  });

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">All your enrolled courses</p>
      </div>

      {!courses?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">You are not enrolled in any courses yet.</p>
            <Link to="/courses"><Button>Browse Courses</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((enrollment: any) => (
            <Card key={enrollment._id}>
              <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                {enrollment.course?.thumbnail?.url ? (
                  <img src={enrollment.course.thumbnail.url} alt={enrollment.course.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No thumbnail</div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1 text-base">{enrollment.course?.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${enrollment.completionPercentage || 0}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{enrollment.completionPercentage || 0}%</span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/student/courses/${enrollment.course?._id}/learn`} className="flex-1">
                    <Button className="w-full" size="sm"><PlayCircle className="mr-1 h-4 w-4" /> Continue</Button>
                  </Link>
                  {enrollment.isCompleted && (
                    <Link to={`/student/certificates`}>
                      <Button variant="outline" size="sm"><Award className="h-4 w-4" /></Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
