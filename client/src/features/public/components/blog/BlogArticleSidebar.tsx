import { Calendar, Clock, Eye, FolderOpen, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ShareButton } from '@/features/public/components/instructor/ShareButton';
import { formatDate } from '@/lib/utils';
import type { BlogPost } from '@/types/blog';

interface BlogArticleSidebarProps {
  blog: BlogPost;
}

/** Sticky sidebar with real article facts (categories, tags, date, reading
 *  time, views) plus a share action. Replaces the previous hardcoded table of
 *  contents with data-backed information. */
export function BlogArticleSidebar({ blog }: BlogArticleSidebarProps) {
  const categories = blog.categories ?? [];
  const tags = blog.tags ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-card/30 p-5 backdrop-blur-md">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Article Information
        </h2>
        <dl className="space-y-4 text-sm">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <dt className="text-xs text-muted-foreground">Published</dt>
              <dd className="font-medium text-foreground">{formatDate(blog.publishedAt || blog.createdAt)}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <dt className="text-xs text-muted-foreground">Reading time</dt>
              <dd className="font-medium text-foreground">{blog.readingTime} min read</dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Eye className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <dt className="text-xs text-muted-foreground">Views</dt>
              <dd className="font-medium text-foreground">{blog.readCount || 0}</dd>
            </div>
          </div>
        </dl>

        {categories.length > 0 && (
          <div className="mt-5 border-t border-border/50 pt-4">
            <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge key={cat} variant="secondary">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-5 border-t border-border/50 pt-4">
            <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Tag className="h-3.5 w-3.5" aria-hidden="true" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-full">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/30 p-5 backdrop-blur-md">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Share this article</h2>
        <ShareButton
          title={blog.title}
          text={blog.excerpt}
          label="Share"
          className="w-full justify-center"
        />
      </div>
    </div>
  );
}