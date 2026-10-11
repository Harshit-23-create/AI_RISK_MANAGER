import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Globe, Clock, Fingerprint, Activity, ShieldAlert, Cpu, BarChart2,
  Copy, Check
} from 'lucide-react';
import { transactionsApi, riskApi } from '../services/api';
import type { Transaction, RiskAssessment, ModelPredictionItem } from '../types';
import { formatCurrency, formatDate, formatTimestamp } from '../utils';
import { PageHeader } from '../components/ui/PageHeader';
import { RiskBadge } from '../components/ui/RiskBadge';
import { RiskScoreGauge } from '../components/ui/RiskScoreGauge';
import { RiskFactorBreakdown } from '../components/ui/RiskFactorBreakdown';
import { AiExplanationCard } from '../components/ui/AiExplanationCard';
import { SkeletonCard } from '../components/ui/SkeletonLoader';

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
  const [copied, setCopied] = useState(false);

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

  const copyId = () => {
    if (txn?.transaction_id) {
      navigator.clipboard.writeText(txn.transaction_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-slate-800/40 rounded skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard className="md:col-span-2" />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!txn) {
    return (
      <div className="text-center py-16 text-slate-400 space-y-4 panel p-8">
        <p className="text-sm font-semibold text-slate-200">Transaction record not found in system.</p>
        <button
          type="button"
          onClick={() => navigate('/transactions')}
          className="px-4 py-2 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-white transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Transaction Audit Table
        </button>
      </div>
    );
  }

  const shapEntries = risk?.shap_values ? Object.entries(risk.shap_values) : [];

  return (
    <div className="space-y-6">
      {/* Back button & Page Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/transactions')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3 font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Transactions
        </button>

        <PageHeader
          category="Investigation Dossier"
          title={txn.transaction_id}
          subtitle={`Forensic transaction inspection for user ${txn.user_id} evaluated at ${formatDate(txn.timestamp)} ${formatTimestamp(txn.timestamp)}`}
          badge={<RiskBadge decision={risk?.decision || txn.decision || 'ALLOW'} size="md" />}
        >
          <button
            type="button"
            onClick={copyId}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 border border-slate-800 px-3 text-xs font-mono font-medium text-slate-300 hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            <span>{copied ? 'Copied ID' : 'Copy Tx ID'}</span>
          </button>
        </PageHeader>
      </div>

      {/* Forensic Metadata Banner */}
      <div className="panel p-5 grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
        <div className="md:col-span-2 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Evaluated Transaction Amount
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-white">
              {formatCurrency(txn.amount, txn.currency)}
            </span>
            <RiskBadge decision={risk?.decision || txn.decision || 'ALLOW'} size="md" />
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono pt-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {formatDate(txn.timestamp)} • {formatTimestamp(txn.timestamp)}
          </div>
        </div>

        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">User Account</span>
            <span className="font-semibold text-white font-mono truncate block">{txn.user_id}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Payment Method</span>
            <span className="font-semibold text-slate-200 truncate block">{txn.payment_method || 'UPI / Card'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Client IP</span>
            <span className="font-semibold text-cyan-400 font-mono truncate block">{txn.ip_address || '—'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Origin Country</span>
            <span className="font-semibold text-slate-200 truncate block">{txn.country || 'Global'}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800/80 gap-6 overflow-x-auto text-xs font-mono">
        {(
          [
            { id: 'overview', label: 'Risk Overview & Weights', icon: ShieldAlert },
            { id: 'behavior', label: 'Behavioral Signals', icon: Fingerprint },
            { id: 'network', label: 'Network & DPI Telemetry', icon: Globe },
            { id: 'ml', label: 'ML Explanations & SHAP', icon: Cpu },
            { id: 'audit', label: 'Lifecycle Audit Trail', icon: Activity },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
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

      {/* Tab Panels */}
      <div className="min-h-[420px]">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RiskScoreGauge
                score={risk?.risk_score || 0}
                decision={risk?.decision}
                confidence={risk?.confidence}
              />
              <RiskFactorBreakdown breakdown={risk?.breakdown} />
            </div>

            <AiExplanationCard
              explanation={risk?.llm_explanation}
              riskAssessment={risk}
              onExplain={requestExplanation}
              loading={explaining}
            />
          </div>
        )}

        {/* Tab 2: Behavioral */}
        {activeTab === 'behavior' && (
          <div className="panel p-5 max-w-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-cyan-400" /> User &amp; Device Behavioral Attributes
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Contextual Telemetry</span>
            </div>

            <div className="divide-y divide-slate-800/60 text-xs">
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-400">Recent Authentication Failures</span>
                <span className={`font-mono font-bold ${txn.failed_attempts > 3 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {txn.failed_attempts} attempts
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-400">Transaction Velocity (5-min window)</span>
                <span className="font-mono font-bold text-slate-200">{txn.transaction_frequency?.toFixed(1) ?? '1.0'} req/min</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-400">Account Age on File</span>
                <span className="font-mono font-bold text-slate-200">{txn.account_age_days} days</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-400">Historical Average Amount</span>
                <span className="font-mono font-bold text-slate-200">{formatCurrency(txn.previous_transaction_avg, txn.currency)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-400">Device Familiarity State</span>
                <span className={`font-semibold ${txn.is_new_device ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {txn.is_new_device ? 'New Unrecognized Device' : 'Verified Known Device'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Network */}
        {activeTab === 'network' && (
          <div className="panel p-5 max-w-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" /> Layer-7 DPI &amp; Network Intelligence
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Packet Ingestion</span>
            </div>

            <div className="divide-y divide-slate-800/60 text-xs">
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-400">Source IP Address</span>
                <span className="font-mono font-bold text-cyan-400">{txn.ip_address || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-400">IP Reputation &amp; ASN Check</span>
                <span className={`font-semibold ${txn.is_new_ip ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {txn.is_new_ip ? 'Flagged / VPN / Datacenter Node' : 'Clean Residential Pool'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-400">Hardware Fingerprint Hash</span>
                <span className="font-mono text-slate-300">{txn.device_id || 'DEV_0049'}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-400">Triggered Scenario Classification</span>
                <span className="font-mono text-slate-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {txn.scenario_label || 'normal_baseline'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-400">Network DPI Risk Factor Component</span>
                <span className="font-mono font-bold text-amber-400">{risk?.network_score?.toFixed(1) || '0.0'} / 100</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: ML & SHAP */}
        {activeTab === 'ml' && (
          <div className="space-y-6 max-w-4xl">
            {/* AI Narrative */}
            <AiExplanationCard
              explanation={risk?.llm_explanation}
              riskAssessment={risk}
              onExplain={requestExplanation}
              loading={explaining}
            />

            {/* Model Outputs */}
            <div className="panel p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" /> Machine Learning Inference Outputs
                </h4>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                  risk?.ml_fallback
                    ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                    : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                }`}>
                  {risk?.ml_fallback ? 'Rule-Based Fallback Engine' : 'Active ML Microservice'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {predictions.length > 0 ? (
                  predictions.map((p, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-950/60 rounded border border-slate-800 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-white block capitalize text-xs">
                            {p.model.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Version {p.version}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                          p.anomaly_flag
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                        }`}>
                          {p.predicted_class}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline pt-1">
                        <span className="text-xs text-slate-400">Anomaly Index:</span>
                        <span className="font-mono text-base font-bold text-cyan-400 tabular-nums">
                          {Math.round(p.score * 10) / 10} / 100
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-3.5 bg-slate-950/60 rounded border border-slate-800">
                      <div className="text-xs text-slate-400">Isolation Forest (Outlier Detector)</div>
                      <div className="text-cyan-400 font-bold font-mono text-base mt-1 tabular-nums">
                        {Math.round((risk?.ml_anomaly_score ?? 20) * 10) / 10} / 100
                      </div>
                    </div>
                    <div className="p-3.5 bg-slate-950/60 rounded border border-slate-800">
                      <div className="text-xs text-slate-400">XGBoost Classifier (Supervised)</div>
                      <div className="text-cyan-400 font-bold font-mono text-base mt-1 tabular-nums">
                        {Math.round((risk?.ml_supervised_score ?? 20) * 10) / 10} / 100
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* SHAP Attributions */}
              {shapEntries.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <h5 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                    <BarChart2 className="w-3.5 h-3.5 text-cyan-400" /> SHAP Feature Attribution Impact
                  </h5>
                  <div className="space-y-1.5 pt-1">
                    {shapEntries.slice(0, 6).map(([feat, val]) => {
                      const numVal = Number(val);
                      const isRisk = numVal > 0;
                      return (
                        <div key={feat} className="flex justify-between items-center text-xs p-2 bg-slate-950/40 rounded border border-slate-800/60">
                          <span className="font-mono text-slate-300">{feat}</span>
                          <span className={`font-mono font-semibold ${isRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
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

        {/* Tab 5: Audit Timeline */}
        {activeTab === 'audit' && (
          <div className="panel p-5 max-w-2xl space-y-6">
            <h3 className="text-sm font-semibold text-white border-b border-slate-800/80 pb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Transaction Processing Lifecycle
            </h3>

            <div className="relative pl-6 space-y-6 border-l border-slate-800/80 ml-2">
              <div className="relative">
                <span className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
                <span className="text-xs font-semibold text-white block">Payment Ingested</span>
                <span className="text-xs text-slate-400 block mt-0.5">Ingested via API with amount {formatCurrency(txn.amount, txn.currency)}</span>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">{formatTimestamp(txn.timestamp)}</span>
              </div>
              <div className="relative">
                <span className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-950" />
                <span className="text-xs font-semibold text-white block">Risk Scoring Pipeline Evaluated</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Isolation Forest + XGBoost models computed anomaly index ({Math.round(risk?.risk_score || 0)}/100)
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Inference Executed</span>
              </div>
              <div className="relative">
                <span className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-950" />
                <span className="text-xs font-semibold text-white block">Routing Policy Applied: {risk?.decision || txn.decision || 'ALLOW'}</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Confidence rating {((risk?.confidence || 0.95) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Logged to System Store</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
