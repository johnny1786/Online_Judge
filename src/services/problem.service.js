import { Problem } from '../models/problem.model.js';

const PAGE_SIZE = 20;

/**
 * List published problems with optional filters and pagination.
 */
export async function listProblems({ page = 1, limit = PAGE_SIZE, difficulty, tags, search } = {}) {
  const query = { status: 'published' };
  if (difficulty) query.difficulty = difficulty;
  if (tags?.length) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
  if (search) query.$text = { $search: search };

  const skip = (page - 1) * Math.min(limit, PAGE_SIZE);
  const [problems, total] = await Promise.all([
    Problem.find(query)
      .select('-testCases -description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(limit, PAGE_SIZE))
      .lean({ virtuals: false }),
    Problem.countDocuments(query),
  ]);

  return {
    problems,
    pagination: {
      page,
      limit: Math.min(limit, PAGE_SIZE),
      total,
      pages: Math.ceil(total / Math.min(limit, PAGE_SIZE)),
    },
  };
}

/**
 * Get a single published problem by slug (without private test cases).
 */
export async function getProblem(slug) {
  const problem = await Problem.findOne({ slug, status: 'published' }).select('-testCases');
  if (!problem) {
    const err = new Error('Problem not found');
    err.status = 404;
    throw err;
  }
  return problem;
}

/**
 * Get a problem by slug including its test cases (for judging use only).
 */
export async function getProblemWithTestCases(slug) {
  const problem = await Problem.findOne({ slug });
  if (!problem) {
    const err = new Error('Problem not found');
    err.status = 404;
    throw err;
  }
  return problem;
}

/**
 * Create a new problem (admin only).
 */
export async function createProblem(data, authorId) {
  const existing = await Problem.findOne({ slug: data.slug });
  if (existing) {
    const err = new Error('A problem with this slug already exists');
    err.status = 409;
    throw err;
  }

  const problem = new Problem({ ...data, authorId });
  await problem.save();
  return problem;
}

/**
 * Update a problem (admin only).
 */
export async function updateProblem(slug, updates) {
  const problem = await Problem.findOneAndUpdate(
    { slug },
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-testCases');

  if (!problem) {
    const err = new Error('Problem not found');
    err.status = 404;
    throw err;
  }
  return problem;
}
