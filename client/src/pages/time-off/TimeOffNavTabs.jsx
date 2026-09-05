import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Shared sub-navigation tabs across Time Off modules.
 */
export default function TimeOffNavTabs() {
  const tabs = [
    { to: '/time-off', label: 'Overview', end: true },
    { to: '/time-off/requests', label: 'Leave Requests' },
    { to: '/time-off/allocations', label: 'Allocations & Balances' },
    { to: '/time-off/types', label: 'Leave Types' },
  ];

  return (
    <div className='flex items-center gap-1 border-b border-[#EAE6DF] pb-2 mb-4 overflow-x-auto'>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              isActive
                ? 'bg-[#714B67] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-[#FAF8F5]'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
