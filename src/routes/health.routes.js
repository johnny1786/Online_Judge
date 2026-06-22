import { Router } from 'express';
import { createHealthController } from '../controllers/health.controller.js';

export function createHealthRouter(dependencies) {
  const controller = createHealthController(dependencies);
  return Router()
    .get('/', controller.overall)
    .get('/db', controller.database)
    .get('/redis', controller.redis)
    .get('/worker', controller.worker);
}
