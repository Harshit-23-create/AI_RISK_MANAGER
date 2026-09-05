
import { Transaction, ITransaction } from '../models/Transaction';
import { NetworkEvent } from '../models/NetworkEvent';
import { RiskAssessment } from '../models/RiskAssessment';
import { ModelPrediction } from '../models/ModelPrediction';
import { Alert } from '../models/Alert';
import { computeRisk, RiskResult } from './riskEngine';
import { wsManager } from '../websocket/wsManager';
import { redis } from '../config/redis';

export interface CreateTransactionInput {
  transactionId: string;
  userId: string;
  merchantId?: string;
  amount: number;
  currency?: string;
  timestamp?: Date;
  paymentMethod?: string;
  ipAddress?: string;
  deviceId?: string;
  country?: string;
  city?: string;
  userAgent?: string;
  apiEndpoint?: string;
  httpMethod?: string;
  responseStatus?: number;
  failedAttempts?: number;
  transactionFrequency?: number;
  accountAgeDays?: number;
  previousTransactionAvg?: number;
  previousTransactionCount?: number;
  isNewDevice?: boolean;
  isNewIp?: boolean;
  scenarioLabel?: string;
}

export async function createTransactionWithRisk(input: CreateTransactionInput): Promise<ITransaction> {

  const txn = await Transaction.create({
    ...input,
    status: 'pending',
    timestamp: input.timestamp || new Date(),
  });

  let riskResult: RiskResult;
  try {
    riskResult = await computeRisk(txn);
  } catch (err) {
    console.error('[Transaction Service] Risk pipeline failed:', err);

    riskResult = {
      transactionScore: 30, behavioralScore: 30, networkScore: 20,
      mlAnomalyScore: 20, mlSupervisedScore: 20, finalScore: 25,
      decision: 'MONITOR', confidence: 0.5, riskFactors: [],
      ruleFlags: {}, mlFallback: true,
      networkEvent: {
        requestRate: 1, failedRequests: 0, packetSize: 300,
        packetCount: 1, connectionCount: 1, endpoint: '/api/v1/payments/create',
        responseStatus: 200, isSuspicious: false, networkRiskScore: 0, isSimulated: true,
      },
    };
  }

  const ne = riskResult.networkEvent;
  const netEvent = await NetworkEvent.create({
    transactionId: txn._id,
    srcIp: txn.ipAddress,
    dstIp: '10.0.0.1',
    dstPort: 443,
    protocol: 'HTTPS',
    packetSize: ne.packetSize,
    packetCount: ne.packetCount,
    requestCount: ne.packetCount,
    responseCount: Math.max(0, ne.packetCount - ne.failedRequests),
    requestFrequency: ne.requestRate / 60,
    connectionCount: ne.connectionCount,
    failedRequestCount: ne.failedRequests,
    payloadSize: ne.packetSize * 0.7,
    requestRate: ne.requestRate,
    httpMethod: txn.httpMethod,
    endpoint: ne.endpoint,
    responseStatus: ne.responseStatus,
    isSuspicious: ne.isSuspicious,
    isSimulated: true,
  });

  await RiskAssessment.create({
    transactionId: txn._id,
    transactionUuid: txn.transactionId,
    finalScore: riskResult.finalScore,
    decision: riskResult.decision,
    confidence: riskResult.confidence,
    transactionScore: riskResult.transactionScore,
    behavioralScore: riskResult.behavioralScore,
    networkScore: riskResult.networkScore,
    mlAnomalyScore: riskResult.mlAnomalyScore,
    mlSupervisedScore: riskResult.mlSupervisedScore,
    riskFactors: riskResult.riskFactors,
    shapValues: riskResult.shapValues,
    ruleFlags: riskResult.ruleFlags,
    mlFallback: riskResult.mlFallback,
  });

  await ModelPrediction.create([
    {
      transactionId: txn._id,
      modelName: 'isolation_forest',
      modelVersion: riskResult.mlFallback ? 'fallback' : 'v1.0',
      score: riskResult.mlAnomalyScore,
      anomalyFlag: riskResult.mlAnomalyScore >= 60,
      predictedClass: riskResult.mlAnomalyScore >= 60 ? 'suspicious' : 'normal',
    },
    {
      transactionId: txn._id,
      modelName: 'xgboost',
      modelVersion: riskResult.mlFallback ? 'fallback' : 'v1.0',
      score: riskResult.mlSupervisedScore,
      anomalyFlag: riskResult.mlSupervisedScore >= 50,
      predictedClass: riskResult.mlSupervisedScore >= 75 ? 'high_risk'
        : riskResult.mlSupervisedScore >= 50 ? 'suspicious' : 'normal',
    },
  ]);

  const alerts = generateAlerts(txn, riskResult);
  if (alerts.length > 0) {
    await Alert.insertMany(alerts.map(a => ({ ...a, transactionId: txn._id })));
  }

  txn.status = 'processed';
  await txn.save();

  const topFactor = riskResult.riskFactors[0]?.description ?? null;
  const wsPayload = {
    type: 'risk_assessment',
    transaction_id: txn.transactionId,
    amount: txn.amount,
    currency: txn.currency,
    user_id: txn.userId,
    ip_address: txn.ipAddress,
    risk_score: riskResult.finalScore,
    decision: riskResult.decision,
    confidence: riskResult.confidence,
    breakdown: {
      transaction: riskResult.transactionScore,
      behavioral: riskResult.behavioralScore,
      network: riskResult.networkScore,
      ml_anomaly: riskResult.mlAnomalyScore,
      ml_supervised: riskResult.mlSupervisedScore,
    },
    top_factor: topFactor,
    scenario: txn.scenarioLabel,
    ml_fallback: riskResult.mlFallback,
    timestamp: txn.timestamp.toISOString(),
  };

  try {
    await redis.publish('risk-events', JSON.stringify(wsPayload));
  } catch (err) {
    console.error('[Transaction Service] Failed to publish to Redis:', err);

    wsManager.broadcast(wsPayload);
  }

  console.log(`[Transaction] ${txn.transactionId} score=${riskResult.finalScore} decision=${riskResult.decision} alerts=${alerts.length}`);
  return txn;
}

function generateAlerts(txn: ITransaction, risk: RiskResult) {
  const alerts: Array<{ severity: string; alertType: string; title: string; message: string }> = [];
  const { finalScore: score, decision, riskFactors: factors } = risk;

  if (decision === 'BLOCK') {
    const topDesc = factors[0]?.description ?? 'multiple risk factors';
    alerts.push({
      severity: 'CRITICAL', alertType: 'blocked_transaction',
      title: `BLOCK — Risk Score ${score.toFixed(0)}/100`,
      message: `Transaction ${txn.transactionId} from user ${txn.userId} (INR ${txn.amount.toLocaleString('en-IN')}) was BLOCKED. Primary signal: ${topDesc}.`,
    });
  } else if (decision === 'STEP-UP') {
    alerts.push({
      severity: 'HIGH', alertType: 'step_up_required',
      title: `STEP-UP Required — Risk Score ${score.toFixed(0)}/100`,
      message: `Transaction ${txn.transactionId} from user ${txn.userId} (INR ${txn.amount.toLocaleString('en-IN')}) requires additional authentication.`,
    });
  } else if (decision === 'MONITOR' && score >= 50) {
    alerts.push({
      severity: 'MEDIUM', alertType: 'monitor_flagged',
      title: `MONITOR — Risk Score ${score.toFixed(0)}/100`,
      message: `Transaction ${txn.transactionId} from user ${txn.userId} (INR ${txn.amount.toLocaleString('en-IN')}) is under monitoring.`,
    });
  }

  if (txn.failedAttempts >= 5 && decision !== 'BLOCK') {
    alerts.push({
      severity: 'HIGH', alertType: 'multiple_failed_attempts',
      title: `Multiple Failed Attempts — ${txn.failedAttempts} failures`,
      message: `User ${txn.userId} has ${txn.failedAttempts} failed payment/auth attempts from ${txn.ipAddress}.`,
    });
  }

  if (txn.transactionFrequency > 10 && decision !== 'BLOCK') {
    alerts.push({
      severity: 'MEDIUM', alertType: 'api_burst_detected',
      title: `API Burst — ${txn.transactionFrequency.toFixed(0)} txns/min`,
      message: `User ${txn.userId} is transacting at ${txn.transactionFrequency.toFixed(1)} txns/min — possible bot traffic.`,
    });
  }

  return alerts;
}
