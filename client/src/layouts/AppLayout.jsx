import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/common/AppHeader.jsx';
import SidebarDrawer from '../components/common/SidebarDrawer.jsx';

export default function AppLayout({
  roleId = 'employee',
  title = 'Dashboard',
  portalName,
  user,
  children,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const defaultPortalName =
    portalName ||
    (roleId === 'admin'
      ? 'Governance'
      : roleId === 'hr-manager'
      ? 'People Ops'
      : roleId === 'hr-payroll-manager'
      ? 'Authorization'
      : roleId === 'hr-payroll-user'
      ? 'Operations'
      : 'Self-Service');

  return (
    <div className='min-h-screen bg-[#FAF8F5] text-[#1E293B] flex flex-col'>
      <AppHeader
        title={title}
        portalName={defaultPortalName}
        user={user}
        isDrawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
        roleSlug={roleId}
      />

      <SidebarDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        roleId={roleId}
      />

      <main className='flex-1 w-full max-w-7xl mx-auto p-4 sm:p-5 lg:p-6 print:p-0 print:m-0 print:max-w-full'>
        {children || <Outlet />}
      </main>

      <footer className='py-3 px-5 border-t border-[#EAE6DF] bg-white/60 text-center text-[11px] text-gray-400 print:hidden'>
        © 2026 PeoplePay. All rights reserved.
      </footer>
    </div>
  );
}