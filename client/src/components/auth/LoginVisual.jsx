import React from 'react';
import { Link } from 'react-router-dom';
import RoleBadge from './RoleBadge.jsx';

/**
 * Brand visual panel for the login experience.
 *
 * @param {Object} props
 * @param {Object} props.role - Role configuration object
 */
export default function LoginVisual({ role }) {
  if (!role) return null;

  return (
    <div className='relative w-full h-full flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-[#F5F0E8] via-[#FAF8F5] to-[#EFE7DC] border-b lg:border-b-0 lg:border-r border-[#EAE6DF] overflow-hidden'>
      <div
        className='absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-200/20 blur-3xl pointer-events-none'
        aria-hidden='true'
      />
      <div
        className='absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-amber-200/20 blur-3xl pointer-events-none'
        aria-hidden='true'
      />

      {/* Top: Logo & Role Pill */}
      <div className='relative z-10'>
        <div className='flex items-center justify-between gap-4 flex-wrap'>
          <Link
            to='/'
            className='inline-flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#714B67] rounded-xl p-1 -m-1'
            aria-label='PeoplePay home'
          >
            {/* Friendly People Logo Icon matching landing navbar */}
            <div className='w-11 h-11 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center p-1.5 shadow-xs transition-transform group-hover:scale-105'>
              <svg
                viewBox='0 0 40 40'
                fill='none'
                className='w-full h-full'
                aria-hidden='true'
              >
                {/* Person 1 - Left (Teal) */}
                <circle cx='13' cy='17' r='5' fill='#34D399' />
                <path
                  d='M6 31c0-4 3.5-7 7-7s7 3 7 7'
                  fill='#34D399'
                  opacity='0.85'
                />
                {/* Person 2 - Center (Purple) */}
                <circle cx='20' cy='13' r='6' fill='#714B67' />
                <path d='M12 29c0-4.5 4-8 8-8s8 3.5 8 8' fill='#714B67' />
                {/* Person 3 - Right (Coral/Orange) */}
                <circle cx='27' cy='17' r='5' fill='#FB923C' />
                <path
                  d='M20 31c0-4 3.5-7 7-7s7 3 7 7'
                  fill='#FB923C'
                  opacity='0.85'
                />
              </svg>
            </div>
            <div className='flex flex-col'>
              <span className='text-2xl font-extrabold tracking-tight text-[#1E293B]'>
                PeoplePay
              </span>
              <span className='text-[10px] font-semibold text-gray-500 uppercase tracking-wider'>
                Unified HR & Payroll
              </span>
            </div>
          </Link>

          <RoleBadge role={role} />
        </div>
      </div>

      {/* Middle: Role Pitch & Interactive Abstract Visual Card */}
      <div className='my-8 lg:my-auto relative z-10 space-y-6'>
        {/* Role Headline */}
        <div>
          <div className='inline-flex items-center gap-2 mb-2'>
            <span className='text-xs font-bold uppercase tracking-widest text-[#714B67]'>
              Dedicated Environment
            </span>
          </div>
          <h1 className='text-3xl sm:text-4xl font-black text-[#1E293B] tracking-tight leading-tight'>
            Designed for{' '}
            <span className='relative inline-block'>
              <span className='relative z-10'>{role.name}</span>
              <span
                className='absolute left-0 bottom-1 w-full h-3 bg-amber-200/60 -rotate-1 -z-0 rounded-xs'
                aria-hidden='true'
              />
            </span>
          </h1>
          <p className='mt-3 text-sm sm:text-base text-gray-600 leading-relaxed max-w-md'>
            {role.tagline}
          </p>
        </div>

        {/* Abstract Role Visual Card Preview */}
        <div className='hidden sm:block bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-[#EAE6DF] shadow-md transition-transform hover:-translate-y-0.5 duration-300'>
          <div className='flex items-center justify-between border-b border-gray-100 pb-3 mb-4'>
            <div className='flex items-center gap-2.5'>
              <div className='w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg select-none'>
                {role.icon}
              </div>
              <div>
                <p className='text-xs font-bold text-[#1E293B]'>
                  {role.roleIndicator}
                </p>
                <p className='text-[11px] text-gray-400'>
                  Status: Ready & Secured
                </p>
              </div>
            </div>
            <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'>
              ● Active
            </span>
          </div>

          {/* Quick Metrics / Preview Pills */}
          <div className='grid grid-cols-2 gap-3'>
            {role.stats.map((stat, idx) => (
              <div
                key={idx}
                className='p-3 rounded-xl bg-[#FAF8F5] border border-gray-100'
              >
                <span className='text-[11px] font-medium text-gray-500 block mb-1'>
                  {stat.label}
                </span>
                <span className='text-sm font-bold text-[#1E293B]'>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Micro Guarantee footer in card */}
          <div className='mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500'>
            <span>Protected with Role-Based Access Control</span>
            <span className='text-[#714B67] font-semibold'>Enterprise</span>
          </div>
        </div>

        {/* Handwritten Annotation with Playful Doodle */}
        <div className='flex items-center gap-3 pt-2 select-none'>
          {/* Subtle curved hand-drawn arrow */}
          <svg
            className='w-7 h-7 text-[#714B67] -rotate-12 shrink-0'
            viewBox='0 0 40 40'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
          >
            <path d='M8 28c8-14 18-18 24-8' />
            <path d='M26 18l6 2-2 6' />
          </svg>
          <span className='font-handwriting text-xl text-[#714B67] font-semibold tracking-wide'>
            {role.handwrittenNote}
          </span>
        </div>
      </div>

      {/* Bottom: Helpful Brand Assurance / Back Link */}
      <div className='relative z-10 pt-4 border-t border-gray-200/60 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2'>
        <span>© 2026 PeoplePay System</span>
        <Link
          to='/'
          className='text-[#714B67] hover:underline font-semibold flex items-center gap-1'
        >
          <span>←</span> Back to PeoplePay
        </Link>
      </div>
    </div>
  );
}
