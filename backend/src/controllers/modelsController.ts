import { Request, Response } from 'express';
import { getModelInfo, checkHealth } from '../ml/mlClient';

export async function getModelsStatus(_req: Request, res: Response): Promise<void> {
  const [info, healthy] = await Promise.all([getModelInfo(), checkHealth()]);
  res.json({
    ml_service_healthy: healthy,
    ml_service_url: process.env.ML_SERVICE_URL || 'http://localhost:8001',
    ...info,
  });
}
