import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getDatabaseStats } from '../controllers/adminController';

const router = Router();

// Admin endpoints — require authenticated admin user
router.use(authenticate);
router.use(requireRole('admin'));

/**
 * GET /api/admin/database-stats
 * Returns collection counts, sizes, simulation status, and retention config.
 */
router.get('/database-stats', getDatabaseStats);

export default router;
