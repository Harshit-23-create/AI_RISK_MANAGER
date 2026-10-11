import { useState, useEffect } from 'react';
import {
  Sliders, History, Cpu, Save, RefreshCw, Trash2,
  CheckCircle, AlertTriangle
} from 'lucide-react';
import { adminApi } from '../services/api';
import type { AuditLogItem } from '../types';
import { formatTimestamp } from '../utils';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonTable } from '../components/ui/SkeletonLoader';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'thresholds' | 'simulation' | 'audit' | 'models'>('thresholds');
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
        adminApi.getAuditLogs(1, 25).catch(() => ({ items: [] })),
      ]);

      if (sData) {
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
      setStatusMessage('Risk engine configuration updated and recorded in audit log.');
      setTimeout(() => setSaveSuccess(false), 4000);
      loadData();
    } catch (err: any) {
      setStatusMessage(err?.response?.data?.error?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePruneData = async () => {
    if (!window.confirm('Are you sure you want to prune synthetic simulation records? Core accounts will be preserved.')) {
      return;
    }
    setPruning(true);
    try {
      const res = await adminApi.resetData();
      setStatusMessage(`Pruned ${res.deleted_transactions || 0} synthetic transactions and ${res.deleted_network_events || 0} network events.`);
      loadData();
    } catch {
      setStatusMessage('Failed to prune simulation data.');
    } finally {
      setPruning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        category="Governance & Configuration"
        title="Risk Engine Policies & Settings"
        subtitle="Calibrate automated decision routing boundaries, tune composite signal weights, and review immutable audit records"
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            Runtime Store: Active
          </span>
        }
      >
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 border border-slate-800 px-3 text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Config</span>
        </button>
      </PageHeader>

      {/* Settings Tab Bar */}
      <div className="flex border-b border-slate-800/80 gap-6 overflow-x-auto text-xs font-mono">
        {[
          { id: 'thresholds', label: 'Decision Boundaries & Signal Weights', icon: Sliders },
          { id: 'simulation', label: 'Data Retention & Pruning', icon: Trash2 },
          { id: 'audit', label: 'System Audit Trail', icon: History },
          { id: 'models', label: 'ML Pipelines & Registry', icon: Cpu },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as any);
              setStatusMessage(null);
            }}
            className={`flex items-center gap-2 pb-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-cyan-400 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-md text-xs font-mono flex items-center gap-2 ${
          saveSuccess
            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
            : 'bg-amber-950/40 text-amber-300 border border-amber-800/60'
        }`}>
          {saveSuccess ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tab 1: Thresholds & Weights */}
      {activeTab === 'thresholds' && (
        <form onSubmit={handleSaveThresholds} className="space-y-6">
          {/* Decision Boundaries Panel */}
          <div className="panel p-5 space-y-4">
            <div className="border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-semibold text-white">Decision Routing Boundaries</h2>
              <p className="text-xs text-slate-400 mt-0.5">Threshold cutoffs for automated transaction disposition</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 p-3.5 rounded bg-slate-950/60 border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-emerald-400">ALLOW Cutoff</span>
                  <span className="font-mono text-white font-bold">{allowThreshold} / 100</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={allowThreshold}
                  onChange={(e) => setAllowThreshold(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-mono">Scores ≤ {allowThreshold} automatically approved</p>
              </div>

              <div className="space-y-2 p-3.5 rounded bg-slate-950/60 border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-amber-400">MONITOR Ceiling</span>
                  <span className="font-mono text-white font-bold">{monitorThreshold} / 100</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="75"
                  value={monitorThreshold}
                  onChange={(e) => setMonitorThreshold(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-mono">Scores &gt; {allowThreshold} and ≤ {monitorThreshold} flagged for observation</p>
              </div>

              <div className="space-y-2 p-3.5 rounded bg-slate-950/60 border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-orange-400">STEP-UP Ceiling</span>
                  <span className="font-mono text-white font-bold">{stepupThreshold} / 100</span>
                </div>
                <input
                  type="range"
                  min="65"
                  max="90"
                  value={stepupThreshold}
                  onChange={(e) => setStepupThreshold(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-mono">Scores &gt; {stepupThreshold} trigger hard BLOCK</p>
              </div>
            </div>
          </div>

          {/* Signal Weights Allocation Panel */}
          <div className="panel p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Risk Factor Signal Weights</h2>
                <p className="text-xs text-slate-400 mt-0.5">Contribution percentages must sum to exactly 100%</p>
              </div>
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                totalWeight === 100
                  ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                  : 'bg-rose-950/50 text-rose-400 border-rose-800/60'
              }`}>
                Sum: {totalWeight}% {totalWeight === 100 ? '✓' : '(Must be 100%)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[11px] font-medium text-slate-300 block">Transaction</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={wTransaction}
                  onChange={(e) => setWTransaction(Number(e.target.value))}
                  className="h-8 w-full rounded border border-slate-800 bg-slate-900 px-2 font-mono text-xs text-white"
                />
                <span className="text-[10px] text-slate-500 font-mono block">Heuristic rules</span>
              </div>

              <div className="p-3 rounded bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[11px] font-medium text-slate-300 block">Behavioral</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={wBehavioral}
                  onChange={(e) => setWBehavioral(Number(e.target.value))}
                  className="h-8 w-full rounded border border-slate-800 bg-slate-900 px-2 font-mono text-xs text-white"
                />
                <span className="text-[10px] text-slate-500 font-mono block">Device &amp; velocity</span>
              </div>

              <div className="p-3 rounded bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[11px] font-medium text-slate-300 block">Network / DPI</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={wNetwork}
                  onChange={(e) => setWNetwork(Number(e.target.value))}
                  className="h-8 w-full rounded border border-slate-800 bg-slate-900 px-2 font-mono text-xs text-white"
                />
                <span className="text-[10px] text-slate-500 font-mono block">L7 packet telemetry</span>
              </div>

              <div className="p-3 rounded bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[11px] font-medium text-slate-300 block">ML Outlier (IF)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={wAnomaly}
                  onChange={(e) => setWAnomaly(Number(e.target.value))}
                  className="h-8 w-full rounded border border-slate-800 bg-slate-900 px-2 font-mono text-xs text-white"
                />
                <span className="text-[10px] text-slate-500 font-mono block">Isolation Forest</span>
              </div>

              <div className="p-3 rounded bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-[11px] font-medium text-slate-300 block">ML Supervised (XGB)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={wSupervised}
                  onChange={(e) => setWSupervised(Number(e.target.value))}
                  className="h-8 w-full rounded border border-slate-800 bg-slate-900 px-2 font-mono text-xs text-white"
                />
                <span className="text-[10px] text-slate-500 font-mono block">XGBoost classifier</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving || totalWeight !== 100}
                className="px-5 py-2 rounded bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Applying Policies…' : 'Save & Audit Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Simulation Pruning */}
      {activeTab === 'simulation' && (
        <div className="panel p-5 space-y-6">
          <div className="border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-semibold text-white">Synthetic Data Retention &amp; Pruning</h2>
            <p className="text-xs text-slate-400 mt-0.5">Purge synthetic test data and reset simulation telemetry</p>
          </div>

          <div className="p-4 rounded bg-rose-950/20 border border-rose-900/40 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Administrative Maintenance Action
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pruning will purge all generated synthetic test transactions and mock network events from MongoDB. Core user accounts, security policies, and production configurations remain untouched.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePruneData}
                disabled={pruning}
                className="px-4 py-2 rounded bg-rose-900/40 hover:bg-rose-900/60 text-rose-200 border border-rose-700/60 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{pruning ? 'Purging Records…' : 'Prune Synthetic Records'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Trail */}
      {activeTab === 'audit' && (
        <div className="panel overflow-hidden">
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/30 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-white">Immutable Administrative Audit Trail</h2>
              <p className="text-xs text-slate-400 mt-0.5">Chronological log of administrative actions, policy adjustments, and threshold changes</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {auditLogs.length} Logged Entries
            </span>
          </div>

          {loading ? (
            <SkeletonTable rows={6} cols={5} />
          ) : !auditLogs.length ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No administrative audit events recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider bg-slate-950/60">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Actor / Admin</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target Resource</th>
                    <th className="px-4 py-3">Origin IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono text-xs">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-medium">
                        {log.user}
                      </td>
                      <td className="px-4 py-3 text-cyan-400 font-semibold">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {log.resource}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: ML Models */}
      {activeTab === 'models' && (
        <div className="panel p-5 space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-semibold text-white">Machine Learning Models Registry</h2>
            <p className="text-xs text-slate-400 mt-0.5">Active model versions and feature pipeline configurations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Isolation Forest Model</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  v1.0.0
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Detects multi-dimensional feature outliers via random recursive space partitioning.
              </p>
              <div className="pt-2 text-[10px] text-slate-500">
                Type: Unsupervised Vector Outlier • Framework: scikit-learn
              </div>
            </div>

            <div className="p-4 rounded bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">XGBoost Classifier Model</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  v1.0.0
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Gradient-boosted decision tree classifier trained on labeled financial fraud records.
              </p>
              <div className="pt-2 text-[10px] text-slate-500">
                Type: Supervised Binary Classification • Framework: XGBoost / SHAP
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
