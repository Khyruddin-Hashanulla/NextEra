import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { RatingStars } from '@/features/public/components/instructor/RatingStars';
import { isFreeCourse } from '@/lib/coursePricing';
import { ROUTES } from '@/lib/constants';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { BookOpen, Heart, Sparkles } from 'lucide-react';
import type { WishlistItem } from '@/types/student';

interface WishlistCourseCardProps {
  item: WishlistItem;
  isPending?: boolean;
  onRemove?: () => void;
}

export function WishlistCourseCard({ item, isPending = false, onRemove }: WishlistCourseCardProps) {
  const course = item.course;
  const title = course?.title || 'Untitled Course';
  const href = ROUTES.COURSE_DETAIL(course?._id ?? '');
  const hasThumbnail = Boolean(course?.thumbnail?.url);
  const rating = course?.averageRating ?? 0;

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
      <Link
        to={href}
        className="relative block aspect-video w-full overflow-hidden bg-muted"
        aria-label={`Open ${title}`}
      >
        {hasThumbnail ? (
          <OptimizedImage
            src={course!.thumbnail!.url}
            alt={title}
            placeholderType="course"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            lazy
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

        {course?.level && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-black/40 px-2.5 py-0.5 text-xs font-medium capitalize text-white backdrop-blur-sm">
            {course.level}
          </span>
        )}

        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-red-500 shadow-sm backdrop-blur-sm">
          <Heart className="h-3 w-3 fill-current" aria-hidden="true" />
          Saved
        </span>
      </Link>

      <CardContent className="flex flex-1 flex-col p-4">
        <div className="space-y-1.5">
          <Link
            to={href}
            className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors hover:text-primary"
          >
            {title}
          </Link>

          {course?.instructor?.name && (
            <p className="truncate text-xs text-muted-foreground">by {course.instructor.name}</p>
          )}

          {rating > 0 && (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <RatingStars value={rating} size={14} />
              <span className="text-xs font-semibold text-foreground">{rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">
                ({formatNumber(course?.totalReviews ?? 0)} {course?.totalReviews === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          {isFreeCourse(course) ? (
            <span className="inline-flex items-center gap-1.5 text-lg font-bold text-success">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Free
            </span>
          ) : (
            <span className="text-lg font-bold tabular-nums text-foreground">
              {formatCurrency(course?.price ?? 0)}
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-3">
          <Link to={href} className="min-w-0 flex-1">
            <Button size="sm" fullWidth>
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              View Course
            </Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            disabled={isPending}
            loading={isPending}
            aria-label={`Remove ${title} from wishlist`}
            className="text-muted-foreground hover:border-destructive/40 hover:text-destructive"
          >
            <Heart className="h-4 w-4 fill-current text-red-500" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}