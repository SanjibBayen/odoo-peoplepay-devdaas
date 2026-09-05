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
  icon = '📋',
  action,
}) {
  return (
    <div className='py-8 px-4 text-center rounded-2xl bg-[#FAF8F5]/60 border border-dashed border-gray-200'>
      <div className='text-2xl mb-2 select-none'>{icon}</div>
      <h4 className='text-xs font-bold text-[#1E293B]'>{title}</h4>
      <p className='text-[11px] text-gray-500 mt-0.5 max-w-xs mx-auto'>
        {description}
      </p>
      {action && <div className='mt-3'>{action}</div>}
    </div>
  );
}
