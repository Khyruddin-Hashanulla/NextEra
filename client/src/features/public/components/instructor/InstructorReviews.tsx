import { memo } from 'react';
import { MessagesSquare, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { Reveal } from './Reveal';
import { RatingStars } from './RatingStars';
import { formatNumber } from '@/lib/utils';
import type { InstructorProfile } from './types';

interface InstructorReviewsProps {
  instructor: InstructorProfile;
}

/**
 * Overall rating summary for the instructor.
 * A per-review list is not exposed by the student API yet, so we show the
 * aggregate honestly plus a friendly next step instead of fabricating reviews.
 */
export const InstructorReviews = memo(function InstructorReviews({ instructor }: InstructorReviewsProps) {
  const { averageRating, totalReviews } = instructor;

  return (
    <Reveal>
      <div id="reviews" className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <MessagesSquare className="h-4 w-4 text-primary" aria-hidden="true" />
          </span>
          Student Reviews
        </h2>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:border sm:border-border sm:bg-muted/30 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-foreground">{averageRating ? averageRating.toFixed(1) : '—'}</p>
              <div className="mt-1.5 flex justify-center">
                <RatingStars value={averageRating} size={16} />
              </div>
            </div>
            <div className="hidden h-10 w-px bg-border sm:block" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {formatNumber(totalReviews)} {totalReviews === 1 ? 'review' : 'reviews'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {totalReviews > 0
                  ? 'From verified learners across courses.'
                  : 'Ratings appear once learners complete courses.'}
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" asChild className="shrink-0">
            <a href="#courses">
              <Star className="h-4 w-4" aria-hidden="true" />
              Leave a review
            </a>
          </Button>
        </div>

        {totalReviews === 0 && (
          <div className="mt-6">
            <EmptyState
              icon={<MessagesSquare className="h-10 w-10 text-muted-foreground/50" />}
              title="No reviews yet"
              description="Be the first to share your learning experience with this instructor."
            />
          </div>
        )}
      </div>
    </Reveal>
  );
});
