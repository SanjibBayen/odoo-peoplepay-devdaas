import React, { useState } from 'react';
import EmployeeContractsTab from './EmployeeContractsTab.jsx';
import EmployeeAttendanceTab from './EmployeeAttendanceTab.jsx';
import EmployeeTimeOffTab from './EmployeeTimeOffTab.jsx';
import EmployeeLeaveBalanceTab from './EmployeeLeaveBalanceTab.jsx';

export default function EmployeeTabs({ employee, overviewContent }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview & Info', icon: '👤' },
    { id: 'contracts', label: 'Contracts', icon: '📄' },
    { id: 'attendance', label: 'Attendance Logs', icon: '⏱️' },
    { id: 'time-off', label: 'Time Off Requests', icon: '🏖️' },
    { id: 'balances', label: 'Leave Balances', icon: '📊' },
  ];

  return (
    <div className='space-y-4'>
      {/* Tab Navigation Strip */}
      <div className='flex items-center gap-1.5 border-b border-[#EAE6DF] pb-2 overflow-x-auto'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type='button'
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-[#714B67] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white bg-transparent'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content Display */}
      <div>
        {activeTab === 'overview' && overviewContent}
        {activeTab === 'contracts' && <EmployeeContractsTab employeeId={employee.id} />}
        {activeTab === 'attendance' && <EmployeeAttendanceTab employeeId={employee.id} />}
        {activeTab === 'time-off' && <EmployeeTimeOffTab employeeId={employee.id} />}
        {activeTab === 'balances' && <EmployeeLeaveBalanceTab employeeId={employee.id} />}
      </div>
    </div>
  );
}
