/**
 * dashboardController.ts
 *
 * Computes high-level security operations center (SOC) metrics via MongoDB
 * aggregation pipelines: transaction volumes, decision breakdowns (allow, monitor,
 * step-up, block), average risk scores, active alert tallies, and risk timeline points.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Transaction } from '../models/Transaction';
import { RiskAssessment } from '../models/RiskAssessment';
import { Alert } from '../models/Alert';

export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const [totalTxns, decisionBreakdown, avgResult, avgBreakdownResult, activeAlerts, criticalAlerts, timeline] = await Promise.all([
      Transaction.countDocuments(),
      RiskAssessment.aggregate([
        { $group: { _id: '$decision', count: { $sum: 1 } } }
      ]),
      RiskAssessment.aggregate([{ $group: { _id: null, avg: { $avg: '$finalScore' } } }]),
      RiskAssessment.aggregate([{
        $group: {
          _id: null,
          txn: { $avg: '$transactionScore' },
          beh: { $avg: '$behavioralScore' },
          net: { $avg: '$networkScore' },
          anom: { $avg: '$mlAnomalyScore' },
          sup: { $avg: '$mlSupervisedScore' },
        }
      }]),
      Alert.countDocuments({ isResolved: false }),
      Alert.countDocuments({ severity: 'CRITICAL', isResolved: false }),
      RiskAssessment.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .select('createdAt finalScore decision')
        .lean(),
    ]);

    const decisionCounts: Record<string, number> = {
      allow: 0, monitor: 0, step_up: 0, block: 0,
    };
    for (const row of decisionBreakdown) {
      const key = (row._id as string).toLowerCase().replace('-', '_');
      decisionCounts[key] = row.count;
    }

    const avgRiskScore = avgResult[0]?.avg ?? 0;
    const avgBk = avgBreakdownResult[0] || {};

    const riskTimeline = timeline.reverse().map(r => ({
      timestamp: r.createdAt.toISOString(),
      risk_score: r.finalScore,
      decision: r.decision,
    }));

    res.json({
      total_transactions: totalTxns,
      average_risk_score: Math.round(avgRiskScore * 100) / 100,
      active_alerts: activeAlerts,
      critical_alerts: criticalAlerts,
      blocked_transactions: decisionCounts.block ?? 0,
      decision_breakdown: decisionCounts,
      average_breakdown: {
        transaction: Math.round((avgBk.txn ?? 0) * 10) / 10,
        behavioral: Math.round((avgBk.beh ?? 0) * 10) / 10,
        network: Math.round((avgBk.net ?? 0) * 10) / 10,
        ml_anomaly: Math.round((avgBk.anom ?? 0) * 10) / 10,
        ml_supervised: Math.round((avgBk.sup ?? 0) * 10) / 10,
      },
      risk_timeline: riskTimeline,
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/dashboard/search?q=...
 * Global search across transactions (ID, user, IP) and alerts.
 */
export async function globalSearch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = ((req.query.q as string) || '').trim();
    if (!q) {
      res.json({ transactions: [], alerts: [] });
      return;
    }

    const regex = new RegExp(q, 'i');

    const [transactions, alerts] = await Promise.all([
      Transaction.find({
        $or: [
          { transactionId: regex },
          { userId: regex },
          { ipAddress: regex },
        ]
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean(),

      Alert.find({
        $or: [
          { title: regex },
          { message: regex },
          { alertType: regex },
        ]
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    ]);

    const txIds = transactions.map(t => String(t._id));
    const assessments = await RiskAssessment.find({ transactionId: { $in: txIds } }).lean();
    const decMap = new Map(assessments.map(a => [String(a.transactionId), a.decision]));

    res.json({
      transactions: transactions.map(t => ({
        id: String(t._id),
        transaction_id: t.transactionId,
        user_id: t.userId,
        amount: t.amount,
        currency: t.currency,
        ip_address: t.ipAddress,
        decision: decMap.get(String(t._id)) || 'ALLOW',
        timestamp: t.timestamp,
      })),
      alerts: alerts.map(a => ({
        id: String(a._id),
        title: a.title,
        severity: a.severity,
        status: a.status || (a.isResolved ? 'RESOLVED' : 'OPEN'),
        transaction_id: a.transactionId ? String(a.transactionId) : null,
        created_at: a.createdAt,
      })),
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/dashboard/analytics?range=24H|7D|30D
 * Real MongoDB aggregation of daily transaction volume and decision trends.
 */
export async function getAnalyticsData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const range = (req.query.range as string) || '7D';
    let days = 7;
    if (range === '24H') days = 1;
    if (range === '30D') days = 30;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Group transactions by date
    const dailyVolume = await Transaction.aggregate([
      { $match: { timestamp: { $gte: cutoff } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          volume: { $sum: 1 },
          amount: { $sum: '$amount' },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Group risk decisions by date
    const decisionTrends = await RiskAssessment.aggregate([
      { $match: { createdAt: { $gte: cutoff } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            decision: '$decision',
          },
          count: { $sum: 1 },
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Pivot decision trends
    const dateMap = new Map<string, { date: string; ALLOW: number; MONITOR: number; STEP_UP: number; BLOCK: number }>();
    for (const dt of decisionTrends) {
      const d = dt._id.date;
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d, ALLOW: 0, MONITOR: 0, STEP_UP: 0, BLOCK: 0 });
      }
      const entry = dateMap.get(d)!;
      const dec = (dt._id.decision || '').replace('-', '_').toUpperCase();
      if (dec === 'ALLOW') entry.ALLOW += dt.count;
      else if (dec === 'MONITOR') entry.MONITOR += dt.count;
      else if (dec === 'STEP_UP') entry.STEP_UP += dt.count;
      else if (dec === 'BLOCK') entry.BLOCK += dt.count;
    }

    res.json({
      range,
      daily_volume: dailyVolume.map(v => ({
        date: v._id,
        volume: v.volume,
        total_amount: Math.round(v.amount),
        fraud: dateMap.get(v._id)?.BLOCK || 0,
      })),
      decision_trends: Array.from(dateMap.values()),
    });
  } catch (err) { next(err); }
}
