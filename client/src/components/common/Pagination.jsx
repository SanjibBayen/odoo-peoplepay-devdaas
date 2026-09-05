import React from 'react';

/**
 * Reusable pagination component for enterprise tables.
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}) {
  if (totalPages <= 1 && totalItems <= pageSize) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className='flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-1 text-xs text-gray-500 font-medium'>
      <div>
        Showing <span className='font-bold text-gray-800'>{start}</span> to{' '}
        <span className='font-bold text-gray-800'>{end}</span> of{' '}
        <span className='font-bold text-gray-800'>{totalItems}</span> records
      </div>

      <div className='flex items-center gap-1.5'>
        <button
          type='button'
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className='px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors font-bold'
        >
          Previous
        </button>

        <span className='px-2.5 py-1 text-gray-700 font-bold'>
          {currentPage} / {totalPages}
        </span>

        <button
          type='button'
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className='px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors font-bold'
        >
          Next
        </button>
      </div>
    </div>
  );
}
