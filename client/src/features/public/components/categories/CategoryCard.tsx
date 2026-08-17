import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryMeta } from './categoryMeta';

interface CategoryCardProps {
  name: string;
  slug: string;
  className?: string;
}

export function CategoryCard({ name, slug, className }: CategoryCardProps) {
  const { icon: Icon, description } = getCategoryMeta(name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn('h-full', className)}
    >
      <Link
        to={`/categories/${slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-20 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
          aria-hidden="true"
        />

        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary transition-colors duration-300 group-hover:border-primary/40 group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>

        <h2 className="relative mt-5 text-heading-md font-semibold text-foreground">{name}</h2>

        <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>

        <span className="relative mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary">
          Explore category
          <ArrowUpRight
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </Link>
    </motion.div>
  );
}