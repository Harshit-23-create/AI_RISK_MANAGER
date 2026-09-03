import { useState } from 'react';
import { LogOut, Play, Square, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { simulationApi } from '../../services/api';

export default function Header() {
  const { user, logout } = useAuth();
  const [simRunning, setSimRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleSim = async () => {
    setLoading(true);
    try {
      if (simRunning) {
        await simulationApi.stop();
        setSimRunning(false);
        toast.success('Simulation stopped');
      } else {
        await simulationApi.start(5, 0.25);
        setSimRunning(true);
        toast.success('Simulation started');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || 'Failed to toggle simulation');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startDemo = async () => {
    setLoading(true);
    try {
      await simulationApi.demo();
      setSimRunning(true);
      toast.success('Demo mode started! Generating synthetic transactions...');
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || 'Failed to start demo');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="h-auto min-h-[60px] flex flex-col md:flex-row items-center justify-between p-3 md:px-6 shrink-0 gap-3 md:gap-0" style={{
      background: 'var(--color-bg-secondary)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      {/* Live indicator */}
      <div className="flex items-center justify-between w-full md:w-auto">
        <div className="flex items-center gap-2">
          <div className="live-dot" style={{
            width: 8, height: 8, borderRadius: '50%',
            background: simRunning ? '#10b981' : '#475569',
          }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {simRunning ? 'Simulation running' : 'Simulation stopped'}
          </span>
        </div>
        
        {/* Mobile logout button (hidden on desktop) */}
        <button
          onClick={logout}
          className="md:hidden flex items-center p-1.5 rounded-lg border border-[var(--color-border)] text-slate-400 hover:text-white"
        >
          <LogOut size={14} />
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
        <button
          id="demo-mode-btn"
          onClick={startDemo}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(139,92,246,0.4)',
            background: 'rgba(139,92,246,0.1)', color: '#8b5cf6',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Zap size={14} />
          <span className="hidden sm:inline">Demo Mode</span>
        </button>

        <button
          id="simulation-toggle-btn"
          onClick={toggleSim}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            border: `1px solid ${simRunning ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'}`,
            background: simRunning ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
            color: simRunning ? '#ef4444' : '#3b82f6',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {simRunning ? <Square size={14} /> : <Play size={14} />}
          <span className="hidden sm:inline">{simRunning ? 'Stop' : 'Start'} Simulation</span>
        </button>

        <div className="hidden md:block px-3 py-1 rounded-full text-xs text-slate-400 bg-blue-500/10 border border-blue-500/20">
          {user?.email}
        </div>

        <button
          id="logout-btn"
          onClick={logout}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] text-slate-400 hover:text-white transition-colors"
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}
