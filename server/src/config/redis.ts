import Redis, { RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let client: Redis | null = null;
let ready = false;

function buildOptions(): RedisOptions {
  const options: RedisOptions = {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: env.redisMaxRetriesPerRequest,
    connectTimeout: env.redisConnectTimeoutMs,
    retryStrategy: (times: number) => {
      return Math.min(times * 200, 5000);
    },
    db: env.redisDb,
  };

  if (env.redisPassword) {
    options.password = env.redisPassword;
  }

  const url = env.redisUrl;
  if (url.startsWith('rediss://') || env.redisTls) {
    options.tls = {};
  }

  return options;
}

export function getRedisClient(): Redis {
  if (client) return client;
  client = new Redis(env.redisUrl, buildOptions());

  client.on('ready', () => {
    ready = true;
    logger.info('Redis connected');
  });

  client.on('error', (err) => {
    ready = false;
    logger.warn(`Redis error: ${err.message}`);
  });

  client.on('close', () => {
    ready = false;
  });

  client.on('end', () => {
    ready = false;
  });

  return client;
}

export function isRedisReady(): boolean {
  return ready && !!client && client.status === 'ready';
}

export async function connectRedis(): Promise<void> {
  if (!env.redisCacheEnabled) {
    logger.info('Redis caching disabled by configuration (REDIS_CACHE_ENABLED=false)');
    return;
  }

  const clientInstance = getRedisClient();
  try {
    await clientInstance.connect();
    if (clientInstance.status === 'ready') {
      ready = true;
    }
  } catch (error) {
    ready = false;
    logger.warn('Redis connection failed. Falling back to direct database queries.');
  }
}

export async function disconnectRedis(): Promise<void> {
  if (client && client.status !== 'end') {
    try {
      await client.quit();
    } catch (error) {
      logger.warn('Error while disconnecting Redis');
    }
  }
}
