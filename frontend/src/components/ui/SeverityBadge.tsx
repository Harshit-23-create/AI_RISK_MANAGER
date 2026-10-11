import React from 'react';
import type { Severity } from '../../types';
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';

interface SeverityBadgeProps {
  severity: Severity | string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const s = (severity || 'LOW').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-700/60 badge-text';
  let Icon = Info;

  if (s === 'MEDIUM') {
    styles = 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50 badge-text';
    Icon = AlertTriangle;
  } else if (s === 'HIGH') {
    styles = 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/50 badge-text';
    Icon = AlertCircle;
  } else if (s === 'CRITICAL') {
    styles = 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60 font-bold badge-text';
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
