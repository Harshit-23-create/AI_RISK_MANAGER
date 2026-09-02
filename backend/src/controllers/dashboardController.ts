import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Transaction } from '../models/Transaction';
import { RiskAssessment } from '../models/RiskAssessment';
import { Alert } from '../models/Alert';

export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const [totalTxns, decisionBreakdown, avgResult, activeAlerts, criticalAlerts, timeline] = await Promise.all([
      Transaction.countDocuments(),
      RiskAssessment.aggregate([
        { $group: { _id: '$decision', count: { $sum: 1 } } }
      ]),
      RiskAssessment.aggregate([{ $group: { _id: null, avg: { $avg: '$finalScore' } } }]),
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
      risk_timeline: riskTimeline,
    });
  } catch (err) { next(err); }
}
