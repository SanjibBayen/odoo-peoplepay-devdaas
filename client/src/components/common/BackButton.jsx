import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Reusable, accessible Back button for detail, edit, and sub-pages.
 * Uses router history navigation (`navigate(-1)`) with optional fallback.
 *
 * @param {Object} props
 * @param {string} [props.label='Back'] - Button text
 * @param {string} [props.fallback] - Fallback route if history is unavailable
 * @param {string} [props.className] - Additional CSS classes
 * @param {Function} [props.onClick] - Custom click handler (overrides navigate(-1))
 */
export default function BackButton({
  label = 'Back',
  fallback,
  className = '',
  onClick,
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else if (fallback) {
      navigate(fallback);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type='button'
      onClick={handleClick}
      aria-label={`Go back - ${label}`}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 hover:text-[#714B67] bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-2xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#714B67]/30 ${className}`}
    >
      <svg
        className='w-3.5 h-3.5 text-gray-500 group-hover:text-[#714B67]'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
        strokeWidth='2.2'
        aria-hidden='true'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M10 19l-7-7m0 0l7-7m-7 7h18'
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
