import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Zap, Search, Bell, Menu, ChevronDown,
  Settings as SettingsIcon, ShieldAlert, ArrowRight, Clock, Activity
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
import { ThemeSelector } from '../ui/ThemeSelector';

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
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      toast.success('Dispatched synthetic transactions batch');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error?.message || 'Failed to start demo batch'
      );
    } finally {
      setLoading(false);
    }
  };

  const getWsBadge = (status: WsStatus) => {
    if (status === 'connected') {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="hidden sm:inline">Stream Live</span>
        </div>
      );
    }

    if (status === 'reconnecting') {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="hidden sm:inline">Reconnecting</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        <span className="hidden sm:inline">Offline</span>
      </div>
    );
  };

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'AD';

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center border-b border-slate-800/80 bg-slate-950/90 px-3 backdrop-blur-md sm:px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={mobileMenuOpen}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Global Search Bar with Live Results Dropdown */}
        <div ref={searchRef} className="relative hidden w-full max-w-md md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchInputRef}
              type="search"
              aria-label="Search transactions, users, and IP addresses"
              placeholder="Search Tx IDs, users, IP addresses & alerts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setSearchOpen(true)}
              className="h-8.5 w-full rounded-md border border-slate-800 bg-slate-900/80 pl-9 pr-14 text-xs text-white placeholder:text-slate-500 focus:border-slate-700 focus:outline-none"
            />
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-mono text-slate-500 bg-slate-950 px-1 py-0.5 rounded border border-slate-800">
              Ctrl+K
            </div>
          </div>

          {/* Search Dropdown Popup */}
          {searchOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 panel bg-slate-900 shadow-2xl overflow-hidden z-50 text-xs">
              {searching ? (
                <div className="p-4 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Clock className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  Querying SOC indices...
                </div>
              ) : (!searchResults?.transactions.length && !searchResults?.alerts.length) ? (
                <div className="p-4 text-center text-slate-500">
                  No matching records for "{searchQuery}".
                </div>
              ) : (
                <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-800/80">
                  {/* Matching Transactions */}
                  {Boolean(searchResults?.transactions.length) && (
                    <div className="p-2.5">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-semibold px-1">
                        Transactions ({searchResults!.transactions.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults!.transactions.map((tx) => (
                          <div
                            key={tx.id}
                            onClick={() => {
                              navigate(`/transactions/${tx.transaction_id}`);
                              setSearchOpen(false);
                            }}
                            className="p-2 rounded hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div className="min-w-0">
                              <span className="font-mono text-cyan-400 font-semibold block truncate text-xs">
                                {tx.transaction_id}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                User: {tx.user_id} {tx.ip_address ? `• IP: ${tx.ip_address}` : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-xs font-semibold text-white">
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
                    <div className="p-2.5">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5 font-semibold px-1">
                        Alerts ({searchResults!.alerts.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults!.alerts.map((al) => (
                          <div
                            key={al.id}
                            onClick={() => {
                              navigate('/alerts');
                              setSearchOpen(false);
                            }}
                            className="p-2 rounded hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-medium text-white block truncate text-xs">{al.title}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatTimestamp(al.created_at)} • Status: {al.status}
                              </span>
                            </div>
                            <SeverityBadge severity={al.severity} size="sm" />
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
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {getWsBadge(wsStatus)}

        {/* Appearance Theme Selector */}
        <ThemeSelector variant="compact" />

        {/* Quick Batch Simulator Button */}
        <button
          type="button"
          onClick={startDemo}
          disabled={loading}
          title="Inject synthetic test batch"
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-900 border border-slate-800 px-2.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-850 transition-colors disabled:opacity-50"
        >
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden sm:inline">
            {loading ? 'Injecting…' : 'Simulate Batch'}
          </span>
        </button>

        {/* Notifications Button & Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            aria-label="Security notifications"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850 transition-colors"
          >
            <Bell className="h-3.5 w-3.5" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-mono font-bold text-white">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 panel bg-slate-900 shadow-2xl z-50 p-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 px-1 mb-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Open Security Incidents
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-medium">
                  {alerts.length} Pending Triage
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
                      className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 cursor-pointer space-y-1 transition-all"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-medium text-white truncate">{al.title}</span>
                        <SeverityBadge severity={al.severity} size="sm" />
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
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1 w-full"
                >
                  Manage All Alerts <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            type="button"
            aria-label="Account menu"
            onClick={() => setUserMenuOpen((open) => !open)}
            className="flex h-8 items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-850 transition-colors"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[10px] font-mono font-bold text-slate-300">
              {initials}
            </div>
            <span className="hidden md:inline font-mono text-[11px]">{user?.email || 'admin@riskmanager.ai'}</span>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </button>

          {userMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close account menu"
                className="fixed inset-0 z-40 h-full w-full cursor-default"
                onClick={() => setUserMenuOpen(false)}
              />

              <div className="absolute right-0 top-full z-50 mt-1.5 w-48 panel bg-slate-900 p-1 shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <SettingsIcon className="h-3.5 w-3.5 text-slate-400" />
                  Policy &amp; Settings
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/system-health');
                  }}
                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Activity className="h-3.5 w-3.5 text-slate-400" />
                  Observability &amp; Health
                </button>

                <div className="my-1 h-px bg-slate-800" />

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-rose-400 hover:bg-rose-950/40"
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
