import { GraduationCap, Quote, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import type { HomeTestimonial } from './useHomePageData';

export function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        loading="lazy"
        decoding="async"
        className="h-11 w-11 shrink-0 rounded-full object-cover"
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
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-sm font-semibold text-white">
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
            index < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted',
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
  return (
    <figure
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-8',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-between gap-4">
        <Quote className="h-8 w-8 shrink-0 text-primary/30" aria-hidden="true" />
        <StarRating rating={testimonial.rating} />
      </div>

      <blockquote className="relative mt-5 flex-1 text-lg font-medium leading-relaxed text-foreground sm:text-xl">
        “{testimonial.content}”
      </blockquote>

      <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-5">
        <figcaption className="flex min-w-0 items-center gap-3">
          <Avatar name={testimonial.name} avatarUrl={testimonial.avatarUrl} />
          <div className="min-w-0">
            <div className="truncate font-semibold text-foreground">{testimonial.name}</div>
            <div className="truncate text-sm text-muted-foreground">{testimonial.role}</div>
          </div>
        </figcaption>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
            Completed: {testimonial.course}
          </span>
          {testimonial.date && (
            <time className="text-xs text-muted-foreground" dateTime={testimonial.date}>
              {formatDate(testimonial.date)}
            </time>
          )}
        </div>
      </div>
    </figure>
  );
}
