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
    { label: 'Transaction Risk', weight: '25%', score: data.transaction, color: 'bg-cyan-500' },
    { label: 'Behavioral Risk', weight: '25%', score: data.behavioral, color: 'bg-blue-500' },
    { label: 'Network / DPI Risk', weight: '20%', score: data.network, color: 'bg-indigo-500' },
    { label: 'ML Anomaly (IF)', weight: '15%', score: data.ml_anomaly, color: 'bg-purple-500' },
    { label: 'ML Supervised (XGB)', weight: '15%', score: data.ml_supervised, color: 'bg-pink-500' },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Factor Weighted Analysis</h3>
        <span className="text-[11px] text-slate-400 font-mono">100% Total Model Weight</span>
      </div>

      <div className="space-y-3.5">
        {factors.map((f, i) => {
          const score = Math.round(f.score || 0);
          const getBarColor = (val: number) => {
            if (val > 70) return 'bg-rose-500 shadow-rose-500/20';
            if (val > 45) return 'bg-amber-500 shadow-amber-500/20';
            return 'bg-emerald-500 shadow-emerald-500/20';
          };

          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-300">
                  {f.label} <span className="text-[10px] text-slate-400 font-mono">({f.weight})</span>
                </span>
                <span className="font-bold text-slate-200 font-mono">{score}/100</span>
              </div>
              <div className="relative h-2.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/40">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(score)}`}
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
