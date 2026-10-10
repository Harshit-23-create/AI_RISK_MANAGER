import { useState, useEffect } from 'react';
import {
  Sliders, History, Cpu, Save, RefreshCw, Trash2,
  CheckCircle, AlertTriangle, Activity, Terminal
} from 'lucide-react';
import { adminApi } from '../services/api';
import type { SystemSettings, AuditLogItem } from '../types';
import { formatTimestamp } from '../utils';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'thresholds' | 'simulation' | 'audit' | 'models'>('thresholds');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form states
  const [allowThreshold, setAllowThreshold] = useState(30);
  const [monitorThreshold, setMonitorThreshold] = useState(60);
  const [stepupThreshold, setStepupThreshold] = useState(80);

  const [wTransaction, setWTransaction] = useState(25);
  const [wBehavioral, setWBehavioral] = useState(25);
  const [wNetwork, setWNetwork] = useState(20);
  const [wAnomaly, setWAnomaly] = useState(15);
  const [wSupervised, setWSupervised] = useState(15);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, aData] = await Promise.all([
        adminApi.getSettings().catch(() => null),
        adminApi.getAuditLogs(1, 20).catch(() => ({ items: [] })),
      ]);

      if (sData) {
        setSettings(sData);
        setAllowThreshold(sData.thresholds.allow);
        setMonitorThreshold(sData.thresholds.monitor);
        setStepupThreshold(sData.thresholds.step_up);

        if (sData.weights) {
          setWTransaction(Math.round(sData.weights.transaction * 100));
          setWBehavioral(Math.round(sData.weights.behavioral * 100));
          setWNetwork(Math.round(sData.weights.network * 100));
          setWAnomaly(Math.round(sData.weights.mlAnomaly * 100));
          setWSupervised(Math.round(sData.weights.mlSupervised * 100));
        }
      }

      setAuditLogs(aData.items || []);
    } catch (e) {
      console.error('[Settings] Error loading configuration:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalWeight = wTransaction + wBehavioral + wNetwork + wAnomaly + wSupervised;

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      setStatusMessage(`Weights must sum to 100% (currently ${totalWeight}%)`);
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    try {
      await adminApi.updateSettings({
        thresholds: {
          allow: allowThreshold,
          monitor: monitorThreshold,
          step_up: stepupThreshold,
        },
        weights: {
          transaction: wTransaction / 100,
          behavioral: wBehavioral / 100,
          network: wNetwork / 100,
          mlAnomaly: wAnomaly / 100,
          mlSupervised: wSupervised / 100,
        },
      });
      setSaveSuccess(true);
      setStatusMessage('Risk engine configuration updated and audited.');
      setTimeout(() => setSaveSuccess(false), 4000);
      loadData();
    } catch (err: any) {
      setStatusMessage(err?.response?.data?.error?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePruneData = async () => {
    if (!window.confirm('Are you sure you want to prune synthetic simulation records? Core user accounts will be preserved.')) {
      return;
    }
    setPruning(true);
    try {
      const res = await adminApi.resetData();
      setStatusMessage(`Pruned ${res.deleted_transactions || 0} simulated transactions and ${res.deleted_network_events || 0} network events.`);
      loadData();
    } catch {
      setStatusMessage('Failed to prune simulation data.');
    } finally {
      setPruning(false);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-5 lg:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">System Configuration & Administration</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Admin Access
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Configure scoring thresholds, signal weights, simulation policies, and inspect audit logs</p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-2 self-start md:self-auto border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Settings
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
          saveSuccess
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}>
          {saveSuccess ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 sm:gap-6 px-2 overflow-x-auto">
        {(
          [
            { id: 'thresholds', label: 'Thresholds & Weights', icon: Sliders },
            { id: 'simulation', label: 'Simulation & Retention', icon: Activity },
            { id: 'audit', label: 'System Audit Trail', icon: History },
            { id: 'models', label: 'AI/ML Registry', icon: Cpu },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Thresholds & Weights */}
      {activeTab === 'thresholds' && (
        <form onSubmit={handleSaveThresholds} className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" /> Risk Routing Decision Boundaries
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Determine how composite scores (0–100) map to automated SOC actions</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-400 uppercase font-mono">ALLOW Limit</span>
                  <span className="font-mono text-white font-bold">{allowThreshold}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={allowThreshold}
                  onChange={(e) => setAllowThreshold(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <p className="text-[10px] text-slate-500 leading-tight">Scores below {allowThreshold} approve instantly without friction.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-blue-400 uppercase font-mono">MONITOR Limit</span>
                  <span className="font-mono text-white font-bold">{monitorThreshold}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="75"
                  value={monitorThreshold}
                  onChange={(e) => setMonitorThreshold(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <p className="text-[10px] text-slate-500 leading-tight">Scores between {allowThreshold} and {monitorThreshold} flag profile for telemetry.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-400 uppercase font-mono">STEP-UP Limit</span>
                  <span className="font-mono text-white font-bold">{stepupThreshold}</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  value={stepupThreshold}
                  onChange={(e) => setStepupThreshold(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <p className="text-[10px] text-slate-500 leading-tight">Scores between {monitorThreshold} and {stepupThreshold} demand 2FA. Above {stepupThreshold} = BLOCK.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" /> Multi-Vector Weight Allocation
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Adjust proportional weight of each risk factor (must total 100%)</p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                totalWeight === 100
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                Total: {totalWeight}%
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Transaction Signal (Amount deviation, auth failures)</span>
                  <span className="font-mono font-bold text-white">{wTransaction}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={wTransaction}
                  onChange={(e) => setWTransaction(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Behavioral Signal (Device familiarity, account age, velocity)</span>
                  <span className="font-mono font-bold text-white">{wBehavioral}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={wBehavioral}
                  onChange={(e) => setWBehavioral(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Network / DPI Signal (IP reputation, request burst rate)</span>
                  <span className="font-mono font-bold text-white">{wNetwork}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={wNetwork}
                  onChange={(e) => setWNetwork(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Unsupervised ML (Isolation Forest anomaly score)</span>
                  <span className="font-mono font-bold text-white">{wAnomaly}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={wAnomaly}
                  onChange={(e) => setWAnomaly(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Supervised ML (XGBoost calibrated risk probability)</span>
                  <span className="font-mono font-bold text-white">{wSupervised}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={wSupervised}
                  onChange={(e) => setWSupervised(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving || totalWeight !== 100}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Deploy Policy Configuration'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Simulation & Retention */}
      {activeTab === 'simulation' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Synthetic Data Retention Policies
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Bounded collections prevent runaway storage growth during testing</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-500 block uppercase font-mono text-[10px]">Max Transactions</span>
                <span className="font-bold text-white text-base mt-1 block font-mono">
                  {settings?.retention.maxTransactions?.toLocaleString() ?? '10,000'}
                </span>
              </div>
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-500 block uppercase font-mono text-[10px]">Max Network Events</span>
                <span className="font-bold text-white text-base mt-1 block font-mono">
                  {settings?.retention.maxNetworkEvents?.toLocaleString() ?? '10,000'}
                </span>
              </div>
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-500 block uppercase font-mono text-[10px]">Max Alert Records</span>
                <span className="font-bold text-white text-base mt-1 block font-mono">
                  {settings?.retention.maxAlerts?.toLocaleString() ?? '5,000'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Prune Test Data</span>
                <span className="text-[11px] text-slate-400 block">Safely removes simulation artifacts while preserving admin audit trails</span>
              </div>
              <button
                type="button"
                onClick={handlePruneData}
                disabled={pruning}
                className="px-4 py-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-colors text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> {pruning ? 'Pruning...' : 'Prune Synthetic Records'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Trail */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex justify-between items-start border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" /> Administrative Audit Log
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Immutable audit trail of security policy updates, alert triage, and data actions</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {auditLogs.length} Events Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                      No administrative audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400">{formatTimestamp(log.timestamp)}</td>
                      <td className="py-2.5 px-3 text-white font-bold">{log.user}</td>
                      <td className="py-2.5 px-3 text-cyan-400">{log.action}</td>
                      <td className="py-2.5 px-3 text-slate-300">{log.resource}</td>
                      <td className="py-2.5 px-3 text-slate-400">{log.ipAddress}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: AI/ML Registry */}
      {activeTab === 'models' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Isolation Forest (Unsupervised)</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Model Artifact</span>
                <span className="font-mono text-cyan-400">isolation_forest.pkl (2.2 MB)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Feature Dimensions</span>
                <span className="font-mono text-white">14-Dimensional Vector</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Contamination Factor</span>
                <span className="font-mono text-white">0.05</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Primary Function</span>
                <span className="text-slate-200">Zero-day anomaly detection & behavioral outliers</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Terminal className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">XGBoost Classifier (Supervised)</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Model Artifact</span>
                <span className="font-mono text-purple-400">xgboost_risk.json (12 KB)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">ROC-AUC Score</span>
                <span className="font-mono text-emerald-400 font-bold">1.0 (Validated)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Explainability Engine</span>
                <span className="font-mono text-cyan-400">SHAP TreeExplainer</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Primary Function</span>
                <span className="text-slate-200">High-confidence binary fraud classification</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
