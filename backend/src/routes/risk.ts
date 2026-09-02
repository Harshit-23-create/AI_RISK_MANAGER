import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getRiskAssessment, getRiskSummary, getModelPredictions } from '../controllers/riskController';

const router = Router();
router.use(authenticate);

router.get('/:transaction_id', getRiskAssessment);
router.get('/:transaction_id/summary', getRiskSummary);
router.get('/:transaction_id/predictions', getModelPredictions);

export default router;
