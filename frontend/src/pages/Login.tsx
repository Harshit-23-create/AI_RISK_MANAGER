import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@riskmanager.ai');
  const [password, setPassword] = useState('Admin@123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Invalid email or password. Use admin@riskmanager.ai / Admin@123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 60%), var(--color-bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="glass-card" style={{
        width: '100%', maxWidth: 420,
        padding: '40px 36px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(59,130,246,0.08)',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', padding: 16, borderRadius: 16,
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
            marginBottom: 16,
          }}>
            <ShieldCheck size={36} color="var(--color-accent-blue)" strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>
            AI Risk Manager
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Real-Time Payment Security Platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)', fontSize: 14, outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', padding: '10px 40px 10px 14px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)', fontSize: 14, outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              marginBottom: 16, fontSize: 12, color: '#ef4444',
            }}>
              <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              {error}
            </div>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 8,
              background: loading ? 'rgba(59,130,246,0.5)' : 'var(--color-accent-blue)',
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div style={{
          marginTop: 20, padding: '16px', borderRadius: 8,
          background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
            <strong style={{ color: 'var(--color-accent-cyan)' }}>Demo Mode Available</strong>
          </div>
          <button
            type="button"
            onClick={(e) => {
              setEmail('admin@riskmanager.ai');
              setPassword('Admin@123');
              // Briefly wait for state to update, then submit
              setTimeout(() => {
                const form = e.currentTarget.closest('.glass-card')?.querySelector('form');
                if (form) form.requestSubmit();
              }, 50);
            }}
            disabled={loading}
            style={{
              width: '100%', padding: '10px', borderRadius: 8,
              background: 'transparent', border: '1px solid var(--color-accent-cyan)',
              color: 'var(--color-accent-cyan)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(6,182,212,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            One-Click Demo Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}
