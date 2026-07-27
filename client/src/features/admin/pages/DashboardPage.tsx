import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { AdminHeader } from '../components/AdminHeader';
import { StatCard } from '../components/StatCard';
import { RevenueChart, RolePieChart, CourseStatusChart } from '../components/Charts';
import { Users, BookOpen, DollarSign, GraduationCap, Loader2 } from 'lucide-react';
import { DataTable } from '../components/DataTable';

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard().then((r) => r.data.data),
   });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Dashboard" description="Overview of your platform" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.users?.total || 0}
          icon={<Users className="h-6 w-6" />}
          description={`${stats?.users?.students || 0} students, ${stats?.users?.instructors || 0} instructors`}
        />
        <StatCard
          title="Total Courses"
          value={stats?.courses?.total || 0}
          icon={<BookOpen className="h-6 w-6" />}
          description={`${stats?.courses?.published || 0} published, ${stats?.courses?.pending || 0} pending review`}
        />
        <StatCard
          title="Total Enrollments"
          value={stats?.enrollments || 0}
          icon={<GraduationCap className="h-6 w-6" />}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${(stats?.revenue || 0).toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RevenueChart
          data={[{ _id: 'Total', amount: stats?.revenue || 0 }]}
          title="Revenue Overview"
        />
        <RolePieChart
          data={[
            { _id: 'Students', count: stats?.users?.students || 0 },
            { _id: 'Instructors', count: stats?.users?.instructors || 0 },
            { _id: 'Admins', count: stats?.users?.admins || 0 },
          ]}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-semibold">Recent Users</h3>
          <DataTable
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'email', header: 'Email' },
              {
                key: 'role',
                header: 'Role',
                render: (item: any) => (
                  <span className="capitalize">{item.role}</span>
                ),
              },
            ]}
            data={stats?.recentUsers || []}
            emptyMessage="No recent users"
          />
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Recent Payments</h3>
          <DataTable
            columns={[
              {
                key: 'user',
                header: 'User',
                render: (item: any) => item.user?.name || 'N/A',
              },
              {
                key: 'amount',
                header: 'Amount',
                render: (item: any) => `₹${item.amount}`,
              },
              { key: 'status', header: 'Status' },
            ]}
            data={stats?.recentPayments || []}
            emptyMessage="No recent payments"
          />
        </div>
      </div>
    </div>
  );
}
