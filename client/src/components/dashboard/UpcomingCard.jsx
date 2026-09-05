import React from 'react';

/**
 * Compact Upcoming milestones card.
 *
 * @param {Object} props
 * @param {Array} props.items - Upcoming events array
 */
export default function UpcomingCard({ items = [] }) {
  return (
    <div className='bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] shadow-2xs'>
      <div className='flex items-center justify-between mb-3 pb-2 border-b border-gray-100'>
        <div className='flex items-center gap-2'>
          <div className='w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center'>
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              strokeWidth='2'
            >
              <rect x='3' y='4' width='18' height='18' rx='2.5' />
              <path strokeLinecap='round' d='M16 2v4M8 2v4M3 10h18' />
            </svg>
          </div>
          <h3 className='text-xs sm:text-sm font-bold text-[#1E293B]'>
            Upcoming
          </h3>
        </div>
        <span className='text-[10px] text-gray-400 font-medium'>Schedule</span>
      </div>

      <div className='space-y-2'>
        {items.map((item) => (
          <div
            key={item.id}
            className='p-2.5 rounded-xl bg-[#FAF8F5] border border-gray-200/60 flex items-center justify-between gap-2.5'
          >
            <div className='flex items-center gap-2.5 min-w-0'>
              <div className='w-8 h-8 rounded-lg bg-white border border-gray-200 flex flex-col items-center justify-center text-center shrink-0'>
                <span className='text-[8px] font-extrabold uppercase text-[#714B67] leading-none'>
                  {item.dateRange.split(' ')[0]}
                </span>
                <span className='text-[11px] font-black text-[#1E293B] leading-none mt-0.5'>
                  {item.dateRange.split(' ')[1] || '—'}
                </span>
              </div>

              <div className='min-w-0'>
                <h4 className='text-xs font-bold text-[#1E293B] truncate'>
                  {item.title}
                </h4>
                <div className='flex items-center gap-1.5 mt-0.5'>
                  <span
                    className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${item.badgeStyle}`}
                  >
                    {item.category}
                  </span>
                  <span className='text-[10px] text-gray-400 font-medium truncate'>
                    {item.dateRange}
                  </span>
                </div>
              </div>
            </div>

            <span className='text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 shrink-0'>
              {item.daysCount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
