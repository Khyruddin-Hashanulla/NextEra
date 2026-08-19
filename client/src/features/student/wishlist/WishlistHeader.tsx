import { Heart } from 'lucide-react';

interface WishlistHeaderProps {
  total?: number;
}

export function WishlistHeader({ total }: WishlistHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Student</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">Wishlist</h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
          Courses you&apos;ve saved for later.
        </p>
      </div>

      {typeof total === 'number' && (
        <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 shadow-sm">
          <Heart className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="font-bold tabular-nums text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">{total === 1 ? 'course' : 'courses'}</span>
        </div>
      )}
    </div>
  );
}