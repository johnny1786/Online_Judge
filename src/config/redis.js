import IORedis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableReadyCheck: true
});

redis.on('error', (error) => logger.error({ error }, 'Redis connection error'));

export async function connectRedis() {
  if (redis.status === 'wait') await redis.connect();
  await redis.ping();
  logger.info('Redis connected');
}

export function redisHealth() {
  return redis.status === 'ready';
}
