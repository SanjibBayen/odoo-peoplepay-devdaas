import React from 'react';

/**
 * Enterprise compact KPI StatCard.
 *
 * @param {Object} props
 * @param {string} props.label - Metric description
 * @param {string} props.value - Metric value
 * @param {string} [props.badgeText] - Status or trend tag
 * @param {string} [props.hint] - Secondary information
 * @param {string} [props.iconType] - Icon identifier
 * @param {string} [props.bgColor] - Pastel container background
 * @param {string} [props.borderColor] - Border color
 * @param {string} [props.iconBg] - Icon background & text styling
 * @param {string} [props.valueColor] - Main value text color
 */
export default function StatCard({
  label,
  value,
  badgeText,
  hint,
  iconType = 'clock',
  bgColor = 'bg-white',
  borderColor = 'border-gray-200/80',
  iconBg = 'bg-purple-100/90 text-[#714B67]',
  valueColor = 'text-[#1E293B]',
}) {
  const renderIcon = () => {
    switch (iconType) {
      case 'users':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
            />
          </svg>
        );
      case 'user-check':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2'
            />
            <circle cx='8.5' cy='7' r='4' />
            <polyline points='17 11 19 13 23 9' />
          </svg>
        );
      case 'clock':
        return (
          <svg
            className='w-4 h-4'
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
            className='w-4 h-4'
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
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            />
          </svg>
        );
      case 'shield':
      case 'shield-check':
        return (
          <svg
            className='w-4 h-4'
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
      case 'trending-up':
      case 'trend-up':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <polyline points='23 6 13.5 15.5 8.5 10.5 1 18' />
            <polyline points='17 6 23 6 23 12' />
          </svg>
        );
      case 'building':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
            />
          </svg>
        );
      case 'alert':
      default:
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <circle cx='12' cy='12' r='9' />
            <line x1='12' y1='8' x2='12' y2='12' />
            <line x1='12' y1='16' x2='12.01' y2='16' />
          </svg>
        );
    }
  };

  return (
    <div
      className={`rounded-2xl p-4 border ${borderColor} ${bgColor} shadow-2xs hover:shadow-xs transition-all duration-150 flex flex-col justify-between`}
    >
      <div>
        <div className='flex items-center justify-between gap-2 mb-2'>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg} shadow-2xs`}
          >
            {renderIcon()}
          </div>
          {badgeText && (
            <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 border border-gray-200/80 text-gray-700 shadow-2xs truncate max-w-[130px]'>
              {badgeText}
            </span>
          )}
        </div>

        <p className='text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5'>
          {label}
        </p>
        <h3
          className={`text-xl sm:text-2xl font-black ${valueColor} tracking-tight`}
        >
          {value}
        </h3>
      </div>

      {hint && (
        <div className='mt-3 pt-2 border-t border-gray-200/50 text-[10px] font-medium text-gray-500 flex items-center gap-1.5 truncate'>
          <span className='w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0' />
          <span className='truncate'>{hint}</span>
        </div>
      )}
    </div>
  );
}
