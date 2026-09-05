import React, { useState } from 'react';
import EmployeeStatusBadge from './EmployeeStatusBadge.jsx';

/**
 * Detailed employee profile view with organized info cards and related records navigation.
 *
 * @param {Object} props
 * @param {Object} props.employee - Employee object
 * @param {Function} props.onBack - Callback to return to employee list
 * @param {Function} props.onEdit - Callback to edit this employee
 */
export default function EmployeeDetails({ employee, onBack, onEdit }) {
  const [relatedToast, setRelatedToast] = useState(null);

  if (!employee) {
    return (
      <div className='bg-white rounded-3xl border border-[#EAE6DF] p-10 text-center space-y-3 shadow-2xs'>
        <p className='text-sm text-gray-500'>Employee profile not found.</p>
        <button
          type='button'
          onClick={onBack}
          className='px-4 py-2 text-xs font-bold text-[#714B67] bg-purple-50 rounded-xl cursor-pointer'
        >
          ← Back to Employees
        </button>
      </div>
    );
  }

  const handleRelatedClick = (moduleName) => {
    setRelatedToast(
      `Navigating to ${moduleName} for ${employee.name}... (Records linked)`
    );
    setTimeout(() => {
      setRelatedToast(null);
    }, 3000);
  };

  const relatedModules = [
    { id: 'contracts', label: 'Contracts', icon: '📄', count: '1 Active' },
    { id: 'attendance', label: 'Attendance', icon: '⏰', count: '98.5% Rate' },
    { id: 'time-off', label: 'Time Off', icon: '📅', count: '12 Days Avail' },
    { id: 'payslips', label: 'Payslips', icon: '💰', count: 'Apr 2026 Disbursed' },
  ];

  return (
    <div className='space-y-5'>
      {/* Top Breadcrumb / Back Action */}
      <div className='flex items-center justify-between'>
        <button
          type='button'
          onClick={onBack}
          className='inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#714B67] px-3 py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-all cursor-pointer'
        >
          <span>←</span>
          <span>Back to Employees</span>
        </button>

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
              <span>✏️</span>
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
                onClick={() => handleRelatedClick(mod.label)}
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

      {/* 3 Compact Information Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
        {/* Card 1: Personal Information */}
        <div className='bg-white rounded-3xl p-5 border border-[#EAE6DF] shadow-xs space-y-3.5'>
          <div className='flex items-center gap-2 pb-2 border-b border-gray-100'>
            <span className='text-sm'>👤</span>
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
            <span className='text-sm'>💼</span>
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
            <span className='text-sm'>📞</span>
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

      {/* Linked Records Toast Notification */}
      {relatedToast && (
        <div className='fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-fadeIn'>
          <span>ℹ️</span>
          <span>{relatedToast}</span>
        </div>
      )}
    </div>
  );
}
