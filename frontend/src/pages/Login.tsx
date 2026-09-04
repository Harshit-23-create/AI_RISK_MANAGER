import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, AlertCircle, Zap, HelpCircle, Loader2, Lock, Mail } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
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
      setError(err?.response?.data?.error?.message || 'Demo login failed. Please check the server connection.');
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
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      window.location.origin + '/login'
    )}&response_type=id_token&scope=openid%20email%20profile&nonce=${Math.random().toString(36).substring(2)}`;
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-700/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
          
          <div className="bg-gradient-to-r from-cyan-600/15 via-blue-600/10 to-slate-900/0 border-b border-slate-800 px-8 py-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-blue-600/25 border border-cyan-500/40 text-cyan-400 shadow-lg mb-4">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">AI Risk Manager</h1>
            <p className="text-xs text-slate-400 mt-1">Enterprise Payment Security Operations Center</p>
          </div>

          <div className="px-8 py-6 space-y-6">
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-11 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading || demoLoading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                OR
              </span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <button
              type="button"
              onClick={handleGoogleClick}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300 font-semibold text-sm transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
              </svg>
              Continue with Google
            </button>

            <div className="pt-4 border-t border-slate-800">
              <div className="text-center mb-3">
                <span className="text-xs font-bold text-slate-400">Try Live Demo</span>
              </div>
              <button
                id="demo-login-btn"
                type="button"
                onClick={handleDemoLogin}
                disabled={demoLoading || loading}
                className="w-full py-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 active:bg-cyan-500/30 text-cyan-400 font-bold text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {demoLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</>
                ) : (
                  <><Zap className="w-4 h-4" /> One-Click Demo Admin Login</>
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-4">
          Secured with JWT • TLS encrypted • SOC-grade authentication
        </p>
      </div>

      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Google OAuth Setup</h3>
              </div>
              <button onClick={() => setShowGoogleModal(false)} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>The backend Google OAuth endpoint (<code className="text-cyan-400 font-mono">POST /api/auth/google</code>) is fully implemented.</p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                <p className="font-bold text-slate-200">Required Environment Variables:</p>
                <p className="text-cyan-300">VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</p>
                <p className="text-cyan-300">GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</p>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                <li>Go to Google Cloud Console → Credentials</li>
                <li>Create OAuth 2.0 Client ID (Web Application)</li>
                <li>Add origin: <code className="text-slate-200 font-mono">https://ai-risk-manager-chi.vercel.app</code></li>
                <li>Set <code className="text-slate-200 font-mono">VITE_GOOGLE_CLIENT_ID</code> in Vercel settings</li>
              </ol>
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowGoogleModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400"
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
