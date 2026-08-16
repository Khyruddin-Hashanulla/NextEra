import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';
import type { HomeCategory } from './useHomePageData';

interface CategoriesSectionProps {
  categories: HomeCategory[];
  isLoading: boolean;
  className?: string;
}

const AUTOPLAY_DELAY = 5000;

function wrappedOffset(index: number, active: number, length: number): number {
  let offset = index - active;
  if (offset > length / 2) offset -= length;
  if (offset < -length / 2) offset += length;
  return offset;
}

export function CategoriesSection({ categories, isLoading, className }: CategoriesSectionProps) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = categories.length;

  const goTo = (index: number) => setActiveIndex(((index % count) + count) % count);
  const goNext = () => goTo(activeIndex + 1);
  const goPrev = () => goTo(activeIndex - 1);

  useEffect(() => {
    if (paused || reduceMotion || count === 0) return;
    const id = setInterval(() => setActiveIndex((i) => (i + 1) % count), AUTOPLAY_DELAY);
    return () => clearInterval(id);
  }, [paused, reduceMotion, count]);

  if (isLoading) {
    return (
      <section id="categories" className={className}>
        <div className="container-custom">
          <SectionHeading
            eyebrow="Browse by topic"
            title="Explore top categories"
            subtitle="Discover courses across the skills that matter most — from programming to design and business."
          />
          <div className="mx-auto max-w-lg">
            <Skeleton className="h-72 rounded-3xl sm:h-80" />
          </div>
        </div>
      </section>
    );
  }

  if (count === 0) return null;

  return (
    <section id="categories" className={className}>
      <div className="container-custom">
        <SectionHeading
          eyebrow="Browse by topic"
          title="Explore top categories"
          subtitle="Discover courses across the skills that matter most — from programming to design and business."
        />

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Browse by topic"
          aria-live="off"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          className="mx-auto max-w-lg"
        >
          <div className="relative h-72 overflow-hidden rounded-3xl sm:h-80">
            {categories.map((category, index) => {
              const offset = wrappedOffset(index, activeIndex, count);
              const Icon = category.icon;
              const isActive = offset === 0;

              const x = offset * 40;
              const scale = offset === 0 ? 1 : Math.max(0.72, 1 - Math.abs(offset) * 0.16);
              const opacity = isActive ? 1 : Math.abs(offset) >= 2 ? 0 : 0.55;
              const rotate = offset * -5;

              return (
                <motion.div
                  key={category.name}
                  initial={false}
                  animate={{ x: `${x}%`, scale, opacity, rotate }}
                  transition={{ type: 'spring', stiffness: 260, damping: 30, mass: 0.9 }}
                  style={{ zIndex: isActive ? 10 : 10 - Math.abs(offset) }}
                  aria-hidden={!isActive}
                  className="absolute inset-0"
                >
                  <Link
                    to={ROUTES.COURSES}
                    tabIndex={isActive ? 0 : -1}
                    className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-lg shadow-primary/5 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-6"
                  >
                    {/* Gradient accent bar */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-80 transition-opacity duration-300 group-hover:opacity-100',
                        category.gradient
                      )}
                    />

                    {/* Soft gradient orb */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br opacity-15 blur-2xl transition-opacity duration-300 group-hover:opacity-30',
                        category.gradient
                      )}
                    />

                    {/* Watermark icon */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-7 -right-7 text-foreground/[0.05] transition-all duration-500 group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:text-foreground/10"
                    >
                      <Icon className="h-32 w-32" />
                    </span>

                    <span className="relative flex items-center justify-between">
                      <span
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3',
                          category.gradient
                        )}
                      >
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </span>
                      <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
                      </span>
                    </span>

                    <span className="relative">
                      <span className="block text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-primary sm:text-2xl">
                        {category.name}
                      </span>
                      <span className="mt-2 block text-sm leading-relaxed text-muted-foreground line-clamp-2">
                        {category.description}
                      </span>
                    </span>

                    <span className="relative mt-5 flex items-center justify-between border-t border-border/70 pt-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                        <span
                          className={cn(
                            'inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r',
                            category.gradient
                          )}
                          aria-hidden="true"
                        />
                        {category.courseCount > 0
                          ? `${category.courseCount} course${category.courseCount === 1 ? '' : 's'}`
                          : 'Explore courses'}
                      </span>
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={goPrev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Previous category"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2">
              {categories.map((category, index) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Go to ${category.name}`}
                  aria-current={index === activeIndex ? 'true' : undefined}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    index === activeIndex
                      ? 'w-6 bg-primary'
                      : 'w-2 bg-muted-foreground/25 hover:bg-muted-foreground/50'
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={goNext}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Next category"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to={ROUTES.COURSES}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-300 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            View all categories
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
