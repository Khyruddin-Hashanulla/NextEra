import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/lib/constants';
import type { BlogPost } from '@/types/blog';
import { SectionHeading } from './SectionHeading';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';

interface HomeBlogSectionProps {
  blogs: BlogPost[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  className?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function HomeBlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={ROUTES.BLOG_DETAIL(post.slug)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {post.featuredImage?.url ? (
          <img
            src={post.featuredImage.url}
            alt={post.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-violet-500/15 text-primary/50">
            <FileText className="h-12 w-12" aria-hidden="true" />
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
          {post.categories?.[0] ?? 'Insights'}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="truncate">{post.author?.name ?? 'NextEra Team'}</span>
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {post.readingTime ?? 5} min read · {formatDate(post.publishedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function HomeBlogSection({ blogs, isLoading, isError, onRetry, className }: HomeBlogSectionProps) {
  return (
    <section id="insights" className={className}>
      <div className="container-custom">
        <SectionHeading
          eyebrow="From the blog"
          title="Learning insights & industry trends"
          subtitle="Practical guides, career tips, and product updates to keep you ahead of the curve."
        />

        {isError ? (
          <ErrorState
            title="Could not load articles"
            message="We had trouble fetching the latest posts. Please try again."
            onRetry={onRetry}
          />
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8 text-muted-foreground" />}
            title="No articles yet"
            description="Check back soon for fresh insights from our community."
          />
        ) : (
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            {blogs.map((post) => (
              <motion.div
                key={post._id}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
                }}
              >
                <HomeBlogCard post={post} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link to={ROUTES.BLOG}>
              View all articles <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
