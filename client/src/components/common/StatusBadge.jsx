import React from 'react';

/**
 * Universal compact Status Badge for workflows and entities.
 *
 * @param {Object} props
 * @param {string} props.status - Status text
 * @param {string} [props.className] - Additional classes
 */
export default function StatusBadge({ status = 'Active', className = '' }) {
  const getStyles = () => {
    const s = String(status).toLowerCase();

    if (
      s.includes('active') ||
      s.includes('ready') ||
      s.includes('completed') ||
      s.includes('validated') ||
      s.includes('paid') ||
      s.includes('success') ||
      s.includes('present') ||
      s.includes('on time')
    ) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (
      s.includes('pending') ||
      s.includes('in progress') ||
      s.includes('computed') ||
      s.includes('permanent') ||
      s.includes('connected')
    ) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }

    if (
      s.includes('needs review') ||
      s.includes('review') ||
      s.includes('warning') ||
      s.includes('on leave') ||
      s.includes('flagged')
    ) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }

    if (
      s.includes('blocked') ||
      s.includes('failed') ||
      s.includes('high') ||
      s.includes('urgent') ||
      s.includes('error')
    ) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (s.includes('draft')) {
      return 'bg-purple-50 text-[#714B67] border-purple-200';
    }

    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase shadow-2xs ${getStyles()} ${className}`}
    >
      <span className='w-1.5 h-1.5 rounded-full bg-current opacity-80' />
      <span>{status}</span>
    </span>
  );
}
