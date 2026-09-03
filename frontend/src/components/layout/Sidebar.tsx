import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Bell, Network, ShieldCheck
} from 'lucide-react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/network', icon: Network, label: 'Network' },
];

export default function Sidebar() {
  return (
    <aside className="w-full md:w-[220px] h-auto md:min-h-screen flex flex-col shrink-0" style={{
      background: 'var(--color-bg-secondary)',
      borderRight: '1px solid var(--color-border)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      {/* Logo */}
      <div className="flex items-center justify-between md:justify-start gap-3 p-4 md:p-6 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={28} color="var(--color-accent-blue)" strokeWidth={1.5} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
              AI Risk
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-accent-cyan)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Manager
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex md:flex-col overflow-x-auto overflow-y-hidden md:overflow-visible p-2 md:p-3 flex-1 gap-2 whitespace-nowrap">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => 
              `flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                  : 'text-slate-400 hover:bg-white/5 border border-transparent'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.5} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="hidden md:block p-4 text-center text-[10px] text-slate-500 border-t border-[var(--color-border)]">
        v1.0.0 · Simulation Mode
      </div>
    </aside>
  );
}
