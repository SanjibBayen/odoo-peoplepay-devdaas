import React from 'react';

/**
 * Reusable, clean EmptyState component with zero decorative emojis or AI graphics.
 *
 * @param {Object} props
 * @param {string} props.title - Main title
 * @param {string} [props.description] - Description text
 * @param {React.ReactNode} [props.action] - Optional action button
 */
export default function EmptyState({
  title = 'No records found',
  description = 'There are currently no items matching your criteria.',
  action,
}) {
  return (
    <div className='py-10 px-4 text-center rounded-2xl bg-white border border-dashed border-[#EAE6DF] shadow-2xs'>
      <div className='w-10 h-10 mx-auto mb-2 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400'>
        <svg
          className='w-5 h-5'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          strokeWidth='1.75'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
          />
        </svg>
      </div>
      <h4 className='text-sm font-bold text-[#1E293B]'>{title}</h4>
      <p className='text-xs text-gray-500 mt-1 max-w-sm mx-auto'>
        {description}
      </p>
      {action && <div className='mt-4'>{action}</div>}
    </div>
  );
}
