import { cacheService } from '../cache/cache.service';
import * as redisModule from '../config/redis';

jest.mock('../config/redis', () => ({
  getRedisClient: jest.fn(),
  isRedisReady: jest.fn(),
}));

const mockedIsRedisReady = redisModule.isRedisReady as jest.Mock;
const mockedGetRedisClient = redisModule.getRedisClient as jest.Mock;

describe('CacheService (memory fallback)', () => {
  beforeEach(async () => {
    await cacheService.flush();
    mockedIsRedisReady.mockReturnValue(false);
  });

  it('round-trips values through set/get and tracks hit/miss/set stats', async () => {
    const value = { id: 1, name: 'Course A', tags: ['math', 'science'] };

    expect(await cacheService.get('test:obj')).toBeNull();
    await cacheService.set('test:obj', value, { ttl: 60 });

    expect(await cacheService.get('test:obj')).toEqual(value);
    expect(await cacheService.get('test:missing')).toBeNull();

    const stats = cacheService.getStats();
    expect(stats.sets).toBe(1);
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(2);
    expect(stats.available).toBe(false);
  });

  it('supports primitives and arrays', async () => {
    await cacheService.set('test:num', 42, { ttl: 60 });
    await cacheService.set('test:str', 'hello', { ttl: 60 });
    await cacheService.set('test:arr', [1, 2, 3], { ttl: 60 });

    expect(await cacheService.get<number>('test:num')).toBe(42);
    expect(await cacheService.get<string>('test:str')).toBe('hello');
    expect(await cacheService.get<number[]>('test:arr')).toEqual([1, 2, 3]);
  });

  it('returns null for values serialized to null/undefined payloads', async () => {
    await cacheService.set('test:null', null, { ttl: 60 });
    expect(await cacheService.get('test:null')).toBeNull();
  });

  it('implements exists() and del()', async () => {
    await cacheService.set('test:del', 'value', { ttl: 60 });
    expect(await cacheService.exists('test:del')).toBe(true);
    expect(await cacheService.exists('test:nope')).toBe(false);

    await cacheService.del('test:del');
    expect(await cacheService.exists('test:del')).toBe(false);
    expect(await cacheService.get('test:del')).toBeNull();
  });

  it('expires keys after their TTL elapses', async () => {
    jest.useFakeTimers();
    try {
      await cacheService.set('test:ttl', 'temp', { ttl: 1 });
      expect(await cacheService.get('test:ttl')).toBe('temp');

      jest.advanceTimersByTime(2000);
      expect(await cacheService.get('test:ttl')).toBeNull();
      expect(await cacheService.exists('test:ttl')).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('extends a key TTL via expire() and returns false for missing keys', async () => {
    await cacheService.set('test:expire', 'value', { ttl: 1 });
    expect(await cacheService.expire('test:expire', 300)).toBe(true);
    expect(await cacheService.exists('test:expire')).toBe(true);
    expect(await cacheService.expire('test:missing', 60)).toBe(false);
  });

  it('invalidates keys matching a glob pattern without touching others', async () => {
    await cacheService.set('course:list:1', { a: 1 }, { ttl: 60 });
    await cacheService.set('course:list:2', { a: 2 }, { ttl: 60 });
    await cacheService.set('blog:list:1', { a: 3 }, { ttl: 60 });

    await cacheService.invalidatePattern('course:*');

    expect(await cacheService.exists('course:list:1')).toBe(false);
    expect(await cacheService.exists('course:list:2')).toBe(false);
    expect(await cacheService.exists('blog:list:1')).toBe(true);
    expect(cacheService.getStats().invalidations).toBeGreaterThan(0);
  });

  it('remember() caches the producer result and skips the producer on hit', async () => {
    const producer = jest.fn().mockResolvedValue({ total: 42 });

    const first = await cacheService.remember('test:remember', { ttl: 60 }, producer);
    const second = await cacheService.remember('test:remember', { ttl: 60 }, producer);

    expect(first).toEqual({ total: 42 });
    expect(second).toEqual({ total: 42 });
    expect(producer).toHaveBeenCalledTimes(1);
  });

  it('remember() bypasses cache entirely when disabled', async () => {
    const producer = jest.fn().mockResolvedValue({ page: 1 });

    await cacheService.remember('test:disabled', { ttl: 60 }, producer);
    await cacheService.remember('test:disabled', { ttl: 60 }, producer, false);

    expect(producer).toHaveBeenCalledTimes(2);
  });

  it('gzip round-trips large payloads that exceed the compression threshold', async () => {
    const large = {
      id: 'abc',
      text: 'x'.repeat(20000),
      items: Array.from({ length: 1000 }, (_, i) => ({ index: i, value: `value-${i}` })),
    };

    await cacheService.set('test:compressed', large, { ttl: 60 });
    expect(await cacheService.get('test:compressed')).toEqual(large);
  });

  it('healthCheck reports memory mode when Redis is unavailable', async () => {
    const health = await cacheService.healthCheck();
    expect(health.ok).toBe(true);
    expect(health.mode).toBe('memory');
  });

  it('flush() clears all entries and resets stats', async () => {
    await cacheService.set('test:flush1', 1, { ttl: 60 });
    await cacheService.set('test:flush2', 2, { ttl: 60 });
    await cacheService.get('test:flush1');

    await cacheService.flush();

    expect(await cacheService.exists('test:flush1')).toBe(false);
    expect(await cacheService.exists('test:flush2')).toBe(false);
    const stats = cacheService.getStats();
    expect(stats.sets).toBe(0);
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });
});

describe('CacheService (failing Redis client)', () => {
  let redisClient: Record<string, jest.Mock>;

  beforeEach(async () => {
    await cacheService.flush();
    redisClient = {
      get: jest.fn().mockRejectedValue(new Error('connection refused')),
      set: jest.fn().mockRejectedValue(new Error('connection refused')),
      exists: jest.fn().mockRejectedValue(new Error('connection refused')),
      expire: jest.fn().mockRejectedValue(new Error('connection refused')),
      del: jest.fn().mockRejectedValue(new Error('connection refused')),
      scanStream: jest.fn(),
      ping: jest.fn().mockRejectedValue(new Error('connection refused')),
      pipeline: jest.fn(),
    };
    mockedGetRedisClient.mockReturnValue(redisClient);
    mockedIsRedisReady.mockReturnValue(true);
  });

  it('falls back to the memory store when Redis operations fail', async () => {
    await cacheService.set('fail:key', { ok: true }, { ttl: 60 });

    const value = await cacheService.get<{ ok: boolean }>('fail:key');

    expect(value).toEqual({ ok: true });
    expect(redisClient.set).toHaveBeenCalled();
    expect(redisClient.get).toHaveBeenCalled();
    const stats = cacheService.getStats();
    expect(stats.errors).toBeGreaterThan(0);
    expect(stats.lastError).toContain('connection refused');
  });

  it('healthCheck reports memory mode when Redis ping fails', async () => {
    const health = await cacheService.healthCheck();
    expect(health.ok).toBe(true);
    expect(health.mode).toBe('memory');
    expect(redisClient.ping).toHaveBeenCalled();
  });
});
