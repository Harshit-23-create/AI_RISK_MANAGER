import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Activity, Sparkles } from 'lucide-react';
import { transactionsApi, riskApi } from '../services/api';
import type { Transaction, RiskAssessment } from '../types';
import { formatCurrency, formatDate, formatTimestamp, decisionBadgeClass, riskScoreColor, formatFactor } from '../utils';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      transactionsApi.get(id).catch(() => null),
      riskApi.get(id).catch(() => null),
    ]).then(([t, r]) => {
      setTxn(t);
      setRisk(r);
    }).finally(() => setLoading(false));
  }, [id]);

  const requestExplanation = async () => {
    if (!id) return;
    setExplaining(true);
    try {
      const result = await riskApi.explain(id);
      setRisk(prev => prev ? { ...prev, llm_explanation: result.explanation } : prev);
    } catch (e) {
      console.error(e);
    } finally {
      setExplaining(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--color-text-muted)' }}>
        Loading transaction…
      </div>
    );
  }

  if (!txn) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
        Transaction not found.
        <button onClick={() => navigate('/transactions')} style={{ display: 'block', margin: '16px auto', color: 'var(--color-accent-blue)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Back to Transactions
        </button>
      </div>
    );
  }

  const scoreColor = riskScoreColor(risk?.risk_score ?? 0);
  const sortedShap = risk?.shap_values
    ? Object.entries(risk.shap_values).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 8)
    : [];

  return (
    <div>
      {/* Back nav */}
      <button
        onClick={() => navigate('/transactions')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: 'var(--color-text-secondary)',
          cursor: 'pointer', fontSize: 13, marginBottom: 20,
        }}
      >
        <ArrowLeft size={16} /> Back to Transactions
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Transaction Info */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>TRANSACTION</div>
                <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: 13, color: 'var(--color-accent-cyan)' }}>
                  {txn.transaction_id}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {formatCurrency(txn.amount, txn.currency)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {formatDate(txn.timestamp)} {formatTimestamp(txn.timestamp)}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                ['User ID', txn.user_id],
                ['Payment Method', txn.payment_method ?? '—'],
                ['Country', txn.country ?? '—'],
                ['IP Address', txn.ip_address ?? '—'],
                ['Device ID', txn.device_id ? txn.device_id.slice(0, 12) + '…' : '—'],
                ['Status', txn.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Behavioral flags */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} color="var(--color-accent-blue)" /> Behavioral Signals
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                ['Failed Attempts', txn.failed_attempts, txn.failed_attempts > 3],
                ['Txn Frequency', `${txn.transaction_frequency.toFixed(1)}/min`, txn.transaction_frequency > 5],
                ['Account Age', `${txn.account_age_days} days`, txn.account_age_days < 30],
                ['Prev Avg Amount', formatCurrency(txn.previous_transaction_avg, txn.currency), false],
                ['Prev Txn Count', txn.previous_transaction_count, false],
                ['New Device', txn.is_new_device ? 'Yes ⚠' : 'No', txn.is_new_device],
                ['New IP', txn.is_new_ip ? 'Yes ⚠' : 'No', txn.is_new_ip],
                ['Scenario', txn.scenario_label ?? '—', false],
              ].map(([label, value, warn]) => (
                <div key={label as string}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label as string}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: warn ? '#f59e0b' : 'var(--color-text-primary)' }}>
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SHAP Explainability */}
          {risk && (
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Brain size={16} color="var(--color-accent-purple)" />
                Why was this flagged? — SHAP Feature Contributions
              </h3>

              {/* Risk factors */}
              {(risk.risk_factors ?? []).length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8 }}>DETECTED RISK FACTORS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(risk.risk_factors ?? []).map(f => (
                      <span key={f.factor} style={{
                        padding: '4px 10px', borderRadius: 4, fontSize: 11,
                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.25)',
                      }}>
                        {f.description}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* SHAP bar chart */}
              {sortedShap.length > 0 ? (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8 }}>SHAP VALUES (ML FEATURE IMPORTANCE)</div>
                  {sortedShap.map(([feature, value]) => {
                    const isPositive = value > 0;
                    const barWidth = Math.min(100, Math.abs(value) * 100);
                    return (
                      <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 140, fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'right', flexShrink: 0 }}>
                          {formatFactor(feature)}
                        </div>
                        <div style={{ flex: 1, height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                          <div style={{
                            position: 'absolute',
                            right: isPositive ? undefined : 0,
                            left: isPositive ? 0 : undefined,
                            width: `${barWidth}%`,
                            height: '100%',
                            background: isPositive ? 'rgba(239,68,68,0.6)' : 'rgba(16,185,129,0.6)',
                            borderRadius: 4,
                          }} />
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-family-mono)', color: isPositive ? '#ef4444' : '#10b981', width: 50 }}>
                          {value > 0 ? '+' : ''}{value.toFixed(3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  SHAP values not available — XGBoost model not yet trained. Using rule-based scoring.
                </div>
              )}
            </div>
          )}

          {/* LLM Explanation */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="var(--color-accent-cyan)" /> AI Explanation
            </h3>
            {risk?.llm_explanation ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7, background: 'rgba(6,182,212,0.04)', padding: 16, borderRadius: 8, border: '1px solid rgba(6,182,212,0.15)' }}>
                {risk.llm_explanation}
              </p>
            ) : (
              <div>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                  No AI explanation generated yet.
                </p>
                <button
                  id="generate-explanation-btn"
                  onClick={requestExplanation}
                  disabled={explaining}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 16px', borderRadius: 8,
                    background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
                    color: 'var(--color-accent-cyan)', fontSize: 12, fontWeight: 600,
                    cursor: explaining ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Sparkles size={14} />
                  {explaining ? 'Generating…' : 'Generate AI Explanation'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar — Risk Score */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {risk && (
            <>
              {/* Score card */}
              <div className="glass-card" style={{
                padding: 24, textAlign: 'center',
                border: `1px solid ${scoreColor}30`,
                boxShadow: `0 0 30px ${scoreColor}15`,
              }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Risk Score
                </div>
                <div style={{
                  fontSize: 64, fontWeight: 800, lineHeight: 1,
                  color: scoreColor,
                  textShadow: `0 0 30px ${scoreColor}50`,
                }}>
                  {risk.risk_score.toFixed(0)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>/100</div>

                <span className={decisionBadgeClass(risk.decision)} style={{
                  display: 'inline-block', padding: '6px 20px', borderRadius: 6,
                  fontSize: 14, fontWeight: 700,
                }}>
                  {risk.decision}
                </span>

                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>
                  Confidence: {(risk.confidence * 100).toFixed(1)}%
                </div>
              </div>

              {/* Score breakdown */}
              <div className="glass-card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--color-text-primary)' }}>
                  Score Breakdown
                </h3>
                {[
                  { label: 'Transaction', value: risk.transaction_score, color: '#3b82f6' },
                  { label: 'Behavioral', value: risk.behavioral_score, color: '#8b5cf6' },
                  { label: 'Network', value: risk.network_score, color: '#06b6d4' },
                  { label: 'ML Anomaly', value: risk.ml_anomaly_score, color: '#f59e0b' },
                  { label: 'ML Supervised', value: risk.ml_supervised_score, color: '#ef4444' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color }}>{value.toFixed(1)}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommended action */}
              <div className="glass-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Recommended Action
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: scoreColor, marginBottom: 8 }}>
                  {risk.decision}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  {risk.decision === 'BLOCK' && 'Immediately block this transaction. Manual review required.'}
                  {risk.decision === 'STEP-UP' && 'Request additional authentication (OTP, biometric) before processing.'}
                  {risk.decision === 'MONITOR' && 'Allow but flag for enhanced monitoring. No immediate action.'}
                  {risk.decision === 'ALLOW' && 'Transaction appears normal. No intervention required.'}
                </div>
              </div>
            </>
          )}

          {!risk && !loading && (
            <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Risk assessment not available for this transaction.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
