import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { CourseStatusBadge } from './CourseStatusBadge';
import { getCourseStatus, getCourseHref } from './useMyCourses';
import {
  PlayCircle,
  Award,
  GraduationCap,
  BookOpen,
  History,
  Sparkles,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EnrolledCourse } from '@/types/student';

interface CourseCardProps {
  enrollment: EnrolledCourse;
}

const actionLabel: Record<'completed' | 'in-progress' | 'not-started', string> = {
  'in-progress': 'Continue',
  completed: 'Review',
  'not-started': 'Start Learning',
};

export function CourseCard({ enrollment }: CourseCardProps) {
  const { course, completionPercentage, enrolledAt } = enrollment;
  const status = getCourseStatus(enrollment);
  const progress = Math.min(Math.max(completionPercentage || 0, 0), 100);
  const href = getCourseHref(enrollment);
  const hasThumbnail = Boolean(course?.thumbnail?.url);
  const thumbnailUrl = course?.thumbnail?.url || '';
  const title = course?.title || 'Untitled Course';
  const isCompleted = status === 'completed';

  const meta = [
    course?.level ? course.level.toLowerCase() : null,
    typeof course?.totalLectures === 'number' ? `${course.totalLectures} lectures` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
      <Link
        to={href}
        className="relative block aspect-video w-full overflow-hidden bg-muted"
        aria-label={`Open ${title}`}
      >
        {hasThumbnail ? (
          <OptimizedImage
            src={thumbnailUrl}
            alt={title}
            placeholderType="course"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90"
        />

        <div className="absolute right-3 top-3">
          <CourseStatusBadge status={status} />
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <PlayCircle className="h-6 w-6 text-primary" aria-hidden="true" />
          </span>
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col space-y-3 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {meta && (
              <span className="inline-flex items-center gap-1 truncate">
                <GraduationCap className="h-3 w-3 shrink-0" aria-hidden="true" />
                {meta}
              </span>
            )}
          </div>

          <Link
            to={href}
            className="line-clamp-2 text-base font-semibold leading-snug transition-colors hover:text-primary"
          >
            {title}
          </Link>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            {course?.instructor?.name ? (
              <p className="truncate text-xs text-muted-foreground">by {course.instructor.name}</p>
            ) : (
              <span />
            )}
            {enrolledAt && (
              <p className="shrink-0 text-xs text-muted-foreground">
                {new Date(enrolledAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              {isCompleted ? (
                <>
                  <Sparkles className="h-3 w-3 text-success" aria-hidden="true" />
                  <span className="font-medium text-success">Completed</span>
                </>
              ) : (
                <>
                  <Star className="h-3 w-3 text-primary" aria-hidden="true" />
                  Course Progress
                </>
              )}
            </span>
            <span className="text-xs font-semibold tabular-nums">{progress}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progress}% complete in ${title}`}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isCompleted ? 'bg-success' : 'bg-primary'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {enrollment.lastWatchedLecture?.title ? (
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
            <PlayCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate text-xs text-muted-foreground">
              Last watched: {enrollment.lastWatchedLecture.title}
            </span>
          </div>
        ) : isCompleted ? (
          <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
            <span className="truncate text-xs text-success">Course completed</span>
          </div>
        ) : progress > 0 ? null : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2">
            <History className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate text-xs text-muted-foreground">Not started yet</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Link to={href} className="min-w-0 flex-1">
            <Button size="sm" fullWidth>
              <PlayCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {actionLabel[status]}
            </Button>
          </Link>
          <Link to="/student/certificates">
            <Button
              variant="outline"
              size="sm"
              aria-label={`View certificate for ${title}`}
            >
              <Award className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}