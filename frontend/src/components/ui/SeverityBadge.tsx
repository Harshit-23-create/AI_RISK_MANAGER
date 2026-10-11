import React from 'react';
import type { Severity } from '../../types';
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';

interface SeverityBadgeProps {
  severity: Severity | string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const s = (severity || 'LOW').toUpperCase();

  let styles = 'bg-slate-900/60 text-slate-400 border-slate-700/60';
  let Icon = Info;

  if (s === 'MEDIUM') {
    styles = 'bg-amber-950/40 text-amber-400 border-amber-800/50';
    Icon = AlertTriangle;
  } else if (s === 'HIGH') {
    styles = 'bg-orange-950/40 text-orange-400 border-orange-800/50';
    Icon = AlertCircle;
  } else if (s === 'CRITICAL') {
    styles = 'bg-rose-950/50 text-rose-400 border-rose-800/60 font-bold';
    Icon = ShieldAlert;
  }

  const px = size === 'sm' ? 'px-1.5 py-0.5 text-[10px] gap-1' : 'px-2 py-0.5 text-[11px] gap-1.5';
  const iconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  return (
    <span className={`inline-flex items-center font-mono font-semibold rounded border ${styles} ${px} uppercase tracking-wider`}>
      <Icon className={iconSize} />
      <span>{s}</span>
    </span>
  );
};
