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
    { label: 'Transaction Heuristics', weight: '25%', score: data.transaction, desc: 'Amount outlier, cross-border, velocity spikes' },
    { label: 'Behavioral Signals', weight: '25%', score: data.behavioral, desc: 'Device fingerprint, session age, rapid retries' },
    { label: 'Network / DPI Telemetry', weight: '20%', score: data.network, desc: 'Layer-7 packet anomalies, IP reputation' },
    { label: 'ML Anomaly (Isolation Forest)', weight: '15%', score: data.ml_anomaly, desc: 'Unsupervised multi-dimensional vector variance' },
    { label: 'ML Supervised (XGBoost)', weight: '15%', score: data.ml_supervised, desc: 'Historical fraud pattern binary classification' },
  ];

  return (
    <div className="panel p-4 sm:p-5 flex flex-col justify-between">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Signal Weight Matrix
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Composite risk factor distribution</p>
        </div>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
          100% Normalized
        </span>
      </div>

      <div className="space-y-3.5">
        {factors.map((factor) => {
          const score = Math.round(factor.score || 0);
          const barColor =
            score > 70 ? 'bg-rose-500' : score > 40 ? 'bg-amber-500' : 'bg-emerald-500';
          const textColor =
            score > 70 ? 'text-rose-400' : score > 40 ? 'text-amber-400' : 'text-emerald-400';

          return (
            <div key={factor.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium text-slate-200 truncate">{factor.label}</span>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">({factor.weight})</span>
                </div>
                <span className={`font-mono font-bold shrink-0 ${textColor}`}>
                  {score}<span className="text-[10px] text-slate-500 font-normal">/100</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
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
