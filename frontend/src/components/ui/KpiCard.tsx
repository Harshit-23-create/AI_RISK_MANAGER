import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  change?: number;
  changePeriod?: string;
  icon: LucideIcon;
  iconColor?: string;
  accentColor?: string;
  updatedAt?: string;
  isLive?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtext,
  change,
  changePeriod = 'vs last hr',
  icon: Icon,
  iconColor = 'text-cyan-400',
  accentColor = 'from-cyan-500/10 to-blue-600/5',
  updatedAt = 'updated just now',
  isLive = true,
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br ${accentColor} bg-slate-900/80 p-4 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-slate-700 hover:shadow-cyan-500/5`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`rounded-lg bg-slate-800/80 p-2 border border-slate-700/50 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-extrabold tracking-tight text-white">{value}</div>
        {change !== undefined && (
          <div
            className={`inline-flex items-center gap-0.5 text-xs font-bold ${
              isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : isNegative ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px] text-slate-400">
        <span className="truncate">{subtext || (change !== undefined ? changePeriod : 'Real-time telemetry')}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          <span className="text-[10px] text-slate-500">{updatedAt}</span>
        </div>
      </div>
    </div>
  );
};
