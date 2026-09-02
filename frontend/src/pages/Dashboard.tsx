import { useEffect, useState, useCallback, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { ShieldX, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { dashboardApi } from '../services/api';
import { useRiskFeed } from '../hooks/useRiskFeed';
import type { DashboardStats, RiskFeedEvent } from '../types';
import { formatCurrency, formatTimestamp, decisionBadgeClass, truncateId, riskScoreColor } from '../utils';

const DECISION_COLORS: Record<string, string> = {
  ALLOW: '#10b981',
  MONITOR: '#3b82f6',
  'STEP-UP': '#f59e0b',
  BLOCK: '#ef4444',
};

const MAX_FEED_ROWS = 50;

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feed, setFeed] = useState<RiskFeedEvent[]>([]);
  const pendingEvents = useRef<RiskFeedEvent[]>([]);

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
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Flush accumulated WebSocket events into feed every 3 seconds
  useEffect(() => {
    const flush = setInterval(() => {
      if (pendingEvents.current.length > 0) {
        setFeed(prev => [...pendingEvents.current, ...prev].slice(0, MAX_FEED_ROWS));
        pendingEvents.current = [];
      }
    }, 3000);
    return () => clearInterval(flush);
  }, []);

  const { connected } = useRiskFeed((event) => {
    if (event.type === 'risk_assessment') {
      pendingEvents.current = [event, ...pendingEvents.current].slice(0, MAX_FEED_ROWS);
    }
  });


  const pieData = stats ? [
    { name: 'ALLOW', value: stats.decision_breakdown.allow || 0 },
    { name: 'MONITOR', value: stats.decision_breakdown.monitor || 0 },
    { name: 'STEP-UP', value: stats.decision_breakdown.step_up || 0 },
    { name: 'BLOCK', value: stats.decision_breakdown.block || 0 },
  ] : [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Risk Operations Center
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Real-time payment risk monitoring
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="live-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#10b981' : '#ef4444' }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {connected ? 'Live' : 'Reconnecting…'}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard
          title="Total Transactions"
          value={stats?.total_transactions?.toLocaleString() ?? '—'}
          icon={<Activity size={20} color="var(--color-accent-blue)" />}
          color="var(--color-accent-blue)"
        />
        <KpiCard
          title="Avg Risk Score"
          value={stats ? `${stats.average_risk_score.toFixed(1)}` : '—'}
          icon={<TrendingUp size={20} color="var(--color-accent-yellow)" />}
          color="var(--color-accent-yellow)"
          sub="/100"
        />
        <KpiCard
          title="Active Alerts"
          value={stats?.active_alerts?.toLocaleString() ?? '—'}
          icon={<AlertTriangle size={20} color="var(--color-accent-red)" />}
          color="var(--color-accent-red)"
          highlight={!!stats && stats.active_alerts > 0}
        />
        <KpiCard
          title="Blocked Transactions"
          value={stats?.decision_breakdown?.block?.toLocaleString() ?? '—'}
          icon={<ShieldX size={20} color="#ef4444" />}
          color="#ef4444"
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Risk Timeline */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>
            Risk Score Timeline
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats?.risk_timeline ?? []}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="timestamp" tickFormatter={t => formatTimestamp(t)} tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#0d1f38', border: '1px solid #1a3354', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                formatter={(val: any) => [`${Number(val).toFixed(1)}`, 'Risk Score']}
              />
              <Area type="monotone" dataKey="risk_score" stroke="#3b82f6" fill="url(#riskGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Decision Distribution */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>
            Decision Distribution
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                dataKey="value" paddingAngle={3}>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={DECISION_COLORS[entry.name] ?? '#475569'} />
                ))}
              </Pie>
              <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
              <Tooltip contentStyle={{ background: '#0d1f38', border: '1px solid #1a3354', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Risk Feed */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Live Risk Feed
          </h2>
          <div className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#10b981' : '#475569' }} />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{feed.length} events</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Transaction ID', 'Time', 'Amount', 'User', 'IP', 'Risk Score', 'Decision', 'Top Factor'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {feed.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Start simulation to see live events…
                  </td>
                </tr>
              )}
              {feed.map((event, i) => (
                <tr
                  key={`${event.transaction_id}-${i}`}
                  className="fade-in-slide"
                  style={{ borderBottom: '1px solid rgba(26,51,84,0.5)', transition: 'background 0.2s' }}
                >
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-family-mono)', color: 'var(--color-accent-cyan)' }}>
                    {truncateId(event.transaction_id ?? '', 14)}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>
                    {formatTimestamp(event.timestamp ?? '')}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {formatCurrency(event.amount ?? 0, event.currency)}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>
                    {event.user_id}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-family-mono)', color: 'var(--color-text-muted)', fontSize: 11 }}>
                    {event.ip_address}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 40, height: 6, borderRadius: 3,
                        background: 'rgba(255,255,255,0.1)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          width: `${event.risk_score ?? 0}%`,
                          background: riskScoreColor(event.risk_score ?? 0),
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <span style={{ fontWeight: 600, color: riskScoreColor(event.risk_score ?? 0) }}>
                        {(event.risk_score ?? 0).toFixed(0)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={decisionBadgeClass(event.decision ?? '')} style={{
                      padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600
                    }}>
                      {event.decision}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)', maxWidth: 180 }}>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }}>
                      {event.top_factor?.replace(/_/g, ' ') ?? '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, color, sub, highlight }: {
  title: string; value: string; icon: React.ReactNode;
  color: string; sub?: string; highlight?: boolean;
}) {
  return (
    <div className="glass-card" style={{
      padding: 20,
      border: highlight ? `1px solid ${color}40` : '1px solid var(--color-border)',
      boxShadow: highlight ? `0 0 20px ${color}20` : undefined,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          padding: 8, borderRadius: 8,
          background: `${color}15`, border: `1px solid ${color}30`,
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)' }}>
        {value}
        {sub && <span style={{ fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 400 }}>{sub}</span>}
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{title}</div>
    </div>
  );
}
