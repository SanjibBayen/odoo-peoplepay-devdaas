import React from 'react';
import LoginForm from '../../components/auth/LoginForm.jsx';
import LoginVisual from '../../components/auth/LoginVisual.jsx';
import { ROLES } from '../../constants/roles.js';

export default function AdminLoginPage() {
  const role = ROLES.ADMIN;

  return (
    <div className='min-h-screen bg-[#FAF8F5] flex flex-col lg:grid lg:grid-cols-12 selection:bg-rose-100 selection:text-rose-900'>
      <div className='lg:col-span-5 xl:col-span-5 h-auto lg:h-screen lg:sticky lg:top-0'>
        <LoginVisual role={role} />
      </div>
      <div className='lg:col-span-7 xl:col-span-7 flex items-center justify-center p-6 sm:p-10 lg:p-16'>
        <LoginForm role={role} />
      </div>
    </div>
  );
}
