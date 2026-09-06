import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Lightweight, subtle breadcrumb component for nested and detail pages.
 *
 * @param {Object} props
 * @param {Array<{ label: string, to?: string }>} props.items - Breadcrumb trail items
 * @param {string} [props.className]
 */
export default function Breadcrumbs({ items = [], className = '' }) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label='Breadcrumb'
      className={`flex items-center gap-1.5 text-xs text-gray-500 font-medium ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <svg
                className='w-3 h-3 text-gray-300 shrink-0'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                strokeWidth='2'
                aria-hidden='true'
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
              </svg>
            )}
            {isLast || !item.to ? (
              <span
                className={`truncate ${
                  isLast ? 'text-gray-900 font-bold' : 'text-gray-500'
                }`}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className='hover:text-[#714B67] transition-colors truncate'
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
