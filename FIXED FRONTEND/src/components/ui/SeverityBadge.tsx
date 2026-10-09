import React from 'react';
import type { Severity } from '../../types';
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';

interface SeverityBadgeProps {
  severity: Severity | string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const s = (severity || 'LOW').toUpperCase();

  let colors = 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  let Icon = Info;

  if (s === 'MEDIUM') {
    colors = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    Icon = AlertTriangle;
  } else if (s === 'HIGH') {
    colors = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    Icon = AlertCircle;
  } else if (s === 'CRITICAL') {
    colors = 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse';
    Icon = ShieldAlert;
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-md border ${colors} ${px} uppercase tracking-wider`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {s}
    </span>
  );
};
