import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Activity, ShieldX, AlertTriangle, TrendingUp, Pause, Play,
  Search, ShieldAlert, CheckCircle, Radio, Clock, Eye, Zap
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import { useRiskFeed } from '../hooks/useRiskFeed';
import type { DashboardStats, RiskFeedEvent } from '../types';
import { formatCurrency, formatTimestamp, truncateId } from '../utils';
import { KpiCard } from '../components/ui/KpiCard';
import { RiskBadge } from '../components/ui/RiskBadge';
import { RiskFactorBreakdown } from '../components/ui/RiskFactorBreakdown';
import { SystemHealthWidget } from '../components/ui/SystemHealthWidget';
import type { ToastMessage } from '../components/ui/Toast';
import { ToastContainer } from '../components/ui/Toast';

const DECISION_COLORS: Record<string, string> = {
  ALLOW: '#10b981',
  MONITOR: '#3b82f6',
  'STEP-UP': '#f59e0b',
  BLOCK: '#ef4444',
};

const MAX_FEED_ROWS = 50;

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feed, setFeed] = useState<RiskFeedEvent[]>([]);
  const [isFeedPaused, setIsFeedPaused] = useState(false);
  const [timeRange, setTimeRange] = useState<'1H' | '6H' | '24H' | '7D'>('24H');
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set());

  const pendingEvents = useRef<RiskFeedEvent[]>([]);

  const addToast = (type: 'info' | 'warning' | 'error' | 'success', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev.slice(-3), { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchStats = useCallback(async () => {
    try {
      const data = await dashboardApi.stats();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 8000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    const flush = setInterval(() => {
      if (!isFeedPaused && pendingEvents.current.length > 0) {
        const incoming = pendingEvents.current;
        pendingEvents.current = [];
        const addedIds = new Set(incoming.map(e => e.transaction_id!).filter(Boolean));
        setNewRowIds(addedIds);
        setTimeout(() => setNewRowIds(new Set()), 3000);
        setFeed(prev => [...incoming, ...prev].slice(0, MAX_FEED_ROWS));
      }
    }, 1500);
    return () => clearInterval(flush);
  }, [isFeedPaused]);

  const { connected, status: wsStatus } = useRiskFeed((event) => {
    if (event.type === 'risk_assessment') {
      pendingEvents.current = [event, ...pendingEvents.current].slice(0, MAX_FEED_ROWS);
      if (event.risk_score && event.risk_score >= 75) {
        addToast(
          'error',
          `HIGH RISK: ${event.decision || 'BLOCK'}`,
          `Tx ${truncateId(event.transaction_id || '', 10)} scored ${Math.round(event.risk_score)}/100 (${formatCurrency(event.amount || 0, event.currency)})`
        );
      }
    }
  });

  const total = stats?.total_transactions || 0;
  const blocks = stats?.decision_breakdown?.block || 0;
  const stepUps = stats?.decision_breakdown?.step_up || 0;
  const monitors = stats?.decision_breakdown?.monitor || 0;
  const allows = stats?.decision_breakdown?.allow || 0;
  const allowRate = total > 0 ? ((allows / total) * 100).toFixed(1) : '100.0';
  const highRiskCount = blocks + stepUps;
  const txVelocity = (total > 0 ? (total / 120).toFixed(1) : '0.0');

  const filteredFeed = feed.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ip_address?.includes(searchQuery);
    const matchesDecision = decisionFilter === 'ALL' || item.decision === decisionFilter;
    return matchesSearch && matchesDecision;
  });

  const pieData = stats
    ? [
        { name: 'ALLOW', value: stats.decision_breakdown.allow || 0 },
        { name: 'MONITOR', value: stats.decision_breakdown.monitor || 0 },
        { name: 'STEP-UP', value: stats.decision_breakdown.step_up || 0 },
        { name: 'BLOCK', value: stats.decision_breakdown.block || 0 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            Risk Operations Center
            <span className="hidden sm:inline px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded">
              Live DPI
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time payment fraud prevention & network deep packet inspection</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* WS Status */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
            wsStatus === 'connected'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : wsStatus === 'reconnecting'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            <Radio className={`w-3 h-3 ${wsStatus === 'connected' ? 'animate-pulse' : ''}`} />
            <span>{wsStatus === 'connected' ? 'Feed Connected' : wsStatus === 'reconnecting' ? 'Reconnecting' : 'Offline'}</span>
          </div>

          <button
            onClick={() => fetchStats()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Refresh"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Primary KPI Row (5 cards) ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          title="Total Transactions"
          value={total.toLocaleString()}
          subtext="Processed in DB"
          change={4.2}
          icon={Activity}
          iconColor="text-cyan-400"
          accentColor="from-cyan-500/10 to-blue-900/10"
        />
        <KpiCard
          title="Avg Risk Score"
          value={stats ? `${stats.average_risk_score.toFixed(1)}` : '—'}
          subtext="/ 100 aggregate"
          change={-2.1}
          icon={TrendingUp}
          iconColor="text-amber-400"
          accentColor="from-amber-500/10 to-orange-900/10"
        />
        <KpiCard
          title="Approval Rate"
          value={`${allowRate}%`}
          subtext="Successful payments"
          change={0.5}
          icon={CheckCircle}
          iconColor="text-emerald-400"
          accentColor="from-emerald-500/10 to-teal-900/10"
        />
        <KpiCard
          title="High Risk Events"
          value={highRiskCount.toLocaleString()}
          subtext="Block & Step-Up"
          change={8.4}
          icon={ShieldAlert}
          iconColor="text-orange-400"
          accentColor="from-orange-500/10 to-red-900/10"
        />
        <KpiCard
          title="Active Alerts"
          value={stats?.active_alerts?.toLocaleString() ?? '0'}
          subtext="Requires review"
          icon={AlertTriangle}
          iconColor="text-rose-400"
          accentColor="from-rose-500/10 to-pink-900/10"
        />
      </div>

      {/* ── Secondary Stats Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">TX Velocity</p>
            <p className="text-base font-bold text-white">{txVelocity}<span className="text-xs text-slate-400 font-normal"> /min</span></p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldX className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Blocked</p>
            <p className="text-base font-bold text-white">{blocks.toLocaleString()}</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Eye className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Step-Up</p>
            <p className="text-base font-bold text-white">{stepUps.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Risk Score Timeline</h2>
              <p className="text-[11px] text-slate-400">Score variations and anomaly spikes</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
              {(['1H', '6H', '24H', '7D'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                    timeRange === r ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats?.risk_timeline ?? []}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="timestamp" tickFormatter={(t) => formatTimestamp(t)} tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                formatter={(val: any) => [`${Number(val).toFixed(1)} / 100`, 'Risk Score']}
              />
              <Area type="monotone" dataKey="risk_score" stroke="#06b6d4" fill="url(#riskGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Decision Donut */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-lg flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-white">Decision Breakdown</h2>
            <p className="text-[11px] text-slate-400">ALLOW / MONITOR / STEP-UP / BLOCK</p>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={DECISION_COLORS[entry.name] ?? '#64748b'} />
                  ))}
                </Pie>
                <Legend
                  iconSize={8}
                  formatter={(v) => <span className="text-[11px] text-slate-300 font-semibold">{v}</span>}
                />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-mono border-t border-slate-800 pt-3 mt-2">
            <div className="flex justify-between"><span className="text-emerald-400">ALLOW</span><strong className="text-white">{allows}</strong></div>
            <div className="flex justify-between"><span className="text-blue-400">MONITOR</span><strong className="text-white">{monitors}</strong></div>
            <div className="flex justify-between"><span className="text-amber-400">STEP-UP</span><strong className="text-white">{stepUps}</strong></div>
            <div className="flex justify-between"><span className="text-rose-400">BLOCK</span><strong className="text-white">{blocks}</strong></div>
          </div>
        </div>
      </div>

      {/* ── Live Risk Feed ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-lg">
        {/* Feed Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Live Risk Feed</h2>
              <p className="text-[11px] text-slate-400">Streaming via Redis & WebSockets</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search Tx / User / IP…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-44"
              />
            </div>
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All</option>
              <option value="ALLOW">ALLOW</option>
              <option value="MONITOR">MONITOR</option>
              <option value="STEP-UP">STEP-UP</option>
              <option value="BLOCK">BLOCK</option>
            </select>
            <button
              onClick={() => setIsFeedPaused(!isFeedPaused)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isFeedPaused
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              {isFeedPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isFeedPaused ? 'Resume' : 'Pause'}</span>
            </button>
          </div>
        </div>

        {/* Feed Table — responsive with hidden columns on mobile */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase font-mono text-[10px] tracking-wider">
                <th className="px-4 py-2.5">Transaction ID</th>
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Amount</th>
                <th className="px-4 py-2.5 hidden sm:table-cell">User</th>
                <th className="px-4 py-2.5 hidden md:table-cell">IP Address</th>
                <th className="px-4 py-2.5">Risk</th>
                <th className="px-4 py-2.5">Decision</th>
                <th className="px-4 py-2.5 hidden lg:table-cell">Top Factor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredFeed.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <Radio className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No transactions in feed</p>
                    <p className="text-[11px] text-slate-600 mt-1">Use Simulation Center to stream live synthetic data.</p>
                  </td>
                </tr>
              ) : (
                filteredFeed.map((event, idx) => {
                  const isNew = newRowIds.has(event.transaction_id || '');
                  return (
                    <tr
                      key={`${event.transaction_id}-${idx}`}
                      onClick={() => event.transaction_id && navigate(`/transactions/${event.transaction_id}`)}
                      className={`cursor-pointer transition-colors duration-200 hover:bg-slate-800/40 ${
                        isNew ? 'bg-cyan-500/8 border-l-2 border-l-cyan-400' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 font-mono text-cyan-400 font-bold">
                        {truncateId(event.transaction_id || '', 12)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px]">
                        {formatTimestamp(event.timestamp || '')}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-white">
                        {formatCurrency(event.amount || 0, event.currency)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300 font-mono hidden sm:table-cell text-[11px]">
                        {event.user_id}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono hidden md:table-cell text-[11px]">
                        {event.ip_address || '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full ${(event.risk_score || 0) > 80 ? 'bg-rose-500' : (event.risk_score || 0) > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, Math.max(4, event.risk_score || 0))}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-200 font-mono">{Math.round(event.risk_score || 0)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <RiskBadge decision={event.decision || 'ALLOW'} size="sm" />
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 max-w-[160px] truncate hidden lg:table-cell">
                        {event.top_factor || 'Normal baseline'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom Row: Model Breakdown + System Health ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RiskFactorBreakdown />
        <SystemHealthWidget wsConnected={connected} />
      </div>
    </div>
  );
}
