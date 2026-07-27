import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { instructorApi } from '@/api/endpoints/instructor';
import { StatCard } from '@/features/admin/components/StatCard';
import { DataTable } from '@/features/admin/components/DataTable';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { BookOpen, DollarSign, GraduationCap, Users, Loader2 } from 'lucide-react';

export function DashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['instructor', 'dashboard'],
    queryFn: () => instructorApi.getDashboard().then((r) => r.data.data),
  });

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <AdminHeader title="Instructor Dashboard" description="Your teaching overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Courses" value={dashboard?.totalCourses || 0} icon={<BookOpen className="h-6 w-6" />} />
        <StatCard title="Published" value={dashboard?.publishedCourses || 0} icon={<BookOpen className="h-6 w-6" />} />
        <StatCard title="Enrollments" value={dashboard?.totalEnrollments || 0} icon={<GraduationCap className="h-6 w-6" />} />
        <StatCard title="Students" value={dashboard?.totalStudents || 0} icon={<Users className="h-6 w-6" />} />
        <StatCard title="Total Revenue" value={`₹${(dashboard?.totalRevenue || 0).toLocaleString()}`} icon={<DollarSign className="h-6 w-6" />} />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Recent Courses</h3>
          <Link to="/instructor/courses" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <DataTable
          columns={[
            { key: 'title', header: 'Title' },
            {
              key: 'status',
              header: 'Status',
              render: (item: any) => (
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  item.status === 'published' ? 'bg-green-50 text-green-700' :
                  item.status === 'review' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'
                }`}>{item.status}</span>
              ),
            },
            { key: 'totalEnrollments', header: 'Enrollments' },
            { key: 'price', header: 'Price', render: (item: any) => `₹${item.price}` },
          ]}
          data={dashboard?.recentCourses || []}
          emptyMessage="No courses yet. Create your first course!"
        />
      </div>
    </div>
  );
}
