import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { studentApi } from '@/api/endpoints/student';
import { useAuth } from '@/providers/AuthProvider';
import { QUERY_KEYS } from '@/lib/constants';
import type { WishlistItem } from '@/types/student';

const WISHLIST_QUERY_KEY = QUERY_KEYS.student.wishlist();

function optimisticItem(courseId: string): WishlistItem {
  return {
    _id: `pending-${courseId}`,
    user: '',
    course: { _id: courseId, title: '', price: 0 },
    createdAt: new Date().toISOString(),
  };
}

export function useWishlist() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const pendingRef = useRef<Set<string>>(new Set());

  const query = useQuery<WishlistItem[]>({
    queryKey: WISHLIST_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const { data } = await studentApi.listWishlist(signal);
      return data.data ?? [];
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation<
    { wishlisted: boolean },
    Error,
    string,
    { previous: WishlistItem[]; courseId: string; wasWishlisted: boolean }
  >({
    mutationFn: async (courseId: string) => {
      const { data } = await studentApi.toggleWishlist(courseId);
      return data.data;
    },
    onMutate: async (courseId: string) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_QUERY_KEY });
      pendingRef.current.add(courseId);

      const previous = queryClient.getQueryData<WishlistItem[]>(WISHLIST_QUERY_KEY) ?? [];
      const wasWishlisted = previous.some((item) => item.course?._id === courseId);
      const next = wasWishlisted
        ? previous.filter((item) => item.course?._id !== courseId)
        : [optimisticItem(courseId), ...previous];

      queryClient.setQueryData<WishlistItem[]>(WISHLIST_QUERY_KEY, next);
      return { previous, courseId, wasWishlisted };
    },
    onError: (_error, courseId, context) => {
      if (context) {
        queryClient.setQueryData<WishlistItem[]>(WISHLIST_QUERY_KEY, context.previous);
      }
      void queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    },
    onSettled: (_data, _error, courseId) => {
      pendingRef.current.delete(courseId);
      void queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    },
  });

  const items = useMemo(() => query.data ?? [], [query.data]);

  const isWishlisted = useCallback(
    (courseId: string) => items.some((item) => item.course?._id === courseId),
    [items]
  );

  const isPending = useCallback(
    (courseId: string) =>
      pendingRef.current.has(courseId) || (mutation.isPending && mutation.variables === courseId),
    [mutation.isPending, mutation.variables]
  );

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isWishlisted,
    isPending,
    toggle: mutation.mutateAsync,
    isAuthenticated,
  };
}
