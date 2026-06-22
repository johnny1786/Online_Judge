export function createHealthController({ databaseHealth, redisHealth, workerHealth }) {
  const check = (name, healthy) => ({ name, status: healthy ? 'ok' : 'unavailable' });

  const overall = async (_req, res, next) => {
    try {
      const [database, redis, worker] = await Promise.all([databaseHealth(), redisHealth(), workerHealth()]);
      const services = [check('database', database), check('redis', redis), check('worker', worker)];
    const healthy = services.every((service) => service.status === 'ok');
    res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', services });
    } catch (error) {
      next(error);
    }
  };

  const component = (name, probe) => async (_req, res, next) => {
    try {
      const healthy = await probe();
      res.status(healthy ? 200 : 503).json(check(name, healthy));
    } catch (error) {
      next(error);
    }
  };

  return { overall, database: component('database', databaseHealth), redis: component('redis', redisHealth), worker: component('worker', workerHealth) };
}
