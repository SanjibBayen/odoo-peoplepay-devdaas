import React from 'react';

export default function FeaturesSection() {
  const cards = [
    {
      title: 'Smart People Directory',
      tag: 'People Ops',
      tagColor: 'bg-emerald-100 text-emerald-800',
      description:
        'Unified employee records, role histories, and organizational charts.',
      badge: 'Live Profiles',
      icon: (
        <svg
          className='w-6 h-6'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <circle cx='12' cy='7' r='4' />
          <path d='M5.5 21a8.5 8.5 0 0 1 13 0' />
        </svg>
      ),
      bg: 'bg-emerald-50/40 border-emerald-100',
    },
    {
      title: 'Digital Contracts',
      tag: 'Agreements',
      tagColor: 'bg-purple-100 text-[#714B67]',
      description:
        'Manage employment terms, working hours, and wage agreements.',
      badge: 'Versioned',
      icon: (
        <svg
          className='w-6 h-6'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
          <path d='M14 2v6h6M16 13H8M16 17H8M10 9H8' />
        </svg>
      ),
      bg: 'bg-purple-50/40 border-purple-100',
    },
    {
      title: 'Real-Time Attendance',
      tag: 'Time Tracking',
      tagColor: 'bg-blue-100 text-blue-800',
      description: 'Daily check-in logs and automated work hour calculation.',
      badge: 'Auto-Sync',
      icon: (
        <svg
          className='w-6 h-6'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <circle cx='12' cy='12' r='9' />
          <path d='M12 7v5l3 3' />
        </svg>
      ),
      bg: 'bg-blue-50/40 border-blue-100',
    },
    {
      title: 'Leave & Time Off',
      tag: 'Approvals',
      tagColor: 'bg-teal-100 text-teal-800',
      description:
        'Quick vacation requests, manager approvals, and balance tracking.',
      badge: 'Self-Service',
      icon: (
        <svg
          className='w-6 h-6'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path d='M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' />
        </svg>
      ),
      bg: 'bg-teal-50/40 border-teal-100',
    },
    {
      title: 'Transparent Salary Rules',
      tag: 'Compensation',
      tagColor: 'bg-amber-100 text-amber-800',
      description:
        'Configurable base pay, structured allowances, and company deductions.',
      badge: 'Clear Breakdown',
      icon: (
        <svg
          className='w-6 h-6'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <rect x='2' y='5' width='20' height='14' rx='2' />
          <line x1='2' y1='10' x2='22' y2='10' />
        </svg>
      ),
      bg: 'bg-amber-50/40 border-amber-100',
    },
    {
      title: 'Automated Payroll & Slips',
      tag: 'Disbursement',
      tagColor: 'bg-purple-100 text-purple-800',
      description:
        'One-click payrun computations with instant digital payslips.',
      badge: 'Zero Errors',
      icon: (
        <svg
          className='w-6 h-6'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path d='M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
        </svg>
      ),
      bg: 'bg-purple-50/40 border-purple-100',
    },
  ];

  return (
    <section
      id='features'
      className='py-20 bg-[#FAF8F5] relative overflow-hidden'
      aria-labelledby='features-title'
    >
      {/* Decorative Pastel Blur Blob */}
      <div className='absolute top-1/2 right-0 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl -z-10' />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header with Handwritten Label */}
        <div className='text-center max-w-2xl mx-auto mb-14'>
          <div className='inline-block -rotate-1 mb-2'>
            <span className='font-handwriting text-2xl font-bold text-[#714B67] marker-mint px-2 py-0.5'>
              Designed for simplicity &amp; speed
            </span>
          </div>
          <h2
            id='features-title'
            className='text-3xl sm:text-4xl font-extrabold text-[#1E293B] tracking-tight'
          >
            Everything Connected. Nothing Siloed.
          </h2>
          <p className='mt-3 text-base text-gray-600 font-normal'>
            Modular workforce tools that work together without complex
            configurations.
          </p>
        </div>

        {/* 6 Pastel Modern Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 border ${card.bg} shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group hover:-translate-y-1`}
            >
              <div>
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-11 h-11 rounded-xl bg-white flex items-center justify-center text-[#1E293B] shadow-2xs border border-gray-100 group-hover:scale-105 transition-transform'>
                    {card.icon}
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${card.tagColor}`}
                  >
                    {card.tag}
                  </span>
                </div>

                <h3 className='text-lg font-bold text-[#1E293B] group-hover:text-[#714B67] transition-colors'>
                  {card.title}
                </h3>

                <p className='mt-2 text-sm text-gray-600 leading-relaxed font-normal'>
                  {card.description}
                </p>
              </div>

              <div className='mt-5 pt-3 border-t border-gray-200/50 flex items-center justify-between text-xs text-gray-500'>
                
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
