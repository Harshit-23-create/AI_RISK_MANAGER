import React from 'react';

interface BreakdownProps {
  breakdown?: {
    transaction: number;
    behavioral: number;
    network: number;
    ml_anomaly: number;
    ml_supervised: number;
  };
}

export const RiskFactorBreakdown: React.FC<BreakdownProps> = ({ breakdown }) => {
  const data = breakdown || {
    transaction: 0,
    behavioral: 0,
    network: 0,
    ml_anomaly: 0,
    ml_supervised: 0,
  };

  const factors = [
    { label: 'Transaction Risk', weight: '25%', score: data.transaction },
    { label: 'Behavioral Risk', weight: '25%', score: data.behavioral },
    { label: 'Network / DPI Risk', weight: '20%', score: data.network },
    { label: 'ML Anomaly (IF)', weight: '15%', score: data.ml_anomaly },
    { label: 'ML Supervised (XGB)', weight: '15%', score: data.ml_supervised },
  ];

  return (
    <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg backdrop-blur-md">
      <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
        <h3 className="min-w-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">
          Risk Factor Weighted Analysis
        </h3>
        <span className="shrink-0 text-[9px] font-mono text-slate-500 sm:text-[10px]">
          100% Weight
        </span>
      </div>

      <div className="space-y-3">
        {factors.map((factor) => {
          const score = Math.round(factor.score || 0);
          const barColor =
            score > 70 ? 'bg-rose-500' : score > 45 ? 'bg-amber-500' : 'bg-emerald-500';

          return (
            <div key={factor.label} className="min-w-0 space-y-1">
              <div className="flex min-w-0 justify-between gap-3 text-[10px] sm:text-xs">
                <span className="min-w-0 truncate font-medium text-slate-300">
                  {factor.label}{' '}
                  <span className="text-[9px] font-mono text-slate-500">({factor.weight})</span>
                </span>
                <span className="shrink-0 font-bold font-mono text-slate-200">{score}/100</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full border border-slate-700/40 bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.min(100, Math.max(2, score))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
