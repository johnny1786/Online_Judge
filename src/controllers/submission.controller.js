import {
  createSubmission,
  getSubmission,
  listSubmissions,
} from '../services/submission.service.js';

/**
 * POST /submissions
 */
export async function createSubmissionHandler(req, res, next) {
  try {
    const submission = await createSubmission({
      userId: req.user._id,
      problemSlug: req.body.problemSlug,
      language: req.body.language,
      code: req.body.code,
    });
    res.status(201).json({ submission });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /submissions/:id
 */
export async function getSubmissionHandler(req, res, next) {
  try {
    const submission = await getSubmission(req.params.id, req.user._id);
    res.status(200).json({ submission });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /submissions
 */
export async function listSubmissionsHandler(req, res, next) {
  try {
    const { problemId, page } = req.query;
    const result = await listSubmissions({
      userId: req.user._id,
      problemId,
      page: parseInt(page) || 1,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
