import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { getCourseStatus, getCourseHref } from './useMyCourses';
import { PlayCircle, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import type { EnrolledCourse } from '@/types/student';

interface ContinueLearningCardProps {
  enrollment: EnrolledCourse;
}

export function ContinueLearningCard({ enrollment }: ContinueLearningCardProps) {
  const { course, completionPercentage } = enrollment;
  const status = getCourseStatus(enrollment);
  const progress = Math.min(Math.max(completionPercentage || 0, 0), 100);
  const href = getCourseHref(enrollment);
  const hasThumbnail = Boolean(course?.thumbnail?.url);
  const thumbnailUrl = course?.thumbnail?.url || '';
  const title = course?.title || 'Untitled Course';
  const isCompleted = status === 'completed';
  const ctaLabel = status === 'not-started' ? 'Start Learning' : 'Continue Learning';

  const meta = [
    course?.level ? course.level.toLowerCase() : null,
    typeof course?.totalLectures === 'number' ? `${course.totalLectures} lectures` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card className="group overflow-hidden border-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
      <div className="flex flex-col md:flex-row">
        <Link
          to={href}
          className="relative block aspect-video w-full overflow-hidden bg-muted md:aspect-auto md:w-2/5 lg:w-1/3"
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
            className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-70"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform duration-300 group-hover:scale-110">
              <PlayCircle className="h-7 w-7 text-primary" aria-hidden="true" />
            </span>
          </div>
        </Link>

        <div className="flex flex-1 flex-col justify-center gap-4 p-5 sm:p-6">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {isCompleted ? 'Completed course' : status === 'not-started' ? 'Your next course' : 'Continue where you left off'}
            </p>
            <h3 className="font-display text-lg font-bold leading-snug tracking-tight sm:text-xl">
              <Link to={href} className="transition-colors hover:text-primary">
                {title}
              </Link>
            </h3>
            {course?.instructor?.name && (
              <p className="text-sm text-muted-foreground">by {course.instructor.name}</p>
            )}
            {meta && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                {meta}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isCompleted ? 'Completed' : status === 'not-started' ? 'Ready to start' : 'Course progress'}
              </span>
              <span className="font-semibold tabular-nums text-foreground">{progress}%</span>
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progress}% complete in ${title}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-success' : 'bg-primary'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button asChild size="lg">
              <Link to={href}>
                <PlayCircle className="h-5 w-5" aria-hidden="true" />
                {ctaLabel}
              </Link>
            </Button>
            {isCompleted && (
              <Button asChild variant="outline" size="lg">
                <Link to="/student/certificates">View Certificate</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}