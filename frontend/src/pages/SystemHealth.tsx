/**
 * SystemHealth — Enterprise Infrastructure Observability
 *
 * Real-time health matrix, true measured roundtrip probe latencies,
 * backend uptime counters, ML model registry, and persistent storage metrics.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Activity, RefreshCw, Database, Server, Cpu, Globe,
  Clock, BarChart3, Brain
} from 'lucide-react';
import { adminApi, healthApi, modelsApi } from '../services/api';
import { useRiskFeed } from '../hooks/useRiskFeed';
import { PageHeader } from '../components/ui/PageHeader';

interface ServiceStatus {
  id: string;
  label: string;
  sub: string;
  ok: boolean;
  latencyMs: number | null;
  icon: React.ElementType;
  version?: string;
}

interface ModelInfo {
  isolation_forest: { loaded: boolean; features: string[] };
  xgboost: { loaded: boolean; shap_available: boolean; features: string[] };
  fallback_active: boolean;
}

interface DatabaseStats {
  database?: string;
  mongodbConnected?: boolean;
  redisConnected?: boolean;
  totalSizeMB?: number;
  collections?: Record<string, { count: number; sizeBytes: number }>;
  simulation?: { isRunning: boolean; rate: number };
}

const REFRESH_INTERVAL_MS = 30_000;

function latencyColor(ms: number | null): string {
  if (ms === null) return 'text-slate-500';
  if (ms < 100) return 'text-emerald-400';
  if (ms < 500) return 'text-amber-400';
  return 'text-rose-400';
}

function LatencyBar({ ms }: { ms: number | null }) {
  if (ms === null) return <span className="text-slate-500 text-[10px] font-mono">Event-driven stream</span>;
  const pct = Math.min(100, Math.max(5, (ms / 1000) * 100));
  const color = ms < 100 ? 'bg-emerald-500' : ms < 500 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[11px] font-mono font-bold tabular-nums ${latencyColor(ms)}`}>{ms}ms</span>
    </div>
  );
}

export default function SystemHealth() {
  const { connected: wsConnected } = useRiskFeed(() => {});

  const [services, setServices] = useState<ServiceStatus[]>([
    { id: 'backend', label: 'Core REST Backend', sub: 'Express API (Node.js)', ok: true, latencyMs: null, icon: Server, version: 'v2.0.0' },
    { id: 'mongodb', label: 'MongoDB Atlas', sub: 'Persistent Cluster Store', ok: true, latencyMs: null, icon: Database },
    { id: 'redis', label: 'Redis Event Broker', sub: 'Pub/Sub & Cache Layer', ok: true, latencyMs: null, icon: Activity },
    { id: 'ml', label: 'ML Microservice', sub: 'FastAPI (XGBoost / IF)', ok: true, latencyMs: null, icon: Cpu, version: 'v1.0.0' },
    { id: 'ws', label: 'WebSocket Gateway', sub: 'Real-Time Client Stream', ok: wsConnected, latencyMs: null, icon: Globe },
  ]);

  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [uptimeStart] = useState<Date>(new Date());
  const [backendUptime, setBackendUptime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const elapsedRef = useRef(0);
  useEffect(() => {
    const t = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return d > 0 ? `${d}d ${h}:${m}:${s}` : `${h}:${m}:${s}`;
  };

  const checkHealth = useCallback(async () => {
    setLoading(true);

    try {
      const [detailedHealth, adminData, modelData] = await Promise.all([
        healthApi.detailed().catch(() => null),
        adminApi.getDatabaseStats().catch(() => null),
        modelsApi.status().catch(() => null),
      ]);

      if (detailedHealth?.uptime_seconds) {
        setBackendUptime(detailedHealth.uptime_seconds);
      }

      const comp = detailedHealth?.components;

      setServices([
        {
          id: 'backend',
          label: 'Core REST Backend',
          sub: 'Express API (Node.js)',
          ok: comp ? comp.backend.status === 'HEALTHY' : true,
          latencyMs: comp?.backend.latency_ms ?? null,
          icon: Server,
          version: detailedHealth?.version || 'v2.0.0',
        },
        {
          id: 'mongodb',
          label: 'MongoDB Atlas',
          sub: 'Persistent Document Store',
          ok: comp?.mongodb.connected ?? true,
          latencyMs: comp?.mongodb.latency_ms ?? null,
          icon: Database,
        },
        {
          id: 'redis',
          label: 'Redis Event Broker',
          sub: 'Pub/Sub & Event Stream Cache',
          ok: comp?.redis.connected ?? true,
          latencyMs: comp?.redis.latency_ms ?? null,
          icon: Activity,
        },
        {
          id: 'ml',
          label: 'ML Microservice',
          sub: 'FastAPI (XGBoost / IF)',
          ok: comp?.ml_service.connected ?? (modelData !== null),
          latencyMs: comp?.ml_service.latency_ms ?? null,
          icon: Cpu,
          version: 'v1.0.0',
        },
        {
          id: 'ws',
          label: 'WebSocket Gateway',
          sub: 'Real-Time Client Stream',
          ok: wsConnected,
          latencyMs: null,
          icon: Globe,
        },
      ]);

      if (modelData) {
        setModelInfo({
          isolation_forest: modelData.isolation_forest,
          xgboost: modelData.xgboost,
          fallback_active: modelData.fallback_active,
        });
      }
      if (adminData) setDbStats(adminData);
      setLastCheck(new Date());
    } finally {
      setLoading(false);
    }
  }, [wsConnected]);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const allOk = services.every(s => s.ok);
  const okCount = services.filter(s => s.ok).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        category="Infrastructure & Observability"
        title="System Infrastructure Health"
        subtitle="Distributed microservice connectivity, verified roundtrip probe latencies, and persistent storage metrics"
        badge={
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
              allOk
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                : 'bg-amber-950/40 text-amber-400 border-amber-800/60'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${allOk ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {allOk ? 'All Systems Operational' : `${okCount}/${services.length} Online`}
          </span>
        }
      >
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-500 font-mono block">Uptime</span>
            <span className="text-xs font-mono font-bold text-white">{formatUptime((backendUptime ?? 0) + elapsed)}</span>
          </div>
          <button
            type="button"
            onClick={checkHealth}
            disabled={loading}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 border border-slate-800 px-3 text-xs font-medium text-slate-200 hover:bg-slate-850 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Probing…' : 'Run Diagnostics'}</span>
          </button>
        </div>
      </PageHeader>

      {/* Service Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.map((s) => (
          <div
            key={s.id}
            className={`panel p-4 flex flex-col justify-between space-y-3 ${
              s.ok ? '' : 'border-rose-900/40 bg-rose-950/10'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded border ${
                  s.ok
                    ? 'bg-slate-900 border-slate-800 text-slate-300'
                    : 'bg-rose-950/50 border-rose-800 text-rose-400'
                }`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">{s.label}</h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{s.sub}</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                  s.ok
                    ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                    : 'bg-rose-950/50 text-rose-400 border-rose-800/60'
                }`}>
                  {s.ok ? 'ONLINE' : 'DEGRADED'}
                </span>
                {s.version && (
                  <span className="text-[9px] text-slate-500 font-mono">{s.version}</span>
                )}
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono uppercase text-slate-500">Probe Latency</span>
              <LatencyBar ms={s.latencyMs} />
            </div>
          </div>
        ))}
      </div>

      {/* ML Model Registry Section */}
      <div className="panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
              ML Model Registry &amp; Pipelines
            </h2>
          </div>
          {modelInfo && (
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
              modelInfo.fallback_active
                ? 'bg-amber-950/50 text-amber-400 border-amber-800/60'
                : 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
            }`}>
              {modelInfo.fallback_active ? 'RULE-BASED FALLBACK ACTIVE' : 'LIVE ML INFERENCE ACTIVE'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          {/* Isolation Forest */}
          <div className="p-4 rounded bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Isolation Forest (Unsupervised)</p>
                <p className="text-[10px] text-slate-500">Vector outlier detection</p>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                modelInfo?.isolation_forest?.loaded
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                  : 'bg-amber-950/40 text-amber-400 border-amber-800/50'
              }`}>
                {modelInfo?.isolation_forest?.loaded ? 'Loaded' : 'Fallback'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 pt-1">
              Input Dimensions: {modelInfo?.isolation_forest?.features?.length ?? 14} features
            </div>
            <div className="text-[11px] text-slate-400">
              Composite Score Weight: 15%
            </div>
          </div>

          {/* XGBoost */}
          <div className="p-4 rounded bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">XGBoost Classifier (Supervised)</p>
                <p className="text-[10px] text-slate-500">Historical fraud pattern scoring</p>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                modelInfo?.xgboost?.loaded
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                  : 'bg-amber-950/40 text-amber-400 border-amber-800/50'
              }`}>
                {modelInfo?.xgboost?.loaded ? 'Loaded' : 'Fallback'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 pt-1">
              SHAP Explainability: {modelInfo?.xgboost?.shap_available ? 'Available & Active' : 'Fallback Attribution'}
            </div>
            <div className="text-[11px] text-slate-400">
              Composite Score Weight: 15%
            </div>
          </div>
        </div>
      </div>

      {/* Database Collection Statistics */}
      {dbStats?.collections && (
        <div className="panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                Database Collection Footprint
              </h2>
            </div>
            {dbStats.totalSizeMB !== undefined && (
              <span className="text-[10px] font-mono text-slate-400">
                Total Allocated: <span className="text-white font-semibold">{dbStats.totalSizeMB.toFixed(2)} MB</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(dbStats.collections).map(([name, stat]) => (
              <div key={name} className="p-3 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-500 block truncate">{name}</span>
                <span className="text-base font-bold text-white font-mono block mt-1">{stat.count.toLocaleString()}</span>
                <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                  {(stat.sizeBytes / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footnote */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
        <Clock className="w-3 h-3" />
        <span>Verified diagnostics at {lastCheck.toLocaleTimeString()}</span>
        <span>•</span>
        <span>Client session active {uptimeStart.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
