import React from 'react';
import type { Decision } from '../../types';
import { RiskBadge } from './RiskBadge';

interface RiskScoreGaugeProps {
  score: number;
  decision?: Decision;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({
  score,
  decision,
  confidence,
  size = 'md',
  className = '',
}) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  let color = 'bg-emerald-500';
  let textColor = 'text-emerald-400';

  if (normalizedScore > 80 || decision === 'BLOCK') {
    color = 'bg-rose-500';
    textColor = 'text-rose-400';
  } else if (normalizedScore > 60 || decision === 'STEP-UP') {
    color = 'bg-orange-500';
    textColor = 'text-orange-400';
  } else if (normalizedScore > 30 || decision === 'MONITOR') {
    color = 'bg-amber-500';
    textColor = 'text-amber-400';
  }

  if (size === 'sm') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full ${color} transition-all duration-300`}
            style={{ width: `${normalizedScore}%` }}
          />
        </div>
        <span className={`text-xs font-mono font-bold ${textColor} tabular-nums`}>
          {normalizedScore}
        </span>
      </div>
    );
  }

  return (
    <div className={`panel p-4 sm:p-5 flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
          Composite Risk Assessment
        </span>
        {confidence !== undefined && (
          <span className="text-[11px] font-mono text-slate-400">
            Confidence: <span className="text-white font-medium">{Math.round(confidence * 100)}%</span>
          </span>
        )}
      </div>

      <div className="my-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase text-slate-500">Calculated Score</div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-3xl sm:text-4xl font-extrabold font-mono tabular-nums ${textColor}`}>
              {normalizedScore}
            </span>
            <span className="text-xs font-mono text-slate-500">/ 100</span>
          </div>
        </div>

        {decision && (
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">SOC Routing</div>
            <RiskBadge decision={decision} size="lg" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        {/* Progress Bar with Tier Marks */}
        <div className="relative h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full ${color} transition-all duration-500`}
            style={{ width: `${normalizedScore}%` }}
          />
        </div>

        {/* Legend / Range brackets */}
        <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center pt-1 border-t border-slate-800/60">
          <div className="text-emerald-500/80">0–30 Allow</div>
          <div className="text-amber-500/80">31–60 Monitor</div>
          <div className="text-orange-500/80">61–80 Step-Up</div>
          <div className="text-rose-500/80">81–100 Block</div>
        </div>
      </div>
    </div>
  );
};
