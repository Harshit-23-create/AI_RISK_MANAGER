import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  change?: number;
  changePeriod?: string;
  icon?: LucideIcon;
  badge?: string;
  badgeVariant?: 'neutral' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtext,
  change,
  changePeriod,
  icon: Icon,
  badge,
  badgeVariant = 'neutral',
  className = '',
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  const badgeStyles = {
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    warning: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
    danger: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
  }[badgeVariant];

  return (
    <div className={`panel panel-hover p-4 sm:p-5 flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border ${badgeStyles}`}>
              {badge}
            </span>
          )}
          {Icon && (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 border border-slate-800 text-slate-400">
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      </div>

      <div className="my-2.5 flex items-baseline justify-between gap-2">
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
          {value}
        </div>
        {change !== undefined && (
          <div
            className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold ${
              isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'
            }`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : isNegative ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      {(subtext || changePeriod) && (
        <div className="text-[11px] text-slate-400 truncate flex items-center justify-between border-t border-slate-800/60 pt-2">
          <span>{subtext}</span>
          {changePeriod && <span className="text-slate-400 font-mono text-[10px]">{changePeriod}</span>}
        </div>
      )}
    </div>
  );
};
