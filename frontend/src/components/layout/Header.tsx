import { useState } from 'react';
import { LogOut, Zap, Menu, X, Radio, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import type { WsStatus } from '../../hooks/useRiskFeed';
import { useRiskFeed } from '../../hooks/useRiskFeed';
import { simulationApi } from '../../services/api';
import { SimulationCenterModal } from '../ui/SimulationCenterModal';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/network', label: 'Network Security' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { status: wsStatus } = useRiskFeed(() => {});

  const startDemo = async () => {
    setLoading(true);
    try {
      await simulationApi.demo();
      toast.success('Demo mode activated with synthetic transactions stream!');
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || 'Failed to start demo');
    } finally {
      setLoading(false);
    }
  };

  const getWsPill = (status: WsStatus) => {
    if (status === 'connected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Live WebSocket
        </span>
      );
    }
    if (status === 'reconnecting') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Reconnecting...
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <span className="w-2 h-2 rounded-full bg-rose-400" />
        Offline
      </span>
    );
  };

  return (
    <>
      <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
        {/* Left: Mobile Menu Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">SOC Center</span>
            </div>
          </div>
        </div>

        {/* Right: Controls & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* WS Status */}
          <div className="hidden lg:block">{getWsPill(wsStatus)}</div>

          {/* Demo Mode Button */}
          <button
            id="demo-mode-btn"
            onClick={startDemo}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold hover:bg-purple-500/20 transition-all shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Demo Mode</span>
          </button>

          {/* Simulation Center */}
          <button
            id="simulation-toggle-btn"
            onClick={() => setSimModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-bold hover:bg-cyan-500/20 transition-all shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Simulation Center</span>
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-200 hover:border-cyan-500/40 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                {user?.email ? user.email.substring(0, 2).toUpperCase() : 'AD'}
              </div>
              <span className="hidden md:inline text-xs font-medium text-slate-300 max-w-[120px] truncate">
                {user?.email || 'admin@riskmanager.ai'}
              </span>
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2.5 border-b border-slate-800">
                  <p className="text-xs font-bold text-white truncate">{user?.email}</p>
                  <p className="text-[10px] text-cyan-400 uppercase font-mono mt-0.5">Role: {user?.role || 'SOC Administrator'}</p>
                </div>
                <div className="px-4 py-2 border-b border-slate-800 text-[11px] text-slate-400">
                  <span>Status: </span>
                  <span className="text-emerald-400 font-semibold">Active Analyst</span>
                </div>
                <button
                  id="logout-btn"
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-2 animate-in slide-in-from-top duration-200 z-30">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  isActive ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <span className="text-[11px] text-slate-400">WebSocket Status</span>
            {getWsPill(wsStatus)}
          </div>
        </div>
      )}

      {/* Simulation Modal */}
      <SimulationCenterModal isOpen={simModalOpen} onClose={() => setSimModalOpen(false)} />
    </>
  );
}
