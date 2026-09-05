import React from 'react';
import { CONTRACT_STATUSES, DEPARTMENTS, EMPLOYEE_STATUSES } from '../../data/employees.js';

/**
 * Compact single-row filter toolbar for the Employee Management module.
 *
 * @param {Object} props
 * @param {string} props.searchQuery
 * @param {Function} props.onSearchChange
 * @param {string} props.selectedDepartment
 * @param {Function} props.onDepartmentChange
 * @param {string} props.selectedStatus
 * @param {Function} props.onStatusChange
 * @param {string} props.selectedContract
 * @param {Function} props.onContractChange
 * @param {Function} props.onReset
 * @param {number} props.totalCount
 * @param {number} props.filteredCount
 */
export default function EmployeeFilters({
  searchQuery,
  onSearchChange,
  selectedDepartment,
  onDepartmentChange,
  selectedStatus,
  onStatusChange,
  selectedContract,
  onContractChange,
  onReset,
  totalCount,
  filteredCount,
}) {
  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedDepartment !== 'All Departments' ||
    selectedStatus !== 'All Statuses' ||
    selectedContract !== 'All Contracts';

  return (
    <div className='bg-white p-3 sm:p-4 rounded-2xl border border-[#EAE6DF] shadow-2xs space-y-3'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-3'>
        {/* Search Input */}
        <div className='relative flex-1 max-w-md'>
          <span className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400'>
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
          </span>
          <input
            type='search'
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder='Search employees by name, ID, email...'
            className='w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-gray-200/90 rounded-xl text-[#1E293B] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-[#714B67] focus:border-transparent transition-all'
          />
        </div>

        {/* Filter Dropdowns + Reset */}
        <div className='flex flex-wrap items-center gap-2'>
          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className='px-3 py-2 text-xs font-semibold bg-[#FAF8F5] hover:bg-white border border-gray-200/90 rounded-xl text-[#1E293B] focus:outline-none focus:ring-1.5 focus:ring-[#714B67] cursor-pointer transition-colors'
            aria-label='Filter by department'
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className='px-3 py-2 text-xs font-semibold bg-[#FAF8F5] hover:bg-white border border-gray-200/90 rounded-xl text-[#1E293B] focus:outline-none focus:ring-1.5 focus:ring-[#714B67] cursor-pointer transition-colors'
            aria-label='Filter by employment status'
          >
            {EMPLOYEE_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Contract Filter */}
          <select
            value={selectedContract}
            onChange={(e) => onContractChange(e.target.value)}
            className='px-3 py-2 text-xs font-semibold bg-[#FAF8F5] hover:bg-white border border-gray-200/90 rounded-xl text-[#1E293B] focus:outline-none focus:ring-1.5 focus:ring-[#714B67] cursor-pointer transition-colors'
            aria-label='Filter by contract status'
          >
            {CONTRACT_STATUSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              type='button'
              onClick={onReset}
              className='px-2.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer flex items-center gap-1'
              title='Clear all filters'
            >
              <span>✕</span>
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Count Strip */}
      <div className='flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100'>
        <span>
          Showing <strong className='text-[#1E293B]'>{filteredCount}</strong> of{' '}
          <strong>{totalCount}</strong> employees
        </span>
        {isFiltered && (
          <span className='font-medium text-[#714B67]'>Filters active</span>
        )}
      </div>
    </div>
  );
}
