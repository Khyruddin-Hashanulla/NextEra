import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { studentApi } from '@/api/endpoints/student';
import { StatCard } from '@/features/admin/components/StatCard';
import { DataTable } from '@/features/admin/components/DataTable';
import { BookOpen, Award, TrendingUp, Loader2, GraduationCap } from 'lucide-react';

export function DashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: () => studentApi.getDashboard().then((r: any) => r.data.data),
  });

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">Track your learning journey</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Enrolled Courses" value={dashboard?.totalCourses || 0} icon={<BookOpen className="h-6 w-6" />} />
        <StatCard title="In Progress" value={dashboard?.inProgress || 0} icon={<TrendingUp className="h-6 w-6" />} />
        <StatCard title="Completed" value={dashboard?.completedCourses || 0} icon={<GraduationCap className="h-6 w-6" />} />
        <StatCard title="Certificates" value={dashboard?.certificates || 0} icon={<Award className="h-6 w-6" />} />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Recent Courses</h3>
          <Link to="/student/my-courses" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <DataTable
          columns={[
            {
              key: 'course',
              header: 'Course',
              render: (item: any) => item.course?.title || 'N/A',
            },
            {
              key: 'completionPercentage',
              header: 'Progress',
              render: (item: any) => (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${item.completionPercentage || 0}%` }} />
                  </div>
                  <span className="text-xs">{item.completionPercentage || 0}%</span>
                </div>
              ),
            },
            {
              key: 'isCompleted',
              header: 'Status',
              render: (item: any) => (
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  item.isCompleted ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                }`}>{item.isCompleted ? 'Completed' : 'In Progress'}</span>
              ),
            },
          ]}
          data={dashboard?.recentCourses || []}
          emptyMessage="You are not enrolled in any courses yet. Browse courses to get started!"
        />
      </div>
    </div>
  );
}
