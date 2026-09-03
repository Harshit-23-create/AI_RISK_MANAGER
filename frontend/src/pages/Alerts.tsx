import { useEffect, useState } from 'react';
import { Bell, CheckCircle, Filter } from 'lucide-react';
import { alertsApi } from '../services/api';
import type { AlertListResponse } from '../types';
import { formatTimestamp, formatDate, severityBadgeClass } from '../utils';

const SEVERITIES = ['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export default function Alerts() {
  const [data, setData] = useState<AlertListResponse | null>(null);
  const [severity, setSeverity] = useState('');
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = () => {
    setLoading(true);
    alertsApi.list(1, severity || undefined, unresolvedOnly)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAlerts(); }, [severity, unresolvedOnly]);

  const resolve = async (id: string) => {
    await alertsApi.resolve(id);
    fetchAlerts();
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Security Alerts</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {data?.total ?? '…'} alerts
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={unresolvedOnly} onChange={e => setUnresolvedOnly(e.target.checked)} />
            Unresolved only
          </label>
          <Filter size={14} color="var(--color-text-muted)" />
          <select
            value={severity}
            onChange={e => setSeverity(e.target.value)}
            style={{
              padding: '6px 12px', borderRadius: 8,
              background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)', fontSize: 12, cursor: 'pointer',
            }}
          >
            {SEVERITIES.map(s => <option key={s} value={s}>{s || 'All severities'}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>Loading…</div>}
        {!loading && (data?.items ?? []).length === 0 && (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Bell size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <div>No alerts found</div>
          </div>
        )}
        {(data?.items ?? []).map(alert => (
          <div
            key={alert.id}
            className="glass-card"
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              opacity: alert.is_resolved ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>
              <div style={{ paddingTop: 2 }}>
                <span className={severityBadgeClass(alert.severity)} style={{
                  display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>
                  {alert.severity}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                  {alert.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {alert.message}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 6 }}>
                  {formatDate(alert.created_at)} {formatTimestamp(alert.created_at)}
                  {alert.is_resolved && alert.resolved_at && ` · Resolved ${formatTimestamp(alert.resolved_at)}`}
                </div>
              </div>
            </div>
            {!alert.is_resolved && (
              <button
                onClick={() => resolve(alert.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 6,
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                  color: '#10b981', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                }}
              >
                <CheckCircle size={12} /> Resolve
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
