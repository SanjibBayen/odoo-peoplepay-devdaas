import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/common/AppHeader.jsx';
import SidebarDrawer from '../components/common/SidebarDrawer.jsx';

/**
 * Unified application shell for all five PeoplePay dashboards.
 * Closed sidebar by default on desktop & mobile; full-width main content.
 *
 * @param {Object} props
 * @param {string} props.roleId - Role identifier ('employee', 'hr-manager', etc.)
 * @param {string} props.title - Dashboard title
 * @param {string} props.portalName - Portal descriptor
 * @param {Object} props.user - Current user profile
 * @param {React.ReactNode} [props.children] - Child page
 */
export default function AppLayout({
  roleId = 'employee',
  title = 'Dashboard',
  portalName = 'Portal',
  user,
  activeNav: initialActiveNav = 'dashboard',
  children,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeNav, setActiveNav] = useState(initialActiveNav);

  return (
    <div className='min-h-screen bg-[#FAF8F5] text-[#1E293B] flex flex-col'>
      {/* Top Application Header */}
      <AppHeader
        title={title}
        portalName={portalName}
        user={user}
        isDrawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
        roleSlug={roleId}
      />

      {/* Collapsible Sidebar Drawer (Hidden by default, slides out when opened) */}
      <SidebarDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        roleId={roleId}
        activeNav={activeNav}
        onNavSelect={(navId) => setActiveNav(navId)}
      />

      {/* Full-width Main Dashboard Content Container */}
      <main className='flex-1 w-full max-w-7xl mx-auto p-4 sm:p-5 lg:p-6'>
        {children || <Outlet />}
      </main>

      {/* Compact Authenticated Footer */}
      <footer className='py-3 px-5 border-t border-[#EAE6DF] bg-white/60 text-center text-[11px] text-gray-400'>
        © 2026 PeoplePay. All rights reserved.
      </footer>
    </div>
  );
}
