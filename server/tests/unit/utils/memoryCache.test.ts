import { createMemoryCache } from '../../../src/utils/memoryCache';

describe('createMemoryCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves values', () => {
    const cache = createMemoryCache<number>();
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
  });

  it('returns undefined for a missing key', () => {
    const cache = createMemoryCache();
    expect(cache.get('missing')).toBeUndefined();
  });

  it('deletes values', () => {
    const cache = createMemoryCache<number>();
    cache.set('a', 1);
    cache.delete('a');
    expect(cache.get('a')).toBeUndefined();
  });

  it('expires entries after ttl', () => {
    const cache = createMemoryCache<number>({ ttlMs: 1000 });
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
    vi.advanceTimersByTime(1001);
    expect(cache.get('a')).toBeUndefined();
  });

  it('keeps entries before ttl', () => {
    const cache = createMemoryCache<number>({ ttlMs: 1000 });
    cache.set('a', 1);
    vi.advanceTimersByTime(999);
    expect(cache.get('a')).toBe(1);
  });

  it('defaults ttl to 60 seconds', () => {
    const cache = createMemoryCache<number>();
    cache.set('a', 1);
    vi.advanceTimersByTime(60_000);
    expect(cache.get('a')).toBeUndefined();
  });

  it('prunes expired entries when the store is full', () => {
    const cache = createMemoryCache<number>({ ttlMs: 100, maxEntries: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    vi.advanceTimersByTime(200);
    cache.set('c', 3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
  });

  it('does not evict live entries when adding under the limit', () => {
    const cache = createMemoryCache<number>({ ttlMs: 1000, maxEntries: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('overwrites an existing key', () => {
    const cache = createMemoryCache<number>();
    cache.set('a', 1);
    cache.set('a', 2);
    expect(cache.get('a')).toBe(2);
  });

  it('supports non-string values including null and false', () => {
    const cache = createMemoryCache<unknown>();
    cache.set('null', null);
    cache.set('false', false);
    expect(cache.get('null')).toBeNull();
    expect(cache.get('false')).toBe(false);
  });
});
