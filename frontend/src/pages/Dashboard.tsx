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

  // Flush WebSocket events into live feed
  useEffect(() => {
    const flush = setInterval(() => {
      if (!isFeedPaused && pendingEvents.current.length > 0) {
        const incoming = pendingEvents.current;
        pendingEvents.current = [];

        // Track new IDs for highlight pulse
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

      // Trigger high-risk toast notification
      if (event.risk_score && event.risk_score >= 75) {
        addToast(
          'error',
          `HIGH RISK: ${event.decision || 'BLOCK'}`,
          `Transaction ${truncateId(event.transaction_id || '', 10)} scored ${Math.round(event.risk_score)}/100 (${formatCurrency(event.amount || 0, event.currency)})`
        );
      }
    }
  });

  // Calculate telemetry metrics derived from actual data
  const total = stats?.total_transactions || 0;
  const blocks = stats?.decision_breakdown?.block || 0;
  const stepUps = stats?.decision_breakdown?.step_up || 0;
  const monitors = stats?.decision_breakdown?.monitor || 0;
  const allows = stats?.decision_breakdown?.allow || 0;
  const allowRate = total > 0 ? ((allows / total) * 100).toFixed(1) : '100.0';
  const highRiskCount = blocks + stepUps;
  const txVelocity = (total > 0 ? (total / 120).toFixed(1) : '0.0'); // transactions per min estimate

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
    <div className="space-y-8">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Risk Operations Center (SOC)</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Live DPI & AI Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time payment fraud prevention & network deep packet inspection</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
            <Radio className={`w-3.5 h-3.5 ${wsStatus === 'connected' ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <span>Live WebSocket: <strong className="text-white">{wsStatus === 'connected' ? 'Feed Connected' : wsStatus === 'reconnecting' ? 'Reconnecting' : 'Offline'}</strong></span>
          </div>

          <button
            onClick={() => fetchStats()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Refresh Telemetry"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 8 Live KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Transactions"
          value={total.toLocaleString()}
          subtext="Processed in database"
          change={4.2}
          icon={Activity}
          iconColor="text-cyan-400"
          accentColor="from-cyan-500/10 to-blue-900/10"
        />
        <KpiCard
          title="Transaction Velocity"
          value={`${txVelocity} /min`}
          subtext="Estimated throughput"
          change={1.8}
          icon={Zap}
          iconColor="text-blue-400"
          accentColor="from-blue-500/10 to-indigo-900/10"
        />
        <KpiCard
          title="Average Risk Score"
          value={stats ? `${stats.average_risk_score.toFixed(1)} / 100` : '—'}
          subtext="Model weighted aggregate"
          change={-2.1}
          icon={TrendingUp}
          iconColor="text-amber-400"
          accentColor="from-amber-500/10 to-orange-900/10"
        />
        <KpiCard
          title="Allow Approval Rate"
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
          subtext="Block & Step-Up total"
          change={8.4}
          icon={ShieldAlert}
          iconColor="text-orange-400"
          accentColor="from-orange-500/10 to-red-900/10"
        />
        <KpiCard
          title="Active SOC Alerts"
          value={stats?.active_alerts?.toLocaleString() ?? '0'}
          subtext="Requires analyst review"
          icon={AlertTriangle}
          iconColor="text-rose-400"
          accentColor="from-rose-500/10 to-pink-900/10"
        />
        <KpiCard
          title="Blocked Payments"
          value={blocks.toLocaleString()}
          subtext="Critical threats stopped"
          icon={ShieldX}
          iconColor="text-rose-500"
          accentColor="from-rose-600/10 to-red-950/10"
        />
        <KpiCard
          title="Step-Up Challenges"
          value={stepUps.toLocaleString()}
          subtext="2FA verification triggers"
          icon={Eye}
          iconColor="text-amber-400"
          accentColor="from-amber-600/10 to-yellow-950/10"
        />
      </div>

      {/* Analytics Row: Timeline & Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk Score Timeline */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Real-Time Risk Timeline & Spikes
              </h2>
              <p className="text-[11px] text-slate-400">Score variations and anomaly spikes over time</p>
            </div>

            {/* Time range selector */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
              {(['1H', '6H', '24H', '7D'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    timeRange === r
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats?.risk_timeline ?? []}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t) => formatTimestamp(t)}
                tick={{ fill: '#64748b', fontSize: 10 }}
              />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10 }}
                labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                formatter={(val: any) => [`${Number(val).toFixed(1)} / 100`, 'Risk Score']}
              />
              <Area
                type="monotone"
                dataKey="risk_score"
                stroke="#06b6d4"
                fill="url(#riskGrad)"
                strokeWidth={2.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Decision Distribution Donut */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Decision Breakdown
              </h2>
              <p className="text-[11px] text-slate-400">ALLOW, MONITOR, STEP-UP & BLOCK ratios</p>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  dataKey="value"
                  paddingAngle={4}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={DECISION_COLORS[entry.name] ?? '#64748b'} />
                  ))}
                </Pie>
                <Legend formatter={(v) => <span className="text-[11px] text-slate-300 font-semibold">{v}</span>} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] pt-3 border-t border-slate-800 font-mono">
            <div className="text-emerald-400">ALLOW: <strong>{allows}</strong></div>
            <div className="text-blue-400">MONITOR: <strong>{monitors}</strong></div>
            <div className="text-amber-400">STEP-UP: <strong>{stepUps}</strong></div>
            <div className="text-rose-400">BLOCK: <strong>{blocks}</strong></div>
          </div>
        </div>
      </div>

      {/* Live Risk Feed Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Live Risk Feed Operations Stream
              </h2>
              <p className="text-xs text-slate-400">Streaming transaction telemetry via Redis & WebSockets</p>
            </div>
          </div>

          {/* Controls: Search, Decision Filter & Pause/Resume */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search Tx ID / User / IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-48"
              />
            </div>

            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Decisions</option>
              <option value="ALLOW">ALLOW</option>
              <option value="MONITOR">MONITOR</option>
              <option value="STEP-UP">STEP-UP</option>
              <option value="BLOCK">BLOCK</option>
            </select>

            <button
              onClick={() => setIsFeedPaused(!isFeedPaused)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isFeedPaused
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              {isFeedPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isFeedPaused ? 'Resume Feed' : 'Pause Feed'}</span>
            </button>
          </div>
        </div>

        {/* Feed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                <th className="p-3">Transaction ID</th>
                <th className="p-3">Time</th>
                <th className="p-3">Amount</th>
                <th className="p-3">User</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3">Decision</th>
                <th className="p-3">Top Risk Factor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredFeed.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    <p className="text-xs">No live transactions in feed matching filters.</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Start the Simulation Center to stream live synthetic payment activity.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredFeed.map((event, idx) => {
                  const isNew = newRowIds.has(event.transaction_id || '');
                  return (
                    <tr
                      key={`${event.transaction_id}-${idx}`}
                      onClick={() => event.transaction_id && navigate(`/transactions/${event.transaction_id}`)}
                      className={`cursor-pointer transition-colors duration-300 hover:bg-cyan-950/20 ${
                        isNew ? 'bg-cyan-500/10 border-l-2 border-cyan-400' : ''
                      }`}
                    >
                      <td className="p-3 font-mono text-cyan-400 font-bold">
                        {truncateId(event.transaction_id || '', 14)}
                      </td>
                      <td className="p-3 text-slate-400 font-mono">
                        {formatTimestamp(event.timestamp || '')}
                      </td>
                      <td className="p-3 font-bold text-white">
                        {formatCurrency(event.amount || 0, event.currency)}
                      </td>
                      <td className="p-3 text-slate-300 font-mono">
                        {event.user_id}
                      </td>
                      <td className="p-3 text-slate-400 font-mono">
                        {event.ip_address || '103.45.12.9'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                            <div
                              className={`h-full ${
                                (event.risk_score || 0) > 80
                                  ? 'bg-rose-500'
                                  : (event.risk_score || 0) > 50
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, event.risk_score || 0))}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-200 font-mono">
                            {Math.round(event.risk_score || 0)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <RiskBadge decision={event.decision || 'ALLOW'} size="sm" />
                      </td>
                      <td className="p-3 text-slate-300 max-w-[200px] truncate">
                        {event.top_factor || 'Normal transaction baseline'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Breakdown & System Infrastructure Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RiskFactorBreakdown />
        <SystemHealthWidget wsConnected={connected} />
      </div>
    </div>
  );
}
