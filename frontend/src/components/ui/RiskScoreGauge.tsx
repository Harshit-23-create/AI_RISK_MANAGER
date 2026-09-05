import React from 'react';
import type { Decision } from '../../types';

interface RiskScoreGaugeProps {
  score: number;
  decision?: Decision;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({ score, decision, confidence, size = 'md' }) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  let color = 'bg-emerald-500';
  let textColor = 'text-emerald-400';
  let borderColor = 'border-emerald-500/30';

  if (normalizedScore > 80 || decision === 'BLOCK') {
    color = 'bg-rose-500';
    textColor = 'text-rose-400';
    borderColor = 'border-rose-500/30';
  } else if (normalizedScore > 60 || decision === 'STEP-UP') {
    color = 'bg-orange-500';
    textColor = 'text-orange-400';
    borderColor = 'border-orange-500/30';
  } else if (normalizedScore > 30 || decision === 'MONITOR') {
    color = 'bg-amber-500';
    textColor = 'text-amber-400';
    borderColor = 'border-amber-500/30';
  }

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${normalizedScore}%` }} />
        </div>
        <span className={`text-xs font-bold ${textColor}`}>{normalizedScore}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${borderColor} bg-slate-900/90 p-4 backdrop-blur-md shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Assessment Gauge</span>
        {confidence !== undefined && (
          <span className="text-xs text-slate-400">Confidence: <span className="text-white font-medium">{Math.round(confidence * 100)}%</span></span>
        )}
      </div>

      <div className="flex items-baseline justify-between my-2">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-black ${textColor}`}>{normalizedScore}</span>
          <span className="text-sm text-slate-500">/ 100</span>
        </div>
        {decision && (
          <span className={`text-xs font-extrabold uppercase px-2.5 py-1 rounded-md border ${borderColor} ${textColor} bg-slate-800/80`}>
            {decision}
          </span>
        )}
      </div>

      <div className="relative h-3 w-full rounded-full bg-slate-800/90 overflow-hidden border border-slate-700/60 p-0.5">
        <div
          className={`h-full rounded-full ${color} shadow-lg transition-all duration-700 ease-out`}
          style={{ width: `${normalizedScore}%` }}
        />
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] font-semibold text-slate-400 text-center">
        <div className="text-emerald-400/80">0-30 ALLOW</div>
        <div className="text-amber-400/80">31-60 MONITOR</div>
        <div className="text-orange-400/80">61-80 STEP-UP</div>
        <div className="text-rose-400/80">81-100 BLOCK</div>
      </div>
    </div>
  );
};
