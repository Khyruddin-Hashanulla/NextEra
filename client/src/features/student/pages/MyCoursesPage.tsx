import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { BookOpen, PlayCircle, Award, History, Sparkles, GraduationCap, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'in-progress' | 'completed';

const tabs: { key: FilterTab; label: string; icon: typeof BookOpen }[] = [
  { key: 'all', label: 'All Courses', icon: BookOpen },
  { key: 'in-progress', label: 'In Progress', icon: PlayCircle },
  { key: 'completed', label: 'Completed', icon: Award },
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

  const totalCount = courses?.length ?? 0;
  const inProgressCount = courses?.filter((e: any) => !e.isCompleted).length ?? 0;
  const completedCount = courses?.filter((e: any) => e.isCompleted).length ?? 0;

  const filtered = courses?.filter((e: any) => {
    if (filter === 'in-progress') return !e.isCompleted;
    if (filter === 'completed') return e.isCompleted;
    return true;
  });

  const tabCount = (key: FilterTab) => {
    if (key === 'in-progress') return inProgressCount;
    if (key === 'completed') return completedCount;
    return totalCount;
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div
        variants={cardItem}
        className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-6 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Student Dashboard</p>
          <h1 className="mt-2 heading-lg">My Learning</h1>
          <p className="mt-1 text-muted-foreground">Keep your momentum — every course you own, in one home.</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums">{totalCount}</p>
            <p className="text-xs text-muted-foreground">Enrolled</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-orange-500">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground">In progress</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-green-600">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={cardItem} className="flex flex-wrap items-center gap-3">
        <div
          className="flex items-start gap-1 rounded-xl border border-border bg-muted p-1"
          role="tablist"
          aria-label="Filter courses"
        >
          {tabs.map((tab) => {
            const count = tabCount(tab.key);
            const Icon = tab.icon;
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all',
                  active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
                {tab.label}
                {count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                      active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {!filtered?.length ? (
        <motion.div variants={cardItem}>
          <EmptyState
            icon={<BookOpen className="h-8 w-8" />}
            title={filter === 'completed' ? 'No completed courses yet' : 'No courses in progress'}
            description={
              filter === 'all'
                ? 'You are not enrolled in any courses yet — start your journey.'
                : 'Keep going — finish a course to see it here.'
            }
            action={filter === 'all' ? { label: 'Browse Courses', href: '/courses' } : undefined}
          />
        </motion.div>
      ) : (
        <motion.div variants={container} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((enrollment: any) => (
            <motion.div key={enrollment._id} variants={cardItem}>
              <Card className="group overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
                <Link
                  to={`/student/courses/${enrollment.course?._id}/learn`}
                  className="relative block aspect-video w-full overflow-hidden bg-muted"
                  aria-label={`Open ${enrollment.course?.title || 'course'}`}
                >
                  {enrollment.course?.thumbnail?.url ? (
                    <OptimizedImage
                      src={enrollment.course.thumbnail.url}
                      alt={enrollment.course.title}
                      placeholderType="course"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />

                  <span
                    className={cn(
                      'absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur',
                      enrollment.isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/20 text-white ring-1 ring-white/30'
                    )}
                  >
                    {enrollment.isCompleted ? (
                      <>
                        <Award className="h-3 w-3" /> Completed
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-3 w-3" /> In Progress
                      </>
                    )}
                  </span>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                      <PlayCircle className="h-6 w-6 text-primary" />
                    </span>
                  </div>
                </Link>

                <CardContent className="space-y-3 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {enrollment.course?.level && (
                        <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 capitalize">
                          {enrollment.course.level.toLowerCase()}
                        </span>
                      )}
                      {enrollment.course?.totalLectures ? (
                        <span className="inline-flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {enrollment.course.totalLectures} lectures
                        </span>
                      ) : null}
                    </div>
                    <Link
                      to={`/student/courses/${enrollment.course?._id}/learn`}
                      className="line-clamp-1 text-base font-semibold transition-colors hover:text-primary"
                    >
                      {enrollment.course?.title || 'Untitled Course'}
                    </Link>
                    {enrollment.course?.instructor?.name && (
                      <p className="text-xs text-muted-foreground">by {enrollment.course.instructor.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {enrollment.isCompleted ? (
                          <>
                            <Sparkles className="h-3 w-3 text-emerald-500" /> Completed
                          </>
                        ) : (
                          <>
                            <GraduationCap className="h-3 w-3" /> Progress
                          </>
                        )}
                      </span>
                      <span className="text-xs font-semibold tabular-nums">
                        {enrollment.completionPercentage || 0}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          enrollment.isCompleted ? 'bg-emerald-500' : 'bg-primary'
                        )}
                        style={{ width: `${enrollment.completionPercentage || 0}%` }}
                      />
                    </div>
                  </div>

                  {enrollment.lastWatchedLecture?.title ? (
                    <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
                      <PlayCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-xs text-muted-foreground">
                        Last watched: {enrollment.lastWatchedLecture.title}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2">
                      <History className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Not started yet</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Link to={`/student/courses/${enrollment.course?._id}/learn`} className="min-w-0 flex-1">
                      <Button size="sm" fullWidth>
                        <PlayCircle className="mr-1.5 h-4 w-4" />
                        {enrollment.isCompleted ? 'Review' : 'Continue'}
                      </Button>
                    </Link>
                    <Link to="/student/certificates">
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`View certificate for ${enrollment.course?.title || 'course'}`}
                      >
                        <Award className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          <motion.div variants={cardItem}>
            <Link
              to="/courses"
              className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Compass className="h-6 w-6 text-primary" />
              </span>
              <p className="mt-3 text-sm font-semibold">Explore more courses</p>
              <p className="mt-1 text-xs text-muted-foreground">Discover your next learning journey</p>
            </Link>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
