import { Router } from 'express';
import {
  signupHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} from '../controllers/auth.controller.js';
import { validate, signupSchema, loginSchema } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';

export function createAuthRouter(authLimiter) {
  const router = Router();

  const limiter = authLimiter || ((req, res, next) => next());

  router.post('/signup', limiter, validate(signupSchema), signupHandler);
  router.post('/login', limiter, validate(loginSchema), loginHandler);
  router.post('/refresh', refreshHandler);
  router.post('/logout', logoutHandler);
  router.get('/me', authenticate, meHandler);

  return router;
}

export const authRouter = createAuthRouter;
