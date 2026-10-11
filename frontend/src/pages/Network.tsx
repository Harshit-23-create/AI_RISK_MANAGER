import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ShieldAlert, Activity, Globe, RefreshCw, Layers, Search, Filter, ShieldCheck,
  X, Copy, Check
} from 'lucide-react';
import { networkApi, healthApi } from '../services/api';
import type { NetworkStats, NetworkEvent } from '../types';
import { formatTimestamp } from '../utils';
import { PageHeader } from '../components/ui/PageHeader';
import { KpiCard } from '../components/ui/KpiCard';
import { SkeletonTable } from '../components/ui/SkeletonLoader';
import { useTheme } from '../hooks/useTheme';

export default function NetworkPage() {
  const { chartColors } = useTheme();
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<NetworkEvent | null>(null);
  const [mlConnected, setMlConnected] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const fetchNetworkData = async () => {
    try {
      const [s, e, h] = await Promise.all([
        networkApi.stats().catch(() => null),
        networkApi.events().catch(() => ({ items: [] })),
        healthApi.detailed().catch(() => null),
      ]);
      if (s) setStats(s);
      setEvents(e.items ?? []);
      if (h?.components?.ml_service) {
        setMlConnected(h.components.ml_service.connected);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
    const interval = setInterval(fetchNetworkData, 8000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesSearch =
        !searchFilter ||
        ev.src_ip?.includes(searchFilter) ||
        ev.dst_ip?.includes(searchFilter) ||
        ev.endpoint?.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesSuspicious = !suspiciousOnly || ev.is_suspicious;
      return matchesSearch && matchesSuspicious;
    });
  }, [events, searchFilter, suspiciousOnly]);

  const packetData = filteredEvents
    .slice(0, 20)
    .map((e, i) => ({
      name: `Pkt ${i + 1}`,
      rate: e.request_rate,
      failed: e.failed_request_count,
      suspicious: e.is_suspicious ? 1 : 0,
    }))
    .reverse();

  const suspiciousIps = stats?.suspicious_ips ?? [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        category="Network Intelligence"
        title="Deep Packet Inspection (DPI) & Network Security"
        subtitle="Real-time Layer-7 HTTP/TCP traffic inspection, payload metadata extraction, and anomalous IP behavior detection"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-900 border border-slate-800 text-slate-300">
            <span className={`h-1.5 w-1.5 rounded-full ${mlConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {mlConnected ? 'DPI Engine Live' : 'Fallback Engine'}
          </span>
        }
      >
        <button
          type="button"
          onClick={fetchNetworkData}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 border border-slate-800 px-3 text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          title="Total DPI Events"
          value={stats?.total_events?.toLocaleString() ?? '0'}
          subtext="Inspected packets"
          icon={Layers}
        />
        <KpiCard
          title="Throughput Rate"
          value={`${stats?.average_request_rate?.toFixed(1) ?? '0.0'} req/s`}
          subtext="Request velocity"
          icon={Activity}
        />
        <KpiCard
          title="Flagged Threat IPs"
          value={suspiciousIps.length.toString()}
          subtext="Active in threat memory"
          icon={Globe}
          badge={suspiciousIps.length > 0 ? 'ACTIVE THREATS' : 'CLEAR'}
          badgeVariant={suspiciousIps.length > 0 ? 'danger' : 'success'}
        />
        <KpiCard
          title="Anomalous Packets"
          value={stats?.suspicious_events?.toLocaleString() ?? '0'}
          subtext="High anomaly flags"
          icon={ShieldAlert}
        />
      </div>

      {/* Visual Telemetry Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Packet Velocity Chart */}
        <div className="panel p-5 lg:col-span-2 flex flex-col justify-between">
          <div className="border-b border-slate-800/80 pb-3 mb-4">
            <h2 className="text-sm font-semibold text-white">Request Velocity &amp; Auth Failures</h2>
            <p className="text-xs text-slate-400 mt-0.5">Throughput request rate vs failed credential challenges across recent packets</p>
          </div>

          <div className="w-full h-56 min-w-0">
            {packetData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded">
                No packet samples recorded in this window.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={packetData}>
                  <XAxis
                    dataKey="name"
                    stroke={chartColors.grid}
                    tick={{ fill: chartColors.text, fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={{ stroke: chartColors.grid }}
                    tickLine={false}
                  />
                  <YAxis
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
                    formatter={(val: any, name: any) => [Number(val), name === 'rate' ? 'Rate (req/s)' : 'Auth Failures']}
                  />
                  <Bar dataKey="rate" name="rate" fill="#0284c7" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="failed" name="failed" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Threat IP Reputation Ledger */}
        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-800/80 pb-3 mb-3">
              <h3 className="text-sm font-semibold text-white">Suspicious IP Ledger</h3>
              <p className="text-xs text-slate-400 mt-0.5">Blacklisted &amp; proxy/botnet nodes</p>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {suspiciousIps.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                  Threat database clear. Zero blacklisted IPs.
                </div>
              ) : (
                suspiciousIps.map((ip, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800/80 text-xs font-mono"
                  >
                    <span className="text-cyan-400 font-semibold">{ip}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(ip)}
                      title="Copy IP"
                      className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                    >
                      {copiedIp === ip ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between mt-3">
            <span>DPI Filter: Strict</span>
            <span className="text-slate-500">Node ID: DPI-01</span>
          </div>
        </div>
      </div>

      {/* Packet Stream Table */}
      <div className="panel overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 p-4 bg-slate-900/30">
          <div>
            <h2 className="text-sm font-semibold text-white">Inspected Layer-7 Packet Stream</h2>
            <p className="text-xs text-slate-400 mt-0.5">Click any packet event to inspect header and payload attributes</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter IP or Endpoint…"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-8 w-44 rounded border border-slate-800 bg-slate-950 pl-8 pr-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
              />
            </div>

            <button
              type="button"
              onClick={() => setSuspiciousOnly(!suspiciousOnly)}
              className={`h-8 px-2.5 rounded text-xs font-mono font-medium border flex items-center gap-1.5 transition-colors ${
                suspiciousOnly
                  ? 'bg-rose-950/60 text-rose-300 border-rose-800/80'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>Suspicious Only</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading && !events.length ? (
          <SkeletonTable rows={8} cols={8} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider bg-slate-950/60">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Source IP</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Protocol</th>
                  <th className="px-4 py-3">Payload Size</th>
                  <th className="px-4 py-3">Req Rate</th>
                  <th className="px-4 py-3">Auth Retries</th>
                  <th className="px-4 py-3">Endpoint Target</th>
                  <th className="px-4 py-3">Threat Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-500">
                      No packet events match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((ev) => (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="cursor-pointer hover:bg-slate-850/60 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {formatTimestamp(ev.timestamp)}
                      </td>
                      <td className="px-4 py-3 font-mono text-cyan-400 font-semibold">{ev.src_ip}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{ev.dst_ip}</td>
                      <td className="px-4 py-3 font-mono text-slate-300 font-semibold">{ev.protocol || 'HTTPS'}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{ev.packet_size.toFixed(0)} B</td>
                      <td className="px-4 py-3 font-mono text-slate-200">{ev.request_rate.toFixed(1)} req/s</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{ev.failed_request_count}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono max-w-[160px] truncate">{ev.endpoint || '/api/v1/payments'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            ev.is_suspicious
                              ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                              : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50'
                          }`}
                        >
                          {ev.is_suspicious ? 'ANOMALOUS' : 'NORMAL'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DPI Packet Inspector Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="panel bg-slate-900 w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                  Wireshark / L7 Packet Forensic Inspector
                </span>
                <h3 className="text-sm font-bold text-white mt-1">Source Node: {selectedEvent.src_ip}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-3.5 rounded border border-slate-800">
              <div>Destination IP: <span className="text-white block font-semibold">{selectedEvent.dst_ip}</span></div>
              <div>Protocol: <span className="text-cyan-400 block font-semibold">{selectedEvent.protocol}</span></div>
              <div>Packet Size: <span className="text-slate-300 block">{selectedEvent.packet_size} Bytes</span></div>
              <div>Packet Count: <span className="text-slate-300 block">{selectedEvent.packet_count}</span></div>
              <div>Request Rate: <span className="text-amber-400 block">{selectedEvent.request_rate} req/s</span></div>
              <div>Auth Failures: <span className="text-rose-400 block">{selectedEvent.failed_request_count}</span></div>
              <div className="col-span-2">Target Endpoint: <span className="text-slate-200 block truncate">{selectedEvent.endpoint}</span></div>
              <div className="col-span-2 pt-1 border-t border-slate-800/80">
                Threat Status:{' '}
                <span className={selectedEvent.is_suspicious ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {selectedEvent.is_suspicious ? 'ANOMALY DETECTED (HIGH RISK)' : 'BENIGN TRAFFIC'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 text-xs font-medium rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
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
