import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { AxiosError } from 'axios';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { useToast } from '@/providers/ToastProvider';
import { useWishlist } from '@/hooks/useWishlist';
import type { ApiError } from '@/types/api';

interface WishlistButtonProps {
  courseId: string;
  variant?: 'icon' | 'button';
  className?: string;
}

export function WishlistButton({ courseId, variant = 'icon', className }: WishlistButtonProps) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isAuthenticated, isWishlisted, isPending, toggle } = useWishlist();

  const wishlisted = isWishlisted(courseId);
  const busy = isPending(courseId);

  const handleClick = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!isAuthenticated) {
      const current = window.location.pathname + window.location.search;
      navigate(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(current)}`);
      return;
    }
    if (busy) return;

    try {
      await toggle(courseId);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data as ApiError | undefined)?.message || 'Could not update wishlist. Please try again.'
          : 'Could not update wishlist. Please try again.';
      addToast({ title: message, variant: 'error' });
    }
  };

  if (variant === 'button') {
    return (
      <Button variant="outline" size="lg" className={cn('gap-2', className)} onClick={handleClick} disabled={busy}>
        <Heart className={cn('h-4 w-4', wishlisted && 'fill-current text-red-500')} aria-hidden="true" />
        {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={wishlisted}
      className={cn(
        'rounded-full bg-white/90 p-2 text-gray-500 shadow-sm backdrop-blur-sm transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60',
        wishlisted && 'text-red-500 opacity-100',
        className
      )}
    >
      <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} aria-hidden="true" />
    </button>
  );
}
