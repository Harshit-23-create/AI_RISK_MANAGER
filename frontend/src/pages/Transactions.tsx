import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { transactionsApi } from '../services/api';
import type { TransactionListResponse } from '../types';
import { formatCurrency, formatTimestamp, truncateId } from '../utils';

const DECISIONS = ['', 'ALLOW', 'MONITOR', 'STEP-UP', 'BLOCK'];

export default function Transactions() {
  const [data, setData] = useState<TransactionListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [decision, setDecision] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    transactionsApi.list(page, 50, decision || undefined)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, decision]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Transactions</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {data?.total?.toLocaleString() ?? '…'} total transactions
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Filter size={14} color="var(--color-text-muted)" />
          <select
            value={decision}
            onChange={e => { setDecision(e.target.value); setPage(1); }}
            style={{
              padding: '6px 12px', borderRadius: 8,
              background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)', fontSize: 12, cursor: 'pointer',
            }}
          >
            {DECISIONS.map(d => (
              <option key={d} value={d}>{d || 'All decisions'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'rgba(26,51,84,0.3)', borderBottom: '1px solid var(--color-border)' }}>
                {['Transaction ID', 'Time', 'Amount', 'User', 'IP Address', 'Method', 'Failed', 'Freq', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</td></tr>
              )}
              {!loading && (data?.items ?? []).map(txn => (
                <tr
                  key={txn.id}
                  onClick={() => navigate(`/transactions/${txn.transaction_id}`)}
                  style={{
                    borderBottom: '1px solid rgba(26,51,84,0.5)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-family-mono)', color: 'var(--color-accent-cyan)', fontSize: 11 }}>
                    {truncateId(txn.transaction_id, 16)}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {formatTimestamp(txn.timestamp)}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                    {formatCurrency(txn.amount, txn.currency)}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>
                    {txn.user_id}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-family-mono)', color: 'var(--color-text-muted)', fontSize: 11 }}>
                    {txn.ip_address ?? '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>
                    {txn.payment_method ?? '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: txn.failed_attempts > 3 ? '#ef4444' : 'var(--color-text-secondary)' }}>
                    {txn.failed_attempts}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>
                    {txn.transaction_frequency.toFixed(1)}/min
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                      background: txn.status === 'processed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      color: txn.status === 'processed' ? '#10b981' : '#f59e0b',
                      border: `1px solid ${txn.status === 'processed' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    }}>
                      {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > 50 && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 8,
            padding: '16px', borderTop: '1px solid var(--color-border)',
          }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
            >
              Previous
            </button>
            <span style={{ padding: '6px 14px', color: 'var(--color-text-secondary)', fontSize: 12 }}>
              Page {page} of {Math.ceil(data.total / 50)}
            </span>
            <button
              disabled={page >= Math.ceil(data.total / 50)}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
