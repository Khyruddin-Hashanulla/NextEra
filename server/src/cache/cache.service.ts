import zlib from 'zlib';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { getRedisClient, isRedisReady } from '../config/redis';

export interface CacheSetOptions {
  ttl: number;
  compress?: boolean;
}

export interface CacheHealth {
  ok: boolean;
  mode: 'redis' | 'memory';
  latencyMs: number;
  memoryEntries: number;
}

export interface CacheStats {
  available: boolean;
  hits: number;
  misses: number;
  errors: number;
  sets: number;
  deletes: number;
  invalidations: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
  lastError?: string;
}

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

export class CacheService {
  private hits = 0;
  private misses = 0;
  private errors = 0;
  private sets = 0;
  private deletes = 0;
  private invalidations = 0;
  private totalLatencyMs = 0;
  private latencySamples = 0;
  private lastError: string | undefined;

  private readonly memoryStore = new Map<string, MemoryEntry>();

  private isEnabled(): boolean {
    return env.redisCacheEnabled && isRedisReady();
  }

  private prefix(key: string): string {
    return `${env.redisKeyPrefix}${key}`;
  }

  private trackLatency(startMs: number): void {
    this.totalLatencyMs += Date.now() - startMs;
    this.latencySamples += 1;
  }

  private recordError(error: unknown): void {
    this.errors += 1;
    this.lastError = error instanceof Error ? error.message : String(error);
    logger.warn(`Cache operation failed (falling back to memory): ${this.lastError}`);
  }

  // ─── Serialization ────────────────────────────────────────────
  private serialize(value: unknown, options: CacheSetOptions): string {
    let json = JSON.stringify(value);
    const shouldCompress =
      (options.compress === undefined ? env.redisCompressionEnabled : options.compress) &&
      json.length >= env.redisCompressionThresholdBytes;

    if (shouldCompress) {
      const compressed = zlib.gzipSync(json);
      return `c:${compressed.toString('base64')}`;
    }
    return `j:${json}`;
  }

  private deserialize(raw: string): unknown {
    if (raw.startsWith('c:')) {
      const decompressed = zlib.gunzipSync(Buffer.from(raw.slice(2), 'base64'));
      return JSON.parse(decompressed.toString('utf8'));
    }
    if (raw.startsWith('j:')) {
      return JSON.parse(raw.slice(2));
    }
    return JSON.parse(raw);
  }

  // ─── Memory fallback store ────────────────────────────────────
  private memorySet(key: string, value: string, ttl: number): void {
    this.memoryStore.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
  }

  private memoryGetRaw(key: string): string | null {
    const entry = this.memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }

  private memoryGet<T>(key: string): T | null {
    const raw = this.memoryGetRaw(key);
    if (raw === null) {
      this.misses += 1;
      return null;
    }
    try {
      const value = this.deserialize(raw) as T;
      this.hits += 1;
      return value;
    } catch {
      this.misses += 1;
      this.memoryStore.delete(key);
      return null;
    }
  }

  private memoryExists(key: string): boolean {
    return this.memoryGetRaw(key) !== null;
  }

  private memoryExpire(key: string, ttl: number): boolean {
    const entry = this.memoryStore.get(key);
    if (!entry) return false;
    entry.expiresAt = Date.now() + ttl * 1000;
    return true;
  }

  private memoryDelete(key: string): void {
    this.memoryStore.delete(key);
  }

  private memoryFlush(): void {
    this.memoryStore.clear();
  }

  private memoryPatternDelete(pattern: string): void {
    const regex = this.globToRegExp(pattern);
    for (const key of Array.from(this.memoryStore.keys())) {
      if (regex.test(key)) {
        this.memoryStore.delete(key);
      }
    }
  }

  private globToRegExp(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`);
  }

  private async redisPatternDelete(pattern: string): Promise<void> {
    const client = getRedisClient();
    const stream = client.scanStream({ match: pattern, count: 100 });
    const keys: string[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: string[]) => {
        keys.push(...chunk);
      });
      stream.on('end', () => resolve());
      stream.on('error', (err) => reject(err));
    });

    for (let i = 0; i < keys.length; i += 500) {
      const batch = keys.slice(i, i + 500);
      const pipeline = client.pipeline();
      batch.forEach((key) => pipeline.del(key));
      await pipeline.exec();
    }
  }

  // ─── Public API ───────────────────────────────────────────────
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.prefix(key);

    if (this.isEnabled()) {
      const start = Date.now();
      try {
        const raw = await getRedisClient().get(fullKey);
        this.trackLatency(start);
        if (raw === null || raw === undefined) {
          this.misses += 1;
          return null;
        }
        this.hits += 1;
        try {
          return this.deserialize(raw) as T;
        } catch {
          this.misses += 1;
          return null;
        }
      } catch (error) {
        this.recordError(error);
        return this.memoryGet<T>(fullKey);
      }
    }

    return this.memoryGet<T>(fullKey);
  }

  async set<T>(key: string, value: T, options: CacheSetOptions): Promise<void> {
    const fullKey = this.prefix(key);
    const raw = this.serialize(value, options);

    if (this.isEnabled()) {
      try {
        await getRedisClient().set(fullKey, raw, 'EX', options.ttl);
        this.sets += 1;
        return;
      } catch (error) {
        this.recordError(error);
      }
    }

    this.memorySet(fullKey, raw, options.ttl);
    this.sets += 1;
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = this.prefix(key);

    if (this.isEnabled()) {
      try {
        const result = await getRedisClient().exists(fullKey);
        return result === 1;
      } catch (error) {
        this.recordError(error);
      }
    }

    return this.memoryExists(fullKey);
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    const fullKey = this.prefix(key);

    if (this.isEnabled()) {
      try {
        const result = await getRedisClient().expire(fullKey, ttl);
        return result === 1;
      } catch (error) {
        this.recordError(error);
      }
    }

    return this.memoryExpire(fullKey, ttl);
  }

  async del(key: string): Promise<void> {
    const fullKey = this.prefix(key);
    this.deletes += 1;

    if (this.isEnabled()) {
      try {
        await getRedisClient().del(fullKey);
        return;
      } catch (error) {
        this.recordError(error);
      }
    }

    this.memoryDelete(fullKey);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const fullPattern = this.prefix(pattern);
    this.invalidations += 1;

    if (this.isEnabled()) {
      try {
        await this.redisPatternDelete(fullPattern);
        return;
      } catch (error) {
        this.recordError(error);
      }
    }

    this.memoryPatternDelete(fullPattern);
  }

  async remember<T>(key: string, options: CacheSetOptions, producer: () => Promise<T>, enabled = true): Promise<T> {
    if (!enabled) {
      return producer();
    }

    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const value = await producer();
    if (value !== null && value !== undefined) {
      await this.set(key, value, options);
    }
    return value;
  }

  async flush(): Promise<void> {
    if (this.isEnabled()) {
      const client = getRedisClient();
      const stream = client.scanStream({ match: this.prefix('*'), count: 200 });
      const keys: string[] = [];

      try {
        await new Promise<void>((resolve, reject) => {
          stream.on('data', (chunk: string[]) => {
            keys.push(...chunk);
          });
          stream.on('end', () => resolve());
          stream.on('error', (err) => reject(err));
        });

        for (let i = 0; i < keys.length; i += 500) {
          const batch = keys.slice(i, i + 500);
          const pipeline = client.pipeline();
          batch.forEach((key) => pipeline.del(key));
          await pipeline.exec();
        }
      } catch (error) {
        this.recordError(error);
      }
    }

    this.memoryFlush();
    this.resetStats();
  }

  async healthCheck(): Promise<CacheHealth> {
    if (this.isEnabled()) {
      const start = Date.now();
      try {
        await getRedisClient().ping();
        return {
          ok: true,
          mode: 'redis',
          latencyMs: Date.now() - start,
          memoryEntries: this.memoryStore.size,
        };
      } catch (error) {
        this.recordError(error);
      }
    }

    return {
      ok: true,
      mode: 'memory',
      latencyMs: 0,
      memoryEntries: this.memoryStore.size,
    };
  }

  getStats(): CacheStats {
    const avgLatencyMs = this.latencySamples > 0 ? this.totalLatencyMs / this.latencySamples : 0;
    return {
      available: this.isEnabled(),
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      sets: this.sets,
      deletes: this.deletes,
      invalidations: this.invalidations,
      totalLatencyMs: this.totalLatencyMs,
      avgLatencyMs,
      lastError: this.lastError,
    };
  }

  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
    this.sets = 0;
    this.deletes = 0;
    this.invalidations = 0;
    this.totalLatencyMs = 0;
    this.latencySamples = 0;
    this.lastError = undefined;
  }
}

export const cacheService = new CacheService();
