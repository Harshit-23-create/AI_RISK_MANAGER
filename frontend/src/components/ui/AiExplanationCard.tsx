import React from 'react';
import { Bot, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import type { RiskAssessment } from '../../types';
import { RiskBadge } from './RiskBadge';

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
    switch (dec.toUpperCase()) {
      case 'BLOCK':
        return 'Decline transaction immediately, freeze user payment authorization pending identity verification, and file high-priority SOC ticket.';
      case 'STEP-UP':
        return 'Request step-up 2FA/biometric challenge before completing settlement. Restrict transaction until authenticated.';
      case 'MONITOR':
        return 'Permit settlement while tagging account profile for 72h elevated velocity observation.';
      default:
        return 'Standard approval path. No human intervention required.';
    }
  };

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-800/80 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between bg-slate-900/30">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-850 border border-slate-700/60 text-cyan-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">
                Decision Intelligence & Rationale
              </h3>
              <RiskBadge decision={decision} size="sm" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated synthesis of ML attributions, DPI telemetry, and rule heuristics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onExplain && (
            <button
              type="button"
              onClick={onExplain}
              disabled={loading}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Bot className="h-3.5 w-3.5 animate-spin text-cyan-400" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              )}
              {loading ? 'Analyzing Signals…' : 'Generate Rationale Narrative'}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {text ? (
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs leading-relaxed text-slate-300 font-sans">
            <p className="whitespace-pre-wrap">{text}</p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/30 p-6 text-center text-xs text-slate-400">
            No narrative generated yet. Click "Generate Rationale Narrative" above to evaluate signals.
          </div>
        )}

        {factors.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              Primary Trigger Factors ({factors.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {factors.map((item, idx) => {
                const name = typeof item === 'string' ? item : item.factor || item.description;
                const contrib = typeof item === 'object' && item.contribution ? ` (+${Math.round(item.contribution * 100)}%)` : '';
                return (
                  <span
                    key={idx}
                    title={typeof item === 'object' ? item.description : undefined}
                    className="inline-flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-2 py-1 text-[11px] text-slate-300 font-mono"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {name}{contrib}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3.5 flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-slate-200">Recommended Analyst Action: </span>
            <span className="text-slate-400">{getRecommendedAction(decision)}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
