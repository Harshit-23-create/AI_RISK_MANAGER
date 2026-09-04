import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Bell, Network } from 'lucide-react';

const tabs = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/network', icon: Network, label: 'Network' },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md">
      <div className="flex items-stretch h-16">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all duration-200 ${
                isActive
                  ? 'text-cyan-400 bg-cyan-500/10 border-t-2 border-cyan-400'
                  : 'text-slate-500 hover:text-slate-300 border-t-2 border-transparent'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
