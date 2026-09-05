import React from 'react';

/**
 * Clean, compact status badge for employee state.
 * Uses subtle pastel colors matching the PeoplePay design system.
 *
 * @param {Object} props
 * @param {'Active'|'Inactive'|'On Leave'|string} props.status
 * @param {string} [props.className]
 */
export default function EmployeeStatusBadge({ status = 'Active', className = '' }) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Active':
        return {
          container: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'On Leave':
        return {
          container: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'Inactive':
      default:
        return {
          container: 'bg-gray-100 text-gray-700 border-gray-200',
          dot: 'bg-gray-400',
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${style.container} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden='true' />
      <span>{status}</span>
    </span>
  );
}
