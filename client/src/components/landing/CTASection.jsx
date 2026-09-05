import React from 'react';

export default function CTASection() {
  return (
    <section
      className='py-20 lg:py-28 bg-[#FAF8F5] relative overflow-hidden'
      aria-labelledby='final-cta-heading'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Soft Mint / Pastel Organic Container */}
        <div className='relative rounded-3xl bg-gradient-to-br from-emerald-100/60 via-teal-50/70 to-purple-100/40 border border-emerald-200/80 p-10 sm:p-16 lg:p-20 text-center shadow-xs overflow-hidden'>
          {/* Organic Background Blobs */}
          <div
            className='absolute -top-16 -left-16 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl pointer-events-none'
            aria-hidden='true'
          />
          <div
            className='absolute -bottom-16 -right-16 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl pointer-events-none'
            aria-hidden='true'
          />

          <div className='relative z-10 max-w-2xl mx-auto space-y-6'>
            {/* Handwritten Note with Doodle Swirl */}
            <div className='inline-flex items-center gap-2 select-none -rotate-1'>
              <span className='font-handwriting text-2xl sm:text-3xl font-bold text-teal-800 marker-yellow px-2.5 py-0.5'>
                Let’s make work simpler.
              </span>
              <span className='text-xl'>✨</span>
            </div>

            {/* Main Heading */}
            <h2
              id='final-cta-heading'
              className='text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1E293B] tracking-tight leading-tight'
            >
              People first. <br />
              <span className='text-[#714B67]'>Payroll simpler.</span>
            </h2>

            {/* Short Supporting Text */}
            <p className='text-base sm:text-lg text-gray-600 font-normal max-w-lg mx-auto leading-relaxed'>
              Everything your HR team needs, in one place.
            </p>

            {/* Action CTA Button */}
            <div className='pt-4 flex flex-col sm:flex-row items-center justify-center gap-4'>
              <button
                type='button'
                className='px-8 py-4 text-base font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-full shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2'
                onClick={() => alert('Start Your Journey')}
              >
                <span>Start Your Journey</span>
                <span className='text-xl'>→</span>
              </button>
            </div>

            {/* Micro-guarantee */}
            <p className='text-xs text-gray-500 font-medium pt-2'>
              No credit card required • Instant workspace setup
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
