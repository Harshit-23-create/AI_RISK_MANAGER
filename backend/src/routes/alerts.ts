import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listAlerts, resolveAlert, acknowledgeAlert, escalateAlert } from '../controllers/alertController';

const router = Router();
router.use(authenticate);

router.get('/', listAlerts);
router.patch('/:id/acknowledge', acknowledgeAlert);
router.patch('/:id/resolve', resolveAlert);
router.patch('/:id/escalate', escalateAlert);

export default router;
