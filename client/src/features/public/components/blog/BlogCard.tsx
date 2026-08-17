import { memo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock } from 'lucide-react';
import { cn, formatDate, getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { BlogPost } from '@/types/blog';

interface BlogCardProps {
  blog: BlogPost;
  className?: string;
}

/** Glass blog article card: 16:9 image with gradient overlay, category
 *  badges and a hover "Read Article" action, plus a clean title/excerpt
 *  body with author, published date and reading time. Links to the detail
 *  page. Data is sourced entirely from the existing Blog API types. */
export const BlogCard = memo(function BlogCard({ blog, className }: BlogCardProps) {
  const href = `/blog/${blog.slug}`;
  const categories = blog.categories ?? [];
  const authorName = blog.author?.name || 'NextEra';

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md',
        'transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10',
        className
      )}
    >
      <Link
        to={href}
        aria-label={`Read article: ${blog.title}`}
        className="flex h-full flex-col rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <OptimizedImage
            src={blog.featuredImage?.url || '/images/blog.jpg'}
            alt={`${blog.title} featured image`}
            placeholderType="blog"
            fallbackSrc="/images/blog.jpg"
            containerClassName="h-full w-full"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Gradient overlay */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40"
            aria-hidden="true"
          />

          {/* Category badges */}
          {categories.length > 0 && (
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
              {categories.slice(0, 2).map((cat) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="bg-background/50 backdrop-blur-sm hover:bg-background/80"
                >
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          {/* Read Article overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-background/20 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
            aria-hidden="true"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Read Article
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="space-y-2">
            <h3 className="line-clamp-2 break-words text-xl font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
              {blog.title}
            </h3>
            {blog.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{blog.excerpt}</p>}
          </div>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/50 pt-4">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-8 w-8 shrink-0 border border-border/50">
                <AvatarImage src={blog.author?.avatar?.url} alt={`Profile photo of ${authorName}`} />
                <AvatarFallback className="bg-muted text-xs font-semibold text-primary">
                  {getInitials(authorName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col text-xs">
                <span className="truncate font-medium text-foreground">{authorName}</span>
                <span className="truncate text-muted-foreground">
                  {formatDate(blog.publishedAt || blog.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span>{blog.readingTime} min read</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
});