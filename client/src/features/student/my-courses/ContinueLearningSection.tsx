import type { EnrolledCourse } from '@/types/student';
import { ContinueLearningCard } from './ContinueLearningCard';

interface ContinueLearningSectionProps {
  enrollment: EnrolledCourse;
}

export function ContinueLearningSection({ enrollment }: ContinueLearningSectionProps) {
  return (
    <section aria-labelledby="continue-learning-title" className="space-y-4">
      <div>
        <h2 id="continue-learning-title" className="font-display text-lg font-bold tracking-tight">
          Continue Learning
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Pick up right where you left off with your most recent course.
        </p>
      </div>
      <ContinueLearningCard enrollment={enrollment} />
    </section>
  );
}