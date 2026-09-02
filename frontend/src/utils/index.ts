import type { Decision, Severity } from '../types';

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

export function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function riskScoreColor(score: number): string {
  if (score >= 81) return '#ef4444';
  if (score >= 61) return '#f59e0b';
  if (score >= 31) return '#3b82f6';
  return '#10b981';
}

export function decisionBadgeClass(decision: Decision | string): string {
  switch (decision?.toUpperCase()) {
    case 'ALLOW':   return 'badge-allow';
    case 'MONITOR': return 'badge-monitor';
    case 'STEP-UP': return 'badge-stepup';
    case 'BLOCK':   return 'badge-block';
    default:        return 'badge-monitor';
  }
}

export function severityBadgeClass(severity: Severity | string): string {
  switch (severity?.toUpperCase()) {
    case 'LOW':      return 'badge-low';
    case 'medium':
    case 'MEDIUM':   return 'badge-medium';
    case 'HIGH':     return 'badge-high';
    case 'CRITICAL': return 'badge-critical';
    default:         return 'badge-low';
  }
}

export function truncateId(id: string, len = 12): string {
  return id.length > len ? `${id.slice(0, len)}…` : id;
}

export function formatFactor(factor: string): string {
  return factor
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
