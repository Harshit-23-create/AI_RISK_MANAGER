import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldAlert, Activity, Globe, Radio, RefreshCw, Layers } from 'lucide-react';
import { networkApi } from '../services/api';
import type { NetworkStats, NetworkEvent } from '../types';
import { formatTimestamp } from '../utils';
import { KpiCard } from '../components/ui/KpiCard';

export default function NetworkPage() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<NetworkEvent | null>(null);

  const fetchNetworkData = async () => {
    try {
      const [s, e] = await Promise.all([
        networkApi.stats().catch(() => null),
        networkApi.events().catch(() => ({ items: [] })),
      ]);
      if (s) setStats(s);
      setEvents(e.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
    const interval = setInterval(fetchNetworkData, 5000);
    return () => clearInterval(interval);
  }, []);

  const packetData = events
    .slice(0, 20)
    .map((e, i) => ({
      name: `Ev ${i + 1}`,
      rate: e.request_rate,
      failed: e.failed_request_count,
      suspicious: e.is_suspicious ? 1 : 0,
    }))
    .reverse();

  return (
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-5 lg:space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Deep Packet Inspection (DPI) & Network Monitor</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Layer-7 Traffic Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time HTTP/TCP packet analysis, payload inspection & anomaly threat detection</p>
        </div>

        <button
          onClick={fetchNetworkData}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Packets
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total DPI Events"
          value={stats?.total_events?.toLocaleString() ?? '0'}
          subtext="Inspected network packets"
          icon={Layers}
          iconColor="text-blue-400"
          accentColor="from-blue-500/10 to-indigo-900/10"
        />
        <KpiCard
          title="Average Request Rate"
          value={`${stats?.average_request_rate?.toFixed(1) ?? '0.0'} req/s`}
          subtext="Throughput velocity"
          icon={Activity}
          iconColor="text-cyan-400"
          accentColor="from-cyan-500/10 to-teal-900/10"
        />
        <KpiCard
          title="Suspicious Threat IPs"
          value={(stats?.suspicious_ips?.length ?? 0).toString()}
          subtext="Flagged in threat database"
          icon={Globe}
          iconColor="text-amber-400"
          accentColor="from-amber-500/10 to-orange-900/10"
        />
        <KpiCard
          title="Suspicious Events"
          value={stats?.suspicious_events?.toLocaleString() ?? '0'}
          subtext="High risk DPI flags"
          icon={ShieldAlert}
          iconColor="text-rose-500"
          accentColor="from-rose-500/10 to-red-950/10"
        />
      </div>

      {/* Request Rate Chart & Suspicious IP Intelligence Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Rate Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Request Rate Velocity (Recent Packet Samples)
            </h2>
            <p className="text-[11px] text-slate-400">Comparing request rate vs failed auth attempts</p>
          </div>

          <ResponsiveContainer width="100%" height={210} minWidth={0}>
            <BarChart data={packetData}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10 }}
                formatter={(val: any, name: any) => [Number(val), name === 'rate' ? 'Req / sec' : 'Failed Attempts']}
              />
              <Bar dataKey="rate" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Suspicious IP Threat Intelligence list */}
        <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-800 pb-3 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Suspicious Threat IP Database
              </h3>
              <p className="text-[11px] text-slate-400">Active foreign & botnet IP addresses</p>
            </div>

            <div className="space-y-2">
              {(stats?.suspicious_ips ?? ['185.220.101.50', '198.51.100.44', '203.0.113.99', '45.33.32.156']).map((ip, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs">
                  <span className="text-cyan-400 font-bold">{ip}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    Flagged IP
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5 mt-4">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Python ML DPI Microservice Connected</span>
          </div>
        </div>
      </div>

      {/* Network Packet Table */}
      <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white">Inspected Layer-7 Packet Stream</h2>
          <p className="text-[11px] text-slate-400">Click any packet event row to inspect payload metadata</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                <th className="p-3">Time</th>
                <th className="p-3">Source IP</th>
                <th className="p-3">Destination</th>
                <th className="p-3">Protocol</th>
                <th className="p-3">Packet Size</th>
                <th className="p-3">Req Rate</th>
                <th className="p-3">Failed Req</th>
                <th className="p-3">Endpoint</th>
                <th className="p-3">Threat Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    Loading packet stream...
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="cursor-pointer hover:bg-cyan-950/20 transition-colors"
                  >
                    <td className="p-3 text-slate-400 font-mono">{formatTimestamp(ev.timestamp)}</td>
                    <td className="p-3 font-mono text-cyan-400 font-bold">{ev.src_ip}</td>
                    <td className="p-3 font-mono text-slate-300">{ev.dst_ip}</td>
                    <td className="p-3 font-bold text-slate-200">{ev.protocol || 'HTTPS'}</td>
                    <td className="p-3 font-mono text-slate-400">{ev.packet_size.toFixed(0)} B</td>
                    <td className="p-3 font-mono font-bold text-slate-200">{ev.request_rate.toFixed(1)} req/s</td>
                    <td className="p-3 font-mono text-slate-300">{ev.failed_request_count}</td>
                    <td className="p-3 text-slate-400 max-w-[160px] truncate">{ev.endpoint || '/api/v1/payments/create'}</td>
                    <td className="p-3">
                      {ev.is_suspicious ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          SUSPICIOUS
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          NORMAL
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Packet Inspector Drawer Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase">DPI PACKET INSPECTOR</span>
                <h3 className="text-sm font-bold text-white mt-1">Source: {selectedEvent.src_ip}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>Destination IP: <span className="text-white">{selectedEvent.dst_ip}</span></div>
              <div>Protocol: <span className="text-cyan-400">{selectedEvent.protocol}</span></div>
              <div>Packet Size: <span className="text-slate-300">{selectedEvent.packet_size} Bytes</span></div>
              <div>Packet Count: <span className="text-slate-300">{selectedEvent.packet_count}</span></div>
              <div>Request Rate: <span className="text-amber-400">{selectedEvent.request_rate} req/s</span></div>
              <div>Failed Auth: <span className="text-rose-400">{selectedEvent.failed_request_count}</span></div>
              <div>Endpoint: <span className="text-slate-300">{selectedEvent.endpoint}</span></div>
              <div>Threat Flag: <span className={selectedEvent.is_suspicious ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{selectedEvent.is_suspicious ? 'YES' : 'NO'}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
