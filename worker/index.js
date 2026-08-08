import { Worker } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { connectRedis, redis, disconnectRedis } from '../src/config/redis.js';
import { logger } from '../src/config/logger.js';
import { processSubmission } from './processors/submission.processor.js';

const WORKER_ID = randomUUID();
const HEARTBEAT_KEY = `ojx:workers:${WORKER_ID}`;
const SHARED_HEARTBEAT_KEY = 'ojx:worker:heartbeat'; // kept for /health/worker compatibility

let heartbeatInterval = null;
let bullWorker = null;

async function start() {
  await Promise.all([connectDatabase(), connectRedis()]);

  // Per-worker heartbeat (and shared legacy key)
  const publishHeartbeat = async () => {
    const now = Date.now().toString();
    await Promise.all([
      redis.set(HEARTBEAT_KEY, now, 'EX', 30),
      redis.set(SHARED_HEARTBEAT_KEY, now, 'EX', 30),
    ]);
  };

  await publishHeartbeat();
  heartbeatInterval = setInterval(
    () => publishHeartbeat().catch((err) => logger.error({ err }, 'Heartbeat failed')),
    10000
  );

  // BullMQ worker: consumes the submission judging queue
  bullWorker = new Worker(
    'ojx-submissions',
    async (job) => {
      logger.info({ jobId: job.id, submissionId: job.data.submissionId }, 'Processing submission job');
      await processSubmission(job, null); // io is null in worker; Socket.IO emit is via Redis pub/sub in full prod
    },
    {
      connection: redis,
      concurrency: 2, // Process 2 submissions in parallel per worker instance
    }
  );

  bullWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Job completed');
  });

  bullWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Job failed');
  });

  bullWorker.on('error', (err) => {
    logger.error({ err }, 'BullMQ worker error');
  });

  logger.info({ workerId: WORKER_ID }, 'Worker service ready');
}

async function shutdown(signal) {
  logger.info({ signal, workerId: WORKER_ID }, 'Worker shutdown signal received');

  // Stop accepting new jobs
  if (bullWorker) {
    await bullWorker.close();
    logger.info('BullMQ worker closed');
  }

  // Stop heartbeat
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  // Remove worker heartbeat keys from Redis
  try {
    await Promise.all([redis.del(HEARTBEAT_KEY), redis.del(SHARED_HEARTBEAT_KEY)]);
  } catch {
    // Best effort
  }

  await Promise.all([disconnectDatabase(), disconnectRedis()]);
  logger.info('Worker exiting cleanly');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((err) => {
  logger.fatal({ err }, 'Worker startup failed');
  process.exit(1);
});
