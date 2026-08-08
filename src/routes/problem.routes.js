import { Router } from 'express';
import {
  listProblemsHandler,
  getProblemHandler,
  createProblemHandler,
  updateProblemHandler,
} from '../controllers/problem.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, createProblemSchema, updateProblemSchema } from '../middlewares/validate.js';

const router = Router();

// Public routes
router.get('/', listProblemsHandler);
router.get('/:slug', getProblemHandler);

// Admin-only routes
router.post('/', authenticate, authorize('admin'), validate(createProblemSchema), createProblemHandler);
router.put('/:slug', authenticate, authorize('admin'), validate(updateProblemSchema), updateProblemHandler);

export { router as problemRouter };
