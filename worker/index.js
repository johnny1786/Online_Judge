import { connectDatabase } from '../src/config/database.js';
import { connectRedis, redis } from '../src/config/redis.js';
import { logger } from '../src/config/logger.js';

async function start() {
  await Promise.all([connectDatabase(), connectRedis()]);
  const publishHeartbeat = () => redis.set('ojx:worker:heartbeat', Date.now().toString(), 'EX', 30);
  await publishHeartbeat();
  setInterval(() => publishHeartbeat().catch((error) => logger.error({ error }, 'Worker heartbeat failed')), 10000).unref();
  // Submission worker registration lands in Phase 4 with the sandbox runners.
  logger.info('Worker service ready');
}

start().catch((error) => { logger.fatal({ error }, 'Worker startup failed'); process.exit(1); });
