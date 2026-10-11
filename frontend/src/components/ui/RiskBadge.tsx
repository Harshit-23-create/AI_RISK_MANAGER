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

  let styles = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50';
  let Icon = ShieldCheck;

  if (d === 'MONITOR') {
    styles = 'bg-amber-950/40 text-amber-400 border-amber-800/50';
    Icon = Eye;
  } else if (d === 'STEP-UP' || d === 'STEP_UP') {
    styles = 'bg-orange-950/40 text-orange-400 border-orange-800/50';
    Icon = ShieldAlert;
  } else if (d === 'BLOCK') {
    styles = 'bg-rose-950/40 text-rose-400 border-rose-800/50';
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
