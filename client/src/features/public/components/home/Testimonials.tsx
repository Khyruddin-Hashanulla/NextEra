import { useReducedMotion, motion, type Variants } from 'framer-motion';
import { MessageSquareQuote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionHeading } from './SectionHeading';
import { TestimonialCard } from './TestimonialCard';
import type { HomeTestimonial } from './useHomePageData';

interface TestimonialsProps {
  testimonials: HomeTestimonial[];
  isLoading: boolean;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

const SKELETON_HEIGHTS = ['h-40', 'h-56', 'h-32', 'h-48', 'h-36', 'h-60', 'h-40', 'h-52'];

export function Testimonials({ testimonials, isLoading }: TestimonialsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section id="testimonials" className="py-16 sm:py-24 lg:py-28">
      <div className="container-custom">
        <SectionHeading
          eyebrow="Loved by learners"
          title="Success stories from our community"
          subtitle="Thousands of students have transformed their careers with NextEra. Here's what they say."
        />

        <div className="relative">
          <div
            className="pointer-events-none absolute -top-16 left-1/2 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-20 right-1/4 h-64 w-96 rounded-full bg-violet-500/10 blur-3xl"
            aria-hidden="true"
          />

          {isLoading ? (
            <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4" aria-hidden="true">
              {SKELETON_HEIGHTS.map((height, index) => (
                <div key={index} className="mb-6 break-inside-avoid">
                  <Skeleton className={cn('w-full rounded-2xl', height)} />
                </div>
              ))}
            </div>
          ) : testimonials.length === 0 ? (
            <EmptyState
              icon={<MessageSquareQuote className="h-8 w-8 text-muted-foreground" />}
              title="No testimonials yet"
              description="Student stories will appear here soon."
            />
          ) : (
            <motion.div
              variants={containerVariants}
              initial={reduceMotion ? false : 'hidden'}
              whileInView={reduceMotion ? undefined : 'show'}
              viewport={{ once: true, margin: '-60px' }}
              className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4"
            >
              {testimonials.map((testimonial) => (
                <motion.div
                  key={testimonial.id}
                  variants={reduceMotion ? undefined : cardVariants}
                  className="mb-6 break-inside-avoid"
                >
                  <TestimonialCard testimonial={testimonial} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
