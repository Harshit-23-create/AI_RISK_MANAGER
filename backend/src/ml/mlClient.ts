/**
 * ML Client — HTTP interface to Python ML microservice.
 * Falls back to rule-based scoring if the ML service is unavailable.
 */
import axios from 'axios';
import { config } from '../config/env';

export interface MLPredictRequest {
  amount: number;
  previous_transaction_avg: number;
  amount_ratio: number;
  failed_attempts: number;
  transaction_frequency: number;
  account_age_days: number;
  previous_transaction_count: number;
  is_new_device: number;
  is_new_ip: number;
  request_rate: number;
  packet_size: number;
  connection_count: number;
  failed_request_count: number;
  packet_count: number;
}

export interface ShapFactor {
  feature: string;
  contribution: number;
  direction: 'increases_risk' | 'decreases_risk';
}

export interface MLPredictResponse {
  anomalyScore: number;
  supervisedScore: number;
  confidence: number;
  shapFactors: ShapFactor[];
  mlFallback: boolean;
  modelVersion: string;
}

export interface NetworkRequest {
  transaction_frequency: number;
  failed_attempts: number;
  amount: number;
  previous_transaction_avg: number;
  is_new_ip: boolean;
  is_new_device: boolean;
  ip_address?: string;
  api_endpoint?: string;
  http_method?: string;
  response_status?: number;
  user_id?: string;
}

export interface NetworkResponse {
  requestRate: number;
  failedRequests: number;
  packetSize: number;
  packetCount: number;
  connectionCount: number;
  endpoint: string;
  responseStatus: number;
  isSuspicious: boolean;
  networkRiskScore: number;
  isSimulated: boolean;
}

export interface ModelInfo {
  isolation_forest: { loaded: boolean; features: string[] };
  xgboost: { loaded: boolean; shap_available: boolean; features: string[] };
  fallback_active: boolean;
}

// ── Rule-based fallbacks (when ML service is down) ────────────────────────────

function ruleBasedAnomaly(f: MLPredictRequest): number {
  let score = 0;
  if (f.amount_ratio > 5) score += 40;
  else if (f.amount_ratio > 3) score += 20;
  score += Math.min(30, f.failed_attempts * 6);
  score += Math.min(20, f.is_new_device * 20);
  score += Math.min(10, f.is_new_ip * 10);
  return Math.min(100, Math.round(score * 100) / 100);
}

function ruleBasedSupervised(f: MLPredictRequest): number {
  let score = 0;
  score += Math.min(35, f.amount_ratio * 4);
  score += Math.min(25, f.failed_attempts * 5);
  score += Math.min(20, f.transaction_frequency * 2);
  score += f.is_new_device * 15;
  score += f.is_new_ip * 10;
  return Math.min(100, Math.round(score * 100) / 100);
}

function ruleBasedNetwork(req: NetworkRequest): NetworkResponse {
  const freq = req.transaction_frequency || 0;
  const failed = req.failed_attempts || 0;
  const amount = req.amount || 0;
  const avg = req.previous_transaction_avg || 1;

  const isSuspicious = failed >= 3 || freq > 8 || req.is_new_ip || (avg > 0 && amount / avg > 5);
  const requestRate = isSuspicious ? Math.min(100, Math.max(freq * 2.5, 15)) : Math.min(5, Math.max(freq * 1.2, 0.5));
  const failedRequests = failed * 2;
  const packetSize = Math.min(8000, 300 + (amount / 10000) * 100) * (isSuspicious ? 2.5 : 1);
  const packetCount = Math.max(2, Math.floor(requestRate));
  const connectionCount = Math.max(1, Math.floor(packetCount * 0.4));

  let netScore = 0;
  if (requestRate > 20) netScore += 40;
  else if (requestRate > 10) netScore += 20;
  if (failedRequests > 10) netScore += 30;
  else if (failedRequests > 4) netScore += 15;
  if (isSuspicious) netScore += 20;

  return {
    requestRate: Math.round(requestRate * 100) / 100,
    failedRequests,
    packetSize: Math.round(packetSize * 100) / 100,
    packetCount,
    connectionCount,
    endpoint: req.api_endpoint || '/api/v1/payments/create',
    responseStatus: req.response_status || 200,
    isSuspicious,
    networkRiskScore: Math.min(100, netScore),
    isSimulated: true,
  };
}

// ── HTTP calls to Python ML service ──────────────────────────────────────────

const mlClient = axios.create({
  baseURL: config.mlServiceUrl,
  timeout: 5000,
});

export async function predict(features: MLPredictRequest): Promise<MLPredictResponse> {
  try {
    const { data } = await mlClient.post<MLPredictResponse>('/predict', features);
    return data;
  } catch (err) {
    console.warn('[ML Client] /predict failed — using rule-based fallback:', (err as Error).message);
    const anomalyScore = ruleBasedAnomaly(features);
    const supervisedScore = ruleBasedSupervised(features);
    return {
      anomalyScore,
      supervisedScore,
      confidence: 0.65,
      shapFactors: [],
      mlFallback: true,
      modelVersion: 'rule-fallback-v1',
    };
  }
}

export async function analyzeNetwork(req: NetworkRequest): Promise<NetworkResponse> {
  try {
    const { data } = await mlClient.post<NetworkResponse>('/network', req);
    return data;
  } catch (err) {
    console.warn('[ML Client] /network failed — using local fallback:', (err as Error).message);
    return ruleBasedNetwork(req);
  }
}

export async function getModelInfo(): Promise<ModelInfo> {
  try {
    const { data } = await mlClient.get<ModelInfo>('/model-info');
    return data;
  } catch {
    return {
      isolation_forest: { loaded: false, features: [] },
      xgboost: { loaded: false, shap_available: false, features: [] },
      fallback_active: true,
    };
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    await mlClient.get('/health', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}
