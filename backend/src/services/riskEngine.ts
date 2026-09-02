/**
 * Risk Engine — TypeScript port of the Python risk pipeline.
 *
 * Weights:
 *   transaction  : 0.25
 *   behavioral   : 0.25
 *   network      : 0.20
 *   ml_anomaly   : 0.15
 *   ml_supervised: 0.15
 *
 * Thresholds:
 *   0–30   ALLOW
 *   31–60  MONITOR
 *   61–80  STEP-UP
 *   81–100 BLOCK
 */
import { ITransaction } from '../models/Transaction';
import { predict, analyzeNetwork, MLPredictRequest, NetworkResponse } from '../ml/mlClient';
import { config } from '../config/env';

const WEIGHTS = {
  transaction:   0.25,
  behavioral:    0.25,
  network:       0.20,
  mlAnomaly:     0.15,
  mlSupervised:  0.15,
};

export interface RiskFactor {
  factor: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  contribution: number;
}

export interface RiskResult {
  transactionScore: number;
  behavioralScore: number;
  networkScore: number;
  mlAnomalyScore: number;
  mlSupervisedScore: number;
  finalScore: number;
  decision: 'ALLOW' | 'MONITOR' | 'STEP-UP' | 'BLOCK';
  confidence: number;
  riskFactors: RiskFactor[];
  shapValues?: Record<string, number>;
  ruleFlags: Record<string, unknown>;
  mlFallback: boolean;
  networkEvent: NetworkResponse;
}

// ── Transaction Scorer ────────────────────────────────────────────────────────

function scoreTransaction(txn: ITransaction, netEvent: NetworkResponse): { score: number; factors: RiskFactor[]; flags: Record<string, unknown> } {
  const factors: RiskFactor[] = [];
  const flags: Record<string, unknown> = {};
  let score = 0;

  const avg = txn.previousTransactionAvg || 0;
  const ratio = avg > 0 ? txn.amount / avg : 0;
  flags.amount_ratio = ratio;

  if (ratio > 20) {
    score += 55; factors.push({ factor: 'extreme_amount_deviation', description: `Amount is ${ratio.toFixed(1)}× user average (extreme)`, severity: 'CRITICAL', contribution: 55 });
  } else if (ratio > 10) {
    score += 40; factors.push({ factor: 'high_amount_deviation', description: `Amount is ${ratio.toFixed(1)}× user average`, severity: 'HIGH', contribution: 40 });
  } else if (ratio > 5) {
    score += 25; factors.push({ factor: 'elevated_amount_deviation', description: `Amount is ${ratio.toFixed(1)}× user average`, severity: 'MEDIUM', contribution: 25 });
  }

  if (txn.failedAttempts >= 10) {
    score += 35; factors.push({ factor: 'critical_failed_attempts', description: `${txn.failedAttempts} failed attempts`, severity: 'CRITICAL', contribution: 35 });
  } else if (txn.failedAttempts >= 5) {
    score += 22; factors.push({ factor: 'high_failed_attempts', description: `${txn.failedAttempts} failed attempts`, severity: 'HIGH', contribution: 22 });
  } else if (txn.failedAttempts >= 3) {
    score += 12; factors.push({ factor: 'multiple_failed_attempts', description: `${txn.failedAttempts} failed attempts`, severity: 'MEDIUM', contribution: 12 });
  }

  if (txn.responseStatus === 401 || txn.responseStatus === 403) {
    score += 10; factors.push({ factor: 'auth_error_response', description: `HTTP ${txn.responseStatus} auth error`, severity: 'MEDIUM', contribution: 10 });
  }

  flags.amount = txn.amount;
  flags.failed_attempts = txn.failedAttempts;
  return { score: Math.min(100, score), factors, flags };
}

// ── Behavioral Scorer ─────────────────────────────────────────────────────────

function scoreBehavioral(txn: ITransaction): { score: number; factors: RiskFactor[]; flags: Record<string, unknown> } {
  const factors: RiskFactor[] = [];
  const flags: Record<string, unknown> = {};
  let score = 0;

  if (txn.isNewDevice) {
    score += 25; factors.push({ factor: 'new_device', description: 'Transaction from unrecognised device', severity: 'HIGH', contribution: 25 });
  }
  if (txn.isNewIp) {
    score += 20; factors.push({ factor: 'new_ip_address', description: 'Transaction from new IP address', severity: 'MEDIUM', contribution: 20 });
  }
  if (txn.accountAgeDays < 7) {
    score += 30; factors.push({ factor: 'very_new_account', description: `Account only ${txn.accountAgeDays} days old`, severity: 'HIGH', contribution: 30 });
  } else if (txn.accountAgeDays < 30) {
    score += 15; factors.push({ factor: 'new_account', description: `Account only ${txn.accountAgeDays} days old`, severity: 'MEDIUM', contribution: 15 });
  }
  if (txn.transactionFrequency > 20) {
    score += 35; factors.push({ factor: 'very_high_frequency', description: `${txn.transactionFrequency.toFixed(1)} txns/min`, severity: 'CRITICAL', contribution: 35 });
  } else if (txn.transactionFrequency > 10) {
    score += 20; factors.push({ factor: 'high_frequency', description: `${txn.transactionFrequency.toFixed(1)} txns/min`, severity: 'HIGH', contribution: 20 });
  } else if (txn.transactionFrequency > 5) {
    score += 10; factors.push({ factor: 'elevated_frequency', description: `${txn.transactionFrequency.toFixed(1)} txns/min`, severity: 'MEDIUM', contribution: 10 });
  }

  const knownCountries = ['India', 'IN'];
  if (txn.country && !knownCountries.includes(txn.country)) {
    score += 18; factors.push({ factor: 'foreign_country', description: `Transaction from ${txn.country}`, severity: 'HIGH', contribution: 18 });
  }

  flags.is_new_device = txn.isNewDevice;
  flags.is_new_ip = txn.isNewIp;
  flags.account_age = txn.accountAgeDays;
  flags.freq = txn.transactionFrequency;
  return { score: Math.min(100, score), factors, flags };
}

// ── Network Scorer ────────────────────────────────────────────────────────────

function scoreNetwork(netEvent: NetworkResponse): { score: number; factors: RiskFactor[]; flags: Record<string, unknown> } {
  const factors: RiskFactor[] = [];
  const flags: Record<string, unknown> = {};
  let score = 0;

  if (netEvent.requestRate > 50) {
    score += 45; factors.push({ factor: 'extreme_request_rate', description: `${netEvent.requestRate.toFixed(1)} req/min`, severity: 'CRITICAL', contribution: 45 });
  } else if (netEvent.requestRate > 20) {
    score += 30; factors.push({ factor: 'high_request_rate', description: `${netEvent.requestRate.toFixed(1)} req/min`, severity: 'HIGH', contribution: 30 });
  } else if (netEvent.requestRate > 10) {
    score += 15; factors.push({ factor: 'elevated_request_rate', description: `${netEvent.requestRate.toFixed(1)} req/min`, severity: 'MEDIUM', contribution: 15 });
  }

  if (netEvent.failedRequests > 20) {
    score += 35; factors.push({ factor: 'critical_network_failures', description: `${netEvent.failedRequests} network failures`, severity: 'CRITICAL', contribution: 35 });
  } else if (netEvent.failedRequests > 10) {
    score += 20; factors.push({ factor: 'high_network_failures', description: `${netEvent.failedRequests} network failures`, severity: 'HIGH', contribution: 20 });
  }

  const suspiciousEndpointPatterns = ['/admin', '/.env', '/bulk-delete', '/batch', '/export/all', '/webhooks/override'];
  if (suspiciousEndpointPatterns.some(p => (netEvent.endpoint || '').toLowerCase().includes(p))) {
    score += 25; factors.push({ factor: 'suspicious_endpoint', description: `Access to ${netEvent.endpoint}`, severity: 'HIGH', contribution: 25 });
  }

  if (netEvent.isSuspicious) {
    score += 15; factors.push({ factor: 'suspicious_network_pattern', description: 'DPI detected suspicious network behaviour', severity: 'MEDIUM', contribution: 15 });
  }

  flags.request_rate = netEvent.requestRate;
  flags.failed_requests = netEvent.failedRequests;
  flags.is_suspicious = netEvent.isSuspicious;
  return { score: Math.min(100, score), factors, flags };
}

// ── Decision Engine ───────────────────────────────────────────────────────────

function makeDecision(score: number): 'ALLOW' | 'MONITOR' | 'STEP-UP' | 'BLOCK' {
  if (score >= config.riskStepup) return 'BLOCK';
  if (score >= config.riskMonitor) return 'STEP-UP';
  if (score >= config.riskAllow) return 'MONITOR';
  return 'ALLOW';
}

function computeConfidence(score: number): number {
  const distanceFromBoundary = Math.min(
    Math.abs(score - config.riskAllow),
    Math.abs(score - config.riskMonitor),
    Math.abs(score - config.riskStepup),
  );
  const base = 0.65;
  return Math.min(0.99, Math.round((base + distanceFromBoundary / 100) * 100) / 100);
}

function mergeFactors(...factorLists: RiskFactor[][]): RiskFactor[] {
  const seen = new Set<string>();
  const merged: RiskFactor[] = [];
  for (const list of factorLists) {
    for (const f of list) {
      if (!seen.has(f.factor)) {
        seen.add(f.factor);
        merged.push(f);
      }
    }
  }
  return merged.sort((a, b) => b.contribution - a.contribution);
}

// ── Main pipeline entry ───────────────────────────────────────────────────────

export async function computeRisk(txn: ITransaction): Promise<RiskResult> {
  // 1. Get network event from ML service (DPI simulation)
  const netEvent = await analyzeNetwork({
    transaction_frequency: txn.transactionFrequency,
    failed_attempts: txn.failedAttempts,
    amount: txn.amount,
    previous_transaction_avg: txn.previousTransactionAvg,
    is_new_ip: txn.isNewIp,
    is_new_device: txn.isNewDevice,
    ip_address: txn.ipAddress ?? undefined,
    api_endpoint: txn.apiEndpoint ?? undefined,
    http_method: txn.httpMethod ?? undefined,
    response_status: txn.responseStatus ?? undefined,
    user_id: txn.userId,
  });

  // 2. Build ML feature dict
  const avg = txn.previousTransactionAvg || 0;
  const amountRatio = avg > 0 ? txn.amount / avg : 0;

  const mlFeatures: MLPredictRequest = {
    amount: txn.amount,
    previous_transaction_avg: avg,
    amount_ratio: amountRatio,
    failed_attempts: txn.failedAttempts,
    transaction_frequency: txn.transactionFrequency,
    account_age_days: txn.accountAgeDays,
    previous_transaction_count: txn.previousTransactionCount,
    is_new_device: txn.isNewDevice ? 1 : 0,
    is_new_ip: txn.isNewIp ? 1 : 0,
    request_rate: netEvent.requestRate,
    packet_size: netEvent.packetSize,
    connection_count: netEvent.connectionCount,
    failed_request_count: netEvent.failedRequests,
    packet_count: netEvent.packetCount,
  };

  // 3. Rule-based scorers
  const { score: txnScore, factors: txnFactors, flags: txnFlags } = scoreTransaction(txn, netEvent);
  const { score: behScore, factors: behFactors, flags: behFlags } = scoreBehavioral(txn);
  const { score: netScore, factors: netFactors, flags: netFlags } = scoreNetwork(netEvent);

  // 4. ML inference
  const mlResult = await predict(mlFeatures);

  // 5. Weighted aggregate
  const finalScore = Math.min(100, Math.max(0,
    WEIGHTS.transaction  * txnScore +
    WEIGHTS.behavioral   * behScore +
    WEIGHTS.network      * netScore +
    WEIGHTS.mlAnomaly    * mlResult.anomalyScore +
    WEIGHTS.mlSupervised * mlResult.supervisedScore,
  ));

  const roundedScore = Math.round(finalScore * 100) / 100;

  // 6. Decision
  const decision = makeDecision(roundedScore);
  const confidence = computeConfidence(roundedScore);

  // 7. SHAP values (convert from ShapFactor[] to flat dict)
  let shapValues: Record<string, number> | undefined;
  if (mlResult.shapFactors.length > 0) {
    shapValues = {};
    for (const sf of mlResult.shapFactors) {
      shapValues[sf.feature] = sf.direction === 'increases_risk' ? sf.contribution / 100 : -(sf.contribution / 100);
    }
  }

  const riskFactors = mergeFactors(txnFactors, behFactors, netFactors);

  return {
    transactionScore: Math.round(txnScore * 100) / 100,
    behavioralScore: Math.round(behScore * 100) / 100,
    networkScore: Math.round(netScore * 100) / 100,
    mlAnomalyScore: mlResult.anomalyScore,
    mlSupervisedScore: mlResult.supervisedScore,
    finalScore: roundedScore,
    decision,
    confidence,
    riskFactors,
    shapValues,
    ruleFlags: { transaction: txnFlags, behavioral: behFlags, network: netFlags },
    mlFallback: mlResult.mlFallback,
    networkEvent: netEvent,
  };
}
