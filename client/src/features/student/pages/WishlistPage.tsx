import { useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AxiosError } from 'axios';
import { useToast } from '@/providers/ToastProvider';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { StaggerContainer, StaggerItem } from '@/components/common/PageTransition';
import { useWishlist } from '@/hooks/useWishlist';
import { categorizeError } from '@/lib/error-utils';
import { WishlistHeader } from '@/features/student/wishlist/WishlistHeader';
import { WishlistCourseCard } from '@/features/student/wishlist/WishlistCourseCard';
import { WishlistSkeleton } from '@/features/student/wishlist/WishlistSkeleton';
import { Heart } from 'lucide-react';
import type { ApiError } from '@/types/api';

const easeOut = [0.22, 1, 0.36, 1] as const;

function getErrorMessage(error: unknown): string {
  switch (categorizeError(error)) {
    case 'network':
      return 'We couldn\u2019t reach our servers. Check your connection and try again.';
    case 'forbidden':
      return 'You don\u2019t have permission to view this page.';
    case 'server':
      return 'Something went wrong on our end. Please try again.';
    default:
      return 'We encountered an error while loading your wishlist. Please try again.';
  }
}

export function WishlistPage() {
  const { addToast } = useToast();
  const { items, isLoading, isError, error, refetch, toggle, isPending } = useWishlist();
  const reduceMotion = useReducedMotion();

  const handleRemove = useCallback(
    async (courseId: string) => {
      if (!courseId || isPending(courseId)) return;
      try {
        await toggle(courseId);
        addToast({ title: 'Removed from wishlist', variant: 'success' });
      } catch (err) {
        const message =
          err instanceof AxiosError
            ? (err.response?.data as ApiError | undefined)?.message || 'Could not remove from wishlist. Please try again.'
            : 'Could not remove from wishlist. Please try again.';
        addToast({ title: message, variant: 'error' });
      }
    },
    [addToast, isPending, toggle]
  );

  if (isLoading) {
    return <WishlistSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState title="Could not load your wishlist" message={getErrorMessage(error)} onRetry={() => refetch()} />
    );
  }

  const fadeUp = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: easeOut },
      };

  return (
    <div className="space-y-8">
      <motion.div {...fadeUp}>
        <WishlistHeader total={items.length} />
      </motion.div>

      {items.length === 0 ? (
        <motion.div {...fadeUp}>
          <EmptyState
            icon={<Heart className="h-8 w-8 text-primary" aria-hidden="true" />}
            title="No courses saved yet"
            description="Explore our courses and save the ones you want to learn later."
            action={{ label: 'Explore Courses', href: '/courses' }}
          />
        </motion.div>
      ) : (
        <StaggerContainer>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <StaggerItem key={item._id}>
                <WishlistCourseCard
                  item={item}
                  isPending={isPending(item.course?._id ?? '')}
                  onRemove={() => handleRemove(item.course?._id ?? '')}
                />
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      )}
    </div>
  );
}