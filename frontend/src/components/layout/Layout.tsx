import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6" style={{ background: 'var(--color-bg-primary)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
