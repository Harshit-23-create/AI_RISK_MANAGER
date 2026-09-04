import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Bell, Network, Settings, X,
  ShieldCheck, Activity, BarChart2, Zap
} from 'lucide-react';

const mainNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/network', icon: Network, label: 'Network Security' },
  { to: '/simulation', icon: Zap, label: 'Simulation Center' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/system-health', icon: Activity, label: 'System Health' },
];

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  return (
    <>
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 cursor-default bg-slate-950/75 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,86vw)] shrink-0 flex-col border-r border-slate-800 bg-slate-900 shadow-2xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:shadow-none ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex min-h-16 items-center justify-between border-b border-slate-800 px-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="shrink-0 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-black leading-none tracking-tight text-white">
                AI Risk Manager
              </div>
              <div className="mt-1 text-[9px] font-bold font-mono uppercase tracking-wider text-slate-500">
                Enterprise SOC
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <nav className="space-y-1">
            {mainNav.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-10 items-center gap-3 rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${
                    isActive
                      ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="my-5 h-px bg-slate-800/60" />

          <nav>
            <NavLink
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex min-h-10 items-center gap-3 rounded-xl border px-3 py-2.5 text-xs font-bold ${
                  isActive
                    ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              <Settings className="h-4 w-4 shrink-0" />
              Settings
            </NavLink>
          </nav>
        </div>
      </aside>
    </>
  );
}
