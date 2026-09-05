
export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  email: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  transaction_id: string;
  user_id: string;
  merchant_id: string | null;
  amount: number;
  currency: string;
  ip_address: string | null;
  device_id: string | null;
  country: string | null;
  payment_method: string | null;
  failed_attempts: number;
  transaction_frequency: number;
  account_age_days: number;
  previous_transaction_avg: number;
  previous_transaction_count: number;
  is_new_device: boolean;
  is_new_ip: boolean;
  status: string;
  decision?: Decision;
  scenario_label: string | null;
  timestamp: string;
  created_at: string;
}

export interface TransactionListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Transaction[];
}

export type Decision = 'ALLOW' | 'MONITOR' | 'STEP-UP' | 'BLOCK';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskAssessment {
  id: string;
  transaction_id: string;
  transaction_uuid: string;
  risk_score: number;
  decision: Decision;
  confidence: number;
  transaction_score: number;
  behavioral_score: number;
  network_score: number;
  ml_anomaly_score: number;
  ml_supervised_score: number;
  breakdown: {
    transaction: number;
    behavioral: number;
    network: number;
    ml_anomaly: number;
    ml_supervised: number;
  };
  risk_factors: Array<{ factor: string; description: string; severity: string; contribution: number }> | null;
  shap_values: Record<string, number> | null;
  llm_explanation: string | null;
  rule_flags: Record<string, unknown> | null;
  ml_fallback: boolean;
  created_at: string;
}

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ESCALATED';

export interface Alert {
  id: string;
  transaction_id: string | null;
  severity: Severity;
  alert_type: string;
  title: string;
  message: string;
  status?: AlertStatus;
  is_resolved: boolean;
  acknowledged_at?: string | null;
  resolved_at: string | null;
  escalated_at?: string | null;
  assigned_to?: string;
  created_at: string;
}

export interface AlertListResponse {
  total: number;
  items: Alert[];
}

export interface DashboardStats {
  total_transactions: number;
  average_risk_score: number;
  active_alerts: number;
  critical_alerts: number;
  blocked_transactions: number;
  decision_breakdown: {
    allow: number;
    monitor: number;
    step_up: number;
    block: number;
  };
  risk_timeline: Array<{ timestamp: string; risk_score: number; decision: string }>;
}

export interface RiskFeedEvent {
  type: 'risk_assessment' | 'ping';
  transaction_id?: string;
  amount?: number;
  currency?: string;
  user_id?: string;
  ip_address?: string;
  risk_score?: number;
  decision?: Decision;
  confidence?: number;
  top_factor?: string;
  timestamp?: string;
}

export interface NetworkEvent {
  id: string;
  transaction_id: string | null;
  src_ip: string | null;
  dst_ip: string | null;
  src_port: number | null;
  dst_port: number | null;
  protocol: string | null;
  packet_size: number;
  packet_count: number;
  request_count: number;
  response_count: number;
  request_frequency: number;
  connection_count: number;
  failed_request_count: number;
  payload_size: number;
  request_rate: number;
  http_method: string | null;
  endpoint: string | null;
  response_status: number | null;
  is_suspicious: boolean;
  timestamp: string;
}

export interface NetworkStats {
  total_events: number;
  suspicious_events: number;
  average_request_rate: number;
  suspicious_ips: string[];
  request_timeline: Array<{ timestamp: string; request_rate: number; is_suspicious: boolean }>;
}

export interface ModelStatus {
  ml_service_healthy: boolean;
  isolation_forest: { loaded: boolean; features: string[] };
  xgboost: { loaded: boolean; shap_available: boolean; features: string[] };
  fallback_active: boolean;
}
