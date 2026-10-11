import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Bell, Network, Settings, X,
  Shield, Activity, BarChart3, Zap, ChevronRight, LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Operations',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Risk Operations' },
      { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
      { to: '/alerts', icon: Bell, label: 'SOC Incidents' },
    ],
  },
  {
    title: 'Intelligence & DPI',
    items: [
      { to: '/network', icon: Network, label: 'Packet Inspection' },
      { to: '/simulation', icon: Zap, label: 'Attack Simulator' },
      { to: '/analytics', icon: BarChart3, label: 'Deep Analytics' },
    ],
  },
  {
    title: 'System & Governance',
    items: [
      { to: '/system-health', icon: Activity, label: 'Telemetry & Health' },
      { to: '/settings', icon: Settings, label: 'Thresholds & Policies' },
    ],
  },
];

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <>
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 cursor-default bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-800/80 bg-slate-950/95 transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-bold tracking-tight text-white uppercase font-mono">
                AI Risk Manager
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  SOC Tier-1 Active
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-2 pb-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
              {section.items.map(({ to, icon: Icon, label, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `group flex h-9 items-center justify-between rounded-md px-2.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-850 text-white font-semibold border border-slate-750'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-200" />
                    <span className="truncate">{label}</span>
                  </div>
                  {badge ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-950 text-rose-400 border border-rose-900">
                      {badge}
                    </span>
                  ) : (
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* User Session Footer */}
        <div className="border-t border-slate-800/80 p-3 bg-slate-950">
          <div className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2 border border-slate-800/60">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-800 text-xs font-mono font-bold text-slate-300">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-slate-200">
                  {user?.full_name || 'SOC Analyst'}
                </div>
                <div className="truncate text-[10px] font-mono text-slate-400">
                  {user?.email || 'admin@riskmanager.ai'}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
