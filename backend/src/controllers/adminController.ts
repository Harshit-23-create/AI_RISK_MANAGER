import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { simulationService } from '../services/simulationService';
import { config } from '../config/env';
import { redis } from '../config/redis';

/**
 * GET /api/admin/database-stats
 *
 * Returns document counts, approximate sizes, indexes, and simulation status.
 * Requires: authenticated admin user.
 */
export async function getDatabaseStats(_req: AuthRequest, res: Response): Promise<void> {
  const db = mongoose.connection.db;

  if (!db || mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: 'MongoDB not connected' });
    return;
  }

  const collectionNames = [
    'users', 'transactions', 'alerts', 'networkevents',
    'riskassessments', 'modelpredictions', 'auditlogs',
  ];

  const collectionStats: Record<string, { count: number; sizeBytes: number; avgDocSizeBytes: number }> = {};
  let totalSizeBytes = 0;

  for (const name of collectionNames) {
    try {
      const stats = await db.command({ collStats: name, scale: 1 });
      collectionStats[name] = {
        count: stats.count ?? 0,
        sizeBytes: stats.size ?? 0,
        avgDocSizeBytes: stats.avgObjSize ?? 0,
      };
      totalSizeBytes += stats.size ?? 0;
    } catch {
      // Collection may not exist — return zeros
      collectionStats[name] = { count: 0, sizeBytes: 0, avgDocSizeBytes: 0 };
    }
  }

  const redisOk = redis.status === 'ready';

  res.json({
    database: db.databaseName,
    mongodbConnected: true,
    redisConnected: redisOk,
    totalSizeBytes,
    totalSizeMB: Math.round(totalSizeBytes / 1024 / 1024 * 100) / 100,
    collections: collectionStats,
    retentionConfig: {
      maxTransactionRecords: config.maxTransactionRecords,
      maxNetworkEventRecords: config.maxNetworkEventRecords,
      maxAlertRecords: config.maxAlertRecords,
      maxModelPredictionRecords: config.maxModelPredictionRecords,
      maxRiskAssessmentRecords: config.maxRiskAssessmentRecords,
    },
    simulation: simulationService.getStatus(),
    timestamp: new Date().toISOString(),
  });
}
