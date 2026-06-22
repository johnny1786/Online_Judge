import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp({ databaseHealth: () => true, redisHealth: () => true, workerHealth: () => true });

describe('health routes', () => {
  it('reports healthy dependencies', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok' });
    expect(response.body.services).toHaveLength(3);
  });

  it('reports an unavailable component', async () => {
    const unhealthy = createApp({ databaseHealth: () => false, redisHealth: () => true, workerHealth: () => true });
    const response = await request(unhealthy).get('/health/db');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ name: 'database', status: 'unavailable' });
  });
});
