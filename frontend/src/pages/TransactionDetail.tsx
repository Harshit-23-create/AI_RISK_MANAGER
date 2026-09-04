import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Globe, Clock, Fingerprint
} from 'lucide-react';
import { transactionsApi, riskApi } from '../services/api';
import type { Transaction, RiskAssessment } from '../types';
import { formatCurrency, formatDate, formatTimestamp } from '../utils';
import { RiskBadge } from '../components/ui/RiskBadge';
import { RiskScoreGauge } from '../components/ui/RiskScoreGauge';
import { RiskFactorBreakdown } from '../components/ui/RiskFactorBreakdown';
import { AiExplanationCard } from '../components/ui/AiExplanationCard';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [loading, setLoading] = useState(true);

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
      {/* Back button */}
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

        {/* Quick specs grid */}
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

      {/* Main Grid: Left investigation panels + Right Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Risk Analysis & Intelligence */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Explanation Card */}
          <AiExplanationCard
            explanation={risk?.llm_explanation}
            riskAssessment={risk}
            onExplain={requestExplanation}
            loading={explaining}
          />

          {/* Weighted Factor Breakdown */}
          <RiskFactorBreakdown breakdown={risk?.breakdown} />

          {/* Behavioral & Network Intelligence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Behavioral Intelligence */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-lg space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Fingerprint className="w-4 h-4 text-cyan-400" /> Behavioral Telemetry
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Auth Failures</span>
                  <span className={`font-bold font-mono ${txn.failed_attempts > 3 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {txn.failed_attempts} attempts
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Transaction Velocity</span>
                  <span className="font-bold font-mono text-slate-200">{txn.transaction_frequency.toFixed(1)} / min</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Account Age</span>
                  <span className="font-bold font-mono text-slate-200">{txn.account_age_days} days</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Historical Avg Amount</span>
                  <span className="font-bold font-mono text-slate-200">{formatCurrency(txn.previous_transaction_avg, txn.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unrecognised Device</span>
                  <span className={`font-bold ${txn.is_new_device ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {txn.is_new_device ? 'New Device Detected' : 'Known Device'}
                  </span>
                </div>
              </div>
            </div>

            {/* Network Intelligence */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-lg space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Globe className="w-4 h-4 text-cyan-400" /> Network & DPI Intelligence
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">IP Reputation</span>
                  <span className={`font-bold ${txn.is_new_ip ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {txn.is_new_ip ? 'Suspicious / Foreign IP' : 'Clean Residential'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Device Fingerprint</span>
                  <span className="font-mono text-slate-300">{txn.device_id || 'DEV_UNKNOWN'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Scenario Vector</span>
                  <span className="font-mono text-cyan-400">{txn.scenario_label || 'normal_baseline'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Network Risk Contribution</span>
                  <span className="font-mono font-bold text-amber-400">{risk?.network_score.toFixed(1) || '0.0'} / 100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Event Timeline */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-lg space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Clock className="w-4 h-4 text-cyan-400" /> Transaction Audit Lifecycle Timeline
            </h3>

            <div className="relative pl-6 space-y-4 border-l border-slate-800">
              <div className="relative">
                <span className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                <span className="text-xs font-bold text-white block">1. Payment Request Received</span>
                <span className="text-[11px] text-slate-400">Ingested via REST API endpoint with amount {formatCurrency(txn.amount, txn.currency)}</span>
              </div>
              <div className="relative">
                <span className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-slate-900" />
                <span className="text-xs font-bold text-white block">2. Risk Engine & ML Models Evaluated</span>
                <span className="text-[11px] text-slate-400">Isolation Forest anomaly + XGBoost prediction calculated final score ({Math.round(risk?.risk_score || 0)}/100)</span>
              </div>
              <div className="relative">
                <span className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-slate-900" />
                <span className="text-xs font-bold text-white block">3. Decision Outputted: {risk?.decision || 'ALLOW'}</span>
                <span className="text-[11px] text-slate-400">Confidence rating {(risk?.confidence || 0.95) * 100}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Score Gauge Card */}
        <div className="space-y-6">
          <RiskScoreGauge
            score={risk?.risk_score || 0}
            decision={risk?.decision}
            confidence={risk?.confidence}
          />

          {/* Model Status Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-lg space-y-3 text-xs">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-2">
              Machine Learning Pipeline Status
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Isolation Forest</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">XGBoost Classifier</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">SHAP Explainability</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
