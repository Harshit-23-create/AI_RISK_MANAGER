import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Transaction } from '../models/Transaction';
import { RiskAssessment } from '../models/RiskAssessment';
import { ModelPrediction } from '../models/ModelPrediction';
import { HttpError } from '../middleware/errorHandler';

export async function getRiskAssessment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const txn = await Transaction.findOne({ transactionId: req.params.transaction_id }).lean();
    if (!txn) throw new HttpError(404, 'Transaction not found');

    const ra = await RiskAssessment.findOne({ transactionId: txn._id }).lean();
    if (!ra) throw new HttpError(404, 'Risk assessment not yet available');

    res.json({
      id: String(ra._id),
      transaction_id: String(ra.transactionId),
      transaction_uuid: ra.transactionUuid,
      risk_score: ra.finalScore,
      decision: ra.decision,
      confidence: ra.confidence,
      transaction_score: ra.transactionScore,
      behavioral_score: ra.behavioralScore,
      network_score: ra.networkScore,
      ml_anomaly_score: ra.mlAnomalyScore,
      ml_supervised_score: ra.mlSupervisedScore,
      breakdown: {
        transaction: ra.transactionScore,
        behavioral: ra.behavioralScore,
        network: ra.networkScore,
        ml_anomaly: ra.mlAnomalyScore,
        ml_supervised: ra.mlSupervisedScore,
      },
      risk_factors: ra.riskFactors,
      shap_values: ra.shapValues ?? null,
      llm_explanation: ra.llmExplanation ?? null,
      rule_flags: ra.ruleFlags ?? null,
      ml_fallback: ra.mlFallback,
      created_at: ra.createdAt,
    });
  } catch (err) { next(err); }
}

export async function getRiskSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const txn = await Transaction.findOne({ transactionId: req.params.transaction_id }).lean();
    if (!txn) throw new HttpError(404, 'Transaction not found');

    const ra = await RiskAssessment.findOne({ transactionId: txn._id }).lean();
    if (!ra) throw new HttpError(404, 'Risk assessment not available');

    const factors = ra.riskFactors || [];
    const topFactor = factors[0]?.description ?? null;

    res.json({
      transaction_id: ra.transactionUuid,
      risk_score: ra.finalScore,
      decision: ra.decision,
      confidence: ra.confidence,
      top_factor: topFactor,
      breakdown: {
        transaction: ra.transactionScore,
        behavioral: ra.behavioralScore,
        network: ra.networkScore,
        ml_anomaly: ra.mlAnomalyScore,
        ml_supervised: ra.mlSupervisedScore,
      },
      created_at: ra.createdAt,
    });
  } catch (err) { next(err); }
}

export async function getModelPredictions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const txn = await Transaction.findOne({ transactionId: req.params.transaction_id }).lean();
    if (!txn) throw new HttpError(404, 'Transaction not found');

    const preds = await ModelPrediction.find({ transactionId: txn._id }).lean();

    res.json({
      transaction_id: req.params.transaction_id,
      predictions: preds.map(p => ({
        model: p.modelName,
        version: p.modelVersion,
        score: p.score,
        anomaly_flag: p.anomalyFlag,
        predicted_class: p.predictedClass,
        created_at: p.createdAt,
      })),
    });
  } catch (err) { next(err); }
}
