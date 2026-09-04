import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Bell, Network, Settings, X, ShieldCheck, Activity, BarChart2, Zap } from 'lucide-react';

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
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
    lg:translate-x-0 lg:static lg:shrink-0
    ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <aside className={sidebarClasses}>
        {/* Brand Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white tracking-tight leading-none">AI Risk Manager</div>
              <div className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">Enterprise SOC</div>
            </div>
          </div>
          <button 
            className="lg:hidden text-slate-400 hover:text-white" 
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <nav className="space-y-1">
            {mainNav.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="h-px bg-slate-800/50" />

          <nav className="space-y-1">
            <NavLink
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`
              }
            >
              <Settings className="w-4 h-4" />
              Settings
            </NavLink>
          </nav>
        </div>
      </aside>
    </>
  );
}
