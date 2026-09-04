import { useState } from 'react';
import { LogOut, Zap, Search, Bell, Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import type { WsStatus } from '../../hooks/useRiskFeed';
import { useRiskFeed } from '../../hooks/useRiskFeed';
import { simulationApi } from '../../services/api';

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Header({ setMobileMenuOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Live
        </span>
      );
    }
    if (status === 'reconnecting') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Reconnect
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <span className="w-2 h-2 rounded-full bg-rose-400" />
        Offline
      </span>
    );
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-slate-900 border-b border-slate-800 z-30 shrink-0">
      
      {/* Mobile Menu Toggle & Search */}
      <div className="flex items-center gap-4 flex-1">
        <button 
          className="lg:hidden p-1.5 text-slate-400 hover:text-white"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="relative max-w-sm w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search transactions, users, IP addresses..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* WS Status */}
        <div className="hidden sm:block">{getWsPill(wsStatus)}</div>

        {/* Demo Mode Action */}
        <button
          onClick={startDemo}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition-all shadow-sm"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Demo Mode</span>
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-slate-900"></span>
        </button>

        {/* Profile Menu */}
        <div className="relative ml-2">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 transition-all focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
              {user?.email ? user.email.substring(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden md:flex flex-col items-start pr-2">
              <span className="text-[11px] font-bold text-slate-200 max-w-[100px] truncate leading-tight">
                {user?.email || 'admin@riskmanager.ai'}
              </span>
              <span className="text-[9px] text-slate-500 uppercase font-mono">
                {user?.role || 'Admin'}
              </span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2">
                <button className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  Profile
                </button>
                <button className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  Settings
                </button>
                <button className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  Security
                </button>
                <div className="h-px bg-slate-800 my-1" />
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
