import React from 'react';

/**
 * Reusable error state component with optional retry callback.
 */
export default function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry,
}) {
  return (
    <div className='py-8 px-5 rounded-2xl bg-rose-50/50 border border-rose-200 text-center max-w-md mx-auto shadow-2xs'>
      <div className='w-9 h-9 mx-auto mb-2 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm'>
        !
      </div>
      <h4 className='text-sm font-bold text-rose-900'>{title}</h4>
      <p className='text-xs text-rose-700 mt-1'>{message}</p>
      {onRetry && (
        <button
          type='button'
          onClick={onRetry}
          className='mt-3.5 px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer'
        >
          Try Again
        </button>
      )}
    </div>
  );
}
