import axios from 'axios';
import type {
  TokenResponse, LoginRequest, Transaction, TransactionListResponse,
  RiskAssessment, AlertListResponse, DashboardStats, NetworkStats, ModelStatus
} from '../types';

// Node.js backend is on port 3000 (was 8000 for FastAPI)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<TokenResponse>('/auth/login', data).then(r => r.data),
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post<TokenResponse>('/auth/register', data).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
};

// ── Transactions ─────────────────────────────────────
export const transactionsApi = {
  list: (page = 1, pageSize = 50, decision?: string) =>
    api.get<TransactionListResponse>('/transactions', {
      params: { page, page_size: pageSize, decision }
    }).then(r => r.data),
  get: (id: string) =>
    api.get<Transaction>(`/transactions/${id}`).then(r => r.data),
};

// ── Risk ─────────────────────────────────────────────
export const riskApi = {
  get: (transactionId: string) =>
    api.get<RiskAssessment>(`/risk/${transactionId}`).then(r => r.data),
  explain: (transactionId: string) =>
    api.post<{ transaction_id: string; explanation: string; risk_score: number; decision: string }>(
      `/explain/${transactionId}`
    ).then(r => r.data),
};

// ── Alerts ───────────────────────────────────────────
export const alertsApi = {
  list: (page = 1, severity?: string, unresolvedOnly = false) =>
    api.get<AlertListResponse>('/alerts', {
      params: { page, severity, unresolved_only: unresolvedOnly }
    }).then(r => r.data),
  resolve: (id: string) =>
    api.patch(`/alerts/${id}/resolve`).then(r => r.data),
};

// ── Dashboard ─────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/dashboard/stats').then(r => r.data),
};

// ── Network ───────────────────────────────────────────
export const networkApi = {
  events: (page = 1) =>
    api.get('/network/events', { params: { page } }).then(r => r.data),
  stats: () => api.get<NetworkStats>('/network/stats').then(r => r.data),
};

// ── Simulation ────────────────────────────────────────
export const simulationApi = {
  start: (rate = 5, suspiciousRatio = 0.25) =>
    api.post('/simulation/start', null, { params: { rate, suspicious_ratio: suspiciousRatio } }).then(r => r.data),
  stop: () => api.post('/simulation/stop').then(r => r.data),
  status: () => api.get('/simulation/status').then(r => r.data),
  demo: () => api.post('/simulation/demo').then(r => r.data),
};

// ── Models ────────────────────────────────────────────
export const modelsApi = {
  status: () => api.get<ModelStatus>('/models/status').then(r => r.data),
};

export default api;
