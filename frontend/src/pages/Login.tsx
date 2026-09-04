import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Eye, EyeOff, AlertCircle, Zap, HelpCircle,
  Loader2, Lock, Mail, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
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
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          'Demo login failed. Please check the server connection.'
      );
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
    <div className="relative flex min-h-[100dvh] w-full min-w-0 items-center justify-center overflow-x-hidden overflow-y-auto bg-slate-950 px-3 py-8 text-slate-100 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[100px] sm:h-[32rem] sm:w-[32rem] sm:blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-blue-700/10 blur-[100px] sm:h-[28rem] sm:w-[28rem] sm:blur-[120px]" />

      <div className="relative z-10 w-full max-w-[460px]">
        <div className="mb-4 flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </button>

          <span className="hidden text-[9px] font-mono uppercase tracking-[.18em] text-slate-600 sm:block">
            Secure Access
          </span>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <header className="border-b border-slate-800 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent px-5 py-6 text-center sm:px-8 sm:py-7">
            <div className="mx-auto mb-4 inline-flex rounded-2xl border border-cyan-500/35 bg-cyan-500/10 p-3 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              AI Risk Manager
            </h1>
            <p className="mx-auto mt-1 max-w-sm text-[10px] leading-5 text-slate-400 sm:text-xs">
              Enterprise Payment Security Operations Center
            </p>
          </header>

          <div className="p-4 sm:p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-xs font-semibold text-slate-300"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="login-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="you@company.com"
                    className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-xs font-semibold text-slate-300"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="Enter your password"
                    className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/10"
                  />
                  <button
                    type="button"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPw((value) => !value)}
                    className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
                  >
                    {showPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-5 text-rose-300"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="break-words">{error}</span>
                </div>
              )}

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading || demoLoading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-500 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                or
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading || demoLoading}
              className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-950/80 px-4 text-sm font-semibold text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 disabled:opacity-60"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
              </svg>
              Continue with Google
            </button>

            <div className="mt-5 border-t border-slate-800 pt-5">
              <div className="mb-3 text-center">
                <span className="text-xs font-bold text-slate-400">
                  Need a quick preview?
                </span>
              </div>
              <button
                id="demo-login-btn"
                type="button"
                onClick={handleDemoLogin}
                disabled={demoLoading || loading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500/20 active:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {demoLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authenticating…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    One-Click Demo Admin Login
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <p className="px-3 pt-4 text-center text-[9px] leading-4 text-slate-600 sm:text-[10px]">
          Secured with JWT · TLS encrypted · SOC-grade authentication
        </p>
      </div>

      {showGoogleModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/80 p-3 backdrop-blur-md sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowGoogleModal(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="google-dialog-title"
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex min-w-0 items-center gap-2">
                <HelpCircle className="h-5 w-5 shrink-0 text-cyan-400" />
                <h3 id="google-dialog-title" className="text-sm font-bold text-white">
                  Google OAuth Setup
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close Google OAuth setup"
                onClick={() => setShowGoogleModal(false)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 pt-4 text-xs leading-5 text-slate-300">
              <p>
                The backend Google OAuth endpoint (
                <code className="break-all text-cyan-400">POST /api/auth/google</code>
                ) is fully implemented.
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[10px] text-cyan-300 sm:text-[11px]">
                <p className="mb-1 font-bold text-slate-200">
                  Required Environment Variables:
                </p>
                <p>VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</p>
                <p>GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</p>
              </div>
              <ol className="list-decimal space-y-1 pl-4 text-slate-400">
                <li>Open Google Cloud Console → Credentials.</li>
                <li>Create an OAuth 2.0 Client ID for a Web Application.</li>
                <li>Add the deployed app origin to authorized origins.</li>
                <li>Set VITE_GOOGLE_CLIENT_ID in your Vercel settings.</li>
              </ol>
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="min-h-9 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
