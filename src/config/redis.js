import IORedis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

const isTls = env.REDIS_URL.startsWith('rediss://');

export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
});

redis.on('error', (error) => logger.error({ error }, 'Redis connection error'));

export async function connectRedis() {
  if (redis.status !== 'ready') {
    await new Promise((resolve, reject) => {
      if (redis.status === 'ready') return resolve();
      redis.once('ready', resolve);
      redis.once('error', reject);
    });
  }
  await redis.ping();
  logger.info('Redis connected');
}

export function redisHealth() {
  return redis.status === 'ready';
}

export async function disconnectRedis() {
  await redis.quit();
  logger.info('Redis disconnected');
}
