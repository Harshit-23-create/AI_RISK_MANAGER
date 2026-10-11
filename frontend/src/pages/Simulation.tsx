import { useState, useEffect } from 'react';
import {
  Play, Square, Zap, ShieldAlert, Activity, AlertOctagon,
  Flame, CheckCircle, Shield, ArrowRight
} from 'lucide-react';
import { simulationApi } from '../services/api';
import type { ToastMessage } from '../components/ui/Toast';
import { ToastContainer } from '../components/ui/Toast';
import { PageHeader } from '../components/ui/PageHeader';

export default function Simulation() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRate, setSelectedRate] = useState(5);
  const [selectedRatio, setSelectedRatio] = useState(0.25);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'info' | 'warning' | 'error' | 'success', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev.slice(-3), { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchStatus = async () => {
    try {
      const data = await simulationApi.status();
      setStatus(data);
    } catch {
      // offline fallback handled by api service
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async (rate: number, suspiciousRatio: number) => {
    setLoading(true);
    try {
      await simulationApi.start(rate, suspiciousRatio);
      await fetchStatus();
      addToast('success', 'Simulation Stream Active', `Generating traffic at ${rate} transactions/sec`);
    } catch (e: any) {
      addToast('error', 'Simulation Failed', e?.response?.data?.error?.message || 'Could not initiate simulation engine');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await simulationApi.stop();
      await fetchStatus();
      addToast('info', 'Simulation Standby', 'Synthetic transaction generation stopped');
    } catch {
      addToast('error', 'Error', 'Failed to halt simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScenario = async (scenarioId: string) => {
    setLoading(true);
    try {
      await simulationApi.triggerScenario(scenarioId);
      await fetchStatus();
      addToast('warning', 'Vector Injected', `Dispatched attack payload: ${scenarioId}`);
    } catch {
      addToast('error', 'Injection Error', 'Failed to inject scenario vector');
    } finally {
      setLoading(false);
    }
  };

  const scenarios = [
    {
      id: 'normal_payment',
      label: 'Benign Consumer Stream',
      desc: 'Standard velocity, verified hardware fingerprints, residential IP distribution',
      icon: CheckCircle,
      threat: 'LOW',
    },
    {
      id: 'unusual_amount',
      label: 'Large Amount Outlier Spike',
      desc: 'Payment values 5x–20x above user historical baseline average',
      icon: Activity,
      threat: 'MEDIUM',
    },
    {
      id: 'new_device',
      label: 'Unrecognized Hardware & Geo Shift',
      desc: 'Unknown user-agent fingerprint coupled with instant cross-region IP hop',
      icon: Shield,
      threat: 'MEDIUM',
    },
    {
      id: 'suspicious_ip',
      label: 'Anonymized Proxy / Tor Exit Node',
      desc: 'High threat reputation datacenter IP or known botnet proxy pool',
      icon: ShieldAlert,
      threat: 'HIGH',
    },
    {
      id: 'multiple_failed_attempts',
      label: 'Credential Stuffing & Auth Retries',
      desc: 'High velocity repeated authentication failures preceding payment settlement',
      icon: AlertOctagon,
      threat: 'HIGH',
    },
    {
      id: 'api_burst',
      label: 'Distributed Botnet API Flood',
      desc: 'Abnormal Layer-7 request rate velocity exceeding rate limits',
      icon: Zap,
      threat: 'HIGH',
    },
    {
      id: 'high_risk_payment',
      label: 'Composite Coordinated Fraud',
      desc: 'Simultaneous elevation across device, proxy, amount, and velocity signals',
      icon: Flame,
      threat: 'CRITICAL',
    },
  ];

  const isRunning = Boolean(status?.running || status?.is_running);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Page Header */}
      <PageHeader
        category="Testing & Evaluation"
        title="Synthetic Fraud & Traffic Simulator"
        subtitle="Orchestrate synthetic financial payment streams, inject multi-vector attack scenarios, and stress-test the real-time scoring engine"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-900 border border-slate-800 text-slate-300">
            <span className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {isRunning ? 'Stream Active' : 'Engine Standby'}
          </span>
        }
      />

      {/* Top Stream Control Panel */}
      <div className="panel p-5 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Stream Status</span>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <h2 className="text-base font-bold text-white">
              {isRunning ? `Streaming Live (${status?.current_rate || status?.rate || selectedRate} tx/sec)` : 'Generator Standby'}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {isRunning ? 'Generating live events to Redis pub/sub and WebSocket broadcast' : 'Configure rate and suspicion ratio to initiate automated stream'}
          </p>
        </div>

        {/* Rate & Suspicion Selectors */}
        <div className="space-y-3 bg-slate-950/60 p-3 rounded border border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-mono">Stream Velocity:</span>
            <div className="flex items-center gap-1">
              {[2, 5, 10, 25].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setSelectedRate(rate)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedRate === rate ? 'bg-slate-800 text-cyan-400 font-bold border border-slate-700' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rate}/s
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-mono">Suspicious Ratio:</span>
            <div className="flex items-center gap-1">
              {[0.1, 0.25, 0.5, 0.75].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRatio(r)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedRatio === r ? 'bg-slate-800 text-rose-400 font-bold border border-slate-700' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {Math.round(r * 100)}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stream Actions */}
        <div className="flex items-center justify-end gap-2.5">
          {isRunning ? (
            <button
              type="button"
              onClick={handleStop}
              disabled={loading}
              className="px-4 py-2 rounded bg-rose-950/60 hover:bg-rose-950/80 text-rose-300 border border-rose-800/80 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5" /> Stop Stream
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleStart(selectedRate, selectedRatio)}
              disabled={loading}
              className="px-5 py-2 rounded bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Start Traffic Stream
            </button>
          )}
        </div>
      </div>

      {/* Scenario Attack Injection Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              Attack Vector Injection Library
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly trigger individual synthetic payment events to test SOC alerting and model thresholds
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const threatStyles = {
              LOW: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50',
              MEDIUM: 'bg-amber-950/40 text-amber-400 border-amber-800/50',
              HIGH: 'bg-orange-950/40 text-orange-400 border-orange-800/50',
              CRITICAL: 'bg-rose-950/60 text-rose-400 border-rose-800/60 font-bold',
            }[sc.threat];

            return (
              <div
                key={sc.id}
                className="panel p-4 flex flex-col justify-between hover:border-slate-700 transition-colors space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      {sc.label}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase border ${threatStyles}`}>
                      {sc.threat}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {sc.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleTriggerScenario(sc.id)}
                    disabled={loading}
                    className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-xs font-mono text-cyan-400 border border-slate-800 flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <span>Inject Payload</span> <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
