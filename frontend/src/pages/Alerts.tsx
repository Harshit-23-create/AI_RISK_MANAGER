import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowUpRight, Search, Clock } from 'lucide-react';
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severity, statusFilter]);

  const handleAcknowledge = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await alertsApi.acknowledge(id);
      fetchAlerts();
    } catch (err) {
      alert('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await alertsApi.resolve(id);
      fetchAlerts();
    } catch (err) {
      alert('Failed to resolve alert');
    }
  };

  const handleEscalate = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await alertsApi.escalate(id);
      fetchAlerts();
    } catch (err) {
      alert('Failed to escalate alert');
    }
  };

  const filteredItems = (data?.items ?? []).filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.message.toLowerCase().includes(q) ||
      (item.transaction_id && item.transaction_id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Security Operations Center Alerts</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
              {data?.total ?? 0} Alert Signals
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time fraud incident triage, severity escalation & analyst response</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                statusFilter === st
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        {/* Severity Dropdown & Search */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search alert title/msg..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Severities' : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
            Loading SOC alert stream...
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="No Alerts Found"
            description="No security alerts match the selected severity and status filters."
          />
        ) : (
          filteredItems.map((alert) => {
            const isResolved = alert.status === 'RESOLVED' || alert.is_resolved;
            const isEscalated = alert.status === 'ESCALATED';
            const isAcknowledged = alert.status === 'ACKNOWLEDGED';

            return (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`group rounded-2xl border ${
                  isEscalated
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : isResolved
                    ? 'border-slate-800 bg-slate-900/40 opacity-75'
                    : 'border-slate-800 bg-slate-900/90'
                } p-4 backdrop-blur-md shadow-lg transition-all hover:border-cyan-500/40 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="mt-0.5">
                    <SeverityBadge severity={alert.severity} />
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {alert.title}
                      </h3>
                      {alert.transaction_id && (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                          Tx: {truncateId(alert.transaction_id, 12)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono pt-1">
                      <span>Created: {formatDate(alert.created_at)} {formatTimestamp(alert.created_at)}</span>
                      <span>Assigned: <strong className="text-slate-400">{alert.assigned_to || 'SOC Analyst'}</strong></span>
                      <span className="capitalize text-cyan-400">Status: {alert.status || 'OPEN'}</span>
                    </div>
                  </div>
                </div>

                {/* Lifecycle Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isAcknowledged && !isResolved && (
                    <button
                      onClick={(e) => handleAcknowledge(alert.id, e)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}

                  {!isEscalated && !isResolved && (
                    <button
                      onClick={(e) => handleEscalate(alert.id, e)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors flex items-center gap-1"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Escalate
                    </button>
                  )}

                  {!isResolved && (
                    <button
                      onClick={(e) => handleResolve(alert.id, e)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Resolve
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Alert Evidence Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <SeverityBadge severity={selectedAlert.severity} />
                <h3 className="text-base font-bold text-white mt-2">{selectedAlert.title}</h3>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Alert Evidence</span>
                <p className="leading-relaxed">{selectedAlert.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>Alert Type: <span className="text-white">{selectedAlert.alert_type}</span></div>
                <div>Status: <span className="text-cyan-400">{selectedAlert.status || 'OPEN'}</span></div>
                <div>Created: <span className="text-slate-400">{formatTimestamp(selectedAlert.created_at)}</span></div>
                <div>Assigned: <span className="text-slate-400">{selectedAlert.assigned_to || 'SOC Analyst'}</span></div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
