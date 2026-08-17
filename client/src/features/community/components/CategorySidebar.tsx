import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FORUM_CATEGORY_META } from '@/features/community/components/ForumCategoryBadge';
import type { ForumCategory } from '@/types/community';

export function CategorySidebar({
  categories,
  activeCategory,
  onSelect,
}: {
  categories?: ForumCategory[];
  activeCategory?: string;
  onSelect: (category?: string) => void;
}) {
  return (
    <nav aria-label="Forum categories" className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        aria-current={!activeCategory ? 'page' : undefined}
        className={cn(
          'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          !activeCategory
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        )}
      >
        <span className="inline-flex items-center gap-2.5">
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          All Topics
        </span>
      </button>

      {categories?.map((category) => {
        const meta = FORUM_CATEGORY_META[category.slug];
        const Icon = meta?.icon;
        const isActive = activeCategory === category.slug;
        return (
          <button
            key={category.slug}
            type="button"
            onClick={() => onSelect(category.slug)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <span className="inline-flex min-w-0 items-center gap-2.5">
              {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
              <span className="truncate">{category.name}</span>
            </span>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums',
                isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              {category.count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}