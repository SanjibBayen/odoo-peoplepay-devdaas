import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useLogout from '../../hooks/useLogout.js';

/**
 * Accessible, collapsible off-canvas Sidebar Drawer for PeoplePay workspaces.
 * Closed by default on desktop & mobile; slides in from left when opened.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the drawer is open
 * @param {Function} props.onClose - Callback to close the drawer
 * @param {string} props.roleId - Active role identifier (employee, hr-manager, etc.)
 * @param {string} [props.activeNav] - Active navigation item ID
 * @param {Function} [props.onNavSelect] - Navigation selection callback
 */
export default function SidebarDrawer({
  isOpen,
  onClose,
  roleId = 'employee',
  activeNav = 'dashboard',
  onNavSelect,
}) {
  const navigate = useNavigate();
  const logout = useLogout();

  // Close drawer on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
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
    switch (roleId) {
      case 'hr-manager':
        return {
          title: 'HR Manager',
          badge: 'People Ops',
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          dashboardRoute: '/dashboard/hr-manager',
          loginRoute: '/login/hr-manager',
          navItems: [
            { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
            { id: 'employees', label: 'Employees', icon: 'users' },
            { id: 'contracts', label: 'Contracts', icon: 'shield' },
            { id: 'attendance', label: 'Attendance', icon: 'clock' },
            { id: 'time-off', label: 'Time Off', icon: 'calendar' },
            { id: 'schedules', label: 'Schedules', icon: 'calendar-check' },
            { id: 'reports', label: 'Reports', icon: 'file-text' },
          ],
        };
      case 'hr-payroll-user':
        return {
          title: 'HR Payroll User',
          badge: 'Operations',
          color: 'text-amber-800 bg-amber-50 border-amber-200',
          dashboardRoute: '/dashboard/hr-payroll-user',
          loginRoute: '/login/hr-payroll-user',
          navItems: [
            { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
            { id: 'attendance', label: 'Attendance', icon: 'clock' },
            {
              id: 'salary-structures',
              label: 'Salary Structures',
              icon: 'sliders',
            },
            { id: 'salary-rules', label: 'Salary Rules', icon: 'sliders' },
            { id: 'payruns', label: 'Payruns', icon: 'document' },
            { id: 'payslips', label: 'Payslips', icon: 'receipt' },
          ],
        };
      case 'hr-payroll-manager':
        return {
          title: 'HR Payroll Manager',
          badge: 'Authorization',
          color: 'text-[#714B67] bg-purple-50 border-purple-200',
          dashboardRoute: '/dashboard/hr-payroll-manager',
          loginRoute: '/login/hr-payroll-manager',
          navItems: [
            { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
            {
              id: 'salary-structures',
              label: 'Salary Structures',
              icon: 'sliders',
            },
            { id: 'salary-rules', label: 'Salary Rules', icon: 'sliders' },
            { id: 'payruns', label: 'Payruns', icon: 'document' },
            { id: 'payslips', label: 'Payslips', icon: 'receipt' },
            { id: 'reports', label: 'Reports', icon: 'file-text' },
          ],
        };
      case 'admin':
        return {
          title: 'Administrator',
          badge: 'Governance',
          color: 'text-rose-700 bg-rose-50 border-rose-200',
          dashboardRoute: '/dashboard/admin',
          loginRoute: '/login/admin',
          navItems: [
            { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
            { id: 'employees', label: 'Employees', icon: 'users' },
            { id: 'users-roles', label: 'Users & Roles', icon: 'users' },
            { id: 'departments', label: 'Departments', icon: 'building' },
            { id: 'settings', label: 'Settings', icon: 'sliders' },
            { id: 'audit-logs', label: 'Audit Logs', icon: 'shield' },
            { id: 'reports', label: 'Reports', icon: 'file-text' },
          ],
        };
      case 'employee':
      default:
        return {
          title: 'Employee',
          badge: 'Self-Service',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          dashboardRoute: '/dashboard/employee',
          loginRoute: '/login/employee',
          navItems: [
            { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
            { id: 'profile', label: 'My Profile', icon: 'user' },
            { id: 'attendance', label: 'Attendance', icon: 'clock' },
            { id: 'time-off', label: 'Time Off', icon: 'calendar' },
            { id: 'contracts', label: 'Contracts', icon: 'shield' },
            { id: 'payslips', label: 'Payslips', icon: 'receipt' },
          ],
        };
    }
  };

  const config = getRoleConfig();

  const renderIcon = (type) => {
    switch (type) {
      case 'grid':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <rect x='3' y='3' width='7' height='7' rx='1.5' />
            <rect x='14' y='3' width='7' height='7' rx='1.5' />
            <rect x='14' y='14' width='7' height='7' rx='1.5' />
            <rect x='3' y='14' width='7' height='7' rx='1.5' />
          </svg>
        );
      case 'user':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
            />
          </svg>
        );
      case 'users':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
            />
          </svg>
        );
      case 'clock':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <circle cx='12' cy='12' r='9' />
            <path strokeLinecap='round' d='M12 6v6l4 2' />
          </svg>
        );
      case 'calendar':
      case 'calendar-check':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <rect x='3' y='4' width='18' height='18' rx='2.5' />
            <path strokeLinecap='round' d='M16 2v4M8 2v4M3 10h18' />
          </svg>
        );
      case 'shield':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
            />
          </svg>
        );
      case 'document':
      case 'file-text':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            />
          </svg>
        );
      case 'receipt':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <rect x='2' y='5' width='20' height='14' rx='2' />
            <line x1='2' y1='10' x2='22' y2='10' />
            <circle cx='12' cy='15' r='1.5' />
          </svg>
        );
      case 'sliders':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <line x1='4' y1='21' x2='4' y2='14' />
            <line x1='4' y1='10' x2='4' y2='3' />
            <line x1='12' y1='21' x2='12' y2='12' />
            <line x1='12' y1='8' x2='12' y2='3' />
            <line x1='20' y1='21' x2='20' y2='16' />
            <line x1='20' y1='12' x2='20' y2='3' />
            <line x1='1' y1='14' x2='7' y2='14' />
            <line x1='9' y1='8' x2='15' y2='8' />
            <line x1='17' y1='16' x2='23' y2='16' />
          </svg>
        );
      case 'building':
      default:
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
            />
          </svg>
        );
    }
  };

  const handleNavClick = (itemId) => {
    if (itemId === 'dashboard') {
      navigate(config.dashboardRoute);
    } else if (itemId === 'employees') {
      navigate('/employees');
    }
    if (onNavSelect) {
      onNavSelect(itemId);
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
      {/* Dark Overlay with Blur */}
      <div
        className='fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Drawer Panel (Sliding in from the Left) */}
      <div
        className='relative w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col justify-between border-r border-[#EAE6DF] z-10 transition-transform duration-200'
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header with PeoplePay Branding */}
          <div className='p-4 sm:p-5 border-b border-[#EAE6DF] flex items-center justify-between'>
            <Link
              to={config.dashboardRoute}
              onClick={onClose}
              className='flex items-center gap-2.5 group'
              aria-label='PeoplePay Dashboard'
            >
              {/* Compact Brand Logo */}
              <div className='w-8 h-8 rounded-lg bg-purple-50 border border-purple-200/80 flex items-center justify-center p-1 shadow-2xs'>
                <svg
                  viewBox='0 0 40 40'
                  fill='none'
                  className='w-full h-full'
                  aria-hidden='true'
                >
                  <circle cx='13' cy='17' r='5' fill='#34D399' />
                  <path
                    d='M6 31c0-4 3.5-7 7-7s7 3 7 7'
                    fill='#34D399'
                    opacity='0.85'
                  />
                  <circle cx='20' cy='13' r='6' fill='#714B67' />
                  <path d='M12 29c0-4.5 4-8 8-8s8 3.5 8 8' fill='#714B67' />
                  <circle cx='27' cy='17' r='5' fill='#FB923C' />
                  <path
                    d='M20 31c0-4 3.5-7 7-7s7 3 7 7'
                    fill='#FB923C'
                    opacity='0.85'
                  />
                </svg>
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

            {/* Close Button */}
            <button
              type='button'
              onClick={onClose}
              className='p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors'
              aria-label='Close sidebar drawer'
            >
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                strokeWidth='2'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className='p-3 space-y-1' aria-label='Drawer Navigation'>
            <p className='px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5'>
              Workspace Menu
            </p>
            {config.navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => handleNavClick(item.id)}
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
                  {isActive && (
                    <span className='ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse' />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Area: Help, Settings, Logout */}
        <div className='p-3 border-t border-[#EAE6DF] space-y-1'>
          <button
            type='button'
            onClick={onClose}
            className='w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-[#714B67] hover:bg-[#FAF8F5] transition-colors text-left cursor-pointer'
          >
            <span className='text-gray-400'>
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                strokeWidth='2'
              >
                <circle cx='12' cy='12' r='9' />
                <path
                  strokeLinecap='round'
                  d='M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01'
                />
              </svg>
            </span>
            <span>Help & Guides</span>
          </button>

          <button
            type='button'
            onClick={() => {
              onClose();
              logout(roleId);
            }}
            className='w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer'
          >
            <span className='text-rose-500'>
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                strokeWidth='2'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                />
              </svg>
            </span>
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
