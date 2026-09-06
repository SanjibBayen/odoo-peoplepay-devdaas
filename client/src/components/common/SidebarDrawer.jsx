import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useLogout from '../../hooks/useLogout.js';

export default function SidebarDrawer({
  isOpen,
  onClose,
  roleId = 'employee',
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();

  // Handle ESC key to close drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getRoleConfig = () => {
    const normalizedRole = (roleId || 'employee').toLowerCase().replace(/_/g, '-');
    switch (normalizedRole) {
      case 'hr-manager':
        return {
          title: 'HR Manager',
          badge: 'People Ops',
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          dashboardRoute: '/hr-manager/dashboard',
          navItems: [
            { id: 'dashboard', label: 'Dashboard', route: '/hr-manager/dashboard', icon: 'grid' },
            { id: 'employees', label: 'Employees', route: '/employees', icon: 'users' },
            { id: 'contracts', label: 'Contracts', route: '/contracts', icon: 'shield' },
            { id: 'attendance', label: 'Attendance', route: '/attendance', icon: 'clock' },
            { id: 'time-off', label: 'Time Off', route: '/time-off', icon: 'calendar' },
            { id: 'schedules', label: 'Schedules', route: '/schedules', icon: 'calendar-check' },
            { id: 'reports', label: 'Reports', route: '/reports', icon: 'file-text' },
          ],
        };
      case 'hr-payroll-user':
        return {
          title: 'HR Payroll User',
          badge: 'Operations',
          color: 'text-amber-800 bg-amber-50 border-amber-200',
          dashboardRoute: '/hr-payroll-user/dashboard',
          navItems: [
            { id: 'dashboard', label: 'Dashboard', route: '/hr-payroll-user/dashboard', icon: 'grid' },
            { id: 'attendance', label: 'Attendance', route: '/attendance', icon: 'clock' },
            { id: 'salary-structures', label: 'Salary Structures', route: '/salary-structures', icon: 'sliders' },
            { id: 'salary-rules', label: 'Salary Rules', route: '/salary-rules', icon: 'sliders' },
            { id: 'payruns', label: 'Payruns', route: '/payruns', icon: 'document' },
            { id: 'payslips', label: 'Payslips', route: '/payslips', icon: 'receipt' },
          ],
        };
      case 'hr-payroll-manager':
        return {
          title: 'HR Payroll Manager',
          badge: 'Authorization',
          color: 'text-[#714B67] bg-purple-50 border-purple-200',
          dashboardRoute: '/hr-payroll-manager/dashboard',
          navItems: [
            { id: 'dashboard', label: 'Dashboard', route: '/hr-payroll-manager/dashboard', icon: 'grid' },
            { id: 'employees', label: 'Employees', route: '/employees', icon: 'users' },
            { id: 'salary-structures', label: 'Salary Structures', route: '/salary-structures', icon: 'sliders' },
            { id: 'salary-rules', label: 'Salary Rules', route: '/salary-rules', icon: 'sliders' },
            { id: 'payruns', label: 'Payruns', route: '/payruns', icon: 'document' },
            { id: 'payslips', label: 'Payslips', route: '/payslips', icon: 'receipt' },
            { id: 'reports', label: 'Reports', route: '/reports', icon: 'file-text' },
          ],
        };
      case 'admin':
        return {
          title: 'Administrator',
          badge: 'Governance',
          color: 'text-rose-700 bg-rose-50 border-rose-200',
          dashboardRoute: '/admin/dashboard',
          navItems: [
            { id: 'dashboard', label: 'Dashboard', route: '/admin/dashboard', icon: 'grid' },
            { id: 'employees', label: 'Employees', route: '/employees', icon: 'users' },
            { id: 'users', label: 'Users & Roles', route: '/users', icon: 'users' },
            { id: 'departments', label: 'Departments', route: '/departments', icon: 'building' },
            { id: 'settings', label: 'Settings', route: '/settings', icon: 'sliders' },
            { id: 'audit-logs', label: 'Audit Logs', route: '/audit-logs', icon: 'shield' },
            { id: 'reports', label: 'Reports', route: '/reports', icon: 'file-text' },
          ],
        };
      case 'employee':
      default:
        return {
          title: 'Employee',
          badge: 'Self-Service',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          dashboardRoute: '/employee/dashboard',
          navItems: [
            { id: 'dashboard', label: 'Dashboard', route: '/employee/dashboard', icon: 'grid' },
            { id: 'profile', label: 'My Profile', route: '/profile', icon: 'user' },
            { id: 'attendance', label: 'Attendance', route: '/attendance', icon: 'clock' },
            { id: 'time-off', label: 'Time Off', route: '/time-off', icon: 'calendar' },
            { id: 'payslips', label: 'Payslips', route: '/payslips', icon: 'receipt' },
          ],
        };
    }
  };

  const config = getRoleConfig();

  const isItemActive = (itemRoute) => {
    const curPath = location.pathname;
    if (itemRoute === '/dashboard' || itemRoute.includes('/dashboard')) {
      return curPath === itemRoute || curPath.endsWith('/dashboard');
    }
    return curPath.startsWith(itemRoute);
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'grid':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' />
          </svg>
        );
      case 'users':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
          </svg>
        );
      case 'user':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
          </svg>
        );
      case 'clock':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
        );
      case 'calendar':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
          </svg>
        );
      case 'calendar-check':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' />
          </svg>
        );
      case 'shield':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
          </svg>
        );
      case 'sliders':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' />
          </svg>
        );
      case 'document':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
          </svg>
        );
      case 'receipt':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' />
          </svg>
        );
      case 'building':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
          </svg>
        );
      case 'file-text':
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' />
          </svg>
        );
      default:
        return (
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
            <circle cx='12' cy='12' r='3' />
          </svg>
        );
    }
  };

  const handleNavClick = (item) => {
    if (item.route) {
      navigate(item.route);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id='sidebar-drawer'
      className='fixed inset-0 z-50 flex justify-start animate-fadeIn'
      role='dialog'
      aria-modal='true'
      aria-label='Navigation Drawer'
    >
      {/* Semi-transparent Overlay */}
      <div
        className='fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Left Navigation Drawer Content */}
      <div
        className='relative w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col justify-between border-r border-[#EAE6DF] z-10 transition-transform duration-200'
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Drawer Header */}
          <div className='p-4 sm:p-5 border-b border-[#EAE6DF] flex items-center justify-between'>
            <Link
              to={config.dashboardRoute}
              onClick={onClose}
              className='flex items-center gap-2.5 group'
            >
              <div className='w-8 h-8 rounded-lg bg-purple-50 border border-purple-200/80 flex items-center justify-center p-1 shadow-2xs'>
                <span className='text-sm font-black text-[#714B67]'>P</span>
              </div>
              <div className='flex flex-col'>
                <span className='text-base font-black tracking-tight text-[#1E293B]'>
                  PeoplePay
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border w-fit ${config.color}`}
                >
                  {config.title}
                </span>
              </div>
            </Link>

            <button
              type='button'
              onClick={onClose}
              className='p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer'
              aria-label='Close navigation menu'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className='p-3 space-y-1' aria-label='Drawer Navigation'>
            <p className='px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5'>
              Workspace Menu
            </p>
            {config.navItems.map((item) => {
              const isActive = isItemActive(item.route);
              return (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#714B67] text-white shadow-xs'
                      : 'text-gray-600 hover:text-[#714B67] hover:bg-[#FAF8F5]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={isActive ? 'text-white' : 'text-gray-400'}>
                    {renderIcon(item.icon)}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Drawer Footer */}
        <div className='p-3 border-t border-[#EAE6DF] space-y-1'>
          <button
            type='button'
            onClick={() => {
              onClose();
              logout(roleId);
            }}
            className='w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer text-left'
          >
            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
              />
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}