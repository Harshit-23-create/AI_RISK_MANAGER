import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { networkApi } from '../services/api';
import type { NetworkStats, NetworkEvent } from '../types';
import { formatTimestamp } from '../utils';

export default function Network() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      networkApi.stats().catch(() => null),
      networkApi.events().catch(() => ({ items: [] })),
    ]).then(([s, e]) => {
      if (s) setStats(s);
      setEvents(e.items ?? []);
    }).finally(() => setLoading(false));

    const interval = setInterval(async () => {
      const [s, e] = await Promise.all([networkApi.stats(), networkApi.events()]);
      if (s) setStats(s);
      setEvents(e.items ?? []);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const packetData = events.slice(0, 20).map((e, i) => ({
    name: i.toString(),
    rate: e.request_rate,
    failed: e.failed_request_count,
    suspicious: e.is_suspicious ? 1 : 0,
  })).reverse();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Network Monitor</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          Deep packet inspection & traffic analysis
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Events', value: stats?.total_events?.toLocaleString() ?? '—', color: '#3b82f6' },
          { label: 'Req/Sec (avg)', value: stats?.average_request_rate?.toFixed(2) ?? '—', color: '#06b6d4' },
          { label: 'Suspicious IPs', value: (stats?.suspicious_ips?.length ?? 0).toLocaleString(), color: '#f59e0b' },
          { label: 'Suspicious Events', value: stats?.suspicious_events?.toLocaleString() ?? '—', color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Traffic chart */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>
          Request Rate (Last 20 Events)
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={packetData}>
            <XAxis dataKey="name" hide />
            <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: '#0d1f38', border: '1px solid #1a3354', borderRadius: 8 }}
              formatter={(val: any, name: any) => [Number(val), name === 'rate' ? 'Req/s' : 'Failed']}
            />
            <Bar dataKey="rate" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="failed" fill="#ef4444" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Events table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Recent Network Events</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Time', 'Src IP', 'Dst IP', 'Protocol', 'Pkt Size', 'Pkt Count', 'Req Rate', 'Failed Req', 'Endpoint', 'Suspicious'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</td></tr>}
              {events.map(ev => (
                <tr key={ev.id} style={{ borderBottom: '1px solid rgba(26,51,84,0.4)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{formatTimestamp(ev.timestamp)}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-family-mono)', color: 'var(--color-text-secondary)' }}>{ev.src_ip}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-family-mono)', color: 'var(--color-text-secondary)' }}>{ev.dst_ip}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--color-accent-cyan)' }}>{ev.protocol}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{ev.packet_size.toFixed(0)}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{ev.packet_count}</td>
                  <td style={{ padding: '8px 12px', color: ev.request_rate > 10 ? '#f59e0b' : 'var(--color-text-secondary)' }}>{ev.request_rate.toFixed(1)}</td>
                  <td style={{ padding: '8px 12px', color: ev.failed_request_count > 5 ? '#ef4444' : 'var(--color-text-secondary)' }}>{ev.failed_request_count}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.endpoint}</td>
                  <td style={{ padding: '8px 12px' }}>
                    {ev.is_suspicious && (
                      <span style={{ padding: '2px 6px', borderRadius: 3, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 10, fontWeight: 600 }}>
                        YES
                      </span>
                    )}
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
