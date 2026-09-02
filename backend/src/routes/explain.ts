import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { explainTransaction } from '../controllers/explainController';

const router = Router();
router.use(authenticate);
router.post('/:transaction_id', explainTransaction);

export default router;
