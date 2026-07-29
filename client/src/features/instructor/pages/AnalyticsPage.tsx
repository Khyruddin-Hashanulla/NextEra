import { useQuery } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Users, GraduationCap, DollarSign, Star, BookOpen, TrendingUp } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const statCards = [
  { key: 'totalStudents', label: 'Total Students', icon: Users, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  { key: 'totalEnrollments', label: 'Total Enrollments', icon: GraduationCap, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: DollarSign, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400', prefix: '₹' },
  { key: 'averageRating', label: 'Average Rating', icon: Star, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { key: 'totalCourses', label: 'Total Courses', icon: BookOpen, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' },
];

export function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'analytics'],
    queryFn: () => instructorApi.getAnalytics().then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64" /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">Comprehensive instructor analytics</p>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          let value: string | number = 0;
          if (stat.key === 'totalStudents') value = data?.totalStudents || 0;
          else if (stat.key === 'totalEnrollments') value = data?.totalEnrollments || 0;
          else if (stat.key === 'totalRevenue') value = `${stat.prefix || ''}${(data?.totalRevenue || 0).toLocaleString()}`;
          else if (stat.key === 'averageRating') value = (data?.averageRating || 0).toFixed(1);
          else if (stat.key === 'totalCourses') value = data?.totalCourses || 0;
          return (
            <Card key={stat.key} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold tracking-tight">{value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {data?.enrollmentTrend && data.enrollmentTrend.length > 0 && (
        <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <TrendingUp className="h-5 w-5 text-primary" /> Enrollment Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {data.enrollmentTrend.map((d: any) => (
                  <div key={d._id} className="flex items-center justify-between py-3">
                    <span className="text-sm text-muted-foreground">{d._id}</span>
                    <span className="font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <DollarSign className="h-5 w-5 text-green-600" /> Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {data.revenueTrend.map((d: any) => (
                  <div key={d._id} className="flex items-center justify-between py-3">
                    <span className="text-sm text-muted-foreground">{d._id}</span>
                    <span className="font-medium">₹{d.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {data?.topCourses && data.topCourses.length > 0 && (
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Top Courses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {data.topCourses.map((course: any, i: number) => (
                  <div key={course._id} className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {i + 1}
                      </span>
                      <span className="font-medium">{course.title}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>{course.enrollments} enrollments</span>
                      <span>₹{course.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
