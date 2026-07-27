import { useQuery } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { StatCard } from '@/features/admin/components/StatCard';
import { Loader2, Users, GraduationCap, DollarSign, Star, BookOpen } from 'lucide-react';

export function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'analytics'],
    queryFn: () => instructorApi.getAnalytics().then((r) => r.data.data),
  });

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <AdminHeader title="Analytics" description="Comprehensive instructor analytics" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Students" value={data?.totalStudents || 0} icon={<Users className="h-6 w-6" />} />
        <StatCard title="Total Enrollments" value={data?.totalEnrollments || 0} icon={<GraduationCap className="h-6 w-6" />} />
        <StatCard title="Total Revenue" value={`₹${(data?.totalRevenue || 0).toLocaleString()}`} icon={<DollarSign className="h-6 w-6" />} />
        <StatCard title="Average Rating" value={(data?.averageRating || 0).toFixed(1)} icon={<Star className="h-6 w-6" />} />
        <StatCard title="Total Courses" value={data?.totalCourses || 0} icon={<BookOpen className="h-6 w-6" />} />
      </div>

      {data?.enrollmentTrend && data.enrollmentTrend.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 font-semibold">Enrollment Trend</h3>
          <div className="rounded-lg border p-4">
            {data.enrollmentTrend.map((d: any) => (
              <div key={d._id} className="flex items-center justify-between border-b py-2 last:border-0">
                <span className="text-sm text-muted-foreground">{d._id}</span>
                <span className="font-medium">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.revenueTrend && data.revenueTrend.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 font-semibold">Revenue Trend</h3>
          <div className="rounded-lg border p-4">
            {data.revenueTrend.map((d: any) => (
              <div key={d._id} className="flex items-center justify-between border-b py-2 last:border-0">
                <span className="text-sm text-muted-foreground">{d._id}</span>
                <span className="font-medium">₹{d.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="mb-3 font-semibold">Top Courses</h3>
        <div className="rounded-lg border">
          {data?.topCourses?.map((course: any, i: number) => (
            <div key={course._id} className="flex items-center justify-between border-b px-4 py-3 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm">#{i + 1}</span>
                <span className="font-medium">{course.title}</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>{course.enrollments} enrollments</span>
                <span>₹{course.revenue.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
