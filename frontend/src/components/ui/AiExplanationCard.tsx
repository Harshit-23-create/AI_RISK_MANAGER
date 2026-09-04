import React from 'react';
import { Bot, Sparkles, AlertCircle, ShieldAlert } from 'lucide-react';
import type { RiskAssessment } from '../../types';

interface AiExplanationCardProps {
  explanation?: string | null;
  riskAssessment?: RiskAssessment | null;
  onExplain?: () => void;
  loading?: boolean;
}

export const AiExplanationCard: React.FC<AiExplanationCardProps> = ({
  explanation,
  riskAssessment,
  onExplain,
  loading = false,
}) => {
  const text = explanation || riskAssessment?.llm_explanation;
  const decision = riskAssessment?.decision || 'MONITOR';
  const factors = riskAssessment?.risk_factors || [];

  const getRecommendedAction = (dec: string) => {
    switch (dec) {
      case 'BLOCK':
        return 'Immediately decline transaction, freeze account pending verification, and alert SOC tier-2 analyst.';
      case 'STEP-UP':
        return 'Trigger 2-Factor / Biometric authentication. Challenge user identity before releasing funds.';
      case 'MONITOR':
        return 'Allow transaction to proceed but flag user profile for elevated telemetry observation.';
      default:
        return 'Standard approval. No further action required.';
    }
  };

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900 to-cyan-950/20 p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              AI Risk Intelligence Rationale
            </h3>
            <p className="text-[11px] text-slate-400">Automated machine learning & rule-based explanation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
            Engine: Rule & LLM Hybrid
          </span>
          {onExplain && (
            <button
              onClick={onExplain}
              disabled={loading}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? <Bot className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate AI Report
            </button>
          )}
        </div>
      </div>

      {text ? (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="rounded-lg bg-slate-950/60 p-3.5 border border-slate-800 leading-relaxed text-slate-200">
            {text}
          </div>

          {/* Key triggers list */}
          {factors.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                Primary Detected Signals
              </h4>
              <ul className="grid gap-2 sm:grid-cols-2">
                {factors.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-800/40 p-2 rounded border border-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-200 block">{f.description}</span>
                      <span className="text-[10px] text-slate-400 font-mono capitalize">Severity: {f.severity}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Action */}
          <div className="rounded-lg bg-slate-800/60 p-3 border border-slate-700/60 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-cyan-300 block mb-0.5">Recommended Analyst Action</span>
              <p className="text-slate-300">{getRecommendedAction(decision)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-slate-400">
          <Bot className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs">No AI explanation requested yet for this transaction.</p>
          {onExplain && (
            <button
              onClick={onExplain}
              disabled={loading}
              className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition-all inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Analyze Transaction with AI
            </button>
          )}
        </div>
      )}
    </div>
  );
};
