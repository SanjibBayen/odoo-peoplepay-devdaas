import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useLogout from '../../hooks/useLogout.js';

export default function SidebarDrawer({
  isOpen,
  onClose,
  roleId = 'employee',
  activeNav = 'dashboard',
  onNavSelect,
}) {
  const navigate = useNavigate();
  const logout = useLogout();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
            { id: 'contracts', label: 'Contracts', route: '/contracts', icon: 'shield' },
            { id: 'payslips', label: 'Payslips', route: '/payslips', icon: 'receipt' },
          ],
        };
    }
  };

  const config = getRoleConfig();

  const renderIcon = (type) => {
    // ... (keep all your existing icon rendering code the same)
    // I'm omitting it here for brevity - keep your existing renderIcon function
  };

  const handleNavClick = (item) => {
    if (item.route) {
      navigate(item.route);
    }
    if (onNavSelect) {
      onNavSelect(item.id);
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
      <div
        className='fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity'
        onClick={onClose}
        aria-hidden='true'
      />

      <div
        className='relative w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col justify-between border-r border-[#EAE6DF] z-10 transition-transform duration-200'
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className='p-4 sm:p-5 border-b border-[#EAE6DF] flex items-center justify-between'>
            <Link to={config.dashboardRoute} onClick={onClose} className='flex items-center gap-2.5 group'>
              <div className='w-8 h-8 rounded-lg bg-purple-50 border border-purple-200/80 flex items-center justify-center p-1 shadow-2xs'>
                <span className='text-sm font-black text-[#714B67]'>P</span>
              </div>
              <div className='flex flex-col'>
                <span className='text-base font-black tracking-tight text-[#1E293B]'>PeoplePay</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border w-fit ${config.color}`}>
                  {config.title}
                </span>
              </div>
            </Link>

            <button
              type='button'
              onClick={onClose}
              className='p-1.5 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer'
              aria-label='Close sidebar'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>

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
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer ${
                    isActive ? 'bg-[#714B67] text-white shadow-xs' : 'text-gray-600 hover:text-[#714B67] hover:bg-[#FAF8F5]'
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

        <div className='p-3 border-t border-[#EAE6DF] space-y-1'>
          <button
            type='button'
            onClick={() => {
              onClose();
              logout(roleId);
            }}
            className='w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer text-left'
          >
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}