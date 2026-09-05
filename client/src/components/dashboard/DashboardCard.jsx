import React from 'react';

/**
 * Reusable KPI Card component for Dashboard metrics.
 *
 * @param {Object} props
 * @param {string} props.label - Short metric description/label
 * @param {string} props.value - Main prominent value
 * @param {string} [props.badgeText] - Status or category tag
 * @param {string} [props.hint] - Helpful secondary detail
 * @param {string} [props.iconType] - Icon identifier
 * @param {string} [props.bgColor] - Pastel container background
 * @param {string} [props.borderColor] - Soft border color
 * @param {string} [props.iconBg] - Colored icon background & text
 * @param {string} [props.valueColor] - Text color for the main value
 */
export default function DashboardCard({
  label,
  value,
  badgeText,
  hint,
  iconType = 'clock',
  bgColor = 'bg-white',
  borderColor = 'border-gray-200/80',
  iconBg = 'bg-purple-100 text-[#714B67]',
  valueColor = 'text-[#1E293B]',
}) {
  const renderIcon = () => {
    switch (iconType) {
      case 'clock':
        return (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <circle cx='12' cy='12' r='9' />
            <path strokeLinecap='round' d='M12 6v6l4 2' />
          </svg>
        );
      case 'calendar':
        return (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <rect x='3' y='4' width='18' height='18' rx='3' />
            <path strokeLinecap='round' d='M16 2v4M8 2v4M3 10h18' />
          </svg>
        );
      case 'document':
        return (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z'
            />
          </svg>
        );
      case 'shield':
      default:
        return (
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={`rounded-2xl p-5 border ${borderColor} ${bgColor} shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group hover:-translate-y-0.5`}
    >
      <div>
        <div className='flex items-center justify-between gap-2 mb-3'>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} shadow-2xs group-hover:scale-105 transition-transform`}
          >
            {renderIcon()}
          </div>
          {badgeText && (
            <span className='text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/80 border border-gray-200/80 text-gray-700 shadow-2xs'>
              {badgeText}
            </span>
          )}
        </div>

        <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1'>
          {label}
        </p>
        <h3
          className={`text-2xl sm:text-3xl font-black ${valueColor} tracking-tight`}
        >
          {value}
        </h3>
      </div>

      {hint && (
        <div className='mt-4 pt-3 border-t border-gray-200/40 text-[11px] font-medium text-gray-500 flex items-center gap-1.5'>
          <span className='w-1.5 h-1.5 rounded-full bg-gray-400' />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}
