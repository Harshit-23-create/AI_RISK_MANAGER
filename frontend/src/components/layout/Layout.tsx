import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          background: 'var(--color-bg-primary)',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
