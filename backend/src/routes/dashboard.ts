import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getDashboardStats, globalSearch, getAnalyticsData } from '../controllers/dashboardController';

const router = Router();
router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/search', globalSearch);
router.get('/analytics', getAnalyticsData);

export default router;
