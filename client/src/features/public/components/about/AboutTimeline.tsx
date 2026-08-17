import { useRef } from 'react';
import { motion, useReducedMotion, useScroll } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AboutTimelineItem {
  year: string;
  title: string;
  description: string;
}

interface AboutTimelineProps {
  items: AboutTimelineItem[];
  className?: string;
}

/**
 * Aceternity-inspired vertical timeline: sticky year/title labels on desktop, a
 * vertical progress line that fills on scroll, node dots and glass content
 * cards. Uses only theme tokens and falls back to a static version when the
 * user prefers reduced motion.
 */
export function AboutTimeline({ items, className }: AboutTimelineProps) {
  const containerRef = useRef<HTMLOListElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 80%', 'end 60%'],
  });

  return (
    <ol ref={containerRef} className={cn('relative', className)}>
      {/* Vertical progress line */}
      <div
        className="absolute inset-y-0 left-3 w-0.5 -translate-x-1/2 overflow-hidden rounded-full bg-border lg:left-[240px]"
        aria-hidden="true"
      >
        {reduceMotion ? (
          <div className="absolute inset-0 bg-gradient-to-b from-primary to-primary/40" />
        ) : (
          <motion.div
            className="absolute inset-0 origin-top bg-gradient-to-b from-primary to-primary/40"
            style={{ scaleY: scrollYProgress }}
          />
        )}
      </div>

      {items.map((item) => (
        <li key={item.year} className="relative mb-12 pl-10 lg:mb-16 lg:grid lg:grid-cols-[240px_1fr] lg:gap-12 lg:pl-0">
          {/* Node dot */}
          <span
            className="absolute left-3 top-1.5 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border-2 border-primary bg-background lg:left-[240px]"
            aria-hidden="true"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </span>

          {/* Sticky label */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="flex items-baseline gap-3 lg:block">
              <span className="font-display text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                {item.year}
              </span>
              <h3 className="mt-1 text-lg font-semibold text-foreground sm:text-xl lg:mt-2">{item.title}</h3>
            </div>
          </div>

          {/* Content card */}
          <div className="mt-3 lg:mt-0">
            {reduceMotion ? (
              <div className="rounded-2xl border border-border/50 bg-card/30 p-6 shadow-sm backdrop-blur-md sm:p-7">
                <p className="leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="rounded-2xl border border-border/50 bg-card/30 p-6 shadow-sm backdrop-blur-md sm:p-7"
              >
                <p className="leading-relaxed text-muted-foreground">{item.description}</p>
              </motion.div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}