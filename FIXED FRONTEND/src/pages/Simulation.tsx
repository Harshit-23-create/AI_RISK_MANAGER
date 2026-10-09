import { useState, useEffect } from 'react';
import { Play, Square, Zap, ShieldAlert, Activity, Radio, AlertOctagon, Terminal } from 'lucide-react';
import { simulationApi } from '../services/api';
import type { ToastMessage } from '../components/ui/Toast';
import { ToastContainer } from '../components/ui/Toast';

export default function Simulation() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('normal_payment');
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
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async (rate: number, suspiciousRatio: number) => {
    setLoading(true);
    try {
      await simulationApi.start(rate, suspiciousRatio);
      await fetchStatus();
      addToast('success', 'Simulation Started', `Traffic stream started at ${rate} req/s`);
    } catch (e: any) {
      addToast('error', 'Simulation Error', e?.response?.data?.error?.message || 'Failed to start simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await simulationApi.stop();
      await fetchStatus();
      addToast('info', 'Simulation Stopped', 'Live traffic generation halted');
    } catch (e) {
      addToast('error', 'Simulation Error', 'Failed to stop simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScenario = async () => {
    setLoading(true);
    try {
      await simulationApi.triggerScenario(selectedScenario);
      await fetchStatus();
      addToast('warning', 'Vector Injected', `Injected synthetic attack vector: ${selectedScenario}`);
    } catch (e) {
      addToast('error', 'Injection Error', 'Failed to trigger attack scenario');
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
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-5 lg:space-y-6 max-w-4xl mx-auto">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Simulation Center</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/30">
              Dev Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Generate real-time payment telemetry & synthetic attack vectors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Stream Controls */}
        <div className="space-y-6">
          {/* Status Panel */}
          <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Terminal className="w-4 h-4 text-cyan-400" /> Engine Status
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${status?.running ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                <div>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-bold">Current State</span>
                  <span className="text-sm font-bold text-white">
                    {status?.running ? (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <Radio className="w-4 h-4 animate-pulse" /> Live ({status.events_per_second || 0} req/s)
                      </span>
                    ) : (
                      <span className="text-slate-400">Stopped</span>
                    )}
                  </span>
                </div>
              </div>
              {status?.running ? (
                <button
                  onClick={handleStop}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40 transition-colors flex items-center gap-1.5"
                >
                  <Square className="w-4 h-4" /> Stop Stream
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center pt-4 border-t border-slate-800">
              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Total</span>
                <span className="text-lg font-mono font-bold text-white">{status?.events_generated ?? 0}</span>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Normal</span>
                <span className="text-lg font-mono font-bold text-emerald-400">{status?.normal_events ?? 0}</span>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">Threats</span>
                <span className="text-lg font-mono font-bold text-rose-400">{status?.suspicious_events ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Automated Stream Profiles */}
          <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Activity className="w-4 h-4 text-cyan-400" /> Automated Continuous Traffic
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => handleStart(2, 0.1)}
                disabled={loading || status?.running}
                className="w-full p-4 text-left rounded-xl border border-slate-800 bg-slate-950/60 hover:border-emerald-500/40 hover:bg-emerald-950/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white group-hover:text-emerald-400">Normal Operations Profile</span>
                  <Play className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-400">Simulates standard payment flow (2 req/sec, 10% baseline anomaly ratio)</p>
              </button>

              <button
                onClick={() => handleStart(8, 0.4)}
                disabled={loading || status?.running}
                className="w-full p-4 text-left rounded-xl border border-slate-800 bg-slate-950/60 hover:border-rose-500/40 hover:bg-rose-950/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white group-hover:text-rose-400">High Threat Attack Spike</span>
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                </div>
                <p className="text-xs text-slate-400">Simulates targeted fraud attack (8 req/sec, 40% high risk attack ratio)</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Specific Injection */}
        <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg h-fit space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldAlert className="w-4 h-4 text-amber-400" /> Inject Single Attack Vector
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Manually trigger specific fraud scenarios into the data stream. These events will be instantly routed through the Risk Engine, evaluated by ML models, and appear on the Dashboard feed.
          </p>
          
          <div className="space-y-3">
            {scenarios.map((s) => (
              <label 
                key={s.id} 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedScenario === s.id 
                    ? 'bg-cyan-500/10 border-cyan-500/40' 
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-600'
                }`}
              >
                <input 
                  type="radio" 
                  name="scenario" 
                  value={s.id}
                  checked={selectedScenario === s.id}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className={`text-xs font-bold ${selectedScenario === s.id ? 'text-cyan-400' : 'text-slate-300'}`}>
                    {s.label}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{s.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleTriggerScenario}
            disabled={loading}
            className="w-full py-3 mt-4 text-sm font-bold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Zap className="w-4 h-4" /> Inject Selected Vector
          </button>
        </div>
      </div>
    </div>
  );
}
