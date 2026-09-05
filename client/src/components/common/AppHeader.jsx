import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Compact, modern AppHeader for PeoplePay dashboards.
 *
 * @param {Object} props
 * @param {string} props.title - Current dashboard/page title
 * @param {string} [props.portalName] - Subtitle or portal indicator
 * @param {Object} props.user - Current user object
 * @param {boolean} props.isDrawerOpen - Drawer status for aria-expanded
 * @param {Function} props.onToggleDrawer - Toggle sidebar drawer callback
 * @param {string} props.roleSlug - Active role slug
 */
export default function AppHeader({
  title = 'Dashboard',
  portalName = 'Employee',
  user,
  isDrawerOpen = false,
  onToggleDrawer,
  roleSlug = 'employee',
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const notifications = [
    {
      id: 1,
      title: 'Time Off Approved',
      time: '1h ago',
      desc: 'Casual leave for 2 days was confirmed.',
      unread: true,
    },
    {
      id: 2,
      title: 'Payroll Disbursal',
      time: 'Yesterday',
      desc: 'Salary batch #2026-09 validated for review.',
      unread: true,
    },
    {
      id: 3,
      title: 'System Health Check',
      time: '3d ago',
      desc: 'Biometric API synchronization active.',
      unread: false,
    },
  ];

  return (
    <header className='sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EAE6DF] px-3 sm:px-5 lg:px-6 h-13 flex items-center justify-between transition-all'>
      {/* Left: Compact Brand + Breadcrumbs */}
      <div className='flex items-center gap-3 min-w-0'>
        {/* Brand Logo & Name (PeoplePay) */}
        <Link
          to={`/dashboard/${roleSlug}`}
          className='flex items-center gap-2 group'
          aria-label='PeoplePay Home'
        >
          <div className='w-7 h-7 rounded-lg bg-purple-50 border border-purple-200/80 flex items-center justify-center p-0.5 shadow-2xs group-hover:scale-105 transition-transform'>
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
          <span className='text-sm font-black tracking-tight text-[#1E293B] hidden xs:inline'>
            PeoplePay
          </span>
        </Link>

        {/* Divider & Breadcrumb */}
        <div className='hidden md:flex items-center gap-1.5 text-xs text-gray-400 font-medium pl-1 border-l border-gray-200'>
          <span className='text-gray-600 font-bold truncate'>{title}</span>
          <span className='text-[10px] text-gray-400'>•</span>
          <span className='text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-[#714B67] border border-purple-200/60'>
            {portalName}
          </span>
        </div>
      </div>

      {/* Center: Compact Search */}
      <div className='hidden sm:flex items-center flex-1 max-w-xs md:max-w-sm mx-4'>
        <div className='relative w-full'>
          <span className='absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400'>
            <svg
              className='w-3.5 h-3.5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              strokeWidth='2'
            >
              <circle cx='11' cy='11' r='8' />
              <path d='M21 21l-4.35-4.35' />
            </svg>
          </span>
          <input
            type='search'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search records, employees, batches...'
            className='w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-gray-200/80 rounded-lg text-[#1E293B] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-[#714B67] focus:border-transparent transition-all'
          />
        </div>
      </div>

      {/* Right: Notifications, User Profile & Hamburger */}
      <div className='flex items-center gap-2 sm:gap-2.5 shrink-0'>
        {/* Notification Bell */}
        <div className='relative'>
          <button
            type='button'
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileMenuOpen(false);
            }}
            className='relative p-1.5 rounded-lg text-gray-600 hover:text-[#714B67] hover:bg-[#FAF8F5] border border-gray-200/80 transition-colors cursor-pointer focus:outline-none focus:ring-1.5 focus:ring-[#714B67]'
            aria-label='View notifications (2 unread)'
            aria-expanded={notificationsOpen}
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
                d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
              />
            </svg>
            <span className='absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 ring-1 ring-white' />
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div
              className='absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-gray-200 shadow-xl py-2.5 z-50 animate-fadeIn'
              role='dialog'
              aria-label='Notifications list'
            >
              <div className='px-3.5 pb-2 border-b border-gray-100 flex items-center justify-between'>
                <span className='text-xs font-bold text-[#1E293B] uppercase tracking-wider'>
                  Alerts & Activity
                </span>
                <span className='text-[10px] font-bold bg-purple-50 text-[#714B67] px-1.5 py-0.2 rounded'>
                  2 New
                </span>
              </div>
              <div className='divide-y divide-gray-50 max-h-60 overflow-y-auto'>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 hover:bg-[#FAF8F5] transition-colors cursor-pointer ${
                      n.unread ? 'bg-purple-50/20' : ''
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <span className='text-xs font-bold text-[#1E293B]'>
                        {n.title}
                      </span>
                      <span className='text-[9px] text-gray-400'>{n.time}</span>
                    </div>
                    <p className='text-[11px] text-gray-500 mt-0.5 leading-snug'>
                      {n.desc}
                    </p>
                  </div>
                ))}
              </div>
              <div className='pt-2 px-3 border-t border-gray-100 text-center'>
                <button
                  type='button'
                  onClick={() => setNotificationsOpen(false)}
                  className='text-[10px] font-bold text-[#714B67] hover:underline cursor-pointer'
                >
                  Close Alerts
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className='relative'>
          <button
            type='button'
            onClick={() => {
              setProfileMenuOpen(!profileMenuOpen);
              setNotificationsOpen(false);
            }}
            className='flex items-center gap-2 p-1 rounded-lg hover:bg-[#FAF8F5] transition-colors cursor-pointer border border-transparent hover:border-gray-200'
            aria-expanded={profileMenuOpen}
            aria-label={`User menu for ${user?.firstName || 'User'}`}
          >
            <div className='w-7 h-7 rounded-lg bg-[#714B67] text-white font-bold text-[11px] flex items-center justify-center shadow-2xs'>
              {user?.avatarInitials || 'PP'}
            </div>
            <div className='hidden sm:flex flex-col text-left leading-tight'>
              <span className='text-xs font-bold text-[#1E293B] truncate max-w-[90px]'>
                {user?.firstName || 'User'}
              </span>
              <span className='text-[9px] text-gray-400 truncate max-w-[90px]'>
                {portalName}
              </span>
            </div>
            <svg
              className='w-3 h-3 text-gray-400 hidden sm:block'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              strokeWidth='2'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </button>

          {/* User Popover */}
          {profileMenuOpen && (
            <div
              className='absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-200 shadow-xl py-1.5 z-50 animate-fadeIn'
              role='menu'
            >
              <div className='px-3.5 py-1.5 border-b border-gray-100'>
                <p className='text-xs font-bold text-[#1E293B] truncate'>
                  {user?.fullName}
                </p>
                <p className='text-[10px] text-gray-400 truncate'>
                  {user?.email}
                </p>
              </div>
              <div className='py-1 text-xs'>
                <Link
                  to='/'
                  onClick={() => setProfileMenuOpen(false)}
                  className='flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-[#FAF8F5] hover:text-[#714B67]'
                  role='menuitem'
                >
                  <span>🏠</span> PeoplePay Home
                </Link>
                <button
                  type='button'
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onToggleDrawer();
                  }}
                  className='w-full text-left flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-[#FAF8F5] hover:text-[#714B67]'
                  role='menuitem'
                >
                  <span>☰</span> Open Navigation
                </button>
              </div>
              <div className='border-t border-gray-100 pt-1'>
                <button
                  type='button'
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate(`/login/${roleSlug}`);
                  }}
                  className='w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer'
                  role='menuitem'
                >
                  <span>🚪</span> Log Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Accessible Hamburger Menu Button (Far Right) */}
        <button
          type='button'
          onClick={onToggleDrawer}
          className='p-1.5 rounded-lg text-gray-600 hover:text-[#714B67] hover:bg-[#FAF8F5] border border-gray-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#714B67]'
          aria-expanded={isDrawerOpen}
          aria-label='Toggle navigation menu'
          aria-controls='sidebar-drawer'
        >
          <svg
            className='w-4.5 h-4.5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M4 6h16M4 12h16M4 18h16'
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
