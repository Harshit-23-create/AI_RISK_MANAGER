import React from 'react';
import type { Decision } from '../../types';
import { ShieldCheck, Eye, ShieldAlert, Ban } from 'lucide-react';

interface RiskBadgeProps {
  decision: Decision | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ decision, size = 'md', showIcon = true }) => {
  const d = (decision || 'ALLOW').toUpperCase();

  let colors = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let Icon = ShieldCheck;

  if (d === 'MONITOR') {
    colors = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    Icon = Eye;
  } else if (d === 'STEP-UP') {
    colors = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    Icon = ShieldAlert;
  } else if (d === 'BLOCK') {
    colors = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    Icon = Ban;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold gap-1',
    md: 'px-2.5 py-1 text-xs font-bold gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm font-bold gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${colors} ${sizeClasses} shadow-sm backdrop-blur-sm tracking-wide transition-all`}
    >
      {showIcon && <Icon className={iconSizes} />}
      <span>{d}</span>
    </span>
  );
};
