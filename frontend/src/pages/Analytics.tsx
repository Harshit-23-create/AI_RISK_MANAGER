import { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, CartesianGrid, LineChart, Line
} from 'recharts';
import { BarChart2, Calendar, TrendingUp, Download, Clock } from 'lucide-react';
import { dashboardApi } from '../services/api';
import type { DashboardStats } from '../types';
import { formatTimestamp } from '../utils';

export default function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24H' | '7D' | '30D'>('7D');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.stats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, timeRange]);

  const mockDailyVolume = Array.from({ length: 7 }).map((_, i) => ({
    date: `Day -${7 - i}`,
    volume: Math.floor(Math.random() * 5000) + 1000,
    fraud: Math.floor(Math.random() * 200) + 10,
  }));

  const mockDecisionTrends = Array.from({ length: 7 }).map((_, i) => ({
    date: `Day -${7 - i}`,
    ALLOW: Math.floor(Math.random() * 4000) + 800,
    MONITOR: Math.floor(Math.random() * 300) + 50,
    STEP_UP: Math.floor(Math.random() * 100) + 20,
    BLOCK: Math.floor(Math.random() * 150) + 10,
  }));

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
          <p className="text-xs text-slate-400 mt-1">Long-term transaction volume, risk scores, and SOC performance metrics</p>
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
          <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
          <Clock className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
          <p className="text-xs">Aggregating historical telemetry...</p>
        </div>
      ) : (
        <div className="space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" /> Average Risk Score Timeline
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Aggregated anomaly detection scores</p>
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
                    <BarChart2 className="w-4 h-4 text-blue-400" /> Transaction & Fraud Volume
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Total processed vs blocked attempts</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260} minWidth={0}>
                <BarChart data={mockDailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="volume" name="Valid Volume" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="fraud" name="Fraud Blocked" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Daily Decision Distribution Trends
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Historical breakdown of SOC routing decisions</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260} minWidth={0}>
              <LineChart data={mockDecisionTrends}>
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
          </div>
        </div>
      )}
    </div>
  );
}
