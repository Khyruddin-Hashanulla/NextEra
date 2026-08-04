import { describe, expect, it } from 'vitest';
import { queryClient } from '@/api/queryClient';

describe('queryClient', () => {
  it('has sensible default query options', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.retry).toBe(1);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it('can store, read, and remove cached data', () => {
    const key = ['test', 'key'];
    queryClient.setQueryData(key, { ok: true });
    expect(queryClient.getQueryData(key)).toEqual({ ok: true });

    queryClient.invalidateQueries({ queryKey: key });
    queryClient.removeQueries({ queryKey: key });
    expect(queryClient.getQueryData(key)).toBeUndefined();
  });
});
