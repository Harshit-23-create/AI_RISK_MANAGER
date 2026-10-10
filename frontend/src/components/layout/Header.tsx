import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Zap, Search, Bell, Menu, ChevronDown,
  Settings as SettingsIcon, ShieldAlert, ArrowRight, X, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import type { WsStatus } from '../../hooks/useRiskFeed';
import { useRiskFeed } from '../../hooks/useRiskFeed';
import { simulationApi, dashboardApi, alertsApi } from '../../services/api';
import type { SearchResult, Alert } from '../../types';
import { formatCurrency, formatTimestamp } from '../../utils';
import { RiskBadge } from '../ui/RiskBadge';
import { SeverityBadge } from '../ui/SeverityBadge';

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Header({
  mobileMenuOpen,
  setMobileMenuOpen,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const { status: wsStatus } = useRiskFeed(() => {});

  // Fetch open alerts for notification center
  const loadNotifications = async () => {
    try {
      const res = await alertsApi.list(1, undefined, 'OPEN', true);
      setAlerts(res.items || []);
    } catch {
      // offline fallback handled by api service
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Debounced global search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await dashboardApi.search(searchQuery.trim());
        setSearchResults(results);
        setSearchOpen(true);
      } catch {
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for search & notifications
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        {/* Global Search Bar with Live Results Dropdown */}
        <div ref={searchRef} className="relative hidden w-full max-w-xl md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              aria-label="Search transactions, users, and IP addresses"
              placeholder="Search across Tx IDs, users, IP addresses & alerts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setSearchOpen(true)}
              className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-8 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Popup */}
          {searchOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs">
              {searching ? (
                <div className="p-4 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Clock className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  Searching SOC database...
                </div>
              ) : (!searchResults?.transactions.length && !searchResults?.alerts.length) ? (
                <div className="p-4 text-center text-slate-500">
                  No matching transactions or alerts found for "{searchQuery}".
                </div>
              ) : (
                <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-800/60">
                  {/* Matching Transactions */}
                  {Boolean(searchResults?.transactions.length) && (
                    <div className="p-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 font-bold px-1">
                        Matching Transactions ({searchResults!.transactions.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults!.transactions.map((tx) => (
                          <div
                            key={tx.id}
                            onClick={() => {
                              navigate(`/transactions/${tx.transaction_id}`);
                              setSearchOpen(false);
                            }}
                            className="p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div className="min-w-0">
                              <span className="font-mono text-cyan-400 font-bold block truncate">
                                {tx.transaction_id}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                User: {tx.user_id} {tx.ip_address ? `• IP: ${tx.ip_address}` : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-bold text-white">
                                {formatCurrency(tx.amount, tx.currency)}
                              </span>
                              <RiskBadge decision={tx.decision} size="sm" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Alerts */}
                  {Boolean(searchResults?.alerts.length) && (
                    <div className="p-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 font-bold px-1">
                        Matching Alerts ({searchResults!.alerts.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults!.alerts.map((al) => (
                          <div
                            key={al.id}
                            onClick={() => {
                              navigate('/alerts');
                              setSearchOpen(false);
                            }}
                            className="p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-white block truncate">{al.title}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatTimestamp(al.created_at)} • Status: {al.status}
                              </span>
                            </div>
                            <SeverityBadge severity={al.severity} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 md:hidden">
          <span className="block truncate text-xs font-bold text-white">
            AI Risk Manager
          </span>
          <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-mono">
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

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <Bell className="h-4 w-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-slate-950">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-2xl z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 px-1 mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Active Security Alerts
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  {alerts.length} Pending
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1.5">
                {alerts.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    All security incidents acknowledged & resolved.
                  </div>
                ) : (
                  alerts.slice(0, 5).map((al) => (
                    <div
                      key={al.id}
                      onClick={() => {
                        navigate('/alerts');
                        setNotificationsOpen(false);
                      }}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 cursor-pointer space-y-1 transition-all"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-white truncate">{al.title}</span>
                        <SeverityBadge severity={al.severity} />
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{al.message}</p>
                      <span className="text-[9px] font-mono text-slate-500 block">
                        {formatTimestamp(al.created_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 mt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/alerts');
                    setNotificationsOpen(false);
                  }}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1 w-full"
                >
                  Manage All Alerts <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu */}
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
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  <SettingsIcon className="h-3.5 w-3.5 text-cyan-400" />
                  Policy &amp; Settings
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/system-health');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
                  Observability &amp; Health
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
