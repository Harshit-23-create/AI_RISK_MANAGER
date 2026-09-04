import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  ArrowUpRight,
  Search,
  Clock,
  X,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { alertsApi } from '../services/api';
import type { AlertListResponse, Alert } from '../types';
import { formatTimestamp, formatDate, truncateId } from '../utils';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { EmptyState } from '../components/ui/EmptyState';

const SEVERITIES = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const STATUSES = ['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'ESCALATED'];

export default function Alerts() {
  const [data, setData] = useState<AlertListResponse | null>(null);
  const [severity, setSeverity] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await alertsApi.list(
        1,
        severity === 'ALL' ? undefined : severity,
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setData(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severity, statusFilter]);

  useEffect(() => {
    if (!selectedAlert) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedAlert(null);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedAlert]);

  const handleAcknowledge = async (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      await alertsApi.acknowledge(id);
      await fetchAlerts();
    } catch {
      alert('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      await alertsApi.resolve(id);
      await fetchAlerts();
    } catch {
      alert('Failed to resolve alert');
    }
  };

  const handleEscalate = async (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      await alertsApi.escalate(id);
      await fetchAlerts();
    } catch {
      alert('Failed to escalate alert');
    }
  };

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return data?.items ?? [];

    return (data?.items ?? []).filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query) ||
        Boolean(
          item.transaction_id &&
            item.transaction_id.toLowerCase().includes(query)
        )
      );
    });
  }, [data?.items, searchQuery]);

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-5 lg:space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md sm:p-5">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" />
              <h1 className="break-words text-lg font-black tracking-tight text-white sm:text-xl">
                Security Operations Center Alerts
              </h1>
              <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[9px] font-mono font-bold uppercase text-rose-400">
                {data?.total ?? 0} Signals
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">
              Real-time fraud incident triage, severity escalation &amp; analyst
              response.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAlerts}
            disabled={loading}
            className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-500/40 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-xl backdrop-blur-md sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`min-h-9 rounded-lg px-3 py-2 text-[10px] font-bold transition sm:text-xs ${
                  statusFilter === status
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {status === 'ALL' ? 'All Statuses' : status}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:w-[25rem]">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                aria-label="Search alerts"
                placeholder="Search title, message or Tx ID…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 text-xs text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10"
              />
            </div>

            <select
              aria-label="Filter by severity"
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs text-slate-200 outline-none focus:border-cyan-500/60 sm:w-auto"
            >
              {SEVERITIES.map((item) => (
                <option key={item} value={item}>
                  {item === 'ALL' ? 'All Severities' : item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="min-w-0 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 py-16 text-center text-slate-400">
            <Clock className="mx-auto mb-2 h-6 w-6 animate-spin text-cyan-400" />
            <p className="text-xs">Loading SOC alert stream…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="No Alerts Found"
            description="No security alerts match the selected severity and status filters."
          />
        ) : (
          filteredItems.map((alert) => {
            const isResolved =
              alert.status === 'RESOLVED' || Boolean(alert.is_resolved);
            const isEscalated = alert.status === 'ESCALATED';
            const isAcknowledged = alert.status === 'ACKNOWLEDGED';

            return (
              <article
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedAlert(alert);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`group min-w-0 rounded-2xl border p-4 shadow-lg transition sm:p-5 ${
                  isEscalated
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : isResolved
                      ? 'border-slate-800 bg-slate-900/40 opacity-75'
                      : 'border-slate-800 bg-slate-900/90'
                } cursor-pointer hover:border-cyan-500/40`}
              >
                <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <SeverityBadge severity={alert.severity} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 className="min-w-0 break-words text-sm font-bold text-white transition-colors group-hover:text-cyan-300">
                          {alert.title}
                        </h3>

                        {alert.transaction_id && (
                          <span className="max-w-full truncate rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 text-[9px] font-mono text-cyan-400">
                            Tx: {truncateId(alert.transaction_id, 12)}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 break-words text-xs leading-5 text-slate-300">
                        {alert.message}
                      </p>

                      <div className="mt-2 grid gap-1 text-[9px] font-mono text-slate-500 sm:grid-cols-2 xl:flex xl:flex-wrap xl:gap-x-5">
                        <span>
                          Created: {formatDate(alert.created_at)}{' '}
                          {formatTimestamp(alert.created_at)}
                        </span>
                        <span>
                          Assigned:{' '}
                          <strong className="text-slate-400">
                            {alert.assigned_to || 'SOC Analyst'}
                          </strong>
                        </span>
                        <span className="text-cyan-400">
                          Status: {alert.status || 'OPEN'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-wrap gap-2 xl:w-auto xl:justify-end">
                    {!isAcknowledged && !isResolved && (
                      <button
                        type="button"
                        onClick={(event) => handleAcknowledge(alert.id, event)}
                        className="min-h-9 flex-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[10px] font-bold text-amber-400 transition hover:bg-amber-500/20 sm:flex-none sm:text-xs"
                      >
                        Acknowledge
                      </button>
                    )}

                    {!isEscalated && !isResolved && (
                      <button
                        type="button"
                        onClick={(event) => handleEscalate(alert.id, event)}
                        className="inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[10px] font-bold text-rose-400 transition hover:bg-rose-500/20 sm:flex-none sm:text-xs"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Escalate
                      </button>
                    )}

                    {!isResolved && (
                      <button
                        type="button"
                        onClick={(event) => handleResolve(alert.id, event)}
                        className="inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[10px] font-bold text-emerald-400 transition hover:bg-emerald-500/20 sm:flex-none sm:text-xs"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {selectedAlert && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-md sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedAlert(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-dialog-title"
            className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6"
          >
            <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-start justify-between gap-3 border-b border-slate-800 bg-slate-900/95 p-4 backdrop-blur sm:-mx-6 sm:-mt-6 sm:p-6">
              <div className="min-w-0">
                <SeverityBadge severity={selectedAlert.severity} />
                <h3
                  id="alert-dialog-title"
                  className="mt-2 break-words text-base font-bold text-white sm:text-lg"
                >
                  {selectedAlert.title}
                </h3>
              </div>

              <button
                type="button"
                aria-label="Close alert details"
                onClick={() => setSelectedAlert(null)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 pt-4 text-xs text-slate-300 sm:pt-5">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 sm:p-4">
                <span className="mb-1 block text-[9px] font-mono uppercase tracking-wider text-slate-500">
                  Alert Evidence
                </span>
                <p className="break-words leading-6">{selectedAlert.message}</p>
              </div>

              <div className="grid gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-[10px] font-mono sm:grid-cols-2 sm:p-4">
                <div className="break-words">
                  Alert Type:{' '}
                  <span className="text-white">{selectedAlert.alert_type}</span>
                </div>
                <div>
                  Status:{' '}
                  <span className="text-cyan-400">
                    {selectedAlert.status || 'OPEN'}
                  </span>
                </div>
                <div>
                  Created:{' '}
                  <span className="text-slate-400">
                    {formatTimestamp(selectedAlert.created_at)}
                  </span>
                </div>
                <div className="break-words">
                  Assigned:{' '}
                  <span className="text-slate-400">
                    {selectedAlert.assigned_to || 'SOC Analyst'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="min-h-9 rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-700 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
