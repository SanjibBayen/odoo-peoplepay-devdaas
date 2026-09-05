import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'People',
      desc: 'Onboard talent & define contracts.',
      icon: (
        <svg
          className='w-5 h-5'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'
          />
          <circle cx='12' cy='7' r='4' />
        </svg>
      ),
      color: 'bg-rose-100 text-rose-700',
    },
    {
      num: '02',
      title: 'Operations',
      desc: 'Log attendance & track leaves.',
      icon: (
        <svg
          className='w-5 h-5'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <circle cx='12' cy='12' r='9' />
          <path strokeLinecap='round' strokeLinejoin='round' d='M12 7v5l3 3' />
        </svg>
      ),
      color: 'bg-emerald-100 text-emerald-700',
    },
    {
      num: '03',
      title: 'Payroll',
      desc: 'Auto-compute salary rules & hours.',
      icon: (
        <svg
          className='w-5 h-5'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <rect x='2' y='5' width='20' height='14' rx='2' />
          <line x1='2' y1='10' x2='22' y2='10' />
        </svg>
      ),
      color: 'bg-blue-100 text-blue-700',
    },
    {
      num: '04',
      title: 'Payslip',
      desc: 'Deliver itemized digital slips.',
      icon: (
        <svg
          className='w-5 h-5'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      ),
      color: 'bg-purple-100 text-[#714B67]',
    },
  ];

  return (
    <section
      id='how-it-works'
      className='py-16 bg-[#FAF8F5] relative overflow-hidden'
      aria-labelledby='journey-heading'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Soft Mint Journey Container */}
        <div className='rounded-3xl bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-emerald-100/40 border border-emerald-200/70 p-6 sm:p-10 lg:p-12 shadow-sm relative overflow-hidden'>
          {/* Decorative Background Glow */}
          <div className='absolute top-0 right-0 w-80 h-80 bg-teal-200/20 rounded-full blur-2xl pointer-events-none' />

          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10'>
            {/* Left Side: Illustrated Signpost & Landscape Graphic */}
            <div className='lg:col-span-5 flex flex-col items-center'>
              <div className='relative w-full max-w-sm rounded-2xl bg-white/70 backdrop-blur-xs p-4 border border-emerald-200/60 shadow-xs overflow-hidden'>
                <svg
                  viewBox='0 0 320 200'
                  fill='none'
                  className='w-full h-auto'
                >
                  {/* Sky & Sun */}
                  <rect width='320' height='200' rx='12' fill='#F0FDFA' />
                  <circle cx='260' cy='40' r='14' fill='#FDE047' />
                  <path
                    d='M260 20v4M260 56v4M240 40h4M276 40h4M246 26l3 3M271 51l3 3M246 54l3-3M271 29l3-3'
                    stroke='#FBBF24'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                  />

                  {/* Distant Rolling Hills */}
                  <path
                    d='M0 160 Q80 120 180 140 T320 130 L320 200 L0 200 Z'
                    fill='#D1FAE5'
                  />
                  <path
                    d='M0 175 Q120 140 220 165 T320 155 L320 200 L0 200 Z'
                    fill='#A7F3D0'
                  />

                  {/* Skyline / Buildings in distance */}
                  <rect
                    x='175'
                    y='115'
                    width='14'
                    height='25'
                    fill='#94A3B8'
                    rx='1'
                  />
                  <rect
                    x='193'
                    y='105'
                    width='18'
                    height='35'
                    fill='#64748B'
                    rx='1'
                  />
                  <rect
                    x='215'
                    y='118'
                    width='12'
                    height='22'
                    fill='#94A3B8'
                    rx='1'
                  />

                  {/* Winding Road to city */}
                  <path
                    d='M70 200 C80 175, 170 170, 200 140'
                    stroke='#FDE68A'
                    strokeWidth='16'
                    fill='none'
                    strokeLinecap='round'
                  />
                  <path
                    d='M70 200 C80 175, 170 170, 200 140'
                    stroke='#CBD5E1'
                    strokeWidth='1'
                    strokeDasharray='3 3'
                    fill='none'
                  />

                  {/* Trees */}
                  <circle cx='140' cy='155' r='10' fill='#059669' />
                  <rect x='138' y='165' width='4' height='10' fill='#78350F' />
                  <circle cx='290' cy='150' r='12' fill='#047857' />
                  <rect x='288' y='162' width='4' height='12' fill='#78350F' />

                  {/* Wooden Signpost on left */}
                  <rect
                    x='52'
                    y='55'
                    width='8'
                    height='135'
                    fill='#92400E'
                    rx='2'
                  />

                  {/* Sign 1: PEOPLE (Peach) */}
                  <path
                    d='M22 60 L78 60 L86 70 L78 80 L22 80 Z'
                    fill='#FDA4AF'
                    stroke='#E11D48'
                    strokeWidth='1'
                  />
                  <text
                    x='32'
                    y='74'
                    fill='#881337'
                    fontSize='10'
                    fontWeight='bold'
                    fontFamily='sans-serif'
                  >
                    PEOPLE
                  </text>

                  {/* Sign 2: PROCESS (Teal) */}
                  <path
                    d='M22 86 L78 86 L86 96 L78 106 L22 106 Z'
                    fill='#5EEAD4'
                    stroke='#0D9488'
                    strokeWidth='1'
                  />
                  <text
                    x='28'
                    y='100'
                    fill='#134E4A'
                    fontSize='10'
                    fontWeight='bold'
                    fontFamily='sans-serif'
                  >
                    PROCESS
                  </text>

                  {/* Sign 3: PAYROLL (Sky Blue) */}
                  <path
                    d='M22 112 L78 112 L86 122 L78 132 L22 132 Z'
                    fill='#93C5FD'
                    stroke='#2563EB'
                    strokeWidth='1'
                  />
                  <text
                    x='27'
                    y='126'
                    fill='#1E3A8A'
                    fontSize='10'
                    fontWeight='bold'
                    fontFamily='sans-serif'
                  >
                    PAYROLL
                  </text>

                  {/* Sign 4: GROWTH (Rose) */}
                  <path
                    d='M22 138 L78 138 L86 148 L78 158 L22 158 Z'
                    fill='#FBCFE8'
                    stroke='#DB2777'
                    strokeWidth='1'
                  />
                  <text
                    x='28'
                    y='152'
                    fill='#831843'
                    fontSize='10'
                    fontWeight='bold'
                    fontFamily='sans-serif'
                  >
                    GROWTH
                  </text>
                </svg>
              </div>
            </div>

            {/* Right Side: Step Journey & Workflow */}
            <div className='lg:col-span-7 space-y-6 text-left'>
              <div>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='font-handwriting text-2xl font-bold text-teal-800 marker-yellow px-2 py-0.5'>
                    One connected HR journey
                  </span>
                  <span className='font-handwriting text-xl text-gray-500 hidden sm:inline'>
                    Everything connected →
                  </span>
                </div>

                <h2
                  id='journey-heading'
                  className='text-3xl sm:text-4xl font-extrabold text-[#1E293B] tracking-tight'
                >
                  From Hiring to Payslip
                </h2>
                <p className='mt-2 text-sm sm:text-base text-gray-600 font-normal'>
                  Bring structure, simplicity and transparency to your people
                  operations.
                </p>
              </div>

              {/* 4 Connected Steps */}
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 relative pt-2'>
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className='bg-white/90 backdrop-blur-xs rounded-2xl p-3.5 border border-emerald-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between'
                  >
                    <div>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='font-handwriting text-xl font-bold text-[#714B67]'>
                          {step.num}
                        </span>
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${step.color}`}
                        >
                          {step.icon}
                        </div>
                      </div>
                      <h3 className='text-sm font-bold text-[#1E293B]'>
                        {step.title}
                      </h3>
                      <p className='mt-1 text-[11px] text-gray-500 leading-snug font-normal'>
                        {step.desc}
                      </p>
                    </div>

                    <div className='mt-2 pt-1 border-t border-gray-100 flex items-center text-[10px] font-bold text-teal-700'>
                      <span>Step {step.num}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Action Button */}
              <div className='pt-2 flex items-center gap-4'>
                <button
                  type='button'
                  className='px-7 py-3 text-sm font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2'
                  onClick={() => alert('Start Your Journey')}
                >
                  <span>Start Your Journey</span>
                  <span className='text-base'>→</span>
                </button>

                <span className='font-handwriting text-xl text-teal-900 font-bold hidden sm:inline select-none -rotate-2'>
                  No complicated setup required! ✨
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
