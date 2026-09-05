import React from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeStatusBadge from './EmployeeStatusBadge.jsx';
import EmployeeTabs from './EmployeeTabs.jsx';
import BackButton from '../common/BackButton.jsx';

/**
 * Detailed employee profile view with organized info cards and related records navigation.
 *
 * @param {Object} props
 * @param {Object} props.employee - Employee object
 * @param {Function} props.onBack - Callback to return to employee list
 * @param {Function} props.onEdit - Callback to edit this employee
 */
export default function EmployeeDetails({ employee, onBack, onEdit }) {
  const navigate = useNavigate();

  if (!employee) {
    return (
      <div className='bg-white rounded-3xl border border-[#EAE6DF] p-10 text-center space-y-3 shadow-2xs'>
        <p className='text-sm text-gray-500'>Employee profile not found.</p>
        <BackButton label='Back to Employees' fallback='/employees' onClick={onBack} />
      </div>
    );
  }

  const handleRelatedClick = (routeId) => {
    navigate(`/${routeId}`);
  };

  const relatedModules = [
    {
      id: 'contracts',
      label: 'Contracts',
      count: '1 Active',
      icon: (
        <svg className='w-4 h-4 text-[#714B67]' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
          <path strokeLinecap='round' strokeLinejoin='round' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
        </svg>
      ),
    },
    {
      id: 'attendance',
      label: 'Attendance',
      count: '98.5% Rate',
      icon: (
        <svg className='w-4 h-4 text-emerald-600' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
          <path strokeLinecap='round' strokeLinejoin='round' d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
        </svg>
      ),
    },
    {
      id: 'time-off',
      label: 'Time Off',
      count: '12 Days Avail',
      icon: (
        <svg className='w-4 h-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
          <path strokeLinecap='round' strokeLinejoin='round' d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
        </svg>
      ),
    },
    {
      id: 'payslips',
      label: 'Payslips',
      count: 'Apr 2026 Disbursed',
      icon: (
        <svg className='w-4 h-4 text-amber-600' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
          <path strokeLinecap='round' strokeLinejoin='round' d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' />
        </svg>
      ),
    },
  ];

  return (
    <div className='space-y-5'>
      {/* Top Breadcrumb / Back Action */}
      <div className='flex items-center justify-between'>
        <BackButton label='Back to Employees' fallback='/employees' onClick={onBack} />

        <span className='text-[11px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-200'>
          ID: {employee.employeeId}
        </span>
      </div>

      {/* Main Header Profile Card */}
      <div className='bg-white rounded-3xl p-5 sm:p-7 border border-[#EAE6DF] shadow-xs relative overflow-hidden'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-5'>
          {/* Avatar & Key Profile Identity */}
          <div className='flex items-center gap-4'>
            <div className='w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200 text-[#714B67] font-black text-2xl flex items-center justify-center shadow-inner shrink-0 select-none'>
              {employee.avatar || employee.firstName?.charAt(0) || 'E'}
            </div>
            <div className='space-y-1'>
              <div className='flex items-center gap-2.5 flex-wrap'>
                <h1 className='text-xl sm:text-2xl font-black text-[#1E293B] tracking-tight'>
                  {employee.name}
                </h1>
                <EmployeeStatusBadge status={employee.status} />
              </div>
              <p className='text-xs sm:text-sm font-semibold text-gray-600'>
                {employee.jobPosition} •{' '}
                <span className='text-[#714B67]'>{employee.department}</span>
              </p>
              <p className='text-xs text-gray-400 font-mono'>{employee.email}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center gap-2.5 self-start sm:self-center'>
            <button
              type='button'
              onClick={() => onEdit(employee)}
              className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5'
            >
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
              </svg>
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Smart Navigation Strip for Related Records */}
        <div className='mt-6 pt-5 border-t border-gray-100'>
          <p className='text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2.5'>
            Linked Business Records
          </p>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5'>
            {relatedModules.map((mod) => (
              <button
                key={mod.id}
                type='button'
                onClick={() => handleRelatedClick(mod.id)}
                className='p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-purple-50/60 border border-gray-200/70 hover:border-purple-200 transition-all text-left group cursor-pointer'
              >
                <div className='flex items-center justify-between'>
                  <span className='text-base'>{mod.icon}</span>
                  <span className='text-[10px] font-bold text-gray-400 group-hover:text-[#714B67]'>
                    →
                  </span>
                </div>
                <h4 className='text-xs font-bold text-[#1E293B] mt-1 group-hover:text-[#714B67]'>
                  {mod.label}
                </h4>
                <p className='text-[10px] text-gray-500 font-medium truncate'>
                  {mod.count}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-Records & Overview Tabs */}
      <EmployeeTabs
        employee={employee}
        overviewContent={
          <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
            {/* Card 1: Personal Information */}
            <div className='bg-white rounded-3xl p-5 border border-[#EAE6DF] shadow-xs space-y-3.5'>
              <div className='flex items-center gap-2 pb-2 border-b border-gray-100'>
                <svg className='w-4 h-4 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                </svg>
                <h3 className='text-xs font-bold uppercase tracking-wider text-[#1E293B]'>
                  Personal Information
                </h3>
              </div>
              <div className='space-y-2.5 text-xs'>
                <div>
                  <span className='text-[10px] text-gray-400 uppercase font-semibold block'>
                    Full Name
                  </span>
                  <span className='font-bold text-[#1E293B]'>{employee.name}</span>
                </div>
                <div>
                  <span className='text-[10px] text-gray-400 uppercase font-semibold block'>
                    Date of Birth
                  </span>
                  <span className='font-medium text-gray-700'>
                    {employee.dateOfBirth || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className='text-[10px] text-gray-400 uppercase font-semibold block'>
                    Emergency Contact
                  </span>
                  <span className='font-medium text-gray-700'>
                    {employee.emergencyContact || 'None on file'}
                  </span>
                </div>
                <div>
                  <span className='text-[10px] text-gray-400 uppercase font-semibold block'>
                    Residential Address
                  </span>
                  <span className='font-medium text-gray-600 leading-snug block'>
                    {employee.address || 'Company HQ Corporate Housing'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Work Information */}
            <div className='bg-white rounded-3xl p-5 border border-[#EAE6DF] shadow-xs space-y-3.5'>
              <div className='flex items-center gap-2 pb-2 border-b border-gray-100'>
                <svg className='w-4 h-4 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                </svg>
                <h3 className='text-xs font-bold uppercase tracking-wider text-[#1E293B]'>
                  Work Information
                </h3>
              </div>
              <div className='space-y-2.5 text-xs'>
                <div>
                  <span className='text-[10px] text-gray-400 uppercase font-semibold block'>
                    Department
                  </span>
                  <span className='font-bold text-[#1E293B]'>{employee.department}</span>
                </div>
                <div>
                  <span className='text-[10px] text-gray-400 uppercase font-semibold block'>
                    Job Position
                  </span>
                  <span className='font-semibold text-gray-700'>{employee.jobPosition}</span>
                </div>
                <div>
                  <span className='text-[10px] text-gray-400 uppercase font-semibold block'>
                    Date of Joining
                  </span>
                  <span className='font-medium text-gray-700'>{employee.joiningDate}</span>
                </div>
                <div>
                  <span className='text-[10px] text-gray-400 uppercase font-semibold block'>
                    Contract Status
                  </span>
                  <span className='font-bold text-blue-700'>{employee.contractStatus}</span>
                </div>
                <div>
                  <span className='text-[10px] text-gray-400 uppercase font-semibold block'>
                    Reporting Manager
                  </span>
                  <span className='font-medium text-gray-700'>{employee.manager}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Contact Information */}
            <div className='bg-white rounded-3xl p-5 border border-[#EAE6DF] shadow-xs space-y-3.5'>
              <div className='flex items-center gap-2 pb-2 border-b border-gray-100'>
                <svg className='w-4 h-4 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                </svg>
                <h3 className='text-xs font-bold uppercase tracking-wider text-[#1E293B]'>
                  Contact Information
                </h3>
              </div>
              <div className='space-y-2.5 text-xs'>
                <div>
                  <span className='text-[10px] text-gray-400 uppercase font-semibold block'>
                    Work Email
                  </span>
                  <a
                    href={`mailto:${employee.email}`}
                    className='font-bold text-[#714B67] hover:underline'
                  >
                    {employee.email}
                  </a>
                </div>
                <div>
                  <span className='text-[10px] text-gray-400 uppercase font-semibold block'>
                    Phone Number
                  </span>
                  <span className='font-medium text-gray-700'>
                    {employee.phone || '+91 98000 00000'}
                  </span>
                </div>
                <div>
                  <span className='text-[10px] text-gray-400 uppercase font-semibold block'>
                    Work Location
                  </span>
                  <span className='font-medium text-gray-700'>
                    {employee.workLocation || 'HQ Campus • Floor 3'}
                  </span>
                </div>
                <div>
                  <span className='text-[10px] text-gray-400 uppercase font-semibold block'>
                    Internal Communication
                  </span>
                  <span className='font-medium text-emerald-700 flex items-center gap-1'>
                    <span className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                    Available on PeoplePay Chat
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
