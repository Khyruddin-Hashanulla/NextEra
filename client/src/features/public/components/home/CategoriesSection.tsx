import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
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

export function CategoriesSection({ categories, isLoading, className }: CategoriesSectionProps) {
  return (
    <section id="categories" className={className}>
      <div className="container-custom">
        <SectionHeading
          eyebrow="Browse by topic"
          title="Explore top categories"
          subtitle="Discover courses across the skills that matter most — from programming to design and business."
        />

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <motion.ul
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <motion.li
                  key={category.name}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
                  }}
                >
                  <Link
                    to={ROUTES.COURSES}
                    className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-110',
                        category.gradient
                      )}
                    >
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                        {category.name}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {category.description}
                      </span>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        {category.courseCount > 0
                          ? `${category.courseCount} course${category.courseCount === 1 ? '' : 's'}`
                          : 'Explore courses'}
                        <ArrowUpRight
                          className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </div>
    </section>
  );
}
