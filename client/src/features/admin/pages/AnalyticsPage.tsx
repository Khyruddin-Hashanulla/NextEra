import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { AdminHeader } from '../components/AdminHeader';
import { RevenueChart, UserGrowthChart, RolePieChart, CourseStatusChart } from '../components/Charts';
import { Loader2 } from 'lucide-react';

export function AnalyticsPage() {
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'revenue'],
    queryFn: () => adminApi.getRevenueAnalytics().then((r) => r.data.data),
   });

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'users'],
    queryFn: () => adminApi.getUserAnalytics().then((r) => r.data.data),
   });

  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'courses'],
    queryFn: () => adminApi.getCourseAnalytics().then((r) => r.data.data),
   });

  const isLoading = revenueLoading || userLoading || courseLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Analytics" description="Detailed platform analytics" />

      <div className="grid gap-6">
        <RevenueChart data={revenueData?.daily || []} title="Revenue Over Time" />

        <div className="grid gap-6 lg:grid-cols-2">
          <UserGrowthChart data={userData?.userGrowth || []} />
          <RolePieChart data={userData?.roleDistribution || []} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <CourseStatusChart data={courseData?.courseStats || []} />
          <div>
            <h3 className="mb-3 font-semibold">Top Courses</h3>
            <div className="rounded-lg border divide-y">
              {(courseData?.topCourses || []).slice(0, 5).map((course: any, i: number) => (
                <div key={course._id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">{i + 1}.</span>
                    <div>
                      <p className="text-sm font-medium">{course.title}</p>
                      <p className="text-xs text-muted-foreground">{course.instructor?.name}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">{course.totalEnrollments} enrolled</span>
                </div>
              ))}
              {(!courseData?.topCourses || courseData.topCourses.length === 0) && (
                <p className="p-4 text-sm text-muted-foreground text-center">No courses found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
