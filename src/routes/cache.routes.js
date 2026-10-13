import { Router } from 'express';
import { getCacheStats } from '../lib/weather.js';

export const cacheRouter = Router();

// GET /api/cache/stats
// Return the current cache statistics.
cacheRouter.get('/cache/stats', (req, res) => {
  const stats = getCacheStats();

  res.status(200).json({
    data: stats,
  });
});