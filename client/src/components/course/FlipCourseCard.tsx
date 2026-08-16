import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn, formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Clock,
  Languages,
  Layers,
  ListVideo,
  Star,
  Users,
} from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { WishlistButton } from '@/components/course/WishlistButton';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { getCoursePricing } from '@/lib/coursePricing';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Course } from '@/types/instructor';

interface FlipCourseCardProps {
  course: Course;
  className?: string;
}

const COURSE_LEVELS: ReadonlyArray<Course['level']> = ['beginner', 'intermediate', 'advanced'];

function getCategoryName(course: Course): string | undefined {
  if (!course.category) return undefined;
  return typeof course.category === 'string' ? course.category : course.category.name;
}

export function FlipCourseCard({ course, className }: FlipCourseCardProps) {
  const [flipped, setFlipped] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const pricing = getCoursePricing(course);
  const thumbUrl = course.thumbnail?.url;
  const catName = getCategoryName(course);
  const level = course.level && COURSE_LEVELS.includes(course.level) ? course.level : undefined;

  const isHoverDevice = useMediaQuery('(hover: hover) and (pointer: fine)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const enableHoverFlip = isHoverDevice && !prefersReducedMotion;

  const handleMouseEnter = () => {
    if (enableHoverFlip) setFlipped(true);
  };

  const handleMouseLeave = () => {
    if (enableHoverFlip) setFlipped(false);
  };

  const showBack = () => {
    setFlipped(true);
    window.setTimeout(() => backRef.current?.focus(), 180);
  };

  const showFront = () => {
    setFlipped(false);
    window.setTimeout(() => frontRef.current?.focus(), 180);
  };

  return (
    <article
      className={cn(
        'group relative h-full w-full rounded-2xl hover:shadow-xl hover:shadow-primary/10 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
        className
      )}
    >
      <div
        className={cn(
          'flip-preserve-3d relative h-full w-full min-h-[420px] rounded-2xl transition-transform duration-500 ease-out',
          flipped ? '[transform:rotateY(180deg)]' : ''
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* ── Front face ─────────────────────────────────────────── */}
        <div
          ref={frontRef}
          tabIndex={-1}
          className={cn(
            'flip-face relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
            flipped && 'invisible'
          )}
        >
          <div className="relative h-44 shrink-0 overflow-hidden bg-muted">
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
              {course.featured && (
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
          </div>

          <div className="flex flex-1 flex-col p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {catName && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {catName}
                </span>
              )}
              {level && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                  {level}
                </span>
              )}
            </div>

            <h3 className="line-clamp-2 font-semibold text-foreground">
              <Link
                to={ROUTES.COURSE_DETAIL(course._id)}
                className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {course.title}
              </Link>
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">{course.instructor?.name || 'Expert instructor'}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
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

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
              <div className="flex items-baseline gap-2">
                {pricing.isFree ? (
                  <span className="text-lg font-bold text-foreground">Free</span>
                ) : (
                  <>
                    <span className="text-lg font-bold text-foreground">{formatCurrency(pricing.price)}</span>
                    {pricing.hasDiscount && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(pricing.originalPrice)}
                      </span>
                    )}
                  </>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={showBack} className="gap-1.5">
                Details
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        {/* ── Back face ─────────────────────────────────────────── */}
        <div
          ref={backRef}
          tabIndex={-1}
          className={cn(
            'flip-face absolute inset-0 flex flex-col overflow-y-auto rounded-2xl border border-border bg-card shadow-sm [transform:rotateY(180deg)]',
            flipped ? '' : 'invisible'
          )}
        >
          <div className="flex flex-1 flex-col p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {catName && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {catName}
                </span>
              )}
              {level && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                  {level}
                </span>
              )}
            </div>

            <h3 className="line-clamp-2 font-semibold text-foreground">{course.title}</h3>

            {(course.shortDescription || course.description) && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {course.shortDescription || course.description}
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              {course.totalDuration ? (
                <div className="flex items-center justify-between gap-1 rounded-lg bg-muted px-3 py-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Duration
                  </span>
                  <span className="text-sm font-semibold text-foreground">{course.totalDuration}h</span>
                </div>
              ) : null}
              {course.totalLectures ? (
                <div className="flex items-center justify-between gap-1 rounded-lg bg-muted px-3 py-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ListVideo className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Lectures
                  </span>
                  <span className="text-sm font-semibold text-foreground">{course.totalLectures}</span>
                </div>
              ) : null}
              {course.totalSections ? (
                <div className="flex items-center justify-between gap-1 rounded-lg bg-muted px-3 py-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Sections
                  </span>
                  <span className="text-sm font-semibold text-foreground">{course.totalSections}</span>
                </div>
              ) : null}
              {course.language ? (
                <div className="flex items-center justify-between gap-1 rounded-lg bg-muted px-3 py-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Language
                  </span>
                  <span className="truncate text-sm font-semibold text-foreground">{course.language}</span>
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              {pricing.isFree ? (
                <span className="text-xl font-bold text-foreground">Free</span>
              ) : (
                <>
                  <span className="text-xl font-bold text-foreground">{formatCurrency(pricing.price)}</span>
                  {pricing.hasDiscount && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatCurrency(pricing.originalPrice)}
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="mt-auto space-y-2 border-t border-border pt-3">
              <Button asChild fullWidth>
                <Link to={ROUTES.COURSE_DETAIL(course._id)}>
                  View Course
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" fullWidth onClick={showFront} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to overview
              </Button>
            </div>
          </div>
        </div>
      </div>

      <WishlistButton
        courseId={course._id}
        variant="icon"
        className="absolute right-3 top-3 z-10"
      />
    </article>
  );
}