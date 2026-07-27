import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AssignmentsPage() {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['student', 'assignments'],
    queryFn: () => studentApi.getAssignments().then((r: any) => r.data.data),
  });

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Assignments</h1>
        <p className="text-muted-foreground">Track your assignment submissions</p>
      </div>

      {!submissions?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No assignments submitted yet.
            <div className="mt-2">
              <Link to="/student/my-courses" className="text-sm text-primary hover:underline">Go to My Courses</Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {submissions.map((sub: any) => (
            <Card key={sub._id}>
              <CardHeader>
                <CardTitle className="text-sm">{sub.lecture?.title || 'Assignment'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  sub.status === 'graded' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                }`}>{sub.status}</div>
                {sub.grade !== undefined && <p className="text-sm">Grade: {sub.grade}/100</p>}
                {sub.feedback && <p className="text-sm text-muted-foreground">Feedback: {sub.feedback}</p>}
                <p className="text-xs text-muted-foreground">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
