import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

export const submissionQueue = new Queue('ojx-submissions', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

/**
 * Enqueue a submission for judging.
 * Uses submissionId as the job ID for idempotency.
 */
export async function enqueueSubmission(submissionId) {
  return submissionQueue.add(
    'judge',
    { submissionId: submissionId.toString() },
    { jobId: submissionId.toString() }
  );
}
