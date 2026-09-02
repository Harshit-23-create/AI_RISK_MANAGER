import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { startSimulation, stopSimulation, getSimulationStatus, startDemo, triggerScenario, listScenarios } from '../controllers/simulationController';

const router = Router();
router.use(authenticate);

router.post('/start', startSimulation);
router.post('/stop', stopSimulation);
router.get('/status', getSimulationStatus);
router.post('/demo', startDemo);
router.post('/scenario', triggerScenario);
router.get('/scenarios', listScenarios);

export default router;
