import { memo } from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  value: number;
  size?: number;
  className?: string;
}

export const RatingStars = memo(function RatingStars({ value, size = 16, className }: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(5, value));

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role="img"
      aria-label={`Rated ${clamped.toFixed(1)} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const remainder = clamped - index;
        const Icon = remainder >= 1 ? Star : remainder >= 0.5 ? StarHalf : Star;
        return (
          <Icon
            key={index}
            style={{ width: size, height: size }}
            strokeWidth={1.5}
            className={cn(
              'shrink-0',
              remainder >= 0.5 ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-muted-foreground/30'
            )}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
});
