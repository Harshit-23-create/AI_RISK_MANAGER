import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, RefreshCw, ExternalLink, MessageSquare, Save
} from 'lucide-react';
import { alertsApi } from '../services/api';
import type { AlertListResponse, Alert } from '../types';
import { formatTimestamp, formatDate } from '../utils';
import { PageHeader } from '../components/ui/PageHeader';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonTable } from '../components/ui/SkeletonLoader';

const SEVERITIES = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const STATUSES = ['ALL', 'OPEN', 'ACKNOWLEDGED', 'ESCALATED', 'RESOLVED'];

export default function Alerts() {
  const navigate = useNavigate();
  const [data, setData] = useState<AlertListResponse | null>(null);
  const [severity, setSeverity] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [notesInput, setNotesInput] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

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
    setNotesInput(selectedAlert.analyst_notes || '');

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedAlert(null);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedAlert]);

  const handleAcknowledge = async (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setActionInProgress(id);
    try {
      await alertsApi.acknowledge(id);
      await fetchAlerts();
      if (selectedAlert?.id === id) {
        setSelectedAlert((prev) => (prev ? { ...prev, status: 'ACKNOWLEDGED' } : prev));
      }
    } catch {
      alert('Failed to acknowledge alert');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResolve = async (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setActionInProgress(id);
    try {
      await alertsApi.resolve(id);
      await fetchAlerts();
      if (selectedAlert?.id === id) {
        setSelectedAlert((prev) => (prev ? { ...prev, status: 'RESOLVED', is_resolved: true } : prev));
      }
    } catch {
      alert('Failed to resolve alert');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleEscalate = async (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setActionInProgress(id);
    try {
      await alertsApi.escalate(id);
      await fetchAlerts();
      if (selectedAlert?.id === id) {
        setSelectedAlert((prev) => (prev ? { ...prev, status: 'ESCALATED' } : prev));
      }
    } catch {
      alert('Failed to escalate alert');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedAlert) return;
    setSavingNotes(true);
    try {
      await alertsApi.updateNotes(selectedAlert.id, notesInput.trim());
      setSelectedAlert((prev) => (prev ? { ...prev, analyst_notes: notesInput.trim() } : prev));
      await fetchAlerts();
    } catch {
      alert('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data?.items ?? [];

    return (data?.items ?? []).filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query) ||
        Boolean(item.transaction_id && item.transaction_id.toLowerCase().includes(query))
      );
    });
  }, [data?.items, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        category="Incident Response"
        title="Security Incidents & Alerts"
        subtitle="Prioritized threat vectors, rule violations, ML anomaly flags, and analyst triage operations"
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            {data?.total ?? 0} Recorded Signals
          </span>
        }
      >
        <button
          type="button"
          onClick={fetchAlerts}
          disabled={loading}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 border border-slate-800 px-3 text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Signals</span>
        </button>
      </PageHeader>

      {/* Filter & Triage Toolbar */}
      <div className="panel p-4 space-y-3">
        {/* Top: Status Tabs + Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {STATUSES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title, payload or Tx ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded border border-slate-800 bg-slate-950 pl-8 pr-7 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom: Severity Sub-filter Bar */}
        <div className="pt-2.5 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono uppercase text-slate-500 mr-1">Severity:</span>
          {SEVERITIES.map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverity(sev)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                severity === sev
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Table */}
      {loading && !data ? (
        <SkeletonTable rows={8} cols={6} />
      ) : !filteredItems.length ? (
        <EmptyState
          title="No Security Alerts Found"
          description="There are currently no active incidents matching your severity and status filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSeverity('ALL');
            setStatusFilter('ALL');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider bg-slate-950/60">
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Incident Summary</th>
                  <th className="px-4 py-3">Associated Tx</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Triage Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredItems.map((al) => {
                  const isAck = al.status === 'ACKNOWLEDGED';
                  const isRes = al.status === 'RESOLVED';
                  const isEsc = al.status === 'ESCALATED';

                  return (
                    <tr
                      key={al.id}
                      onClick={() => setSelectedAlert(al)}
                      className="cursor-pointer hover:bg-slate-850/60 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <SeverityBadge severity={al.severity} size="sm" />
                      </td>
                      <td className="px-4 py-3 max-w-sm">
                        <div className="font-semibold text-slate-100 truncate">{al.title}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{al.message}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-cyan-400 text-xs">
                        {al.transaction_id ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/transactions/${al.transaction_id}`);
                            }}
                            className="hover:underline flex items-center gap-1"
                          >
                            <span>{al.transaction_id}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </button>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {formatTimestamp(al.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            isRes
                              ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/60'
                              : isEsc
                              ? 'bg-rose-950/50 text-rose-400 border border-rose-800/60'
                              : isAck
                              ? 'bg-amber-950/50 text-amber-400 border border-amber-800/60'
                              : 'bg-slate-900 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {al.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {!isAck && !isRes && (
                            <button
                              type="button"
                              onClick={(e) => handleAcknowledge(al.id, e)}
                              disabled={actionInProgress === al.id}
                              title="Acknowledge alert"
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-amber-300 border border-slate-800 transition-colors"
                            >
                              Ack
                            </button>
                          )}
                          {!isRes && (
                            <button
                              type="button"
                              onClick={(e) => handleResolve(al.id, e)}
                              disabled={actionInProgress === al.id}
                              title="Resolve alert"
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-emerald-400 border border-slate-800 transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedAlert(al)}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-slate-400 hover:text-white border border-slate-800 transition-colors"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Incident Detail / Triage Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="panel bg-slate-900 w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                  Incident Triage Briefing
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedAlert.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <SeverityBadge severity={selectedAlert.severity} size="sm" />
                  <span className="text-[11px] font-mono text-slate-400">
                    Status: <span className="text-white font-medium">{selectedAlert.status}</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Incident Payload */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                  Incident Description
                </span>
                <div className="p-3 rounded bg-slate-950/70 border border-slate-800 text-slate-300 leading-relaxed">
                  {selectedAlert.message}
                </div>
              </div>

              {selectedAlert.transaction_id && (
                <div className="flex items-center justify-between p-3 rounded bg-slate-950/50 border border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Target Transaction</span>
                    <span className="font-mono text-cyan-400 font-semibold">{selectedAlert.transaction_id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAlert(null);
                      navigate(`/transactions/${selectedAlert.transaction_id}`);
                    }}
                    className="px-3 py-1.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
                  >
                    Investigate Dossier <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Analyst Notes Editor */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-slate-500" /> Analyst Case Notes
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Persisted in audit log</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Record investigation notes, IP attribution observations, or escalation rationales…"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-700 font-sans"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" />
                    <span>{savingNotes ? 'Saving Notes…' : 'Save Notes'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Triage Actions Footer */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-slate-500">
                Recorded {formatDate(selectedAlert.created_at)}
              </span>

              <div className="flex items-center gap-2">
                {selectedAlert.status !== 'ACKNOWLEDGED' && selectedAlert.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    onClick={() => handleAcknowledge(selectedAlert.id)}
                    className="px-3 py-1.5 rounded bg-amber-950/60 hover:bg-amber-950/80 text-amber-300 border border-amber-800/80 text-xs font-medium"
                  >
                    Acknowledge
                  </button>
                )}
                {selectedAlert.status !== 'ESCALATED' && selectedAlert.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    onClick={() => handleEscalate(selectedAlert.id)}
                    className="px-3 py-1.5 rounded bg-rose-950/60 hover:bg-rose-950/80 text-rose-300 border border-rose-800/80 text-xs font-medium"
                  >
                    Escalate to Tier-2
                  </button>
                )}
                {selectedAlert.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    onClick={() => handleResolve(selectedAlert.id)}
                    className="px-3 py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-xs font-medium"
                  >
                    Mark Resolved
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
