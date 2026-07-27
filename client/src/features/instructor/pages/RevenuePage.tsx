import { useQuery } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { StatCard } from '@/features/admin/components/StatCard';
import { DataTable } from '@/features/admin/components/DataTable';
import { DollarSign, TrendingUp, ShoppingCart, Loader2 } from 'lucide-react';

export function RevenuePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'revenue'],
    queryFn: () => instructorApi.getRevenue().then((r) => r.data.data),
  });

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <AdminHeader title="Revenue" description="Your earnings from courses" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Revenue" value={`₹${(data?.total || 0).toLocaleString()}`} icon={<DollarSign className="h-6 w-6" />} />
        <StatCard title="Monthly Revenue" value={`₹${(data?.daily?.slice(-30).reduce((s: number, d: any) => s + d.amount, 0) || 0).toLocaleString()}`} icon={<TrendingUp className="h-6 w-6" />} />
        <StatCard title="Total Sales" value={data?.daily?.reduce((s: number, d: any) => s + d.count, 0) || 0} icon={<ShoppingCart className="h-6 w-6" />} />
      </div>

      {data?.perCourse && data.perCourse.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 font-semibold">Earnings by Course</h3>
          <DataTable
            columns={[
              { key: 'courseTitle', header: 'Course' },
              { key: 'enrollments', header: 'Enrollments' },
              { key: 'amount', header: 'Amount', render: (item: any) => `₹${item.amount.toLocaleString()}` },
            ]}
            data={data.perCourse}
          />
        </div>
      )}
    </div>
  );
}
