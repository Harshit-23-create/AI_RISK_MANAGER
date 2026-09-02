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
    <header style={{
      height: 60,
      background: 'var(--color-bg-secondary)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
    }}>
      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="live-dot" style={{
          width: 8, height: 8, borderRadius: '50%',
          background: simRunning ? '#10b981' : '#475569',
        }} />
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {simRunning ? 'Simulation running' : 'Simulation stopped'}
        </span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          Demo Mode
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
          {simRunning ? 'Stop' : 'Start'} Simulation
        </button>

        <div style={{
          padding: '4px 12px', borderRadius: 20,
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
          fontSize: 12, color: 'var(--color-text-secondary)',
        }}>
          {user?.email}
        </div>

        <button
          id="logout-btn"
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)',
            background: 'transparent', color: 'var(--color-text-muted)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}
