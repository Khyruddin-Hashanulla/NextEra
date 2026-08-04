import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrefetch } from '@/hooks/usePrefetch';

describe('usePrefetch', () => {
  it('returns a stable callback that calls the factory', () => {
    const factory = vi.fn(async () => 'data');
    const { result } = renderHook(() => usePrefetch(factory));

    expect(result.current).toBeTypeOf('function');
    act(() => result.current());
    expect(factory).toHaveBeenCalledTimes(1);

    act(() => result.current());
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('recreates the callback when the factory changes', () => {
    const factoryA = vi.fn();
    const factoryB = vi.fn();
    const { result, rerender } = renderHook(({ f }) => usePrefetch(f), {
      initialProps: { f: factoryA },
    });
    const first = result.current;

    rerender({ f: factoryB });
    expect(result.current).not.toBe(first);
  });
});
