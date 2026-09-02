import { Router } from 'express';
import { getModelsStatus } from '../controllers/modelsController';

const router = Router();
router.get('/status', getModelsStatus);
export default router;
