import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, Calendar, ChevronLeft, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShareButton } from '@/features/public/components/instructor/ShareButton';
import { cn, formatDate, getInitials } from '@/lib/utils';
import type { BlogPost } from '@/types/blog';

interface BlogDetailHeaderProps {
  blog: BlogPost;
  isBookmarked: boolean;
  isBookmarkPending: boolean;
  onToggleBookmark: () => void;
}

/** Editorial article header: back link, category badge, title, excerpt and
 *  author meta with bookmark + share actions. All data comes from the BlogPost. */
export function BlogDetailHeader({
  blog,
  isBookmarked,
  isBookmarkPending,
  onToggleBookmark,
}: BlogDetailHeaderProps) {
  const authorName = blog.author?.name || 'NextEra';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl text-left"
    >
      <Link
        to="/blog"
        className="mb-8 inline-flex items-center gap-1 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back to Blog
      </Link>

      {blog.categories?.[0] && (
        <div className="mb-4">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{blog.categories[0]}</Badge>
        </div>
      )}

      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">{blog.title}</h1>

      {blog.excerpt && (
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {blog.excerpt}
        </p>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <Avatar className="h-9 w-9 border border-border/50">
            <AvatarImage src={blog.author?.avatar?.url} alt={`Profile photo of ${authorName}`} />
            <AvatarFallback className="bg-muted text-xs font-semibold text-primary">
              {getInitials(authorName)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{authorName}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          {formatDate(blog.publishedAt || blog.createdAt)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" aria-hidden="true" />
          {blog.readingTime} min read
        </span>
        <span className="flex items-center gap-1.5">
          <Eye className="h-4 w-4" aria-hidden="true" />
          {blog.readCount || 0} views
        </span>
      </div>

      <div className="mt-7 flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleBookmark}
          disabled={isBookmarkPending}
          aria-pressed={isBookmarked}
          className={cn(
            'gap-2',
            isBookmarked && 'border-primary/60 text-primary hover:border-primary hover:text-primary'
          )}
        >
          <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} aria-hidden="true" />
          {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </Button>
        <ShareButton title={blog.title} text={blog.excerpt} label="Share" />
      </div>
    </motion.div>
  );
}