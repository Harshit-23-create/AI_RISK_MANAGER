import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] w-full min-w-0 overflow-hidden bg-canvas font-sans antialiased text-slate-100">
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-canvas">
          <div className="mx-auto w-full min-w-0 max-w-[1720px] p-4 sm:p-6 lg:p-8 space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
