import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Eye, Clock, Download, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { transactionsApi } from '../services/api';
import type { TransactionListResponse } from '../types';
import { formatCurrency, formatTimestamp, truncateId } from '../utils';
import { EmptyState } from '../components/ui/EmptyState';
import { RiskBadge } from '../components/ui/RiskBadge';

const DECISIONS = ['ALL', 'ALLOW', 'MONITOR', 'STEP-UP', 'BLOCK'];

export default function Transactions() {
  const [data, setData] = useState<TransactionListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
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
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
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
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-5 lg:space-y-6">

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Transaction Investigation</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {data?.total?.toLocaleString() ?? 0} Record Items
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Audit, filter, and inspect payment transactions across rule sets & ML features</p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={exporting || (data?.total ?? 0) === 0}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-2 border border-slate-700 self-start md:self-auto disabled:opacity-50"
        >
          <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
          {exporting ? 'Exporting CSV…' : 'Export Filtered CSV'}
        </button>
      </div>

      {/* Multi-param search form */}
      <form onSubmit={handleApplyFilters} className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Multi-Param Audit Search</h3>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400">Search Tx ID / User / IP</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="TXN_..., USER_..., 192.168..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400">Risk Decision</label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {DECISIONS.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'All Risk Decisions' : d}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400">Amount Min - Max (INR)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-1/2 px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-1/2 px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400">Date Bound (From - To)</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-1/2 px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 text-[11px]"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-1/2 px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 text-[11px]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          {/* Filter badges */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {decision !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono">
                Decision: {decision}
                <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setDecision('ALL')} />
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">
                Query: {searchQuery}
                <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSearchQuery('')} />
              </span>
            )}
            {(minAmount || maxAmount) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">
                ₹{minAmount || '0'} - ₹{maxAmount || '∞'}
                <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => { setMinAmount(''); setMaxAmount(''); }} />
              </span>
            )}
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Filter className="w-3.5 h-3.5" /> Apply Filters
          </button>
        </div>
      </form>

      {/* Main Table */}
      <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-xl overflow-hidden">

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                <th className="p-3.5">Transaction ID</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">User ID</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5">Failed Attempts</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Decision</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                    Loading database transactions...
                  </td>
                </tr>
              ) : (data?.items ?? []).length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6">
                    <EmptyState
                      title="No Transactions Found"
                      description="No payment records match your active query filters."
                      onAction={handleResetFilters}
                      actionLabel="Reset Search Parameters"
                    />
                  </td>
                </tr>
              ) : (
                (data?.items ?? []).map((txn) => (
                  <tr
                    key={txn.id}
                    onClick={() => navigate(`/transactions/${txn.transaction_id}`)}
                    className="cursor-pointer hover:bg-cyan-950/20 transition-colors"
                  >
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">
                      {truncateId(txn.transaction_id, 16)}
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono">
                      {formatTimestamp(txn.timestamp)}
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      {formatCurrency(txn.amount, txn.currency)}
                    </td>
                    <td className="p-3.5 text-slate-300 font-mono">
                      {txn.user_id}
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono">
                      {txn.ip_address || '—'}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {txn.payment_method || 'UPI'}
                    </td>
                    <td className="p-3.5">
                      <span className={txn.failed_attempts > 3 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {txn.failed_attempts}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        txn.failed_attempts > 0 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {txn.failed_attempts > 0 ? 'FAILED' : 'COMPLETED'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <RiskBadge decision={txn.decision || 'ALLOW'} size="sm" />
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors inline-flex items-center">
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-slate-800">
          {(data?.items ?? []).map((txn) => (
            <div
              key={txn.id}
              onClick={() => navigate(`/transactions/${txn.transaction_id}`)}
              className="p-4 space-y-2.5 active:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-cyan-400 font-bold text-xs">{truncateId(txn.transaction_id, 14)}</span>
                <span className="font-bold text-white text-sm">{formatCurrency(txn.amount, txn.currency)}</span>
              </div>
              <div className="grid grid-cols-2 text-[11px] text-slate-400 font-mono gap-1">
                <div>User: <span className="text-slate-200">{txn.user_id}</span></div>
                <div>IP: <span className="text-slate-200">{txn.ip_address || '—'}</span></div>
                <div>Time: <span className="text-slate-300">{formatTimestamp(txn.timestamp)}</span></div>
                <div>Failed Auth: <span className="text-amber-400 font-bold">{txn.failed_attempts}</span></div>
              </div>
              <div className="flex justify-between items-center pt-1">
                <RiskBadge decision={txn.decision || 'ALLOW'} size="sm" />
                <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                  View Details →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-800/80 bg-slate-950/40 gap-3 text-xs">
          <div className="text-slate-400 font-mono text-[11px]">
            {data?.total ? (
              <>Showing <span className="text-white font-bold">{startItem}</span>–<span className="text-white font-bold">{endItem}</span> of <span className="text-white font-bold">{data.total.toLocaleString()}</span> items</>
            ) : (
              '0 records'
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono font-bold text-cyan-400">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
