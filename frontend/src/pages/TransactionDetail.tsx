import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Globe, Clock, Fingerprint, Activity, ShieldAlert, Cpu, BarChart2
} from 'lucide-react';
import { transactionsApi, riskApi } from '../services/api';
import type { Transaction, RiskAssessment, ModelPredictionItem } from '../types';
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
  const [predictions, setPredictions] = useState<ModelPredictionItem[]>([]);
  const [explaining, setExplaining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      transactionsApi.get(id).catch(() => null),
      riskApi.get(id).catch(() => null),
      riskApi.getPredictions(id).then(r => r.predictions).catch(() => []),
    ])
      .then(([t, r, p]) => {
        setTxn(t);
        setRisk(r);
        setPredictions(p || []);
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

  const shapEntries = risk?.shap_values ? Object.entries(risk.shap_values) : [];

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-5 lg:space-y-6">
      <button
        onClick={() => navigate('/transactions')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Transaction Audit List
      </button>

      {/* Main summary card */}
      <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row justify-between gap-6">
        <div className="min-w-0 space-y-2">
          <div className="min-w-0 flex items-center gap-2.5">
            <span className="shrink-0 text-xs text-slate-400 font-mono">TRANSACTION ID:</span>
            <span className="min-w-0 break-all font-mono text-cyan-400 font-extrabold text-sm">{txn.transaction_id}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-white">{formatCurrency(txn.amount, txn.currency)}</span>
            <RiskBadge decision={risk?.decision || txn.decision || 'ALLOW'} size="lg" />
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {formatDate(txn.timestamp)} {formatTimestamp(txn.timestamp)}
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">User Account</span>
            <span className="block truncate font-bold text-white font-mono">{txn.user_id}</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Payment Method</span>
            <span className="block truncate font-bold text-slate-200">{txn.payment_method || 'UPI'}</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">IP Address</span>
            <span className="block truncate font-bold text-cyan-300 font-mono">{txn.ip_address || '—'}</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Country</span>
            <span className="block truncate font-bold text-slate-200">{txn.country || 'India'}</span>
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
            { id: 'ml', label: 'ML Explanations & SHAP', icon: Cpu },
            { id: 'audit', label: 'Audit Timeline', icon: Activity },
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

      <div className="min-h-[400px]">
        {/* Tab: Overview */}
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

        {/* Tab: Behavioral */}
        {activeTab === 'behavior' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-lg max-w-2xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Fingerprint className="w-4 h-4 text-cyan-400" /> User &amp; Device Behavioral Metrics
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
                <span className="font-bold font-mono text-slate-200">{txn.transaction_frequency?.toFixed(1) ?? '1.0'} req / min</span>
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

        {/* Tab: Network */}
        {activeTab === 'network' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-lg max-w-2xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Globe className="w-4 h-4 text-cyan-400" /> DPI Telemetry &amp; Network Security
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
                <span className="font-mono text-slate-400 text-xs">{txn.device_id || 'DEV_0049'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Detected Scenario Vector</span>
                <span className="font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded text-xs border border-cyan-500/20">{txn.scenario_label || 'normal_baseline'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Network Risk Contribution</span>
                <span className="font-mono font-bold text-amber-400">{risk?.network_score?.toFixed(1) || '0.0'} / 100</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab: ML Explanation */}
        {activeTab === 'ml' && (
          <div className="space-y-6 max-w-3xl">
            <AiExplanationCard
              explanation={risk?.llm_explanation}
              riskAssessment={risk}
              onExplain={requestExplanation}
              loading={explaining}
            />

            {/* Model predictions from database */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-lg text-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h4 className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" /> ML Engine Model Predictions
                </h4>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  risk?.ml_fallback
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {risk?.ml_fallback ? 'Rule-Based Fallback' : 'Active ML Pipelines'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {predictions.length > 0 ? (
                  predictions.map((p, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-white block capitalize">
                            {p.model.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Version: {p.version}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          p.anomaly_flag
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {p.predicted_class}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline pt-1">
                        <span className="text-xs text-slate-400">Inference Score:</span>
                        <span className="font-mono text-base font-black text-cyan-400">
                          {Math.round(p.score * 10) / 10} / 100
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">Isolation Forest (Unsupervised)</div>
                      <div className="text-cyan-400 font-bold font-mono text-base mt-1">
                        {Math.round((risk?.ml_anomaly_score ?? 20) * 10) / 10} / 100
                      </div>
                    </div>
                    <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">XGBoost Classifier (Supervised)</div>
                      <div className="text-cyan-400 font-bold font-mono text-base mt-1">
                        {Math.round((risk?.ml_supervised_score ?? 20) * 10) / 10} / 100
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* SHAP Feature Attributions */}
              {shapEntries.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-cyan-400" /> SHAP Feature Impact Attributions
                  </h5>
                  <div className="space-y-1.5 pt-1">
                    {shapEntries.slice(0, 6).map(([feat, val]) => {
                      const numVal = Number(val);
                      const isRisk = numVal > 0;
                      return (
                        <div key={feat} className="flex justify-between items-center text-[11px] p-2 bg-slate-950/40 rounded-lg border border-slate-800/60">
                          <span className="font-mono text-slate-300">{feat}</span>
                          <span className={`font-mono font-bold ${isRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {isRisk ? `+${(numVal * 100).toFixed(1)}% risk` : `${(numVal * 100).toFixed(1)}% safe`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Audit */}
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
                <span className="text-sm font-bold text-white block">Risk Engine &amp; ML Models Evaluated</span>
                <span className="text-xs text-slate-400 block mt-1">
                  Isolation Forest anomaly + XGBoost prediction calculated final score ({Math.round(risk?.risk_score || 0)}/100)
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Inference Pipeline Completed</span>
              </div>
              <div className="relative">
                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-slate-900" />
                <span className="text-sm font-bold text-white block">Decision Outputted: {risk?.decision || txn.decision || 'ALLOW'}</span>
                <span className="text-xs text-slate-400 block mt-1">
                  Confidence rating {((risk?.confidence || 0.95) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Action Logged to Central Database</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
