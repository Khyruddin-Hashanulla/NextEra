import { Link } from 'react-router-dom';
import { cn, formatCurrency } from '@/lib/utils';
import { Star, Users, Clock, BookOpen } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { ROUTES } from '@/lib/constants';
import type { MockCourse } from '@/mocks/types';
import { getCoursePricing } from '@/lib/coursePricing';

interface HomeCourseCardProps {
  course: MockCourse;
  className?: string;
  spotlight?: boolean;
}

export function HomeCourseCard({ course, className, spotlight = false }: HomeCourseCardProps) {
  const pricing = getCoursePricing(course);
  const thumbUrl = course.thumbnail?.url;
  const catName =
    course.category && typeof course.category === 'object'
      ? course.category.name
      : typeof course.category === 'string'
        ? course.category
        : undefined;
  const level = course.level?.charAt(0).toUpperCase() + course.level?.slice(1) || undefined;

  return (
    <Link
      to={ROUTES.COURSE_DETAIL(course._id)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        spotlight && 'lg:flex-row',
        className
      )}
    >
      <div
        className={cn(
          'relative aspect-[16/10] shrink-0 overflow-hidden bg-muted',
          spotlight && 'lg:aspect-auto lg:h-full lg:w-[55%]'
        )}
      >
        {thumbUrl ? (
          <OptimizedImage
            src={thumbUrl}
            alt={`${course.title} course thumbnail`}
            placeholderType="course"
            containerClassName="h-full w-full"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            lazy
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <BookOpen className="h-12 w-12" aria-hidden="true" />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          {spotlight && (
            <span className="rounded-full bg-gradient-to-r from-primary to-violet-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              Featured
            </span>
          )}
          {pricing.hasDiscount && (
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              {pricing.discountPercent}% OFF
            </span>
          )}
        </div>
        {level && (
          <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur-sm">
            {level}
          </span>
        )}
      </div>

      <div className={cn('flex flex-1 flex-col p-5', spotlight && 'lg:w-[45%] lg:flex-none lg:p-7')}>
        {catName && (
          <span className="mb-2 inline-block w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {catName}
          </span>
        )}

        <h3
          className={cn(
            'line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-primary',
            spotlight && 'text-2xl sm:text-3xl'
          )}
        >
          {course.title}
        </h3>

        <p className="mt-1.5 text-sm text-muted-foreground">
          {course.instructor?.name || 'Expert instructor'}
        </p>

        {spotlight && course.shortDescription && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {course.shortDescription}
          </p>
        )}

        <div className={cn('mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground', !spotlight && 'mb-6')}>
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

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4 max-lg:mt-6">
          <div className="flex items-baseline gap-2">
            {pricing.isFree ? (
              <span className={cn('text-lg font-bold text-foreground', spotlight && 'text-2xl sm:text-3xl')}>Free</span>
            ) : (
              <>
                <span className={cn('text-lg font-bold text-foreground', spotlight && 'text-2xl sm:text-3xl')}>
                  {formatCurrency(pricing.price)}
                </span>
                {pricing.hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatCurrency(pricing.originalPrice)}
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
