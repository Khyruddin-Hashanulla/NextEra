import { Link } from 'react-router-dom';
import { cn, formatCurrency } from '@/lib/utils';
import { Star, Users, Clock, BookOpen } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { WishlistButton } from '@/components/course/WishlistButton';
import type { MockCourse } from '@/mocks/types';
import type { Course } from '@/types/instructor';
import { getCoursePricing } from '@/lib/coursePricing';

interface CourseCardProps {
  course: MockCourse | Course;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export function CourseCard({ course, variant = 'default', className }: CourseCardProps) {
  const pricing = getCoursePricing(course);
  const thumbUrl = course.thumbnail?.url;
  const catName = typeof course.category === 'object' ? course.category?.name : undefined;

  if (variant === 'compact') {
    return (
      <Link
        to={`/courses/${course._id}`}
        className={cn(
          'group flex gap-3 rounded-xl bg-card p-3 shadow-sm border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300',
          className
        )}
      >
        <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {thumbUrl ? (
            <OptimizedImage src={thumbUrl} alt={course.title} placeholderType="course" className="object-cover" lazy />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/40">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {course.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">{course.instructor?.name}</p>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" aria-hidden="true" /> {course.totalDuration}h
            </div>
            <span className="text-xs font-semibold text-primary">
              {pricing.isFree ? 'Free' : formatCurrency(pricing.price)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link
        to={`/courses/${course._id}`}
        className={cn(
          'group block rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden',
          className
        )}
      >
        <div className="relative h-48 overflow-hidden bg-muted">
          {thumbUrl ? (
            <OptimizedImage
              src={thumbUrl}
              alt={course.title}
              placeholderType="course"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              lazy
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/40">
              <BookOpen className="h-10 w-10" aria-hidden="true" />
            </div>
          )}
          {pricing.hasDiscount && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {pricing.discountPercent}% OFF
            </span>
          )}
          <WishlistButton courseId={course._id} variant="icon" className="absolute top-3 right-3" />
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            {catName && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                {catName}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /> {course.totalEnrollments ?? 0}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /> {course.totalDuration}h
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span className="text-sm font-semibold text-foreground">{course.averageRating?.toFixed(1) ?? '—'}</span>
            </div>
            <span className="text-sm font-bold text-primary">
              {pricing.isFree ? 'Free' : formatCurrency(pricing.price)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/courses/${course._id}`}
      className={cn(
        'group block rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden',
        className
      )}
    >
      <div className="relative h-44 overflow-hidden bg-muted">
        {thumbUrl ? (
          <OptimizedImage
            src={thumbUrl}
            alt={course.title}
            placeholderType="course"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            lazy
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground/40">
            <BookOpen className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
        {course.level && (
          <span
            className={cn(
              'absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full',
              course.level === 'beginner' && 'bg-success/10 text-success',
              course.level === 'intermediate' && 'bg-warning/10 text-warning',
              course.level === 'advanced' && 'bg-destructive/10 text-destructive'
            )}
          >
            {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
          </span>
        )}
        <WishlistButton
          courseId={course._id}
          variant="icon"
          className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
      <div className="p-5">
        {catName && (
          <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full mb-2 inline-block">
            {catName}
          </span>
        )}
        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{course.instructor?.name}</p>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">{course.averageRating?.toFixed(1) ?? '4.5'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" aria-hidden="true" /> {course.totalEnrollments ?? 0}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {course.totalDuration}h
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <div className="flex items-baseline gap-1.5">
            {pricing.isFree ? (
              <span className="text-lg font-bold text-foreground">Free</span>
            ) : (
              <span className="text-lg font-bold text-foreground">{formatCurrency(pricing.price)}</span>
            )}
            {pricing.hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">{formatCurrency(pricing.originalPrice)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
