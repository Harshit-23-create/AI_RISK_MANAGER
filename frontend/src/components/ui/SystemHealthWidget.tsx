import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import api, { modelsApi } from '../../services/api';

interface HealthState {
  backend: boolean;
  mongodb: boolean;
  redis: boolean;
  mlService: boolean;
  websocket: boolean;
}

interface SystemHealthWidgetProps {
  wsConnected: boolean;
}

export const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({ wsConnected }) => {
  const [health, setHealth] = useState<HealthState>({
    backend: true,
    mongodb: true,
    redis: true,
    mlService: true,
    websocket: wsConnected,
  });
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await api.get('/health').catch(() => null);
      const modelsRes = await modelsApi.status().catch(() => null);

      setHealth({
        backend: !!res?.data,
        mongodb: res?.data?.mongodb ?? false,
        redis: res?.data?.redis ?? false,
        mlService: modelsRes ? modelsRes.ml_service_healthy : false,
        websocket: wsConnected,
      });
    } catch (e) {
      // keep current state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setHealth(h => ({ ...h, websocket: wsConnected }));
  }, [wsConnected]);

  useEffect(() => {
    checkHealth();
  }, []);

  const services = [
    { label: 'Backend API', ok: health.backend, sub: 'REST Express' },
    { label: 'MongoDB Atlas', ok: health.mongodb, sub: 'Database' },
    { label: 'Upstash Redis', ok: health.redis, sub: 'Pub/Sub' },
    { label: 'ML Service', ok: health.mlService, sub: 'XGBoost / IF' },
    { label: 'WebSocket', ok: wsConnected, sub: 'Real-time Feed' },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-lg">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">System Infrastructure Health</h3>
        </div>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="text-slate-400 hover:text-cyan-400 p-1 rounded transition-colors"
          title="Refresh Health Status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {services.map((s, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">{s.label}</span>
              <span className="text-[10px] text-slate-400">{s.sub}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${s.ok ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              {s.ok ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
