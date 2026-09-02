import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getNetworkEvents, getNetworkStats } from '../controllers/networkController';

const router = Router();
router.use(authenticate);
router.get('/events', getNetworkEvents);
router.get('/stats', getNetworkStats);

export default router;
