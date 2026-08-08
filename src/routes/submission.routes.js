import { Router } from 'express';
import {
  createSubmissionHandler,
  getSubmissionHandler,
  listSubmissionsHandler,
} from '../controllers/submission.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate, createSubmissionSchema } from '../middlewares/validate.js';

const router = Router();

// All submission routes require authentication
router.use(authenticate);

router.post('/', validate(createSubmissionSchema), createSubmissionHandler);
router.get('/', listSubmissionsHandler);
router.get('/:id', getSubmissionHandler);

export { router as submissionRouter };
