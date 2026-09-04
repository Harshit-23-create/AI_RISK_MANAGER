import React, { useState, useEffect } from 'react';
import { Play, Square, Zap, ShieldAlert, X, Activity, Radio, AlertOctagon } from 'lucide-react';
import { simulationApi } from '../../services/api';

interface SimulationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulationCenterModal: React.FC<SimulationCenterModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('normal_payment');

  const fetchStatus = async () => {
    try {
      const data = await simulationApi.status();
      setStatus(data);
    } catch (e) {
      // ignore error
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStart = async (rate: number, suspiciousRatio: number) => {
    setLoading(true);
    try {
      await simulationApi.start(rate, suspiciousRatio);
      await fetchStatus();
    } catch (e) {
      alert('Failed to start simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await simulationApi.stop();
      await fetchStatus();
    } catch (e) {
      alert('Failed to stop simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScenario = async () => {
    setLoading(true);
    try {
      await simulationApi.triggerScenario(selectedScenario);
      await fetchStatus();
    } catch (e) {
      alert('Failed to trigger scenario');
    } finally {
      setLoading(false);
    }
  };

  const scenarios = [
    { id: 'normal_payment', label: 'Normal Low-Risk Payments', desc: 'Standard user transaction velocity & amounts' },
    { id: 'unusual_amount', label: 'Unusual Large Amount (5-20x)', desc: 'High value payment anomaly' },
    { id: 'new_device', label: 'Unrecognised Device & Location', desc: 'New device fingerprint & geo shift' },
    { id: 'suspicious_ip', label: 'Foreign / VPN Suspicious IP', desc: 'High threat reputation IP address' },
    { id: 'multiple_failed_attempts', label: 'Multiple Auth Failures', desc: 'Brute-force auth velocity signal' },
    { id: 'api_burst', label: 'API Bot Traffic Burst', desc: 'Abnormal API transaction frequency' },
    { id: 'high_risk_payment', label: 'Combined Fraud Attack', desc: 'All high-risk signals elevated simultaneously' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Simulation Control Center
              </h2>
              <p className="text-xs text-slate-400">Generate real-time payment telemetry & synthetic attack vectors</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Status Bar */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${status?.running ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
              <div>
                <span className="text-xs text-slate-400 block font-medium uppercase">Current Status</span>
                <span className="text-sm font-bold text-white">
                  {status?.running ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 animate-pulse" /> Live Simulation Active ({status.events_per_second || 0} req/s)
                    </span>
                  ) : (
                    <span className="text-slate-400">Simulation Stopped</span>
                  )}
                </span>
              </div>
            </div>

            {status?.running ? (
              <button
                onClick={handleStop}
                disabled={loading}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40 transition-colors flex items-center gap-1.5"
              >
                <Square className="w-4 h-4" /> Stop Simulation
              </button>
            ) : (
              <span className="text-xs text-slate-500 italic">Ready to start</span>
            )}
          </div>

          {/* Real-time stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <span className="text-[11px] text-slate-400 block">Total Generated</span>
              <span className="text-xl font-bold text-white">{status?.events_generated ?? 0}</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <span className="text-[11px] text-slate-400 block">Normal Payments</span>
              <span className="text-xl font-bold text-emerald-400">{status?.normal_events ?? 0}</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <span className="text-[11px] text-slate-400 block">Suspicious Signals</span>
              <span className="text-xl font-bold text-rose-400">{status?.suspicious_events ?? 0}</span>
            </div>
          </div>

          {/* Automated Traffic Profiles */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" /> Start Automated Stream Profiles
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleStart(2, 0.1)}
                disabled={loading}
                className="p-3 text-left rounded-xl border border-slate-800 bg-slate-950/60 hover:border-emerald-500/40 hover:bg-emerald-950/10 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-400">Normal Operations</span>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400">2 req/sec, 10% baseline anomaly ratio</p>
              </button>

              <button
                onClick={() => handleStart(8, 0.4)}
                disabled={loading}
                className="p-3 text-left rounded-xl border border-slate-800 bg-slate-950/60 hover:border-rose-500/40 hover:bg-rose-950/10 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-rose-400">Simulate Attack Spike</span>
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <p className="text-[11px] text-slate-400">8 req/sec, 40% high risk attack ratio</p>
              </button>
            </div>
          </div>

          {/* Trigger Specific Single Scenario */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Inject Single Attack Vector
            </h3>
            <div className="flex gap-2">
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 text-xs text-white p-2.5 focus:border-cyan-500 focus:outline-none"
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} — {s.desc}
                  </option>
                ))}
              </select>
              <button
                onClick={handleTriggerScenario}
                disabled={loading}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Zap className="w-4 h-4" /> Inject Vector
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
