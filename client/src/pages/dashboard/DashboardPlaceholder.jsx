import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import RoleBadge from '../../components/auth/RoleBadge.jsx';
import { getRoleBySlug, ROLES } from '../../constants/roles.js';

/**
 * Temporary dashboard placeholder for role-specific routes.
 *
 * @param {Object} props
 * @param {string} [props.roleSlug] - Direct role slug override
 */
export default function DashboardPlaceholder({ roleSlug }) {
  const params = useParams();
  const navigate = useNavigate();

  const slug = roleSlug || params.roleSlug || 'employee';
  const role = getRoleBySlug(slug) || ROLES.EMPLOYEE;

  return (
    <div className='min-h-screen bg-[#FAF8F5] text-[#1E293B] flex flex-col justify-between'>
      {/* Top Navbar */}
      <header className='border-b border-[#EAE6DF] bg-white/80 backdrop-blur-md px-6 py-4'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <Link to='/' className='flex items-center gap-3 group'>
            <div className='w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center p-1 shadow-2xs'>
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
            <span className='text-xl font-black tracking-tight text-[#1E293B]'>
              PeoplePay
            </span>
          </Link>

          <div className='flex items-center gap-4'>
            <RoleBadge role={role} />
            <button
              type='button'
              onClick={() => navigate('/')}
              className='text-xs font-bold text-gray-600 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-rose-200 bg-white hover:bg-rose-50 transition-colors cursor-pointer'
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className='flex-1 flex items-center justify-center p-6'>
        <div className='max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#EAE6DF] shadow-lg text-center space-y-6'>
          {/* Role Icon Circle */}
          <div className='w-20 h-20 mx-auto rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-center text-[#714B67] shadow-inner select-none'>
            <svg className='w-10 h-10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.75'>
              <rect width='7' height='9' x='3' y='3' rx='1' />
              <rect width='7' height='5' x='14' y='3' rx='1' />
              <rect width='7' height='9' x='14' y='12' rx='1' />
              <rect width='7' height='5' x='3' y='16' rx='1' />
            </svg>
          </div>

          <div>
            <RoleBadge role={role} className='mb-3' />
            <h1 className='text-2xl sm:text-3xl font-black text-[#1E293B] tracking-tight'>
              {role.name} Dashboard
            </h1>
            <div className='mt-2 inline-block'>
              <span className='font-handwriting text-xl text-[#714B67] marker-yellow px-2 py-0.5 font-bold'>
                Coming Next
              </span>
            </div>
          </div>

          <div className='p-4 rounded-2xl bg-[#FAF8F5] border border-gray-200/80 text-xs text-gray-600 leading-relaxed text-left space-y-2'>
            <p className='font-bold text-[#1E293B] flex items-center gap-1.5'>
              <span>ℹ️</span> Authentication UI Test Successful
            </p>
            <p>
              You have authenticated as <strong>{role.name}</strong> and reached
              the frontend route:{' '}
              <code className='px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[11px] text-[#714B67]'>
                {role.dashboardRoute}
              </code>
            </p>
            <p className='text-gray-500'>
              The complete {role.name} workspace dashboard will be implemented
              in the next phase.
            </p>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-3 pt-2'>
            <button
              type='button'
              onClick={() => navigate(role.loginRoute)}
              className='w-full sm:w-1/2 py-2.5 px-4 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer'
            >
              Back to Login
            </button>
            <button
              type='button'
              onClick={() => navigate('/')}
              className='w-full sm:w-1/2 py-2.5 px-4 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer'
            >
              Home Page
            </button>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className='py-4 text-center text-xs text-gray-400 border-t border-[#EAE6DF]'>
        PeoplePay • Frontend Authentication Verification
      </footer>
    </div>
  );
}
