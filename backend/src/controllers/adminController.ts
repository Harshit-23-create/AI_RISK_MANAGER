import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { simulationService } from '../services/simulationService';
import { config } from '../config/env';
import { redis } from '../config/redis';
import { AuditLog } from '../models/AuditLog';
import { Transaction } from '../models/Transaction';
import { RiskAssessment } from '../models/RiskAssessment';
import { NetworkEvent } from '../models/NetworkEvent';
import { Alert } from '../models/Alert';
import { ModelPrediction } from '../models/ModelPrediction';
import { z } from 'zod';

import { runtimeSettings } from '../config/runtimeConfig';

const settingsSchema = z.object({
  riskAllow: z.number().min(0).max(100).optional(),
  riskMonitor: z.number().min(0).max(100).optional(),
  riskStepup: z.number().min(0).max(100).optional(),
  weights: z.object({
    transaction: z.number().min(0).max(1).optional(),
    behavioral: z.number().min(0).max(1).optional(),
    network: z.number().min(0).max(1).optional(),
    mlAnomaly: z.number().min(0).max(1).optional(),
    mlSupervised: z.number().min(0).max(1).optional(),
  }).optional(),
});

/**
 * GET /api/admin/database-stats
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

/**
 * GET /api/admin/settings
 * Returns current risk thresholds, scoring weights, and simulation limits.
 */
export async function getSettings(_req: AuthRequest, res: Response): Promise<void> {
  res.json({
    thresholds: {
      allow: runtimeSettings.riskAllow,
      monitor: runtimeSettings.riskMonitor,
      step_up: runtimeSettings.riskStepup,
    },
    weights: runtimeSettings.weights,
    simulation: runtimeSettings.simulation,
    retention: runtimeSettings.retention,
    llmProvider: config.llmProvider,
  });
}

/**
 * POST /api/admin/settings
 * Updates risk thresholds and scoring weights, creating an audit log entry.
 */
export async function updateSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = settingsSchema.parse(req.body);

    if (parsed.riskAllow !== undefined) {
      runtimeSettings.riskAllow = parsed.riskAllow;
      config.riskAllow = parsed.riskAllow;
    }
    if (parsed.riskMonitor !== undefined) {
      runtimeSettings.riskMonitor = parsed.riskMonitor;
      config.riskMonitor = parsed.riskMonitor;
    }
    if (parsed.riskStepup !== undefined) {
      runtimeSettings.riskStepup = parsed.riskStepup;
      config.riskStepup = parsed.riskStepup;
    }
    if (parsed.weights) {
      runtimeSettings.weights = { ...runtimeSettings.weights, ...parsed.weights };
    }

    // Record audit log
    await AuditLog.create({
      userId: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
      action: 'UPDATE_SETTINGS',
      resource: 'SYSTEM_SETTINGS',
      ipAddress: req.ip || '127.0.0.1',
      metadata: parsed,
      timestamp: new Date(),
    });

    res.json({
      message: 'System settings updated successfully',
      thresholds: {
        allow: runtimeSettings.riskAllow,
        monitor: runtimeSettings.riskMonitor,
        step_up: runtimeSettings.riskStepup,
      },
      weights: runtimeSettings.weights,
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/admin/audit-logs
 * Returns paginated system audit events.
 */
export async function getAuditLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const pageSize = Math.min(100, parseInt(req.query.page_size as string || '25'));
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      AuditLog.find().sort({ timestamp: -1 }).skip(skip).limit(pageSize).populate('userId', 'email role').lean(),
      AuditLog.countDocuments(),
    ]);

    const mapped = items.map(log => ({
      id: String(log._id),
      user: log.userId ? (log.userId as any).email : 'System Admin',
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId ?? null,
      ipAddress: log.ipAddress ?? '127.0.0.1',
      metadata: log.metadata ?? {},
      timestamp: log.timestamp,
    }));

    res.json({ total, page, page_size: pageSize, items: mapped });
  } catch (err) { next(err); }
}

/**
 * POST /api/admin/reset-data
 * Safely prunes simulated and test data while preserving core accounts.
 */
export async function resetSimulationData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    simulationService.stop();

    // Delete records with scenarioLabel or created by simulation
    const [txResult, netResult] = await Promise.all([
      Transaction.deleteMany({ scenarioLabel: { $exists: true, $ne: null } }),
      NetworkEvent.deleteMany({ isSimulated: true }),
    ]);

    await AuditLog.create({
      userId: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
      action: 'PRUNE_SIMULATION_DATA',
      resource: 'DATA_MANAGEMENT',
      ipAddress: req.ip || '127.0.0.1',
      metadata: { deletedTransactions: txResult.deletedCount, deletedNetworkEvents: netResult.deletedCount },
      timestamp: new Date(),
    });

    res.json({
      message: 'Simulated telemetry pruned successfully',
      deleted_transactions: txResult.deletedCount,
      deleted_network_events: netResult.deletedCount,
    });
  } catch (err) { next(err); }
}
