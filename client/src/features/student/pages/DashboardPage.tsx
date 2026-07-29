import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { studentApi } from '@/api/endpoints/student';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen, Award, TrendingUp, GraduationCap, Clock,
  ArrowRight, PlayCircle, ChevronRight, BarChart3,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const statCards = [
  { key: 'totalCourses', label: 'Enrolled Courses', icon: BookOpen, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  { key: 'inProgress', label: 'In Progress', icon: TrendingUp, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' },
  { key: 'completedCourses', label: 'Completed', icon: GraduationCap, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
  { key: 'certificates', label: 'Certificates', icon: Award, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
];

export function DashboardPage() {
  const { user } = useAuth();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: () => studentApi.getDashboard().then((r: any) => r.data.data),
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
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-muted-foreground">Track your learning journey</p>
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
                  {dashboard?.[stat.key as keyof typeof dashboard] ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Continue Learning</CardTitle>
            <Link
              to="/student/my-courses"
              className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              View all <ArrowRight className="ml-0.5 inline h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {!dashboard?.recentCourses?.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <BookOpen className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No courses in progress</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link to="/courses">Browse Courses</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.recentCourses.slice(0, 3).map((enrollment: any) => (
                  <Link
                    key={enrollment._id}
                    to={enrollment.isCompleted ? '/student/certificates' : `/student/courses/${enrollment.course?._id}/learn`}
                    className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {enrollment.isCompleted ? <Award className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary">
                        {enrollment.course?.title || 'Untitled Course'}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${enrollment.completionPercentage || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {enrollment.completionPercentage || 0}%
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Quick Stats</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-primary">{dashboard?.totalCourses || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Total Enrolled</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{dashboard?.completedCourses || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{dashboard?.inProgress || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">In Progress</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{dashboard?.certificates || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Certificates</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Keep learning to reach your goals!
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
