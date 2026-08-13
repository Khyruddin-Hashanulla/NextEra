import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { TrendingUp, Users, BookOpen } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export function AnalyticsPage() {
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'revenue'],
    queryFn: ({ signal }) => adminApi.getRevenueAnalytics(undefined, undefined, signal).then((r) => r.data.data),
  });

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'users'],
    queryFn: ({ signal }) => adminApi.getUserAnalytics(signal).then((r) => r.data.data),
  });

  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'courses'],
    queryFn: ({ signal }) => adminApi.getCourseAnalytics(signal).then((r) => r.data.data),
  });

  const isLoading = revenueLoading || userLoading || courseLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-36" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">Detailed platform analytics and reports</p>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="h-5 w-5 text-primary" /> Revenue Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!revenueData?.daily?.length ? (
              <div className="flex flex-col items-center py-12 text-center">
                <TrendingUp className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No revenue data available</p>
              </div>
            ) : (
              <div className="divide-y">
                {revenueData.daily.slice(-14).map((d: any) => (
                  <div key={d._id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-muted-foreground">{new Date(d._id).toLocaleDateString()}</span>
                    <span className="font-medium">₹{d.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-5 w-5 text-blue-600" /> User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!userData?.userGrowth?.length ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Users className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No user growth data</p>
              </div>
            ) : (
              <div className="divide-y">
                {userData.userGrowth.slice(-14).map((d: any) => (
                  <div key={d._id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-muted-foreground">{d._id}</span>
                    <span className="font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-5 w-5 text-purple-600" /> User Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!userData?.roleDistribution?.length ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Users className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No role data</p>
              </div>
            ) : (
              <div className="divide-y">
                {userData.roleDistribution.map((r: any) => (
                  <div key={r._id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium capitalize">{r._id}</span>
                    <span className="font-medium">{r.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BookOpen className="h-5 w-5 text-orange-600" /> Course Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!courseData?.courseStats?.length ? (
              <div className="flex flex-col items-center py-12 text-center">
                <BookOpen className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No course data</p>
              </div>
            ) : (
              <div className="divide-y">
                {courseData.courseStats.map((s: any) => (
                  <div key={s._id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium capitalize">{s._id}</span>
                    <span className="font-medium">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Courses</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!courseData?.topCourses?.length ? (
              <div className="flex flex-col items-center px-4 py-12 text-center">
                <BookOpen className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No courses found</p>
              </div>
            ) : (
              <div className="divide-y">
                {courseData.topCourses.slice(0, 5).map((course: any, i: number) => (
                  <div
                    key={course._id}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{course.title}</p>
                        <p className="text-xs text-muted-foreground">{course.instructor?.name}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">{course.totalEnrollments} enrolled</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
