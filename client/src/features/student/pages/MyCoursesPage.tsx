import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { BookOpen, PlayCircle, Award, Clock, Filter, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'in-progress' | 'completed';

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All Courses' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function MyCoursesPage() {
  const [filter, setFilter] = useState<FilterTab>('all');

  const { data: courses, isLoading } = useQuery({
    queryKey: ['student', 'my-courses'],
    queryFn: () => studentApi.getMyCourses().then((r: any) => r.data.data),
  });

  const filtered = courses?.filter((e: any) => {
    if (filter === 'in-progress') return !e.isCompleted;
    if (filter === 'completed') return e.isCompleted;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-28 rounded-lg" />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-0"><Skeleton className="aspect-video w-full rounded-t-lg" /><div className="space-y-2 p-4"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-2 w-full" /></div></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={cardItem}>
        <h1 className="text-2xl font-bold tracking-tight">My Learning</h1>
        <p className="mt-1 text-muted-foreground">All your enrolled courses</p>
      </motion.div>

      <motion.div variants={cardItem} className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              filter === tab.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {tab.label}
            {tab.key === 'in-progress' && courses?.filter((e: any) => !e.isCompleted).length ? (
              <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-xs">
                {courses.filter((e: any) => !e.isCompleted).length}
              </span>
            ) : null}
            {tab.key === 'completed' && courses?.filter((e: any) => e.isCompleted).length ? (
              <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-xs">
                {courses.filter((e: any) => e.isCompleted).length}
              </span>
            ) : null}
          </button>
        ))}
      </motion.div>

      {!filtered?.length ? (
        <motion.div variants={cardItem}>
          <EmptyState
            icon={<BookOpen className="h-8 w-8" />}
            title={filter === 'completed' ? 'No completed courses yet' : 'No courses in progress'}
            description={filter === 'all' ? 'You are not enrolled in any courses yet.' : undefined}
            action={filter === 'all' ? { label: 'Browse Courses', href: '/courses' } : undefined}
          />
        </motion.div>
      ) : (
        <motion.div variants={container} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((enrollment: any) => (
            <motion.div key={enrollment._id} variants={cardItem}>
              <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                <Link to={`/student/courses/${enrollment.course?._id}/learn`}>
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {enrollment.course?.thumbnail?.url ? (
                      <OptimizedImage
                        src={enrollment.course.thumbnail.url}
                        alt={enrollment.course.title}
                        placeholderType="course"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 opacity-0 shadow transition-opacity group-hover:opacity-100">
                      <PlayCircle className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </Link>
                <CardContent className="space-y-3 p-4">
                  <div>
                    <Link
                      to={`/student/courses/${enrollment.course?._id}/learn`}
                      className="line-clamp-1 text-base font-semibold transition-colors hover:text-primary"
                    >
                      {enrollment.course?.title || 'Untitled Course'}
                    </Link>
                    {enrollment.course?.instructor?.name && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {enrollment.course.instructor.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${enrollment.completionPercentage || 0}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {enrollment.completionPercentage || 0}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                        enrollment.isCompleted
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      )}
                    >
                      {enrollment.isCompleted ? (
                        <><Award className="h-3 w-3" /> Completed</>
                      ) : (
                        <><Clock className="h-3 w-3" /> In Progress</>
                      )}
                    </span>
                    {enrollment.lastWatchedLecture?.title && (
                      <span className="truncate text-xs text-muted-foreground">
                        {enrollment.lastWatchedLecture.title}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Link
                      to={`/student/courses/${enrollment.course?._id}/learn`}
                      className="flex-1"
                    >
                      <Button size="sm" fullWidth>
                        <PlayCircle className="mr-1.5 h-4 w-4" />
                        {enrollment.isCompleted ? 'Review' : 'Continue'}
                      </Button>
                    </Link>
                    {enrollment.isCompleted && (
                      <Link to="/student/certificates">
                        <Button variant="outline" size="sm">
                          <Award className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
