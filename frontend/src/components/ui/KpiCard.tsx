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
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className={`relative min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br ${accentColor} bg-slate-900/80 p-3 shadow-lg backdrop-blur-md transition hover:border-slate-700 sm:p-4`}>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className="min-w-0 truncate text-[9px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[10px]">
          {title}
        </span>
        <div className={`shrink-0 rounded-lg border border-slate-700/50 bg-slate-800/80 p-1.5 ${iconColor} sm:p-2`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>

      <div className="mt-2 flex min-w-0 items-baseline justify-between gap-2 sm:mt-3">
        <div className="min-w-0 truncate text-xl font-extrabold tracking-tight text-white sm:text-2xl">
          {value}
        </div>
        {change !== undefined && (
          <div className={`inline-flex shrink-0 items-center gap-0.5 text-[10px] font-bold ${
            isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'
          }`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : isNegative ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex min-w-0 items-center justify-between gap-2 border-t border-slate-800/60 pt-2 text-[9px] text-slate-400 sm:text-[10px]">
        <span className="min-w-0 truncate">{subtext || (change !== undefined ? changePeriod : 'Real-time telemetry')}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          <span className="hidden text-[9px] text-slate-500 xl:inline">{updatedAt}</span>
        </div>
      </div>
    </div>
  );
};
