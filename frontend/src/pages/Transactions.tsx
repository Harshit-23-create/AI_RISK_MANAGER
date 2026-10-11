import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronLeft, ChevronRight, X, Download, SlidersHorizontal, ArrowRight
} from 'lucide-react';
import { transactionsApi } from '../services/api';
import type { TransactionListResponse } from '../types';
import { formatCurrency, formatTimestamp } from '../utils';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { RiskBadge } from '../components/ui/RiskBadge';
import { SkeletonTable } from '../components/ui/SkeletonLoader';

const DECISIONS = ['ALL', 'ALLOW', 'MONITOR', 'STEP-UP', 'BLOCK'];

export default function Transactions() {
  const [data, setData] = useState<TransactionListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const navigate = useNavigate();

  const [decision, setDecision] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const fetchTransactions = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await transactionsApi.list({
        page,
        pageSize,
        decision: decision === 'ALL' ? undefined : decision,
        search: searchQuery || undefined,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, decision, searchQuery, minAmount, maxAmount, fromDate, toDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setDecision('ALL');
    setSearchQuery('');
    setMinAmount('');
    setMaxAmount('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await transactionsApi.downloadCsv({
        search: searchQuery || undefined,
        decision: decision === 'ALL' ? undefined : decision,
        min_amount: minAmount ? parseFloat(minAmount) : undefined,
        max_amount: maxAmount ? parseFloat(maxAmount) : undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
    } catch (err) {
      console.error('Failed to export transactions CSV:', err);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil((data?.total ?? 0) / pageSize) || 1;
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, data?.total ?? 0);
  const hasActiveFilters = decision !== 'ALL' || searchQuery || minAmount || maxAmount || fromDate || toDate;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        category="Investigation"
        title="Transactions Audit Log"
        subtitle="Forensic payment transaction records, multi-vector anomaly scores, and SOC policy decisions"
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            {data?.total?.toLocaleString() ?? 0} Recorded
          </span>
        }
      >
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={exporting || (data?.total ?? 0) === 0}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 border border-slate-800 px-3 text-xs font-medium text-slate-200 hover:bg-slate-850 hover:text-white transition-colors disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5 text-slate-400" />
          <span>{exporting ? 'Generating CSV…' : 'Export Filtered CSV'}</span>
        </button>
      </PageHeader>

      {/* Investigation Filter Panel */}
      <div className="panel p-4 space-y-4">
        {/* Primary Filter Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Decision Pill Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {DECISIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDecision(d);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                  decision === d
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Quick Search & Advanced Toggle */}
          <form onSubmit={handleApplyFilters} className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search Tx, User, IP…"
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

            <button
              type="button"
              onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
              className={`h-8 px-2.5 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                advancedFiltersOpen || minAmount || maxAmount || fromDate || toDate
                  ? 'bg-slate-800 text-cyan-400 border-slate-700'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
            </button>

            <button
              type="submit"
              className="h-8 px-3 rounded bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
            >
              Apply
            </button>
          </form>
        </div>

        {/* Expandable Advanced Filters */}
        {advancedFiltersOpen && (
          <form onSubmit={handleApplyFilters} className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Min Amount ($)</label>
              <input
                type="number"
                placeholder="0.00"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="h-8 w-full rounded border border-slate-800 bg-slate-950 px-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Max Amount ($)</label>
              <input
                type="number"
                placeholder="50000.00"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="h-8 w-full rounded border border-slate-800 bg-slate-950 px-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 w-full rounded border border-slate-800 bg-slate-950 px-2.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 w-full rounded border border-slate-800 bg-slate-950 px-2.5 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-1">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white"
                >
                  Reset All Filters
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-primary hover:bg-primary-hover text-white text-xs font-medium"
              >
                Update Results
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Transactions Data Table */}
      {loading && !data ? (
        <SkeletonTable rows={10} cols={7} />
      ) : !data?.items?.length ? (
        <EmptyState
          title="No Transactions Found"
          description="No transaction records match the specified search query or filter parameters in the database."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider bg-slate-950/60">
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 hidden md:table-cell">Client IP</th>
                  <th className="px-4 py-3">Anomaly Score</th>
                  <th className="px-4 py-3">Routing Decision</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.items.map((tx) => (
                  <tr
                    key={tx.id || tx.transaction_id}
                    onClick={() => navigate(`/transactions/${tx.transaction_id || tx.id}`)}
                    className="cursor-pointer hover:bg-slate-850/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-cyan-400 font-semibold truncate max-w-[140px]">
                      {tx.transaction_id || tx.id}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {tx.user_id}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {formatTimestamp(tx.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white whitespace-nowrap">
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono hidden md:table-cell text-[11px]">
                      {tx.ip_address || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200">
                          {Math.round(tx.risk_score || 0)}
                        </span>
                        <div className="w-12 h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800/80 hidden sm:block">
                          <div
                            className={`h-full ${(tx.risk_score || 0) > 80 ? 'bg-rose-500' : (tx.risk_score || 0) > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, Math.max(4, tx.risk_score || 0))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge decision={tx.decision || 'ALLOW'} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-cyan-400">
                        Inspect <ArrowRight className="h-3 w-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80 p-3.5 bg-slate-950/60 text-xs">
            <div className="text-slate-400 font-mono text-[11px]">
              Showing <span className="text-white font-medium">{startItem}–{endItem}</span> of{' '}
              <span className="text-white font-medium">{data.total.toLocaleString()}</span> records
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="flex h-7 items-center gap-1 rounded bg-slate-900 border border-slate-800 px-2.5 text-xs font-medium text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>

              <span className="font-mono text-[11px] text-slate-400 px-2">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="flex h-7 items-center gap-1 rounded bg-slate-900 border border-slate-800 px-2.5 text-xs font-medium text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
