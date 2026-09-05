import React from 'react';

export default function LandingFooter() {
  return (
    <footer
      className='bg-[#FAF8F5] border-t border-[#EAE6DF]'
      aria-label='Site Footer'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='flex flex-col md:flex-row items-center justify-between gap-6'>
          {/* Logo & Tagline */}
          <div className='flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-lg bg-[#714B67] flex items-center justify-center text-white shadow-2xs'>
                <span className='font-extrabold text-sm'>P</span>
              </div>
              <span className='text-xl font-bold tracking-tight text-[#1E293B]'>
                PeoplePay<span className='text-[#714B67]'>360</span>
              </span>
            </div>
            <span className='hidden sm:inline text-gray-300'>•</span>
            <span className='text-sm text-gray-500 font-medium'>
              People operations, connected.
            </span>
          </div>

          {/* Clean Navigation Links */}
          <nav className='flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-gray-600'>
            <a href='#home' className='hover:text-[#714B67] transition-colors'>
              Home
            </a>
            <a
              href='#features'
              className='hover:text-[#714B67] transition-colors'
            >
              Features
            </a>
            <a
              href='#solutions'
              className='hover:text-[#714B67] transition-colors'
            >
              Solutions
            </a>
            <a href='#about' className='hover:text-[#714B67] transition-colors'>
              About
            </a>
            <button
              type='button'
              onClick={() => alert('Login')}
              className='hover:text-[#714B67] transition-colors cursor-pointer'
            >
              Login
            </button>
          </nav>
        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className='mt-8 pt-6 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500'>
          <div>© 2026 PeoplePay360. All rights reserved.</div>
          <div className='flex items-center gap-6 font-medium'>
            <a
              href='#privacy'
              onClick={(e) => {
                e.preventDefault();
                alert('Privacy Policy');
              }}
              className='hover:text-gray-800 transition-colors'
            >
              Privacy
            </a>
            <a
              href='#terms'
              onClick={(e) => {
                e.preventDefault();
                alert('Terms of Service');
              }}
              className='hover:text-gray-800 transition-colors'
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
