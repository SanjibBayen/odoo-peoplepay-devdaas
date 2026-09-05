import React from 'react';
import LoginForm from '../../components/auth/LoginForm.jsx';
import { ROLES } from '../../constants/roles.js';

export default function HRPayrollManagerLoginPage() {
  const role = ROLES.HR_PAYROLL_MANAGER;

  return (
    <div className='min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden'>
      {/* Subtle pastel background decorative shapes */}
      <div
        className='absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-100/50 blur-3xl pointer-events-none'
        aria-hidden='true'
      />
      <div
        className='absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-100/30 blur-3xl pointer-events-none'
        aria-hidden='true'
      />

      <LoginForm role={role} />
    </div>
  );
}
