import React from 'react';

/**
 * Recent Activity feed showing latest attendance, leave, payslip, and contract events.
 *
 * @param {Object} props
 * @param {Array} props.activities - List of activity objects
 */
export default function RecentActivity({ activities = [] }) {
  const renderIcon = (type) => {
    switch (type) {
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
              d='M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z'
            />
          </svg>
        );
      case 'shield':
      default:
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
    }
  };

  return (
    <div className='bg-white rounded-3xl p-6 sm:p-7 border border-[#EAE6DF] shadow-md'>
      {/* Header */}
      <div className='flex items-center justify-between mb-5'>
        <div className='flex items-center gap-2.5'>
          <div className='w-9 h-9 rounded-xl bg-purple-50 text-[#714B67] border border-purple-100 flex items-center justify-center'>
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
                d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h2 className='text-lg font-black text-[#1E293B] tracking-tight'>
            Recent Activity
          </h2>
        </div>
        <span className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>
          Past 30 Days
        </span>
      </div>

      {/* Activity Timeline List */}
      <div className='space-y-4'>
        {activities.map((act) => (
          <div
            key={act.id}
            className='flex items-start gap-3.5 p-3 rounded-2xl hover:bg-[#FAF8F5] transition-colors group'
          >
            {/* Category Icon */}
            <div className='w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#714B67] group-hover:text-white transition-colors'>
              {renderIcon(act.iconType)}
            </div>

            {/* Content */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between gap-2 mb-0.5 flex-wrap'>
                <div className='flex items-center gap-2'>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${act.badgeStyle}`}
                  >
                    {act.category}
                  </span>
                  <h3 className='text-xs sm:text-sm font-bold text-[#1E293B]'>
                    {act.title}
                  </h3>
                </div>
                <span className='text-[10px] font-medium text-gray-400 shrink-0'>
                  {act.timestamp}
                </span>
              </div>
              <p className='text-xs text-gray-500 font-normal leading-relaxed'>
                {act.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
