import React from 'react';

/**
 * Universal compact Activity List feed.
 *
 * @param {Object} props
 * @param {Array} props.activities - List of activity records
 * @param {string} [props.title] - Section heading
 * @param {string} [props.badge] - Optional badge
 */
export default function ActivityList({
  activities = [],
  title = 'Recent Activity',
  badge = 'Live Feed',
}) {
  const renderIcon = (type) => {
    switch (type) {
      case 'users':
      case 'user-check':
        return (
          <svg
            className='w-3.5 h-3.5'
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
            className='w-3.5 h-3.5'
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
            className='w-3.5 h-3.5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <rect x='3' y='4' width='18' height='18' rx='2.5' />
            <path strokeLinecap='round' d='M16 2v4M8 2v4M3 10h18' />
          </svg>
        );
      case 'document':
        return (
          <svg
            className='w-3.5 h-3.5'
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
      default:
        return (
          <svg
            className='w-3.5 h-3.5'
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
    <div className='bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] shadow-2xs'>
      <div className='flex items-center justify-between mb-3 pb-2 border-b border-gray-100'>
        <div className='flex items-center gap-2'>
          <h3 className='text-xs sm:text-sm font-bold text-[#1E293B]'>
            {title}
          </h3>
          {badge && (
            <span className='text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-50 text-[#714B67] border border-purple-200/60'>
              {badge}
            </span>
          )}
        </div>
        <span className='text-[10px] text-gray-400 font-medium'>Auto-sync</span>
      </div>

      <div className='space-y-2.5'>
        {activities.map((act) => (
          <div
            key={act.id}
            className='flex items-start gap-2.5 p-2 rounded-xl hover:bg-[#FAF8F5] transition-colors group'
          >
            <div className='w-7 h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#714B67] group-hover:text-white transition-colors'>
              {renderIcon(act.iconType)}
            </div>

            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between gap-2 flex-wrap'>
                <div className='flex items-center gap-1.5'>
                  {act.category && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${act.badgeStyle || 'bg-gray-100 text-gray-700'}`}
                    >
                      {act.category}
                    </span>
                  )}
                  <h4 className='text-xs font-bold text-[#1E293B] truncate'>
                    {act.title || act.action}
                  </h4>
                </div>
                <span className='text-[10px] text-gray-400 font-medium shrink-0'>
                  {act.timestamp || act.time}
                </span>
              </div>
              <p className='text-[11px] text-gray-500 font-normal mt-0.5 leading-snug'>
                {act.description || act.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
