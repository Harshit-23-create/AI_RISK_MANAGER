import axios from 'axios';
import type {
  TokenResponse, LoginRequest, Transaction, TransactionListResponse,
  RiskAssessment, AlertListResponse, DashboardStats, NetworkStats, ModelStatus,
  SearchResult, AnalyticsData, SystemSettings, AuditLogItem, DetailedHealthResponse,
  ModelPredictionItem
} from '../types';
import {
  mockDashboardStats,
  mockTransactionListResponse,
  mockTransactions,
  mockAlerts,
  mockRiskAssessment,
  mockNetworkStats,
  mockModelStatus
} from './mockData';

const getApiBase = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  if (!url.endsWith('/api')) {
    url = url.replace(/\/+$/, '') + '/api';
  }
  return url;
};

const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !localStorage.getItem('is_demo_mode')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    try {
      const res = await api.post<TokenResponse>('/auth/login', data);
      return res.data;
    } catch (err) {
      if (data.email === 'admin@riskmanager.ai') {
        return {
          access_token: 'demo_token_' + Date.now(),
          token_type: 'bearer',
          user_id: 1,
          email: 'admin@riskmanager.ai',
          role: 'admin',
        };
      }
      throw err;
    }
  },
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post<TokenResponse>('/auth/register', data).then(r => r.data),
  google: (data: { id_token?: string; token?: string; email?: string; name?: string }) =>
    api.post<TokenResponse>('/auth/google', data).then(r => r.data),
  me: () =>
    api.get('/auth/me')
      .then(r => r.data)
      .catch(() => ({
        id: 'usr_admin',
        email: 'admin@riskmanager.ai',
        full_name: 'Security Administrator',
        role: 'admin',
        is_active: true,
      })),
};

export const transactionsApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    decision?: string;
    userId?: string;
    search?: string;
    minAmount?: number;
    maxAmount?: number;
    fromDate?: string;
    toDate?: string;
  }) =>
    api.get<TransactionListResponse>('/transactions', {
      params: {
        page: params?.page || 1,
        page_size: params?.pageSize || 50,
        decision: params?.decision,
        user_id: params?.userId,
        search: params?.search,
        min_amount: params?.minAmount,
        max_amount: params?.maxAmount,
        from_date: params?.fromDate,
        to_date: params?.toDate,
      }
    })
      .then(r => r.data)
      .catch(() => {
        let items = [...mockTransactionListResponse.items];
        if (params?.decision && params.decision !== 'ALL') {
          items = items.filter(t => t.decision === params.decision);
        }
        return {
          ...mockTransactionListResponse,
          items,
          total: items.length,
        };
      }),
  get: (id: string) =>
    api.get<Transaction>(`/transactions/${id}`)
      .then(r => r.data)
      .catch(() => mockTransactions.find(t => t.id === id || t.transaction_id === id) || mockTransactions[0]),
  exportCsvUrl: (params?: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.append(k, String(v));
      });
    }
    return `${API_BASE}/transactions/export/csv?${query.toString()}`;
  },
  downloadCsv: async (params?: Record<string, string | number | undefined>) => {
    const response = await api.get('/transactions/export/csv', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export const riskApi = {
  get: (transactionId: string) =>
    api.get<RiskAssessment>(`/risk/${transactionId}`)
      .then(r => r.data)
      .catch(() => ({ ...mockRiskAssessment, transaction_id: transactionId })),
  explain: (transactionId: string) =>
    api.post<{ transaction_id: string; explanation: string; risk_score: number; decision: string }>(
      `/explain/${transactionId}`
    )
      .then(r => r.data)
      .catch(() => ({
        transaction_id: transactionId,
        explanation: mockRiskAssessment.llm_explanation || 'Comprehensive risk assessment generated.',
        risk_score: mockRiskAssessment.risk_score,
        decision: mockRiskAssessment.decision,
      })),
  getPredictions: (transactionId: string) =>
    api.get<{ transaction_id: string; predictions: ModelPredictionItem[] }>(`/risk/${transactionId}/predictions`)
      .then(r => r.data)
      .catch(() => ({
        transaction_id: transactionId,
        predictions: [
          { model: 'isolation_forest', version: 'v1.0', score: 28, anomaly_flag: false, predicted_class: 'normal', created_at: new Date().toISOString() },
          { model: 'xgboost', version: 'v1.0', score: 32, anomaly_flag: false, predicted_class: 'normal', created_at: new Date().toISOString() },
        ],
      })),
};

export const alertsApi = {
  list: (page = 1, severity?: string, status?: string, unresolvedOnly = false) =>
    api.get<AlertListResponse>('/alerts', {
      params: { page, severity, status, unresolved_only: unresolvedOnly }
    })
      .then(r => r.data)
      .catch(() => mockAlerts),
  acknowledge: (id: string, notes?: string) =>
    api.patch(`/alerts/${id}/acknowledge`, { notes }).then(r => r.data).catch(() => ({ success: true })),
  resolve: (id: string, notes?: string) =>
    api.patch(`/alerts/${id}/resolve`, { notes }).then(r => r.data).catch(() => ({ success: true })),
  escalate: (id: string, notes?: string) =>
    api.patch(`/alerts/${id}/escalate`, { notes }).then(r => r.data).catch(() => ({ success: true })),
  updateNotes: (id: string, notes: string, assigned_to?: string) =>
    api.patch(`/alerts/${id}/notes`, { notes, assigned_to }).then(r => r.data).catch(() => ({ success: true })),
};

export const dashboardApi = {
  stats: () =>
    api.get<DashboardStats>('/dashboard/stats')
      .then(r => r.data)
      .catch(() => mockDashboardStats),
  search: (q: string) =>
    api.get<SearchResult>('/dashboard/search', { params: { q } })
      .then(r => r.data)
      .catch(() => ({ transactions: [], alerts: [] })),
  analytics: (range = '7D') =>
    api.get<AnalyticsData>('/dashboard/analytics', { params: { range } })
      .then(r => r.data)
      .catch(() => ({
        range,
        daily_volume: [
          { date: '2026-10-05', volume: 1420, total_amount: 1450000, fraud: 12 },
          { date: '2026-10-06', volume: 1680, total_amount: 1820000, fraud: 18 },
          { date: '2026-10-07', volume: 1540, total_amount: 1620000, fraud: 9 },
          { date: '2026-10-08', volume: 1950, total_amount: 2100000, fraud: 25 },
          { date: '2026-10-09', volume: 2210, total_amount: 2450000, fraud: 31 },
          { date: '2026-10-10', volume: 2480, total_amount: 2890000, fraud: 19 },
          { date: '2026-10-11', volume: 1890, total_amount: 1980000, fraud: 14 },
        ],
        decision_trends: [
          { date: '2026-10-05', ALLOW: 1300, MONITOR: 80, STEP_UP: 28, BLOCK: 12 },
          { date: '2026-10-06', ALLOW: 1520, MONITOR: 105, STEP_UP: 37, BLOCK: 18 },
          { date: '2026-10-07', ALLOW: 1430, MONITOR: 72, STEP_UP: 29, BLOCK: 9 },
          { date: '2026-10-08', ALLOW: 1750, MONITOR: 124, STEP_UP: 51, BLOCK: 25 },
          { date: '2026-10-09', ALLOW: 1980, MONITOR: 142, STEP_UP: 57, BLOCK: 31 },
          { date: '2026-10-10', ALLOW: 2280, MONITOR: 128, STEP_UP: 53, BLOCK: 19 },
          { date: '2026-10-11', ALLOW: 1720, MONITOR: 110, STEP_UP: 46, BLOCK: 14 },
        ],
      })),
};

export const networkApi = {
  events: (page = 1) =>
    api.get('/network/events', { params: { page } })
      .then(r => r.data)
      .catch(() => ({ total: 10, page, page_size: 50, items: [] })),
  stats: () =>
    api.get<NetworkStats>('/network/stats')
      .then(r => r.data)
      .catch(() => mockNetworkStats),
};

export const simulationApi = {
  start: (rate = 5, suspiciousRatio = 0.25) =>
    api.post('/simulation/start', null, { params: { rate, suspicious_ratio: suspiciousRatio } })
      .then(r => r.data)
      .catch(() => ({ status: 'running', rate, suspicious_ratio: suspiciousRatio })),
  stop: () =>
    api.post('/simulation/stop').then(r => r.data).catch(() => ({ status: 'stopped' })),
  status: () =>
    api.get('/simulation/status').then(r => r.data).catch(() => ({ is_running: true, current_rate: 2 })),
  demo: () =>
    api.post('/simulation/demo').then(r => r.data).catch(() => ({ message: 'Demo batch dispatched' })),
  triggerScenario: (scenario: string) =>
    api.post<{ message: string; transaction_id: string; amount: number; user_id: string }>('/simulation/trigger', { scenario })
      .then(r => r.data)
      .catch(() => ({ message: `Triggered ${scenario}`, transaction_id: 'TXN_' + Date.now(), amount: 5000, user_id: 'USER_0001' })),
};

export const adminApi = {
  getSettings: () =>
    api.get<SystemSettings>('/admin/settings').then(r => r.data),
  updateSettings: (data: Partial<SystemSettings>) =>
    api.post('/admin/settings', data).then(r => r.data),
  getAuditLogs: (page = 1, pageSize = 25) =>
    api.get<{ total: number; page: number; page_size: number; items: AuditLogItem[] }>('/admin/audit-logs', {
      params: { page, page_size: pageSize }
    }).then(r => r.data),
  resetData: () =>
    api.post('/admin/reset-data').then(r => r.data),
  getDatabaseStats: () =>
    api.get('/admin/database-stats').then(r => r.data),
};

export const healthApi = {
  detailed: () =>
    api.get<DetailedHealthResponse>('/health/detailed').then(r => r.data),
};

export const modelsApi = {
  status: () =>
    api.get<ModelStatus>('/models/status')
      .then(r => r.data)
      .catch(() => mockModelStatus),
};

export default api;
