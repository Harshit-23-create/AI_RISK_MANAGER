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
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: 'var(--color-bg-secondary)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <ShieldCheck size={28} color="var(--color-accent-blue)" strokeWidth={1.5} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
            AI Risk
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-accent-cyan)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Manager
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 8,
              marginBottom: 4,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
              color: isActive ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)',
              background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
              border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
              transition: 'all 0.2s',
            })}
          >
            <Icon size={18} strokeWidth={1.5} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--color-border)',
        fontSize: 10,
        color: 'var(--color-text-muted)',
        textAlign: 'center',
      }}>
        v1.0.0 · Simulation Mode
      </div>
    </aside>
  );
}
