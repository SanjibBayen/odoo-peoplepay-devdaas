import React from 'react';

export default function ValueStrip() {
  const items = [
    {
      label: 'Employee Management',
      icon: (
        <svg
          className='w-6 h-6'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
          />
        </svg>
      ),
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      label: 'Contract Management',
      icon: (
        <svg
          className='w-6 h-6'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
          />
        </svg>
      ),
      color: 'bg-purple-50 text-[#714B67] border-purple-200',
    },
    {
      label: 'Attendance Tracking',
      icon: (
        <svg
          className='w-6 h-6'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
          <circle cx='12' cy='15' r='2' fill='currentColor' />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      label: 'Time Off Management',
      icon: (
        <svg
          className='w-6 h-6'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M12 3v18m0-18c-3 3-7 4-7 9 0 4 3 6 7 6m0-15c3 3 7 4 7 9 0 4-3 6-7 6'
          />
          <path strokeLinecap='round' strokeLinejoin='round' d='M5 12h14' />
        </svg>
      ),
      color: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      label: 'Salary Structures',
      icon: (
        <svg
          className='w-6 h-6'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      ),
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      label: 'Payroll & Payslips',
      icon: (
        <svg
          className='w-6 h-6'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
          />
        </svg>
      ),
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  return (
    <section
      className='py-8 bg-white/70 backdrop-blur-xs border-y border-[#EAE6DF] relative overflow-hidden'
      aria-label='Core Capabilities'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col lg:flex-row items-center justify-between gap-6'>
          {/* 6 Visual Feature Icons */}
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-2 flex-1 divide-y sm:divide-y-0 lg:divide-x divide-gray-200/60'>
            {items.map((item, idx) => (
              <div
                key={idx}
                className='flex flex-col items-center text-center p-3 sm:px-4 group cursor-default transition-transform hover:-translate-y-0.5'
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-2.5 transition-transform group-hover:scale-110 shadow-2xs ${item.color}`}
                >
                  {item.icon}
                </div>
                <span className='text-xs sm:text-sm font-bold text-[#1E293B] group-hover:text-[#714B67] transition-colors leading-snug'>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Right Handwritten Note with Curved Arrow */}
          <div className='hidden xl:flex items-center gap-2 pl-4 border-l border-gray-200/60 select-none'>
            <svg
              className='w-7 h-7 text-[#714B67] -rotate-12'
              viewBox='0 0 30 30'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.2'
              strokeLinecap='round'
            >
              <path d='M22 15 C 16 12, 10 16, 6 22' />
              <path d='M12 22 L 6 22 L 6 16' />
            </svg>
            <span className='font-handwriting text-xl font-bold text-[#714B67] whitespace-nowrap'>
              Everything your
              <br />
              HR team needs
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
