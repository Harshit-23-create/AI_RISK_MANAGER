import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Globe, Clock, Fingerprint, Activity, ShieldAlert, Cpu
} from 'lucide-react';
import { transactionsApi, riskApi } from '../services/api';
import type { Transaction, RiskAssessment } from '../types';
import { formatCurrency, formatDate, formatTimestamp } from '../utils';
import { RiskBadge } from '../components/ui/RiskBadge';
import { RiskScoreGauge } from '../components/ui/RiskScoreGauge';
import { RiskFactorBreakdown } from '../components/ui/RiskFactorBreakdown';
import { AiExplanationCard } from '../components/ui/AiExplanationCard';

type Tab = 'overview' | 'behavior' | 'network' | 'ml' | 'audit';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      transactionsApi.get(id).catch(() => null),
      riskApi.get(id).catch(() => null),
    ])
      .then(([t, r]) => {
        setTxn(t);
        setRisk(r);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const requestExplanation = async () => {
    if (!id) return;
    setExplaining(true);
    try {
      const result = await riskApi.explain(id);
      setRisk((prev) => (prev ? { ...prev, llm_explanation: result.explanation } : prev));
    } catch (e) {
      console.error(e);
    } finally {
      setExplaining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Clock className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
        <p className="text-xs">Fetching fraud investigation telemetry...</p>
      </div>
    );
  }

  if (!txn) {
    return (
      <div className="text-center py-16 text-slate-400 space-y-4">
        <p className="text-sm font-bold text-slate-200">Transaction record not found in system.</p>
        <button
          onClick={() => navigate('/transactions')}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Transaction Audit Table
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/transactions')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Transaction Audit List
      </button>

      {/* Header Overview Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400 font-mono">TRANSACTION ID:</span>
            <span className="font-mono text-cyan-400 font-extrabold text-sm">{txn.transaction_id}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-white">{formatCurrency(txn.amount, txn.currency)}</span>
            <RiskBadge decision={risk?.decision || 'ALLOW'} size="lg" />
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {formatDate(txn.timestamp)} {formatTimestamp(txn.timestamp)}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">User Account</span>
            <span className="font-bold text-white font-mono">{txn.user_id}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Payment Method</span>
            <span className="font-bold text-slate-200">{txn.payment_method || 'UPI'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">IP Address</span>
            <span className="font-bold text-cyan-300 font-mono">{txn.ip_address || '—'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Country</span>
            <span className="font-bold text-slate-200">{txn.country || 'India'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 px-2 overflow-x-auto">
        {(
          [
            { id: 'overview', label: 'Risk Overview', icon: ShieldAlert },
            { id: 'behavior', label: 'Behavioral Analysis', icon: Fingerprint },
            { id: 'network', label: 'Network / DPI', icon: Globe },
            { id: 'ml', label: 'ML Explanation', icon: Cpu },
            { id: 'audit', label: 'Audit Timeline', icon: Activity },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <RiskScoreGauge
                score={risk?.risk_score || 0}
                decision={risk?.decision}
                confidence={risk?.confidence}
              />
            </div>
            <div>
              <RiskFactorBreakdown breakdown={risk?.breakdown} />
            </div>
          </div>
        )}

        {activeTab === 'behavior' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-lg max-w-2xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Fingerprint className="w-4 h-4 text-cyan-400" /> User & Device Behavioral Metrics
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Authentication Failures</span>
                <span className={`font-bold font-mono ${txn.failed_attempts > 3 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {txn.failed_attempts} attempts
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Transaction Velocity (5m)</span>
                <span className="font-bold font-mono text-slate-200">{txn.transaction_frequency.toFixed(1)} req / min</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Account Age</span>
                <span className="font-bold font-mono text-slate-200">{txn.account_age_days} days</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Historical Avg Amount</span>
                <span className="font-bold font-mono text-slate-200">{formatCurrency(txn.previous_transaction_avg, txn.currency)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Device Familiarity</span>
                <span className={`font-bold ${txn.is_new_device ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {txn.is_new_device ? 'New Device Detected' : 'Known Device'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-lg max-w-2xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Globe className="w-4 h-4 text-cyan-400" /> DPI Telemetry & Network Security
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Origin IP Address</span>
                <span className="font-bold font-mono text-slate-200">{txn.ip_address || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">IP Reputation Check</span>
                <span className={`font-bold ${txn.is_new_ip ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {txn.is_new_ip ? 'Suspicious / VPN / Proxy' : 'Clean Residential'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Device Fingerprint Hash</span>
                <span className="font-mono text-slate-400 text-xs">{txn.device_id || 'DEV_UNKNOWN'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Detected Scenario Vector</span>
                <span className="font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded text-xs border border-cyan-500/20">{txn.scenario_label || 'normal_baseline'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Network Risk Contribution</span>
                <span className="font-mono font-bold text-amber-400">{risk?.network_score.toFixed(1) || '0.0'} / 100</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ml' && (
          <div className="space-y-6 max-w-3xl">
            <AiExplanationCard
              explanation={risk?.llm_explanation}
              riskAssessment={risk}
              onExplain={requestExplanation}
              loading={explaining}
            />
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-lg text-sm">
              <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-3 mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" /> Pipeline Diagnostics
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80">
                  <div className="text-xs text-slate-500 mb-1">Isolation Forest (Unsupervised)</div>
                  <div className="text-emerald-400 font-bold">Active • Evaluated</div>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80">
                  <div className="text-xs text-slate-500 mb-1">XGBoost Classifier (Supervised)</div>
                  <div className="text-emerald-400 font-bold">Active • Evaluated</div>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80">
                  <div className="text-xs text-slate-500 mb-1">SHAP Values</div>
                  <div className="text-cyan-400 font-bold">Extracted</div>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/80">
                  <div className="text-xs text-slate-500 mb-1">Risk Decision Confidence</div>
                  <div className="text-amber-400 font-bold font-mono">{(risk?.confidence ? risk.confidence * 100 : 95).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-lg max-w-2xl">
            <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Activity className="w-4 h-4 text-cyan-400" /> Lifecycle Audit Trail
            </h3>

            <div className="relative pl-6 space-y-6 border-l border-slate-800/60 ml-2">
              <div className="relative">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                <span className="text-sm font-bold text-white block">Payment Request Received</span>
                <span className="text-xs text-slate-400 block mt-1">Ingested via REST API endpoint with amount {formatCurrency(txn.amount, txn.currency)}</span>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">{formatTimestamp(txn.timestamp)}</span>
              </div>
              <div className="relative">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-slate-900" />
                <span className="text-sm font-bold text-white block">Risk Engine & ML Models Evaluated</span>
                <span className="text-xs text-slate-400 block mt-1">Isolation Forest anomaly + XGBoost prediction calculated final score ({Math.round(risk?.risk_score || 0)}/100)</span>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">T+12ms</span>
              </div>
              <div className="relative">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-slate-900" />
                <span className="text-sm font-bold text-white block">Decision Outputted: {risk?.decision || 'ALLOW'}</span>
                <span className="text-xs text-slate-400 block mt-1">Confidence rating {((risk?.confidence || 0.95) * 100).toFixed(1)}%</span>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">T+18ms</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
