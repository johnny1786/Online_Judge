import { Problem } from '../models/problem.model.js';
import { Submission } from '../models/submission.model.js';
import { enqueueSubmission } from '../queues/submission.queue.js';

const PAGE_SIZE = 20;

/**
 * Create a new submission and enqueue it for judging.
 */
export async function createSubmission({ userId, problemSlug, language, code }) {
  const problem = await Problem.findOne({ slug: problemSlug, status: 'published' });
  if (!problem) {
    const err = new Error('Problem not found or not published');
    err.status = 404;
    throw err;
  }

  const submission = new Submission({
    userId,
    problemId: problem._id,
    language,
    code,
    status: 'queued',
  });
  await submission.save();

  // Enqueue asynchronously (idempotent by job ID)
  await enqueueSubmission(submission._id);

  return submission;
}

/**
 * Get a submission by ID (owner check).
 */
export async function getSubmission(id, userId) {
  const submission = await Submission.findById(id).select('+code');
  if (!submission) {
    const err = new Error('Submission not found');
    err.status = 404;
    throw err;
  }
  // Only owner or admin can view code; others get result only
  if (submission.userId.toString() !== userId.toString()) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  return submission;
}

/**
 * List submissions for a user, optionally filtered by problem.
 */
export async function listSubmissions({ userId, problemId, page = 1 }) {
  const query = { userId };
  if (problemId) query.problemId = problemId;

  const skip = (page - 1) * PAGE_SIZE;
  const [submissions, total] = await Promise.all([
    Submission.findOne
      ? Submission.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(PAGE_SIZE)
          .populate('problemId', 'slug title difficulty')
          .lean()
      : [],
    Submission.countDocuments(query),
  ]);

  return {
    submissions,
    pagination: {
      page,
      limit: PAGE_SIZE,
      total,
      pages: Math.ceil(total / PAGE_SIZE),
    },
  };
}
