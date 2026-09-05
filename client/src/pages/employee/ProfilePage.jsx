import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmployeeDetails from '../../components/employee/EmployeeDetails.jsx';
import ChangePasswordModal from '../../components/auth/ChangePasswordModal.jsx';
import { getEmployees } from '../../data/employeeStore.js';

export default function ProfilePage() {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const employees = getEmployees();
  const currentEmployee = employees[0] || {
    id: 'emp-1',
    employeeId: 'EMP-2024-001',
    name: 'Ayush Sharma',
    email: 'ayush.sharma@peoplepay.internal',
    phone: '+91 98450 12345',
    dateOfBirth: '1996-08-14',
    joiningDate: '2024-03-15',
    department: 'Engineering',
    jobPosition: 'Senior Full Stack Engineer',
    status: 'Active',
    contractStatus: 'Permanent',
    workLocation: 'HQ Campus • Floor 3',
    manager: 'Sarah Jenkins',
    emergencyContact: '+91 98450 99999 (Father)',
    address: '42 Orchid Residency, Indiranagar, Bengaluru, Karnataka 560038',
    avatar: 'AS',
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        title='My Profile'
        subtitle='Self-service personal identity, contact credentials, and employment details.'
        actions={
          <button
            type='button'
            onClick={() => setChangePasswordOpen(true)}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] shadow-xs transition-colors cursor-pointer'
          >
            <svg
              className='w-3.5 h-3.5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              strokeWidth='2'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z'
              />
            </svg>
            <span>Change Password</span>
          </button>
        }
      />

      <EmployeeDetails
        employee={currentEmployee}
        onBack={() => window.history.back()}
        onEdit={() =>
          alert('Contact HR Manager to update official personnel records.')
        }
      />

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  );
}
