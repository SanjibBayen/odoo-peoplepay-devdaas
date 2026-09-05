import React from 'react';

/**
 * Reusable loading indicator for API-driven modules.
 * Prevents blank white screens with smooth feedback.
 */
export default function LoadingState({ message = 'Loading records...' }) {
  return (
    <div className='py-12 px-4 flex flex-col items-center justify-center text-center rounded-2xl bg-white/70 border border-[#EAE6DF] shadow-2xs'>
      <div className='w-7 h-7 border-2 border-[#714B67]/30 border-t-[#714B67] rounded-full animate-spin mb-3' />
      <p className='text-xs font-semibold text-gray-500 tracking-wide'>
        {message}
      </p>
    </div>
  );
}
