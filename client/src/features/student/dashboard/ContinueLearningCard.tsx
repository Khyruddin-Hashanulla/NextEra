import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlayCircle, Award, BookOpen } from 'lucide-react';
import type { StudentDashboardEnrollment } from '@/types/student';
import { getCourseHref } from './useStudentDashboard';

interface ContinueLearningCardProps {
  enrollment: StudentDashboardEnrollment;
}

export function ContinueLearningCard({ enrollment }: ContinueLearningCardProps) {
  const { course, completionPercentage, isCompleted } = enrollment;
  const progress = Math.min(Math.max(completionPercentage || 0, 0), 100);
  const hasThumbnail = Boolean(course?.thumbnail?.url);
  const thumbnailUrl = course?.thumbnail?.url || '';
  const title = course?.title || 'Untitled Course';

  const meta = [
    course?.level,
    typeof course?.totalLectures === 'number' ? `${course.totalLectures} lectures` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card className="group flex h-full flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-4">
          {hasThumbnail ? (
            <img
              src={thumbnailUrl}
              alt={title}
              loading="lazy"
              decoding="async"
              className="h-16 w-24 shrink-0 rounded-lg border object-cover"
            />
          ) : (
            <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{title}</h3>
            {meta && <p className="mt-1 text-xs text-muted-foreground">{meta}</p>}
          </div>
        </div>

        <div className="mt-4 flex-1" />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              {isCompleted ? 'Completed' : `${progress}% complete`}
            </span>
            <span className="tabular-nums text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} aria-label={`Progress in ${title}`} />
        </div>

        <Button asChild size="sm" className="mt-4 w-full" variant={isCompleted ? 'outline' : 'default'}>
          <Link to={getCourseHref(enrollment)}>
            {isCompleted ? <Award className="h-4 w-4" aria-hidden="true" /> : <PlayCircle className="h-4 w-4" aria-hidden="true" />}
            {isCompleted ? 'View Certificate' : 'Continue Learning'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}