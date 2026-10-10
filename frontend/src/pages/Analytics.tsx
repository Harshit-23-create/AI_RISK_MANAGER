import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, CartesianGrid, LineChart, Line
} from 'recharts';
import { BarChart2, Calendar, TrendingUp, Download, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { dashboardApi } from '../services/api';
import type { DashboardStats, AnalyticsData } from '../types';
import { formatTimestamp } from '../utils';

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
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-5 lg:space-y-6">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Deep Analytics & Reporting</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Historical Trends
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Aggregated transaction volumes, real decision distributions, and SOC performance telemetry</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['24H', '7D', '30D'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  timeRange === r ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportData}
            title="Export Report (JSON)"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 flex items-center gap-1.5 text-xs font-semibold"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
          <Clock className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
          <p className="text-xs">Aggregating historical telemetry from database...</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Quick Metric Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Total Analyzed ({timeRange})</p>
                <p className="text-lg font-black text-white">{stats?.total_transactions.toLocaleString() ?? '0'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Threat Interceptions</p>
                <p className="text-lg font-black text-rose-400">{((stats?.decision_breakdown?.block ?? 0) + (stats?.decision_breakdown?.step_up ?? 0)).toLocaleString()}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Average Risk Score</p>
                <p className="text-lg font-black text-white">{stats?.average_risk_score.toFixed(1) ?? '0.0'} <span className="text-xs text-slate-500 font-normal">/ 100</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" /> Average Risk Score Timeline
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Aggregated anomaly detection scores across sliding windows</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260} minWidth={0}>
                <AreaChart data={stats?.risk_timeline ?? []}>
                  <defs>
                    <linearGradient id="riskAnalyticsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="timestamp" tickFormatter={(t) => formatTimestamp(t)} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                    formatter={(val: any) => [`${Number(val).toFixed(1)} / 100`, 'Avg Risk Score']}
                  />
                  <Area type="monotone" dataKey="risk_score" stroke="#06b6d4" fill="url(#riskAnalyticsGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-blue-400" /> Daily Transaction & Fraud Volume
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Processed volume vs blocked fraud attempts</p>
                </div>
              </div>
              {dailyVolume.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No aggregated transaction records for this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260} minWidth={0}>
                  <BarChart data={dailyVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                      labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="volume" name="Total Volume" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="fraud" name="Fraud Blocked" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Daily Decision Distribution Trends
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Historical breakdown of SOC routing decisions (ALLOW / MONITOR / STEP_UP / BLOCK)</p>
              </div>
            </div>
            {decisionTrends.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No decision distribution records for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260} minWidth={0}>
                <LineChart data={decisionTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="ALLOW" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="MONITOR" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="STEP_UP" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="BLOCK" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
