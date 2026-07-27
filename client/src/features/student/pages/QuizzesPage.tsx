import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function QuizzesPage() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['student', 'my-courses'],
    queryFn: () => studentApi.getMyCourses().then((r: any) => r.data.data),
  });

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const quizLectures = courses?.flatMap((enrollment: any) => []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Quiz Attempts</h1>
        <p className="text-muted-foreground">Track your quiz performance across courses</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Attempt quizzes from the course player to see your results here.
          <div className="mt-2">
            <Link to="/student/my-courses" className="text-sm text-primary hover:underline">Go to My Courses</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
