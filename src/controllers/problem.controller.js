import {
  listProblems,
  getProblem,
  createProblem,
  updateProblem,
} from '../services/problem.service.js';

/**
 * GET /problems
 */
export async function listProblemsHandler(req, res, next) {
  try {
    const { page, limit, difficulty, tags, search } = req.query;
    const result = await listProblems({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      difficulty,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
      search,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /problems/:slug
 */
export async function getProblemHandler(req, res, next) {
  try {
    const problem = await getProblem(req.params.slug);
    res.status(200).json({ problem });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /problems (admin only)
 */
export async function createProblemHandler(req, res, next) {
  try {
    const problem = await createProblem(req.body, req.user._id);
    res.status(201).json({ problem });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /problems/:slug (admin only)
 */
export async function updateProblemHandler(req, res, next) {
  try {
    const problem = await updateProblem(req.params.slug, req.body);
    res.status(200).json({ problem });
  } catch (err) {
    next(err);
  }
}
