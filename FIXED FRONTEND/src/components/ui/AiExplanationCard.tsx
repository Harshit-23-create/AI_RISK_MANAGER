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
        return 'Immediately decline the transaction, freeze the account pending verification, and alert a SOC tier-2 analyst.';
      case 'STEP-UP':
        return 'Trigger 2-Factor / Biometric authentication and challenge the user identity before releasing funds.';
      case 'MONITOR':
        return 'Allow the transaction to proceed while flagging the user profile for elevated telemetry observation.';
      default:
        return 'Standard approval. No further action required.';
    }
  };

  const decisionClass =
    decision === 'BLOCK'
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
      : decision === 'STEP-UP'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        : decision === 'ALLOW'
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/20 shadow-xl backdrop-blur-md">
      <div className="flex flex-col gap-4 border-b border-slate-800 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2.5 text-cyan-400">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold leading-5 text-white sm:text-base">
                AI Risk Intelligence Rationale
              </h3>
              <span className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${decisionClass}`}>
                {decision}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-slate-400">
              Automated machine learning &amp; rule-based explanation
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:justify-end">
          <span className="inline-flex min-h-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-300">
            Rule &amp; LLM Hybrid
          </span>

          {onExplain && (
            <button
              type="button"
              onClick={onExplain}
              disabled={loading}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Bot className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {loading ? 'Generating…' : 'Generate AI Report'}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {text ? (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 leading-6 text-slate-200 sm:p-4">
              <p className="whitespace-pre-wrap break-words">{text}</p>
            </div>

            {factors.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                  Primary Detected Signals
                </h4>

                <ul className="grid min-w-0 gap-2 sm:grid-cols-2">
                  {factors.slice(0, 4).map((factor, index) => (
                    <li
                      key={index}
                      className="flex min-w-0 items-start gap-2 rounded-lg border border-slate-800 bg-slate-800/40 p-3"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                      <div className="min-w-0">
                        <span className="block break-words font-semibold leading-5 text-slate-200">
                          {factor.description}
                        </span>
                        <span className="mt-1 block text-[10px] font-mono capitalize text-slate-400">
                          Severity: {factor.severity}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-800/60 p-3.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
              <div className="min-w-0">
                <span className="block text-xs font-bold text-cyan-300">
                  Recommended Analyst Action
                </span>
                <p className="mt-1 break-words text-xs leading-5 text-slate-300">
                  {getRecommendedAction(decision)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-36 flex-col items-center justify-center px-3 py-8 text-center text-slate-400">
            <Bot className="mb-2 h-8 w-8 text-slate-600" />
            <p className="text-xs leading-5">
              No AI explanation has been generated for this transaction yet.
            </p>

            {onExplain && (
              <button
                type="button"
                onClick={onExplain}
                disabled={loading}
                className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {loading ? 'Analyzing…' : 'Analyze Transaction with AI'}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
