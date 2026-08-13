import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  avatar?: string;
  content: string;
  rating: number;
  course?: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  className?: string;
}

export function TestimonialCarousel({ testimonials, className }: TestimonialCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const liveRef = useRef<HTMLDivElement>(null);

  const totalSlides = testimonials.length;

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current]
  );

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(totalSlides - 1);
      }
    },
    [goPrev, goNext, goTo, totalSlides]
  );

  useEffect(() => {
    if (liveRef.current) {
      liveRef.current.textContent = `Testimonial ${current + 1} of ${totalSlides}: ${testimonials[current]?.name}`;
    }
  }, [current, totalSlides, testimonials]);

  if (!testimonials.length) return null;

  const t = testimonials[current];

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
  };

  return (
    <div
      className={cn('relative', className)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Student testimonials"
      onKeyDown={handleKeyDown}
    >
      <div className="text-center max-w-3xl mx-auto">
        <Quote className="h-8 w-8 text-primary/30 mx-auto mb-6" aria-hidden="true" />
        <div className="relative min-h-[200px] flex items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="w-full"
              role="group"
              aria-roledescription="slide"
              aria-label={`Testimonial ${current + 1} of ${totalSlides}`}
            >
              <div className="flex justify-center gap-1 mb-6" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-5 w-5',
                      i < t.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
                    )}
                  />
                ))}
              </div>
              <blockquote className="text-lg sm:text-xl text-foreground/80 leading-relaxed mb-8">
                &ldquo;{t.content}&rdquo;
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-muted">
                  {t.avatar ? (
                    <OptimizedImage
                      src={t.avatar}
                      alt={`Profile photo of ${t.name}`}
                      placeholderType="avatar"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {t.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t.role}
                    {t.company ? `, ${t.company}` : ''}
                  </p>
                </div>
              </div>
              {t.course && <p className="text-xs text-muted-foreground/70 mt-4">Completed: {t.course}</p>}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={goPrev}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2" role="tablist" aria-label="Testimonial indicators">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  'h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  i === current ? 'w-6 bg-primary' : 'w-2 bg-muted hover:bg-muted-foreground/20'
                )}
                role="tab"
                aria-selected={i === current}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={goNext}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />
    </div>
  );
}
