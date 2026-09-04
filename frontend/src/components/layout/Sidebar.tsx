import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Bell, Network, ShieldCheck, Radio } from 'lucide-react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/network', icon: Network, label: 'Network Security' },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 min-h-screen flex-col shrink-0 bg-slate-900 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center gap-3 p-6 border-b border-slate-800">
        <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 shadow-md">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <div className="text-sm font-extrabold text-white tracking-tight leading-none">
            AI Risk Manager
          </div>
          <div className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-widest mt-1">
            Enterprise SOC
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-4 space-y-1.5">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
          Operations & Intelligence
        </div>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> DPI Engine Active
          </span>
          <span className="font-mono text-[10px] text-slate-500">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
}
