import { GraduationCap, Quote, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { HomeTestimonial } from './useHomePageData';

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  className?: string;
}

export function Avatar({ name, avatarUrl, className }: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        loading="lazy"
        decoding="async"
        className={cn('h-10 w-10 shrink-0 rounded-full object-cover', className)}
      />
    );
  }

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-sm font-semibold text-white',
        className
      )}
    >
      {initials}
    </div>
  );
}

export function StarRating({ rating, className }: { rating: number; className?: string }) {
  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role="img"
      aria-label={`Rated ${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            'h-4 w-4',
            index < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

interface TestimonialCardProps {
  testimonial: HomeTestimonial;
  className?: string;
}

export function TestimonialCard({ testimonial, className }: TestimonialCardProps) {
  const isFeatured = !!testimonial.featured;

  return (
    <figure
      className={cn(
        'group relative flex flex-col break-inside-avoid rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 sm:p-6',
        isFeatured
          ? 'border-primary/40 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/15'
          : 'border-border hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-black/5',
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-between gap-4">
        <Quote
          className={cn('shrink-0 text-primary/30', isFeatured ? 'h-8 w-8' : 'h-6 w-6')}
          aria-hidden="true"
        />
        <StarRating rating={testimonial.rating} />
      </div>

      <blockquote
        className={cn(
          'relative mt-4 leading-relaxed text-foreground sm:text-[0.95rem]',
          isFeatured ? 'text-base sm:text-lg' : 'text-sm'
        )}
      >
        “{testimonial.content}”
      </blockquote>

      <figcaption className="relative mt-5 border-t border-border/60 pt-4">
        <div className="flex items-center gap-3">
          <Avatar name={testimonial.name} avatarUrl={testimonial.avatarUrl} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{testimonial.name}</div>
            <div className="truncate text-xs text-muted-foreground">{testimonial.role}</div>
          </div>
          {testimonial.date && (
            <time className="shrink-0 text-[11px] text-muted-foreground" dateTime={testimonial.date}>
              {formatDate(testimonial.date)}
            </time>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
            <GraduationCap className="h-3 w-3" aria-hidden="true" />
            Completed: {testimonial.course}
          </span>
          {isFeatured && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-600">
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
              Featured story
            </span>
          )}
        </div>
      </figcaption>
    </figure>
  );
}
