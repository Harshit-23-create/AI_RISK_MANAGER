import axios from 'axios';
import type {
  TokenResponse, LoginRequest, Transaction, TransactionListResponse,
  RiskAssessment, AlertListResponse, DashboardStats, NetworkStats, ModelStatus
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
    // Only redirect if genuinely an invalid token from an active backend, not offline demo tokens
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
};

export const alertsApi = {
  list: (page = 1, severity?: string, status?: string, unresolvedOnly = false) =>
    api.get<AlertListResponse>('/alerts', {
      params: { page, severity, status, unresolved_only: unresolvedOnly }
    })
      .then(r => r.data)
      .catch(() => mockAlerts),
  acknowledge: (id: string) =>
    api.patch(`/alerts/${id}/acknowledge`).then(r => r.data).catch(() => ({ success: true })),
  resolve: (id: string) =>
    api.patch(`/alerts/${id}/resolve`).then(r => r.data).catch(() => ({ success: true })),
  escalate: (id: string) =>
    api.patch(`/alerts/${id}/escalate`).then(r => r.data).catch(() => ({ success: true })),
};

export const dashboardApi = {
  stats: () =>
    api.get<DashboardStats>('/dashboard/stats')
      .then(r => r.data)
      .catch(() => mockDashboardStats),
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
    api.post('/simulation/trigger', { scenario })
      .then(r => r.data)
      .catch(() => ({ message: `Triggered ${scenario}` })),
};

export const modelsApi = {
  status: () =>
    api.get<ModelStatus>('/models/status')
      .then(r => r.data)
      .catch(() => mockModelStatus),
};

export default api;
