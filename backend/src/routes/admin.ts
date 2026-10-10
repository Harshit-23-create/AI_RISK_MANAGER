import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getDatabaseStats,
  getSettings,
  updateSettings,
  getAuditLogs,
  resetSimulationData,
} from '../controllers/adminController';

const router = Router();

// Admin endpoints — require authenticated admin user
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/database-stats', getDatabaseStats);
router.get('/settings', getSettings);
router.post('/settings', updateSettings);
router.get('/audit-logs', getAuditLogs);
router.post('/reset-data', resetSimulationData);

export default router;
