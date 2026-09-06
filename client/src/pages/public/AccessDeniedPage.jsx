import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentRole } from '../../redux/selectors/authSelectors.js';

export default function AccessDeniedPage() {
  const currentRole = useSelector(selectCurrentRole) || 'employee';
  const roleSlug = currentRole.toLowerCase().replace(/_/g, '-');
  const dashboardTarget = `/dashboard/${roleSlug}`;

  return (
    <div className='min-h-screen bg-[#FAF8F5] text-[#1E293B] flex flex-col items-center justify-center p-6 text-center'>
      <div className='max-w-md w-full bg-white rounded-3xl border border-[#EAE6DF] p-8 sm:p-10 shadow-sm space-y-6'>
        <div className='w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 text-2xl shadow-inner'>
          🔒
        </div>

        <div className='space-y-2'>
          <h1 className='text-2xl font-black text-[#1E293B] tracking-tight'>
            Access Denied
          </h1>
          <p className='text-xs text-gray-500 leading-relaxed'>
            You don't have permission to view this module. Please contact your system administrator if you believe this is in error.
          </p>
        </div>

        <div className='pt-2'>
          <Link
            to={dashboardTarget}
            className='inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] shadow-xs transition-colors cursor-pointer'
          >
            Go to Dashboard
          </Link>
        </div>
      </div>

      <p className='mt-6 text-[11px] text-gray-400'>
        © 2026 PeoplePay • HR & Payroll Management System
      </p>
    </div>
  );
}
