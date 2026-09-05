import React from 'react';

/**
 * Reusable role badge displaying the role indicator with role-specific pastel styling.
 *
 * @param {Object} props
 * @param {Object} props.role - Role configuration object
 * @param {string} [props.className] - Additional class names
 */
export default function RoleBadge({ role, className = '' }) {
  if (!role) return null;

  const { badgeStyles = {}, roleIndicator, icon } = role;
  const bg = badgeStyles.bg || 'bg-purple-50';
  const text = badgeStyles.text || 'text-[#714B67]';
  const border = badgeStyles.border || 'border-purple-200';
  const dot = badgeStyles.dot || 'bg-[#714B67]';

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold tracking-wide uppercase shadow-2xs ${bg} ${border} ${text} ${className}`}
      role='status'
      aria-label={`Role: ${roleIndicator}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${dot} animate-pulse`}
        aria-hidden='true'
      />
      {icon && (
        <span className='text-sm select-none' aria-hidden='true'>
          {icon}
        </span>
      )}
      <span>{roleIndicator}</span>
    </div>
  );
}
