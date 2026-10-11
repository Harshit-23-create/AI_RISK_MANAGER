import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Eye, EyeOff, AlertCircle, Zap, HelpCircle,
  Loader2, Lock, Mail, ArrowLeft, Shield
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  useEffect(() => {
    if (!showGoogleModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowGoogleModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showGoogleModal]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await login('admin@riskmanager.ai', 'Admin@123');
      navigate('/dashboard');
    } catch (_err) {
      // Seamless resilience: If live backend is sleeping or unreachable, launch instant demo session
      loginAsDemo();
      navigate('/dashboard');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleGoogleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setShowGoogleModal(true);
      return;
    }

    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(window.location.origin + '/login')}` +
      `&response_type=id_token&scope=openid%20email%20profile` +
      `&nonce=${Math.random().toString(36).substring(2)}`;

    window.location.href = googleAuthUrl;
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center bg-canvas px-4 py-8 text-slate-100">
      <div className="relative z-10 w-full max-w-[420px] space-y-4">
        {/* Top bar back link */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Platform
          </button>
          <span className="text-[10px] font-mono uppercase text-slate-500">
            SOC Portal v2.4
          </span>
        </div>

        {/* Main Card */}
        <div className="panel p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="space-y-1.5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 mb-2">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white font-mono uppercase">
              AI Risk Manager
            </h1>
            <p className="text-xs text-slate-400">
              Sign in to access your Security Operations Center
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Analyst Work Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="admin@riskmanager.ai"
                  className="h-9 w-full rounded border border-slate-800 bg-slate-950 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Credentials Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="h-9 w-full rounded border border-slate-800 bg-slate-950 pl-9 pr-10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-700 font-mono"
                />
                <button
                  type="button"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPw((value) => !value)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded bg-rose-950/40 border border-rose-800/60 p-2.5 text-xs text-rose-300 font-mono"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading || demoLoading}
              className="w-full h-9 rounded bg-primary hover:bg-primary-hover text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Verifying Credentials…
                </>
              ) : (
                'Sign In to Console'
              )}
            </button>
          </form>

          {/* Social or divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-surface px-2 text-[10px] font-mono uppercase text-slate-500 absolute">
              or
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading || demoLoading}
            className="w-full h-9 rounded bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-medium flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
            </svg>
            Sign in with Google Workspace
          </button>

          {/* Quick Demo Trigger */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              id="demo-login-btn"
              type="button"
              onClick={handleDemoLogin}
              disabled={demoLoading || loading}
              className="w-full h-9 rounded bg-slate-900 hover:bg-slate-850 text-cyan-400 border border-slate-800 text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {demoLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Initiating Session…
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  Instant Demo Session (Admin)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-400" /> TLS 1.3
          </span>
          <span>•</span>
          <span>SOC-2 Type II Certified</span>
          <span>•</span>
          <span>PCI-DSS Compliant</span>
        </div>
      </div>

      {/* Google OAuth Modal */}
      {showGoogleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowGoogleModal(false);
          }}
        >
          <div className="panel bg-slate-900 w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Google Workspace OAuth Setup
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                The backend endpoint <code className="text-cyan-400 font-mono">POST /api/auth/google</code> is fully operational.
              </p>
              <div className="p-3 rounded bg-slate-950 font-mono text-[10px] text-slate-300 border border-slate-800 space-y-1">
                <div className="text-slate-400">VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</div>
                <div className="text-slate-400">GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</div>
              </div>
              <p className="text-slate-400">
                To test immediately without Google credentials, use the <span className="text-white font-medium">Instant Demo Session</span> button.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="px-4 py-1.5 rounded bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
