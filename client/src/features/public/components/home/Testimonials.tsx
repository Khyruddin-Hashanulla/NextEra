import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight, MessageSquareQuote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionHeading } from './SectionHeading';
import { TestimonialCard, Avatar } from './TestimonialCard';
import type { HomeTestimonial } from './useHomePageData';

const AUTO_SLIDE_MS = 6000;

const easeOut = [0.22, 1, 0.36, 1] as const;

interface TestimonialsProps {
  testimonials: HomeTestimonial[];
  isLoading: boolean;
}

const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 48, scale: 0.98 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -48, scale: 0.98 }),
};

export function Testimonials({ testimonials, isLoading }: TestimonialsProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { margin: '-60px' });

  const reducedMotion = useMemo(() => {
    if (typeof window.matchMedia !== 'function') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const goNext = useCallback(() => {
    setDirection(1);
    setIndex((current) => (current + 1) % testimonials.length);
  }, [testimonials.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setIndex((current) => (current - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  const goTo = useCallback(
    (target: number) => {
      setDirection(target > index ? 1 : -1);
      setIndex(target);
    },
    [index]
  );

  useEffect(() => {
    if (!inView || paused || reducedMotion || testimonials.length < 2) return;
    const id = setInterval(goNext, AUTO_SLIDE_MS);
    return () => clearInterval(id);
  }, [inView, paused, reducedMotion, testimonials.length, goNext]);

  const active = testimonials[Math.min(index, testimonials.length - 1)];

  return (
    <section id="testimonials" className="py-16 sm:py-24 lg:py-28">
      <div className="container-custom">
        <SectionHeading
          eyebrow="Loved by learners"
          title="Success stories from our community"
          subtitle="Thousands of students have transformed their careers with NextEra. Here's what they say."
        />

        {isLoading ? (
          <div className="mx-auto max-w-4xl">
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        ) : testimonials.length === 0 ? (
          <EmptyState
            icon={<MessageSquareQuote className="h-8 w-8 text-muted-foreground" />}
            title="No testimonials yet"
            description="Student stories will appear here soon."
          />
        ) : (
          <div className="mx-auto max-w-4xl">
            <div
              ref={stageRef}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              className="relative"
            >
              <div className="relative h-[380px] sm:h-[360px]">
                <AnimatePresence initial={false} custom={direction}>
                  <motion.div
                    key={active.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.5, ease: easeOut }}
                    className="absolute inset-0"
                  >
                    <TestimonialCard testimonial={active} />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous testimonial"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-all duration-200 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>

                <div className="flex items-center gap-2" role="tablist" aria-label="Testimonials">
                  {testimonials.map((testimonial, testimonialIndex) => (
                    <button
                      key={testimonial.id}
                      type="button"
                      role="tab"
                      aria-selected={testimonialIndex === index}
                      aria-label={`Go to testimonial from ${testimonial.name}`}
                      onClick={() => goTo(testimonialIndex)}
                      className={cn(
                        'h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        testimonialIndex === index
                          ? 'w-6 bg-primary'
                          : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                      )}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next testimonial"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-all duration-200 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {testimonials.map((testimonial, testimonialIndex) => {
                  const isActive = testimonialIndex === index;
                  return (
                    <button
                      key={testimonial.id}
                      type="button"
                      onClick={() => goTo(testimonialIndex)}
                      aria-label={`Show testimonial from ${testimonial.name}`}
                      aria-current={isActive}
                      className={cn(
                        'flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        isActive
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border bg-card opacity-60 hover:opacity-100'
                      )}
                    >
                      <Avatar name={testimonial.name} avatarUrl={testimonial.avatarUrl} />
                      <span className="text-sm font-medium text-foreground">{testimonial.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
