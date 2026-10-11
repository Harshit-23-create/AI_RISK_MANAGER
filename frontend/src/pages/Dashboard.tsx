import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Activity, ShieldX, TrendingUp, Pause, Play,
  Search, ShieldAlert, CheckCircle, RefreshCw, Zap, AlertOctagon, ArrowRight
} from 'lucide-react';
import { dashboardApi, alertsApi, transactionsApi } from '../services/api';
import { useRiskFeed } from '../hooks/useRiskFeed';
import type { DashboardStats, RiskFeedEvent, AlertListResponse } from '../types';
import { formatCurrency, formatTimestamp, truncateId } from '../utils';
import { PageHeader } from '../components/ui/PageHeader';
import { KpiCard } from '../components/ui/KpiCard';
import { RiskBadge } from '../components/ui/RiskBadge';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { RiskFactorBreakdown } from '../components/ui/RiskFactorBreakdown';
import type { ToastMessage } from '../components/ui/Toast';
import { ToastContainer } from '../components/ui/Toast';
import { useTheme } from '../hooks/useTheme';

const DECISION_COLORS: Record<string, string> = {
  ALLOW: '#10b981',
  MONITOR: '#3b82f6',
  'STEP-UP': '#f59e0b',
  BLOCK: '#ef4444',
};

const MAX_FEED_ROWS = 50;

export default function Dashboard() {
  const navigate = useNavigate();
  const { chartColors } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feed, setFeed] = useState<RiskFeedEvent[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<AlertListResponse | null>(null);
  const [isFeedPaused, setIsFeedPaused] = useState(false);
  const [timeRange, setTimeRange] = useState<'1H' | '6H' | '24H' | '7D'>('24H');
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [newRowIds, setNewRowIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const pendingEvents = useRef<RiskFeedEvent[]>([]);

  const addToast = (type: 'info' | 'warning' | 'error' | 'success', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev.slice(-3), { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [statsData, alertsData, txData] = await Promise.all([
        dashboardApi.stats(),
        alertsApi.list(1, 'CRITICAL', 'OPEN'),
        transactionsApi.list({ page: 1, pageSize: 20 }).catch(() => ({ items: [] })),
      ]);
      setStats(statsData);
      setRecentAlerts(alertsData);
      if (txData?.items?.length) {
        setFeed((prev) => {
          if (prev.length === 0) {
            return txData.items.map((t: any) => ({
              type: 'risk_assessment' as const,
              transaction_id: t.transaction_id || t.id,
              user_id: t.user_id,
              amount: t.amount,
              currency: t.currency || 'USD',
              ip_address: t.ip_address,
              decision: t.decision || 'ALLOW',
              risk_score: t.risk_score || 0,
              timestamp: t.timestamp || new Date().toISOString(),
            }));
          }
          return prev;
        });
      }
    } catch (e) {
      console.error('[Dashboard] Failed to fetch stats:', e);
      addToast('error', 'Sync Failed', 'Could not refresh real-time telemetry.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const flush = setInterval(() => {
      if (!isFeedPaused && pendingEvents.current.length > 0) {
        const incoming = pendingEvents.current;
        pendingEvents.current = [];
        const addedIds = new Set(incoming.map(e => e.transaction_id!).filter(Boolean));
        setNewRowIds(addedIds);
        setTimeout(() => setNewRowIds(new Set()), 2500);
        setFeed(prev => [...incoming, ...prev].slice(0, MAX_FEED_ROWS));
      }
    }, 10000);
    return () => clearInterval(flush);
  }, [isFeedPaused]);

  useRiskFeed((event) => {
    if (event.type === 'risk_assessment') {
      pendingEvents.current = [event, ...pendingEvents.current].slice(0, MAX_FEED_ROWS);
      if (event.risk_score && event.risk_score >= 75) {
        addToast(
          'error',
          `HIGH RISK INTERCEPT: ${event.decision || 'BLOCK'}`,
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

      {/* Page Header */}
      <PageHeader
        category="Operations"
        title="Risk Operations Center"
        subtitle="Real-time financial transaction risk telemetry, anomaly spike detection, and automated SOC routing"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-900 border border-slate-800 text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live Ingestion Active
          </span>
        }
      >
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="inline-flex items-center rounded-md bg-slate-900 border border-slate-800 p-0.5 text-xs font-mono">
            {(['1H', '6H', '24H', '7D'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  timeRange === r
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={refreshing}
            title="Refresh metrics"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </PageHeader>

      {/* Executive Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          title="Total Evaluated"
          value={total.toLocaleString()}
          subtext="Persisted payments"
          icon={Activity}
        />
        <KpiCard
          title="Velocity"
          value={`${txVelocity}/min`}
          subtext="Throughput velocity"
          icon={Zap}
        />
        <KpiCard
          title="Avg Risk Index"
          value={stats ? `${stats.average_risk_score.toFixed(1)}` : '—'}
          subtext="Composite baseline"
          icon={TrendingUp}
        />
        <KpiCard
          title="High Risk Flags"
          value={highRiskCount.toLocaleString()}
          subtext="Block & Step-up"
          icon={AlertOctagon}
          badge="ACTION REQUIRED"
          badgeVariant="danger"
        />
        <KpiCard
          title="Blocked Fraud"
          value={blocks.toLocaleString()}
          subtext="Total declined"
          icon={ShieldX}
        />
        <KpiCard
          title="Settlement Rate"
          value={`${allowRate}%`}
          subtext="Clean approvals"
          icon={CheckCircle}
          badgeVariant="success"
        />
      </div>

      {/* Visual Analytics Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Timeline Chart */}
        <div className="panel p-5 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Risk Score Trajectory & Spikes</h2>
              <p className="text-xs text-slate-400 mt-0.5">Rolling anomaly index across sliding detection intervals</p>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Aggregated Window: <span className="text-slate-300 font-semibold">{timeRange}</span>
            </div>
          </div>

          <div className="w-full h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={stats?.risk_timeline ?? []}>
                <defs>
                  <linearGradient id="riskTimelineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => formatTimestamp(t)}
                  stroke={chartColors.grid}
                  tick={{ fill: chartColors.text, fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={{ stroke: chartColors.grid }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke={chartColors.grid}
                  tick={{ fill: chartColors.text, fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={{ stroke: chartColors.grid }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    color: chartColors.tooltipText,
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                  labelStyle={{ color: chartColors.text }}
                  formatter={(val: any) => [`${Number(val).toFixed(1)} / 100`, 'Risk Index']}
                />
                <Area
                  type="monotone"
                  dataKey="risk_score"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="url(#riskTimelineGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decision Breakdown Donut */}
        <div className="panel p-5 flex flex-col justify-between">
          <div className="border-b border-slate-800/80 pb-3 mb-2">
            <h2 className="text-sm font-semibold text-white">Decision Routing Ratio</h2>
            <p className="text-xs text-slate-400 mt-0.5">ALLOW / MONITOR / STEP-UP / BLOCK breakdown</p>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[180px]">
            <ResponsiveContainer width="100%" height={190} minWidth={0}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={74}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={DECISION_COLORS[entry.name] ?? '#64748b'} stroke={chartColors.cardBg} strokeWidth={2} />
                  ))}
                </Pie>
                <Legend
                  iconSize={8}
                  formatter={(v) => <span className="text-[11px] font-mono text-slate-400">{v}</span>}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    color: chartColors.tooltipText,
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs font-mono">
            <div className="flex justify-between p-1.5 rounded bg-slate-900 border border-slate-800/60">
              <span className="text-slate-400">Allow:</span>
              <span className="font-bold text-emerald-400">{allows}</span>
            </div>
            <div className="flex justify-between p-1.5 rounded bg-slate-900 border border-slate-800/60">
              <span className="text-slate-400">Block:</span>
              <span className="font-bold text-rose-400">{blocks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operations & Stream Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Live Transaction Feed Table */}
        <div className="panel lg:col-span-2 flex flex-col overflow-hidden">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 p-4 bg-slate-900/30">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Live Transaction Stream</h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  Buffer: {filteredFeed.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Click any record to inspect complete forensic dossier</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter Tx, User, IP…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-44 rounded border border-slate-800 bg-slate-950 pl-8 pr-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
                />
              </div>

              <select
                value={decisionFilter}
                onChange={(e) => setDecisionFilter(e.target.value)}
                className="h-8 px-2.5 rounded border border-slate-800 bg-slate-950 text-xs text-slate-300 focus:outline-none focus:border-slate-700 font-mono"
              >
                <option value="ALL">All Routing</option>
                <option value="ALLOW">ALLOW</option>
                <option value="MONITOR">MONITOR</option>
                <option value="STEP-UP">STEP-UP</option>
                <option value="BLOCK">BLOCK</option>
              </select>

              <button
                type="button"
                onClick={() => setIsFeedPaused(!isFeedPaused)}
                className={`h-8 px-2.5 rounded text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                  isFeedPaused
                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
                title={isFeedPaused ? "Resume live feed" : "Pause live feed"}
              >
                {isFeedPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isFeedPaused ? 'Paused' : 'Pause'}</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto min-h-0 flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider bg-slate-950/40">
                  <th className="px-4 py-2.5">Transaction ID</th>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5 hidden md:table-cell">Client IP</th>
                  <th className="px-4 py-2.5">Score</th>
                  <th className="px-4 py-2.5">Routing Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredFeed.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      No transaction records match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredFeed.slice(0, 10).map((event, idx) => {
                    const isNew = newRowIds.has(event.transaction_id || '');
                    return (
                      <tr
                        key={`${event.transaction_id}-${idx}`}
                        onClick={() => event.transaction_id && navigate(`/transactions/${event.transaction_id}`)}
                        className={`cursor-pointer transition-colors duration-150 hover:bg-slate-850/60 ${
                          isNew ? 'bg-cyan-950/20' : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 font-mono text-cyan-400 font-semibold truncate max-w-[120px]">
                          {truncateId(event.transaction_id || '', 10)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px]">
                          {formatTimestamp(event.timestamp || '')}
                        </td>
                        <td className="px-4 py-2.5 font-mono font-semibold text-white">
                          {formatCurrency(event.amount || 0, event.currency)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 font-mono hidden md:table-cell text-[11px]">
                          {event.ip_address || '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-200">
                              {Math.round(event.risk_score || 0)}
                            </span>
                            <div className="w-10 h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800/80 hidden sm:block">
                              <div
                                className={`h-full ${(event.risk_score || 0) > 80 ? 'bg-rose-500' : (event.risk_score || 0) > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, Math.max(4, event.risk_score || 0))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <RiskBadge decision={event.decision || 'ALLOW'} size="sm" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-center">
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5"
            >
              Open Full Transactions Investigation Log <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Operations Stack: Critical Alerts & Signal Weights */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Active Critical Alerts */}
          <div className="panel p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                  Active Critical Incidents
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {recentAlerts?.items.length || 0} Open
              </span>
            </div>

            <div className="space-y-2">
              {recentAlerts?.items.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded">
                  No unacknowledged critical incidents.
                </div>
              ) : (
                recentAlerts?.items.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => navigate('/alerts')}
                    className="p-3 rounded bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer space-y-1 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-200 truncate">{alert.title}</span>
                      <SeverityBadge severity={alert.severity} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {formatTimestamp(alert.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/alerts')}
              className="w-full py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded transition-colors"
            >
              Triage All Incidents
            </button>
          </div>

          {/* Factor Breakdown */}
          <RiskFactorBreakdown breakdown={stats?.average_breakdown} />
        </div>
      </div>
    </div>
  );
}
