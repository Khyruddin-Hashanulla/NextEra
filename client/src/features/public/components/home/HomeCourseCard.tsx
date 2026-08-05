import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Star, Users, Clock, BookOpen } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { ROUTES } from '@/lib/constants';
import type { MockCourse } from '@/mocks/types';

interface HomeCourseCardProps {
  course: MockCourse;
  className?: string;
}

export function HomeCourseCard({ course, className }: HomeCourseCardProps) {
  const price = course.pricing?.originalPrice ?? course.price ?? 0;
  const discount = course.pricing?.discountPercent ?? 0;
  const hasDiscount = discount > 0 && price > 0;
  const discountedPrice = hasDiscount ? price * (1 - discount / 100) : price;
  const thumbUrl = course.thumbnail?.url;
  const catName =
    course.category && typeof course.category === 'object'
      ? course.category.name
      : typeof course.category === 'string'
        ? course.category
        : undefined;
  const level =
    course.level?.charAt(0).toUpperCase() + course.level?.slice(1) || undefined;

  return (
    <Link
      to={ROUTES.COURSE_DETAIL(course._id)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {thumbUrl ? (
          <OptimizedImage
            src={thumbUrl}
            alt={`${course.title} course thumbnail`}
            placeholderType="course"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            lazy
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <BookOpen className="h-12 w-12" aria-hidden="true" />
          </div>
        )}
        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            {discount}% OFF
          </span>
        )}
        {level && (
          <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur-sm">
            {level}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {catName && (
          <span className="mb-2 inline-block w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {catName}
          </span>
        )}

        <h3 className="line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-primary">
          {course.title}
        </h3>

        <p className="mt-1.5 text-sm text-muted-foreground">
          {course.instructor?.name || 'Expert instructor'}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="font-semibold text-foreground">
              {course.averageRating ? course.averageRating.toFixed(1) : 'New'}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden="true" />
            {(course.totalEnrollments ?? 0).toLocaleString()} students
          </span>
          {course.totalDuration ? (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {course.totalDuration}h
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-baseline gap-2">
            {price === 0 ? (
              <span className="text-lg font-bold text-foreground">Free</span>
            ) : (
              <>
                <span className="text-lg font-bold text-foreground">
                  ${discountedPrice.toFixed(0)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${price.toFixed(0)}
                  </span>
                )}
              </>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            Enroll now
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
