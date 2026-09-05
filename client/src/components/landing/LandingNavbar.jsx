import React, { useState } from 'react';

export default function LandingNavbar({ onOpenWorkspaceModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'Solutions', href: '#solutions' },
    { name: 'About', href: '#about' },
  ];

  return (
    <header className='sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EAE6DF] transition-all'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-20'>
          {/* Logo & Brand */}
          <div className='flex items-center gap-3'>
            <a href='#home' className='flex items-center gap-3 group'>
              {/* Friendly Illustrated People Logo Icon */}
              <div className='w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/70 flex items-center justify-center p-1.5 shadow-xs transition-transform group-hover:scale-105'>
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
              <span className='text-2xl font-extrabold tracking-tight text-[#1E293B]'>
                PeoplePay
              </span>
            </a>
          </div>

          {/* Center Navigation Links */}
          <nav
            className='hidden md:flex items-center gap-9'
            aria-label='Desktop Navigation'
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className='text-sm font-semibold text-[#475569] hover:text-[#714B67] transition-colors'
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Area: Handwritten Note + Action Buttons */}
          <div className='hidden md:flex items-center gap-5'>
            {/* Playful Handwritten Note with Sun Doodle */}
            <div className='flex items-center gap-1.5 text-right -rotate-2 select-none'>
              <span className='font-handwriting text-lg text-amber-900/80 leading-none font-semibold'>
                Better People
                <br />
                Brighter Tomorrow
              </span>
              {/* Sun Doodle SVG */}
              <svg
                className='w-5 h-5 text-amber-500 animate-spin-slow'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <circle cx='12' cy='12' r='4' fill='#FDE047' />
                <path
                  strokeLinecap='round'
                  d='M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41'
                />
              </svg>
            </div>

            {/* Login Button */}
            <button
              type='button'
              className='px-5 py-2 text-sm font-semibold text-[#1E293B] hover:text-[#714B67] bg-white hover:bg-gray-50 border border-gray-300 rounded-full transition-all shadow-2xs cursor-pointer'
              onClick={onOpenWorkspaceModal}
            >
              Login
            </button>

            {/* Get Started Button */}
            <button
              type='button'
              className='px-6 py-2.5 text-sm font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-full shadow-sm hover:shadow transition-all transform hover:-translate-y-0.5 cursor-pointer'
              onClick={onOpenWorkspaceModal}
            >
              Get Started
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className='flex md:hidden'>
            <button
              type='button'
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='p-2 rounded-xl text-gray-700 hover:bg-white/80 transition-colors cursor-pointer'
              aria-expanded={mobileMenuOpen}
              aria-label='Toggle navigation menu'
            >
              {mobileMenuOpen ? (
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  strokeWidth='2'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              ) : (
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  strokeWidth='2'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className='md:hidden border-b border-[#EAE6DF] bg-[#FAF8F5] px-5 pt-3 pb-6 space-y-4'>
          <div className='flex flex-col space-y-2'>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className='px-3 py-2 text-base font-semibold text-[#1E293B] hover:text-[#714B67] rounded-lg transition-colors'
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className='pt-3 border-t border-gray-200 flex flex-col gap-2.5'>
            <button
              type='button'
              className='w-full text-center py-2.5 text-sm font-semibold text-[#1E293B] bg-white border border-gray-300 rounded-full cursor-pointer'
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenWorkspaceModal?.();
              }}
            >
              Login
            </button>
            <button
              type='button'
              className='w-full text-center py-2.5 text-sm font-bold text-white bg-[#714B67] rounded-full shadow-sm cursor-pointer'
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenWorkspaceModal?.();
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
