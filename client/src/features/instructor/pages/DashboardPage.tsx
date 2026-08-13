import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { instructorApi } from '@/api/endpoints/instructor';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import {
  BookOpen,
  DollarSign,
  GraduationCap,
  Users,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
import SubscriptionBadge from '@/components/instructor/SubscriptionBadge';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const statCards = [
  {
    key: 'totalCourses',
    label: 'Total Courses',
    icon: BookOpen,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    key: 'publishedCourses',
    label: 'Published',
    icon: TrendingUp,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    key: 'totalEnrollments',
    label: 'Total Enrollments',
    icon: GraduationCap,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    key: 'totalStudents',
    label: 'Students',
    icon: Users,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  },
];

export function DashboardPage() {
  const { user } = useAuth();

  const { data: dashboard, isLoading, error, refetch } = useQuery({
    queryKey: ['instructor', 'dashboard'],
    queryFn: ({ signal }) => instructorApi.getDashboard(signal).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load dashboard"
        message="We couldn't fetch your dashboard data. Please try again."
        onRetry={refetch}
        showHomeLink={false}
      />
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="mt-1 text-muted-foreground">Your teaching overview</p>
          </div>
          <SubscriptionBadge />
        </div>
        <Link to="/instructor/courses/create">
          <Button>
            <PlusCircle className="mr-1.5 h-4 w-4" />
            New Course
          </Button>
        </Link>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.key} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold tracking-tight">
                  {(dashboard?.[stat.key as keyof typeof dashboard] as number) ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight text-green-600">
              {formatCurrency(dashboard?.totalRevenue ?? 0)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Total earnings from your courses</p>
            <Link
              to="/instructor/revenue"
              className="mt-4 inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              View revenue details <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link
              to="/instructor/courses"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">My Courses</span>
            </Link>
            <Link
              to="/instructor/analytics"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">Analytics</span>
            </Link>
            <Link
              to="/instructor/students"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <Users className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Students</span>
            </Link>
            <Link
              to="/instructor/payouts"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Withdraw</span>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Recent Courses</CardTitle>
            <Link to="/instructor/courses" className="text-xs font-medium text-primary">
              View all <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {!dashboard?.recentCourses?.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <BookOpen className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No courses yet</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link to="/instructor/courses/create">Create your first course</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {dashboard.recentCourses.map((course: any) => (
                  <Link
                    key={course._id}
                    to={`/instructor/courses/${course._id}/edit`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{course.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            course.status === 'published'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : course.status === 'review'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {course.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {course.totalEnrollments || 0} enrollment{course.totalEnrollments !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
