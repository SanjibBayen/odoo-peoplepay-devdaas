import React from 'react';

/**
 * Compact EmptyState component for lists and tables.
 *
 * @param {Object} props
 * @param {string} props.title - Main title
 * @param {string} [props.description] - Description text
 * @param {string} [props.icon] - Emoji or indicator
 * @param {React.ReactNode} [props.action] - Optional button
 */
export default function EmptyState({
  title = 'No items found',
  description = 'Everything is up to date.',
  icon,
  action,
}) {
  return (
    <div className='py-8 px-4 text-center rounded-2xl bg-[#FAF8F5]/60 border border-dashed border-gray-200'>
      <div className='flex items-center justify-center mb-2.5 text-gray-400 select-none'>
        {icon || (
          <div className='w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#714B67]'>
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              strokeWidth='1.75'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
          </div>
        )}
      </div>
      <h4 className='text-xs font-bold text-[#1E293B]'>{title}</h4>
      <p className='text-[11px] text-gray-500 mt-0.5 max-w-xs mx-auto'>
        {description}
      </p>
      {action && <div className='mt-3'>{action}</div>}
    </div>
  );
}
