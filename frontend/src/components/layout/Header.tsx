import { useEffect, useState } from 'react';
import { LogOut, Zap, Search, Bell, Menu, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import type { WsStatus } from '../../hooks/useRiskFeed';
import { useRiskFeed } from '../../hooks/useRiskFeed';
import { simulationApi } from '../../services/api';

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Header({
  mobileMenuOpen,
  setMobileMenuOpen,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { status: wsStatus } = useRiskFeed(() => {});

  useEffect(() => {
    if (!userMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUserMenuOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [userMenuOpen]);

  const startDemo = async () => {
    setLoading(true);
    try {
      await simulationApi.demo();
      toast.success('Demo mode activated with synthetic transactions stream!');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error?.message || 'Failed to start demo'
      );
    } finally {
      setLoading(false);
    }
  };

  const getWsPill = (status: WsStatus) => {
    if (status === 'connected') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live
        </span>
      );
    }

    if (status === 'reconnecting') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          Reconnect
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-rose-400">
        <span className="h-2 w-2 rounded-full bg-rose-400" />
        Offline
      </span>
    );
  };

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'AD';

  return (
    <header className="sticky top-0 z-40 flex min-h-16 w-full shrink-0 items-center border-b border-slate-800 bg-slate-950/95 px-3 backdrop-blur-xl sm:px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <button
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={mobileMenuOpen}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden w-full max-w-xl md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            aria-label="Search transactions, users, and IP addresses"
            placeholder="Search transactions, users, IP addresses…"
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-4 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10"
          />
        </div>

        <div className="min-w-0 md:hidden">
          <span className="block truncate text-xs font-bold text-white">
            AI Risk Manager
          </span>
          <span className="block text-[9px] uppercase tracking-wider text-slate-500">
            SOC Console
          </span>
        </div>
      </div>

      <div className="ml-2 flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        <div className="hidden sm:block">{getWsPill(wsStatus)}</div>

        <button
          type="button"
          onClick={startDemo}
          disabled={loading}
          aria-label="Start demo mode"
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 text-xs font-bold text-purple-300 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
        >
          <Zap className={`h-3.5 w-3.5 ${loading ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">
            {loading ? 'Starting…' : 'Demo Mode'}
          </span>
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-slate-950" />
        </button>

        <div className="relative">
          <button
            type="button"
            aria-label="Open account menu"
            aria-expanded={userMenuOpen}
            onClick={() => setUserMenuOpen((open) => !open)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1 transition hover:border-cyan-500/30"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-xs font-bold text-cyan-300">
              {initials}
            </div>

            <div className="hidden min-w-0 max-w-40 flex-col items-start pr-1 md:flex">
              <span className="w-full truncate text-[11px] font-bold leading-tight text-slate-200">
                {user?.email || 'admin@riskmanager.ai'}
              </span>
              <span className="text-[9px] font-mono uppercase text-slate-500">
                {user?.role || 'Admin'}
              </span>
            </div>

            <ChevronDown
              className={`mr-1 hidden h-3.5 w-3.5 text-slate-500 transition-transform md:block ${
                userMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {userMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close account menu"
                className="fixed inset-0 z-40 h-full w-full cursor-default"
                onClick={() => setUserMenuOpen(false)}
              />

              <div className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-1 shadow-2xl">
                <div className="border-b border-slate-800 px-3 py-2 md:hidden">
                  <p className="truncate text-xs font-bold text-white">
                    {user?.email || 'admin@riskmanager.ai'}
                  </p>
                  <p className="mt-0.5 text-[9px] font-mono uppercase text-slate-500">
                    {user?.role || 'Admin'}
                  </p>
                </div>

                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  Profile
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  Settings
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  Security
                </button>

                <div className="my-1 h-px bg-slate-800" />

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-rose-400 transition hover:bg-rose-500/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
