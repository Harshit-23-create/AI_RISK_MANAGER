import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { simulationService, NAMED_SCENARIOS } from '../services/simulationService';
import { HttpError } from '../middleware/errorHandler';
import { config } from '../config/env';
import { z } from 'zod';

const scenarioSchema = z.object({ scenario: z.string() });

const startSchema = z.object({
  rate: z.number().int().min(1).max(50).optional(),
  suspicious_ratio: z.number().min(0).max(1).optional(),
}).optional();

export async function startSimulation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (simulationService.isRunning) {
      res.json({ message: 'Simulation already running', ...simulationService.getStatus() });
      return;
    }

    // Accept from both query params (legacy) and request body
    const rate = parseInt(req.query.rate as string || String(req.body?.rate || '2'));
    const suspicious_ratio = parseFloat(req.query.suspicious_ratio as string || String(req.body?.suspicious_ratio || '0.25'));

    console.log(`[SIMULATION] Manual start requested: rate=${rate} suspicious_ratio=${suspicious_ratio}`);
    simulationService.stop();
    simulationService.setParams(rate, suspicious_ratio, false);
    simulationService.run().catch(err => console.error('[SIMULATION] run error:', err));

    res.json({
      message: 'Simulation started',
      rate: simulationService.rate,
      suspicious_ratio: simulationService.suspiciousRatio,
      max_records: config.maxSimulatedTransactions,
      interval_ms: config.simulationIntervalMs,
    });
  } catch (err) { next(err); }
}

export async function stopSimulation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    console.log('[SIMULATION] Manual stop requested.');
    simulationService.stop();
    res.json({ message: 'Simulation stopped', ...simulationService.getStatus() });
  } catch (err) { next(err); }
}

export async function getSimulationStatus(req: AuthRequest, res: Response): Promise<void> {
  res.json(simulationService.getStatus());
}

export async function startDemo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    console.log('[SIMULATION] Demo mode start requested.');
    simulationService.stop();
    await new Promise(r => setTimeout(r, 200)); // brief pause to let stop propagate
    simulationService.setParams(2, 0.0, true);
    simulationService.run().catch(err => console.error('[Demo] run error:', err));
    res.json({
      message: 'Demo mode started',
      rate: 2,
      max_records: config.maxSimulatedTransactions,
      interval_ms: config.simulationIntervalMs,
      scenarios: ['demo_normal', 'demo_suspicious', 'demo_api_burst'],
    });
  } catch (err) { next(err); }
}

export async function triggerScenario(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { scenario } = scenarioSchema.parse(req.body);
    const scenarioLower = scenario.toLowerCase();
    if (!NAMED_SCENARIOS.includes(scenarioLower)) {
      throw new HttpError(400, `Unknown scenario '${scenario}'. Valid: ${NAMED_SCENARIOS.join(', ')}`);
    }

    const { createTransactionWithRisk } = await import('../services/transactionService');
    const payload = simulationService.generateScenario(scenarioLower);
    const txn = await createTransactionWithRisk(payload);

    console.log(`[SIMULATION] Single scenario '${scenarioLower}' triggered: ${txn.transactionId}`);

    res.json({
      message: `Scenario '${scenarioLower}' executed`,
      transaction_id: txn.transactionId,
      amount: txn.amount,
      user_id: txn.userId,
      scenario_label: txn.scenarioLabel,
      status: txn.status,
    });
  } catch (err) { next(err); }
}

export async function listScenarios(_req: Request, res: Response): Promise<void> {
  res.json({
    scenarios: [
      { name: 'normal_payment',           description: 'Standard low-risk payment within user history' },
      { name: 'unusual_amount',           description: 'Scenario A: 5–20× user\'s historical average' },
      { name: 'new_device',               description: 'Scenario C: Transaction from unrecognised device' },
      { name: 'suspicious_ip',            description: 'Scenario D: Transaction from foreign/suspicious IP' },
      { name: 'multiple_failed_attempts', description: 'Scenario B: Many failed auth attempts before success' },
      { name: 'api_burst',                description: 'Scenario E: Abnormal request frequency (bot traffic)' },
      { name: 'high_risk_payment',        description: 'Scenario F: Combined attack — all signals elevated' },
    ],
  });
}
