import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      {/* Sidebar - Desktop and Mobile Drawer */}
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950 relative z-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
