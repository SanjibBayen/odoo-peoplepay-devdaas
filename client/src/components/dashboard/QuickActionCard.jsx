import React from 'react';

/**
 * Compact Quick Action Card/Button for rapid shortcuts.
 *
 * @param {Object} props
 * @param {Object} props.action - Action object
 * @param {Function} [props.onClick] - Click callback
 */
export default function QuickActionCard({ action, onClick }) {
  const { title, subtitle, iconType, accent = 'purple', badge } = action;

  const getAccentStyles = () => {
    switch (accent) {
      case 'emerald':
        return {
          iconBg: 'bg-emerald-100/80 text-emerald-700',
          borderHover: 'hover:border-emerald-300',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'blue':
        return {
          iconBg: 'bg-blue-100/80 text-blue-700',
          borderHover: 'hover:border-blue-300',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-100/80 text-amber-800',
          borderHover: 'hover:border-amber-300',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-100/80 text-rose-700',
          borderHover: 'hover:border-rose-300',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'purple':
      default:
        return {
          iconBg: 'bg-purple-100/80 text-[#714B67]',
          borderHover: 'hover:border-purple-300',
          badgeBg: 'bg-purple-50 text-[#714B67] border-purple-200',
        };
    }
  };

  const styles = getAccentStyles();

  const renderIcon = () => {
    switch (iconType) {
      case 'users':
      case 'user-plus':
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
              d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'
            />
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
      case 'calendar-check':
        return (
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
        );
      case 'document':
      case 'file-text':
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
      case 'play':
      case 'check-circle':
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
              d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        );
      case 'search':
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <circle cx='11' cy='11' r='8' />
            <path d='M21 21l-4.35-4.35' />
          </svg>
        );
      case 'sliders':
      default:
        return (
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <line x1='4' y1='21' x2='4' y2='14' />
            <line x1='4' y1='10' x2='4' y2='3' />
            <line x1='12' y1='21' x2='12' y2='12' />
            <line x1='12' y1='8' x2='12' y2='3' />
            <line x1='20' y1='21' x2='20' y2='16' />
            <line x1='20' y1='12' x2='20' y2='3' />
          </svg>
        );
    }
  };

  return (
    <button
      type='button'
      onClick={onClick}
      className={`w-full p-3 rounded-xl bg-white border border-gray-200/80 shadow-2xs hover:shadow-xs ${styles.borderHover} transition-all flex items-center justify-between text-left group cursor-pointer`}
    >
      <div className='flex items-center gap-2.5 min-w-0'>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${styles.iconBg} shadow-2xs group-hover:scale-105 transition-transform`}
        >
          {renderIcon()}
        </div>

        <div className='min-w-0'>
          <div className='flex items-center gap-1.5 flex-wrap'>
            <h4 className='text-xs font-bold text-[#1E293B] group-hover:text-[#714B67] transition-colors truncate'>
              {title}
            </h4>
            {badge && (
              <span
                className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${styles.badgeBg}`}
              >
                {badge}
              </span>
            )}
          </div>
          <p className='text-[11px] text-gray-500 mt-0.5 truncate'>
            {subtitle}
          </p>
        </div>
      </div>

      <div className='w-6 h-6 rounded-full bg-gray-50 group-hover:bg-[#714B67] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors shrink-0 ml-2'>
        <span className='text-[11px] font-bold'>→</span>
      </div>
    </button>
  );
}
