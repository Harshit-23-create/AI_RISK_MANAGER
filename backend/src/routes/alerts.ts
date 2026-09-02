import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listAlerts, resolveAlert } from '../controllers/alertController';

const router = Router();
router.use(authenticate);

router.get('/', listAlerts);
router.patch('/:id/resolve', resolveAlert);

export default router;
