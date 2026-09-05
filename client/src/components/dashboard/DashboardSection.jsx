import React from 'react';

/**
 * Reusable compact dashboard section wrapper.
 *
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} [props.subtitle] - Supporting line
 * @param {React.ReactNode} [props.action] - Optional header action
 * @param {React.ReactNode} props.children - Content
 * @param {string} [props.className] - Additional styles
 */
export default function DashboardSection({
  title,
  subtitle,
  action,
  children,
  className = '',
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] shadow-2xs ${className}`}
    >
      {(title || action) && (
        <div className='flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-100 flex-wrap'>
          <div>
            <h3 className='text-xs sm:text-sm font-bold text-[#1E293B]'>
              {title}
            </h3>
            {subtitle && (
              <p className='text-[10px] text-gray-400 font-medium mt-0.5'>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className='shrink-0'>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
