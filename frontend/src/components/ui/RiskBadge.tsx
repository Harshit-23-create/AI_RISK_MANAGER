import React from 'react';
import type { Decision } from '../../types';
import { ShieldCheck, Eye, ShieldAlert, Ban } from 'lucide-react';

interface RiskBadgeProps {
  decision: Decision | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  decision,
  size = 'md',
  showIcon = true,
}) => {
  const d = (decision || 'ALLOW').toUpperCase();

  let styles = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50 badge-text';
  let Icon = ShieldCheck;

  if (d === 'MONITOR') {
    styles = 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50 badge-text';
    Icon = Eye;
  } else if (d === 'STEP-UP' || d === 'STEP_UP') {
    styles = 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/50 badge-text';
    Icon = ShieldAlert;
  } else if (d === 'BLOCK') {
    styles = 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50 badge-text';
    Icon = Ban;
  }

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1 font-mono',
    md: 'px-2 py-0.5 text-[11px] gap-1.5 font-mono',
    lg: 'px-3 py-1 text-xs gap-2 font-mono',
  }[size];

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded border font-semibold uppercase tracking-wider ${styles} ${sizeClasses}`}
    >
      {showIcon && <Icon className={iconSizes} />}
      <span>{d === 'STEP_UP' ? 'STEP-UP' : d}</span>
    </span>
  );
};
