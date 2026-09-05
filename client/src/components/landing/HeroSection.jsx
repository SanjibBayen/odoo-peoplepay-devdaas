import React from 'react';

export default function HeroSection({ onOpenWorkspaceModal }) {
  return (
    <section
      id='home'
      className='relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center'>
          {/* LEFT COLUMN: Typography, CTAs & Social Proof */}
          <div className='lg:col-span-5 space-y-6 text-left relative z-10'>
            {/* Handwritten Pre-Heading with Marker Highlight */}
            <div className='inline-block'>
              <span className='font-handwriting text-2xl md:text-3xl text-gray-800 font-bold px-2 py-0.5 marker-yellow rounded-sm select-none'>
                HR. Payroll. People. All together.
              </span>
            </div>

            {/* Main Heading with Playful Doodles */}
            <div className='relative'>
              {/* Doodle Spark on top-left of heading */}
              <svg
                className='absolute -top-6 -left-6 w-8 h-8 text-[#714B67] select-none'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
              >
                <path d='M12 2v4M12 18v4M2 12h4M18 12h4' />
              </svg>

              <h1 className='text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1E293B] tracking-tight leading-[1.12]'>
                Powering People. <br />
                <span className='text-[#714B67] relative inline-block'>
                  Simplifying Payroll.
                  {/* Imperfect hand-drawn underline */}
                  <svg
                    className='absolute -bottom-2.5 left-0 w-full h-3 text-[#714B67]/70'
                    viewBox='0 0 250 12'
                    fill='none'
                    preserveAspectRatio='none'
                  >
                    <path
                      d='M2 9c45-6 125-8 244 1'
                      stroke='currentColor'
                      strokeWidth='3.5'
                      strokeLinecap='round'
                    />
                  </svg>
                </span>
              </h1>
            </div>

            {/* Short Supporting Text */}
            <p className='text-base sm:text-lg text-gray-600 max-w-lg leading-relaxed pt-1'>
              Manage your entire workforce — employees, attendance, contracts,
              time off and payroll from one connected platform.
            </p>

            {/* CTAs with Hand-drawn Annotation */}
            <div className='pt-2 relative'>
              <div className='flex flex-wrap items-center gap-4'>
                <button
                  type='button'
                  className='px-7 py-3.5 text-base font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2'
                  onClick={onOpenWorkspaceModal}
                >
                  <span>Get Started</span>
                  <span className='text-lg'>→</span>
                </button>

                <a
                  href='#features'
                  className='px-7 py-3.5 text-base font-semibold text-[#1E293B] hover:text-[#714B67] bg-white hover:bg-gray-50 border border-[#1E293B]/60 rounded-full transition-all text-center shadow-2xs'
                >
                  Explore Features
                </a>
              </div>

              {/* Hand-drawn Annotation below CTAs: Arrow + Smiley */}
              <div className='hidden sm:flex items-center gap-2 mt-4 ml-2 select-none'>
                <svg
                  className='w-8 h-8 text-[#714B67] -rotate-12'
                  viewBox='0 0 40 40'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2.2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M30 10 C 22 18, 14 26, 8 20' />
                  <path d='M6 25 L 8 19 L 14 21' />
                </svg>
                <span className='font-handwriting text-xl text-gray-700 font-semibold'>
                  Less manual work → More time for people
                </span>
                <span className='text-xl'>😊</span>
              </div>
            </div>

            {/* Social Proof Avatar Row */}
            <div className='pt-4 border-t border-gray-200/80 flex items-center gap-4'>
              <div className='flex -space-x-2.5 overflow-hidden'>
                {/* Avatar 1 */}
                <div className='w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shadow-xs'>
                  👨‍💼
                </div>
                {/* Avatar 2 */}
                <div className='w-10 h-10 rounded-full border-2 border-white bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 shadow-xs'>
                  👩‍💼
                </div>
                {/* Avatar 3 */}
                <div className='w-10 h-10 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 shadow-xs'>
                  🧑‍💻
                </div>
                {/* Avatar 4 */}
                <div className='w-10 h-10 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-700 shadow-xs'>
                  👩‍🔬
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <p className='text-xs font-semibold text-gray-600 leading-snug'>
                  Trusted by HR teams <br />
                  across growing organizations
                </p>
                <span className='text-rose-400 text-lg'>♥</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Modern SaaS Dashboard Mockup + Friendly Employee Illustration + Doodles */}
          <div className='lg:col-span-7 relative'>
            {/* Organic Pastel Background Blob */}
            <div className='absolute inset-0 -m-6 bg-gradient-to-tr from-emerald-100/50 via-teal-50/40 to-purple-100/30 rounded-[48px] filter blur-xl -z-10' />

            {/* Handwritten Top Annotation: One Platform Many Possibilities */}
            <div className='hidden sm:flex items-center gap-2 absolute -top-8 left-12 select-none z-20'>
              <span className='font-handwriting text-2xl font-bold text-teal-800 -rotate-3'>
                One Platform Many Possibilities
              </span>
              <svg
                className='w-7 h-7 text-teal-700 rotate-12'
                viewBox='0 0 30 30'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.2'
                strokeLinecap='round'
              >
                <path d='M8 8 C 15 15, 20 20, 22 26' />
                <path d='M16 26 L 22 26 L 24 20' />
              </svg>
            </div>

            {/* Circled Handwritten Cloud Tag on Top-Right */}
            <div className='hidden md:block absolute -top-6 -right-2 select-none z-20'>
              <div className='relative px-3.5 py-2 border-2 border-dashed border-[#714B67]/60 rounded-full bg-white/90 shadow-2xs rotate-3 text-center'>
                <span className='font-handwriting text-base font-bold text-[#714B67] leading-none block'>
                  People • Data • Payroll • Growth
                </span>
              </div>
            </div>

            {/* MAIN DASHBOARD WINDOW CONTAINER */}
            <div className='relative bg-white rounded-2xl shadow-xl border border-gray-200/90 overflow-hidden z-10'>
              {/* Window Header Bar */}
              <div className='bg-[#FAF8F5] px-4 py-3 border-b border-gray-200 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex items-center gap-1.5'>
                    <div className='w-2.5 h-2.5 rounded-full bg-rose-400' />
                    <div className='w-2.5 h-2.5 rounded-full bg-amber-400' />
                    <div className='w-2.5 h-2.5 rounded-full bg-emerald-400' />
                  </div>
                  <div className='flex items-center gap-1.5 ml-2'>
                    <div className='w-5 h-5 rounded-md bg-[#714B67] flex items-center justify-center text-white text-[10px] font-bold'>
                      P
                    </div>
                    <span className='text-xs font-bold text-[#1E293B]'>
                      PeoplePay
                    </span>
                  </div>
                </div>

                <div className='flex items-center gap-3 text-gray-400'>
                  <div className='hidden sm:flex items-center bg-white px-2.5 py-1 rounded-full border border-gray-200 text-xs text-gray-400 gap-1.5'>
                    <svg
                      className='w-3.5 h-3.5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                      />
                    </svg>
                    <span>Search employees...</span>
                  </div>
                  <div className='w-7 h-7 rounded-full bg-purple-100 text-[#714B67] flex items-center justify-center font-bold text-xs'>
                    S
                  </div>
                </div>
              </div>

              {/* Window Interior: Sidebar + Main Workspace */}
              <div className='grid grid-cols-12 min-h-[360px]'>
                {/* Left Mini-Sidebar */}
                <div className='hidden sm:block sm:col-span-3 bg-gray-50/70 border-r border-gray-100 p-3 space-y-1'>
                  <div className='px-2.5 py-1.5 rounded-lg bg-purple-100/70 text-[#714B67] text-xs font-bold flex items-center gap-2'>
                    <span>📊</span> Dashboard
                  </div>
                  <div className='px-2.5 py-1.5 text-xs text-gray-600 font-medium flex items-center gap-2 hover:bg-gray-100 rounded-lg'>
                    <span>👥</span> Employees
                  </div>
                  <div className='px-2.5 py-1.5 text-xs text-gray-600 font-medium flex items-center gap-2 hover:bg-gray-100 rounded-lg'>
                    <span>⏱️</span> Attendance
                  </div>
                  <div className='px-2.5 py-1.5 text-xs text-gray-600 font-medium flex items-center gap-2 hover:bg-gray-100 rounded-lg'>
                    <span>🌴</span> Time Off
                  </div>
                  <div className='px-2.5 py-1.5 text-xs text-gray-600 font-medium flex items-center gap-2 hover:bg-gray-100 rounded-lg'>
                    <span>💰</span> Payroll
                  </div>
                  <div className='px-2.5 py-1.5 text-xs text-gray-400 font-medium flex items-center gap-2'>
                    <span>📈</span> Reports
                  </div>
                </div>

                {/* Main Content Area */}
                <div className='col-span-12 sm:col-span-9 p-4 sm:p-5 space-y-4'>
                  {/* Greeting Row */}
                  <div>
                    <h2 className='text-base sm:text-lg font-bold text-[#1E293B]'>
                      Good Morning, Sarah! 👋
                    </h2>
                    <p className='text-xs text-gray-500'>
                      Here’s what’s happening in your workforce today.
                    </p>
                  </div>

                  {/* 3 Metric Cards */}
                  <div className='grid grid-cols-3 gap-2.5'>
                    {/* Stat 1 */}
                    <div className='p-2.5 bg-gray-50 rounded-xl border border-gray-100'>
                      <span className='text-[11px] font-medium text-gray-500 block'>
                        Total Employees
                      </span>
                      <span className='text-lg font-extrabold text-[#1E293B] block'>
                        248
                      </span>
                      <span className='text-[10px] font-bold text-emerald-600'>
                        ↑ 1.2% this mo
                      </span>
                    </div>

                    {/* Stat 2 */}
                    <div className='p-2.5 bg-gray-50 rounded-xl border border-gray-100'>
                      <span className='text-[11px] font-medium text-gray-500 block'>
                        Attendance Rate
                      </span>
                      <span className='text-lg font-extrabold text-[#1E293B] block'>
                        96.4%
                      </span>
                      <span className='text-[10px] font-bold text-teal-600'>
                        ↑ 2.1% on-time
                      </span>
                    </div>

                    {/* Stat 3 */}
                    <div className='p-2.5 bg-purple-50/60 rounded-xl border border-purple-100'>
                      <span className='text-[11px] font-medium text-gray-500 block'>
                        Payroll Status
                      </span>
                      <span className='text-lg font-extrabold text-[#714B67] block'>
                        Ready
                      </span>
                      <span className='text-[10px] font-bold text-[#714B67] bg-white px-1.5 py-0.2 rounded border border-purple-200 inline-block'>
                        Apr 2026
                      </span>
                    </div>
                  </div>

                  {/* Attendance Overview Bar Chart */}
                  <div className='p-3 bg-white rounded-xl border border-gray-100 shadow-2xs space-y-2'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='font-bold text-gray-700'>
                        Attendance Overview
                      </span>
                      <span className='text-[11px] text-gray-400'>
                        Weekly Log
                      </span>
                    </div>

                    {/* Bars Grid */}
                    <div className='h-16 flex items-end justify-between gap-2 pt-2 px-2'>
                      {[
                        { day: 'Mon', h: '85%', color: 'bg-teal-300' },
                        { day: 'Tue', h: '94%', color: 'bg-emerald-400' },
                        { day: 'Wed', h: '98%', color: 'bg-[#714B67]' },
                        { day: 'Thu', h: '92%', color: 'bg-teal-400' },
                        { day: 'Fri', h: '90%', color: 'bg-purple-300' },
                        { day: 'Sat', h: '45%', color: 'bg-amber-300' },
                        { day: 'Sun', h: '30%', color: 'bg-gray-300' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className='flex-1 flex flex-col items-center gap-1'
                        >
                          <div
                            className={`w-full rounded-t-sm ${item.color} transition-all`}
                            style={{ height: item.h }}
                          />
                          <span className='text-[9px] text-gray-400 font-medium'>
                            {item.day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STACKED PASTEL STICKY NOTES ON THE RIGHT SIDE */}
            <div className='hidden sm:flex flex-col gap-1.5 absolute -right-3 top-1/3 z-20 select-none'>
              <span className='px-3 py-1 text-xs font-bold text-amber-950 bg-[#FDBA74] rounded-md shadow-xs -rotate-2 transform hover:scale-105 transition-transform'>
                Track
              </span>
              <span className='px-3 py-1 text-xs font-bold text-yellow-950 bg-[#FDE047] rounded-md shadow-xs rotate-1 transform hover:scale-105 transition-transform'>
                Manage
              </span>
              <span className='px-3 py-1 text-xs font-bold text-emerald-950 bg-[#6EE7B7] rounded-md shadow-xs -rotate-1 transform hover:scale-105 transition-transform'>
                Automate
              </span>
              <span className='px-3 py-1 text-xs font-bold text-blue-950 bg-[#93C5FD] rounded-md shadow-xs rotate-2 transform hover:scale-105 transition-transform'>
                Grow
              </span>
            </div>

            {/* FRIENDLY ILLUSTRATED EMPLOYEE SITTING AT LAPTOP DESK (Inline SVG Illustration) */}
            <div className='relative mt-4 flex items-end justify-center sm:justify-start sm:ml-12 z-20'>
              {/* Illustrated Scene */}
              <div className='relative flex items-end'>
                {/* Desk Plant */}
                <div className='w-12 h-16 mr-2 hidden sm:block'>
                  <svg
                    viewBox='0 0 60 80'
                    fill='none'
                    className='w-full h-full'
                  >
                    {/* Plant Pot */}
                    <path
                      d='M15 50 L45 50 L40 75 L20 75 Z'
                      fill='#E2E8F0'
                      stroke='#CBD5E1'
                      strokeWidth='2'
                    />
                    {/* Green Leaves */}
                    <path
                      d='M30 50 C20 30, 10 25, 5 35 C15 35, 25 45, 30 50'
                      fill='#34D399'
                    />
                    <path
                      d='M30 50 C30 20, 35 15, 45 20 C40 30, 35 45, 30 50'
                      fill='#10B981'
                    />
                    <path
                      d='M30 50 C35 30, 48 35, 52 45 C42 48, 35 48, 30 50'
                      fill='#059669'
                    />
                  </svg>
                </div>

                {/* Desk Surface & Character Illustration */}
                <div className='relative'>
                  <svg
                    viewBox='0 0 240 130'
                    fill='none'
                    className='w-64 sm:w-72 h-auto'
                  >
                    {/* Wooden Desk Surface */}
                    <path
                      d='M10 115 L230 115 L230 125 L10 125 Z'
                      fill='#FDE68A'
                      stroke='#F59E0B'
                      strokeWidth='2'
                      rx='4'
                    />

                    {/* Coffee Mug with Steam */}
                    <rect
                      x='185'
                      y='92'
                      width='18'
                      height='23'
                      rx='4'
                      fill='#0284C7'
                      stroke='#0369A1'
                      strokeWidth='1.5'
                    />
                    <path
                      d='M203 98 C208 98, 208 110, 203 110'
                      stroke='#0369A1'
                      strokeWidth='2'
                      fill='none'
                    />
                    <path
                      d='M190 85 C190 80, 194 82, 194 77'
                      stroke='#94A3B8'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                    />
                    <path
                      d='M196 87 C196 82, 200 84, 200 79'
                      stroke='#94A3B8'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                    />

                    {/* Modern Laptop */}
                    <path
                      d='M110 80 L160 80 L165 115 L105 115 Z'
                      fill='#E2E8F0'
                      stroke='#94A3B8'
                      strokeWidth='1.5'
                    />
                    <rect
                      x='115'
                      y='84'
                      width='40'
                      height='26'
                      rx='2'
                      fill='#FFFFFF'
                    />
                    {/* Small heart logo on laptop lid */}
                    <path
                      d='M135 97 C133 94, 130 96, 132 98 L135 101 L138 98 C140 96, 137 94, 135 97'
                      fill='#F43F5E'
                    />

                    {/* Happy Working Employee Character */}
                    {/* Body / Sweater (Warm Yellow) */}
                    <path
                      d='M45 125 C45 85, 60 70, 95 70 C125 70, 140 85, 140 125 Z'
                      fill='#FBBF24'
                    />
                    {/* Arm resting on desk */}
                    <path
                      d='M95 85 C110 85, 125 95, 135 115'
                      stroke='#D97706'
                      strokeWidth='8'
                      strokeLinecap='round'
                    />

                    {/* Neck */}
                    <rect
                      x='85'
                      y='55'
                      width='14'
                      height='18'
                      rx='4'
                      fill='#FCD34D'
                    />

                    {/* Head */}
                    <circle cx='92' cy='45' r='22' fill='#FCD34D' />

                    {/* Friendly Hair (Dark Brunette) */}
                    <path
                      d='M68 45 C68 25, 80 18, 95 18 C115 18, 122 28, 118 48 C110 32, 105 32, 90 32 C78 32, 70 38, 68 45 Z'
                      fill='#332219'
                    />
                    <path
                      d='M68 45 C65 55, 68 75, 78 82 C72 70, 72 55, 70 45 Z'
                      fill='#332219'
                    />

                    {/* Facial Features */}
                    {/* Smile */}
                    <path
                      d='M90 52 Q95 57 100 52'
                      stroke='#78350F'
                      strokeWidth='2'
                      strokeLinecap='round'
                      fill='none'
                    />
                    {/* Eyes */}
                    <circle cx='91' cy='42' r='2.5' fill='#332219' />
                    <circle cx='102' cy='42' r='2.5' fill='#332219' />
                    {/* Rosy Cheeks */}
                    <circle
                      cx='86'
                      cy='47'
                      r='3'
                      fill='#FDA4AF'
                      opacity='0.6'
                    />
                    <circle
                      cx='106'
                      cy='47'
                      r='3'
                      fill='#FDA4AF'
                      opacity='0.6'
                    />
                  </svg>
                </div>

                {/* Hand-drawn Callout: Happier Employees with Curved Arrow */}
                <div className='hidden sm:flex items-center gap-1.5 ml-3 mb-8 select-none'>
                  <svg
                    className='w-8 h-8 text-[#714B67] rotate-45'
                    viewBox='0 0 30 30'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2.2'
                    strokeLinecap='round'
                  >
                    <path d='M22 6 C 16 12, 10 18, 8 24' />
                    <path d='M6 18 L 8 24 L 14 24' />
                  </svg>
                  <span className='font-handwriting text-2xl font-bold text-[#714B67] whitespace-nowrap'>
                    Happier Employees
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
