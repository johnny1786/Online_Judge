import { logger } from '../config/logger.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} was not found` } });
}

export function errorHandler(error, req, res, _next) {
  logger.error({ error, requestId: req.id }, 'Unhandled request error');
  const status = error.statusCode ?? 500;
  res.status(status).json({
    error: {
      code: error.code ?? 'INTERNAL_ERROR',
      message: status >= 500 ? 'An unexpected error occurred' : error.message
    },
    requestId: req.id
  });
}
