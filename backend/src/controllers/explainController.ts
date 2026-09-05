import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Transaction } from '../models/Transaction';
import { RiskAssessment } from '../models/RiskAssessment';
import { generateExplanation } from '../services/llmService';
import { HttpError } from '../middleware/errorHandler';

export async function explainTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const txn = await Transaction.findOne({ transactionId: req.params.transaction_id }).lean();
    if (!txn) throw new HttpError(404, 'Transaction not found');

    const ra = await RiskAssessment.findOne({ transactionId: txn._id }).lean();
    if (!ra) throw new HttpError(404, 'Risk assessment not available');

    const explanation = await generateExplanation({
      transaction_id: txn.transactionId,
      risk_score: ra.finalScore,
      decision: ra.decision,
      amount: txn.amount,
      currency: txn.currency || 'INR',
      user_id: txn.userId,
      ip_address: txn.ipAddress ?? undefined,
      breakdown: {
        transaction: ra.transactionScore,
        behavioral: ra.behavioralScore,
        network: ra.networkScore,
        ml_anomaly: ra.mlAnomalyScore,
        ml_supervised: ra.mlSupervisedScore,
      },
      risk_factors: ra.riskFactors,
      shap_values: ra.shapValues ?? undefined,
    });

    await RiskAssessment.findByIdAndUpdate(ra._id, { llmExplanation: explanation });

    res.json({
      transaction_id: txn.transactionId,
      explanation,
      risk_score: ra.finalScore,
      decision: ra.decision,
    });
  } catch (err) { next(err); }
}
