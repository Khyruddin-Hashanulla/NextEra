export interface CacheStore<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  delete(key: string): void;
}

export interface MemoryCacheOptions {
  ttlMs?: number;
  maxEntries?: number;
}

export function createMemoryCache<T = unknown>(options?: MemoryCacheOptions): CacheStore<T> {
  const ttlMs = options?.ttlMs ?? 60_000;
  const maxEntries = options?.maxEntries ?? 10_000;
  const store = new Map<string, { value: T; expiresAt: number }>();

  function pruneExpired(): void {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) store.delete(key);
    }
  }

  return {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: string, value: T): void {
      if (store.size >= maxEntries) pruneExpired();
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
    delete(key: string): void {
      store.delete(key);
    },
  };
}
