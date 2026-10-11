import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import {
  BarChart2, Calendar, TrendingUp, Download, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import type { DashboardStats, AnalyticsData } from '../types';
import { formatTimestamp } from '../utils';
import { PageHeader } from '../components/ui/PageHeader';
import { KpiCard } from '../components/ui/KpiCard';
import { SkeletonChart } from '../components/ui/SkeletonLoader';

export default function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24H' | '7D' | '30D'>('7D');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, analyticsData] = await Promise.all([
        dashboardApi.stats(),
        dashboardApi.analytics(timeRange),
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportData = () => {
    if (!analytics) return;
    const exportPayload = {
      export_date: new Date().toISOString(),
      time_range: timeRange,
      stats_summary: {
        total_transactions: stats?.total_transactions ?? 0,
        average_risk_score: stats?.average_risk_score ?? 0,
        decision_breakdown: stats?.decision_breakdown ?? {},
      },
      daily_volume: analytics.daily_volume ?? [],
      decision_trends: analytics.decision_trends ?? [],
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soc_analytics_report_${timeRange}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const dailyVolume = analytics?.daily_volume ?? [];
  const decisionTrends = analytics?.decision_trends ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        category="Business Intelligence"
        title="Deep Fraud Analytics & Trends"
        subtitle="Aggregated multi-day transaction volume, threat intercept frequency, and SOC routing decisions"
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            Window: {timeRange}
          </span>
        }
      >
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="inline-flex items-center rounded-md bg-slate-900 border border-slate-800 p-0.5 text-xs font-mono">
            {(['24H', '7D', '30D'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded text-[11px] transition-colors ${
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
            onClick={handleExportData}
            title="Export Report (JSON)"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 border border-slate-800 px-3 text-xs font-medium text-slate-200 hover:bg-slate-850 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>Export Report</span>
          </button>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title={`Total Ingested (${timeRange})`}
          value={stats?.total_transactions.toLocaleString() ?? '0'}
          subtext="Evaluated payment transactions"
          icon={BarChart2}
        />
        <KpiCard
          title="Threat Interceptions"
          value={((stats?.decision_breakdown?.block ?? 0) + (stats?.decision_breakdown?.step_up ?? 0)).toLocaleString()}
          subtext="Blocked & Stepped-up payments"
          icon={ShieldAlert}
          badge="SECURITY ACTION"
          badgeVariant="danger"
        />
        <KpiCard
          title="Mean Composite Risk Score"
          value={stats ? `${stats.average_risk_score.toFixed(1)} / 100` : '—'}
          subtext="Historical rolling average"
          icon={ShieldCheck}
          badgeVariant="success"
        />
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart height={260} />
            <SkeletonChart height={260} />
          </div>
          <SkeletonChart height={260} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Timeline */}
            <div className="panel p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start border-b border-slate-800/80 pb-3 mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" /> Mean Risk Index Timeline
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Aggregated anomaly scores across sliding chronological windows</p>
                </div>
              </div>
              <div className="w-full h-64 min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={stats?.risk_timeline ?? []}>
                    <defs>
                      <linearGradient id="riskAnalyticsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(t) => formatTimestamp(t)}
                      stroke="#334155"
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#1e293b' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#334155"
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#1e293b' }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090e18',
                        border: '1px solid #1e293b',
                        borderRadius: 6,
                        fontSize: 11,
                        fontFamily: 'monospace',
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(val: any) => [`${Number(val).toFixed(1)} / 100`, 'Risk Index']}
                    />
                    <Area
                      type="monotone"
                      dataKey="risk_score"
                      stroke="#38bdf8"
                      fill="url(#riskAnalyticsGrad)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Volume Bar Chart */}
            <div className="panel p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start border-b border-slate-800/80 pb-3 mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-blue-400" /> Transaction Throughput vs Fraud
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Processed payment attempts vs blocked threats</p>
                </div>
              </div>
              <div className="w-full h-64 min-w-0">
                {dailyVolume.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded">
                    No aggregated records found in this interval.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={dailyVolume}>
                      <XAxis
                        dataKey="date"
                        stroke="#334155"
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        axisLine={{ stroke: '#1e293b' }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#334155"
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        axisLine={{ stroke: '#1e293b' }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090e18',
                          border: '1px solid #1e293b',
                          borderRadius: 6,
                          fontSize: 11,
                          fontFamily: 'monospace',
                        }}
                      />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontFamily: 'monospace' }} />
                      <Bar dataKey="volume" name="Processed Volume" fill="#0284c7" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="fraud" name="Fraud Blocked" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Decision Trends Line Chart */}
          <div className="panel p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start border-b border-slate-800/80 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Daily SOC Decision Distribution Trends
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Historical routing breakdown (ALLOW, MONITOR, STEP-UP, BLOCK)</p>
              </div>
            </div>
            <div className="w-full h-64 min-w-0">
              {decisionTrends.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded">
                  No decision trend records found in this interval.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={decisionTrends}>
                    <XAxis
                      dataKey="date"
                      stroke="#334155"
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#1e293b' }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#334155"
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#1e293b' }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090e18',
                        border: '1px solid #1e293b',
                        borderRadius: 6,
                        fontSize: 11,
                        fontFamily: 'monospace',
                      }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontFamily: 'monospace' }} />
                    <Line type="monotone" dataKey="ALLOW" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="MONITOR" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="STEP_UP" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="BLOCK" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
