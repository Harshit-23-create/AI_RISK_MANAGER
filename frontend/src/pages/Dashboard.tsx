import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Activity, ShieldX, TrendingUp, Pause, Play,
  Search, ShieldAlert, CheckCircle, Radio, Clock, Zap, AlertOctagon, ArrowRight
} from 'lucide-react';
import { dashboardApi, alertsApi } from '../services/api';
import { useRiskFeed } from '../hooks/useRiskFeed';
import type { DashboardStats, RiskFeedEvent, AlertListResponse } from '../types';
import { formatCurrency, formatTimestamp, truncateId } from '../utils';
import { KpiCard } from '../components/ui/KpiCard';
import { RiskBadge } from '../components/ui/RiskBadge';
import { RiskFactorBreakdown } from '../components/ui/RiskFactorBreakdown';
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
  const [recentAlerts, setRecentAlerts] = useState<AlertListResponse | null>(null);
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

  const fetchData = useCallback(async () => {
    try {
      const [statsData, alertsData] = await Promise.all([
        dashboardApi.stats(),
        alertsApi.list(1, 'CRITICAL', 'OPEN')
      ]);
      setStats(statsData);
      setRecentAlerts(alertsData);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

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

  const { status: wsStatus } = useRiskFeed((event) => {
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
          <h1 className="text-xl font-black text-white tracking-tight">Risk Operations Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time payment fraud prevention & network deep packet inspection</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
            onClick={() => fetchData()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Refresh"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 6 KPIs ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <KpiCard
          title="Total Processed"
          value={total.toLocaleString()}
          subtext="Total transactions"
          icon={Activity}
          iconColor="text-blue-400"
          accentColor="from-blue-500/10 to-indigo-900/10"
        />
        <KpiCard
          title="Velocity"
          value={`${txVelocity}/min`}
          subtext="Request rate"
          icon={Zap}
          iconColor="text-cyan-400"
          accentColor="from-cyan-500/10 to-blue-900/10"
        />
        <KpiCard
          title="Avg Risk Score"
          value={stats ? `${stats.average_risk_score.toFixed(1)}` : '—'}
          subtext="/ 100 aggregate"
          icon={TrendingUp}
          iconColor="text-amber-400"
          accentColor="from-amber-500/10 to-orange-900/10"
        />
        <KpiCard
          title="High Risk Events"
          value={highRiskCount.toLocaleString()}
          subtext="Block & Step-Up"
          icon={AlertOctagon}
          iconColor="text-orange-400"
          accentColor="from-orange-500/10 to-red-900/10"
        />
        <KpiCard
          title="Blocked Payments"
          value={blocks.toLocaleString()}
          subtext="Rejected by SOC"
          icon={ShieldX}
          iconColor="text-rose-400"
          accentColor="from-rose-500/10 to-pink-900/10"
        />
        <KpiCard
          title="Allow Rate"
          value={`${allowRate}%`}
          subtext="Successful payments"
          icon={CheckCircle}
          iconColor="text-emerald-400"
          accentColor="from-emerald-500/10 to-teal-900/10"
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Risk Score & Transaction Volume</h2>
              <p className="text-[11px] text-slate-400">Score variations and anomaly spikes over time</p>
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
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-lg flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-white">Decision Distribution</h2>
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
        </div>
      </div>

      {/* ── Live Risk Feed & Alerts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Risk Feed Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-lg flex flex-col">
          {/* Feed Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Live Transaction Feed</h2>
                <p className="text-[11px] text-slate-400">Investigate live stream</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Tx/IP…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-36"
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
                className={`p-1.5 rounded-lg transition-colors border ${
                  isFeedPaused
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
                title={isFeedPaused ? "Resume Feed" : "Pause Feed"}
              >
                {isFeedPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase font-mono text-[10px] tracking-wider">
                  <th className="px-4 py-2.5">Tx ID</th>
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5 hidden md:table-cell">IP</th>
                  <th className="px-4 py-2.5">Score</th>
                  <th className="px-4 py-2.5">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredFeed.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      <p className="text-xs">No transactions matching filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredFeed.slice(0, 10).map((event, idx) => {
                    const isNew = newRowIds.has(event.transaction_id || '');
                    return (
                      <tr
                        key={`${event.transaction_id}-${idx}`}
                        onClick={() => event.transaction_id && navigate(`/transactions/${event.transaction_id}`)}
                        className={`cursor-pointer transition-colors duration-200 hover:bg-slate-800/40 ${
                          isNew ? 'bg-cyan-500/8 border-l-2 border-l-cyan-400' : ''
                        }`}
                      >
                        <td className="px-4 py-2 font-mono text-cyan-400 font-bold truncate max-w-[100px]">
                          {truncateId(event.transaction_id || '', 8)}
                        </td>
                        <td className="px-4 py-2 text-slate-400 font-mono text-[10px]">
                          {formatTimestamp(event.timestamp || '')}
                        </td>
                        <td className="px-4 py-2 font-bold text-white">
                          {formatCurrency(event.amount || 0, event.currency)}
                        </td>
                        <td className="px-4 py-2 text-slate-400 font-mono hidden md:table-cell text-[10px]">
                          {event.ip_address || '—'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-200 font-mono">{Math.round(event.risk_score || 0)}</span>
                            <div className="w-8 h-1 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                              <div
                                className={`h-full ${(event.risk_score || 0) > 80 ? 'bg-rose-500' : (event.risk_score || 0) > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, Math.max(4, event.risk_score || 0))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <RiskBadge decision={event.decision || 'ALLOW'} size="sm" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-slate-800 text-center">
             <button onClick={() => navigate('/transactions')} className="text-xs font-bold text-cyan-400 hover:text-cyan-300">View All Transactions <ArrowRight className="w-3 h-3 inline ml-1" /></button>
          </div>
        </div>

        {/* Right Panel: Recent Alerts & Risk Factor */}
        <div className="space-y-4 flex flex-col h-full">
          {/* Recent Alerts */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md shadow-lg flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Recent Critical Alerts</h3>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              {recentAlerts?.items.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs border border-slate-800 border-dashed rounded-xl">
                  No active critical alerts
                </div>
              ) : (
                recentAlerts?.items.slice(0, 4).map(alert => (
                  <div key={alert.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-1 cursor-pointer hover:border-slate-700 transition-colors" onClick={() => navigate('/alerts')}>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-white truncate pr-2">{alert.title}</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">CRITICAL</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{formatTimestamp(alert.created_at)}</span>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => navigate('/alerts')} className="w-full py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
              Manage All Alerts
            </button>
          </div>

          {/* Risk Factor Summary */}
          <RiskFactorBreakdown />
        </div>
      </div>
    </div>
  );
}
