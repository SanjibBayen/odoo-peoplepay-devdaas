import React from 'react';
import EmployeeStatusBadge from './EmployeeStatusBadge.jsx';

/**
 * Compact enterprise employee table with responsive mobile cards.
 *
 * @param {Object} props
 * @param {Array} props.employees - List of employee objects
 * @param {Function} props.onView - Callback when clicking to view employee profile
 * @param {Function} props.onEdit - Callback when clicking to edit employee
 * @param {Function} [props.onResetFilters] - Callback to reset filters when empty
 */
export default function EmployeeTable({
  employees = [],
  onView,
  onEdit,
  onResetFilters,
}) {
  if (employees.length === 0) {
    return (
      <div className='bg-white rounded-2xl border border-[#EAE6DF] p-10 text-center space-y-3 shadow-2xs'>
        <div className='w-12 h-12 mx-auto rounded-2xl bg-purple-50 text-[#714B67] flex items-center justify-center'>
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
          </svg>
        </div>
        <h3 className='text-sm font-bold text-[#1E293B]'>No employees found</h3>
        <p className='text-xs text-gray-500 max-w-sm mx-auto'>
          We couldn't find any employees matching your current search or filter criteria.
        </p>
        {onResetFilters && (
          <button
            type='button'
            onClick={onResetFilters}
            className='inline-flex items-center px-3 py-1.5 text-xs font-bold text-[#714B67] bg-purple-50 hover:bg-purple-100/80 rounded-xl transition-colors cursor-pointer'
          >
            Clear All Filters
          </button>
        )}
      </div>
    );
  }

  const getContractBadge = (contractStatus) => {
    switch (contractStatus) {
      case 'Permanent':
        return 'bg-blue-50/80 text-blue-700 border-blue-200';
      case 'Probation':
        return 'bg-amber-50/80 text-amber-800 border-amber-200';
      case 'Contract':
      default:
        return 'bg-purple-50/80 text-[#714B67] border-purple-200';
    }
  };

  return (
    <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
      {/* Desktop & Tablet Table View */}
      <div className='overflow-x-auto'>
        <table className='w-full text-left border-collapse'>
          <thead>
            <tr className='border-b border-gray-100 bg-[#FAF8F5]/80 text-[10px] font-bold uppercase tracking-wider text-gray-500'>
              <th scope='col' className='py-3 px-4 sm:px-5'>
                Employee
              </th>
              <th scope='col' className='py-3 px-3'>
                Employee ID
              </th>
              <th scope='col' className='py-3 px-3'>
                Department
              </th>
              <th scope='col' className='py-3 px-3'>
                Job Position
              </th>
              <th scope='col' className='py-3 px-3'>
                Status
              </th>
              <th scope='col' className='py-3 px-3'>
                Contract
              </th>
              <th scope='col' className='py-3 px-4 text-right'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100 text-xs'>
            {employees.map((emp) => (
              <tr
                key={emp.id}
                className='hover:bg-[#FAF8F5]/60 transition-colors group'
              >
                {/* Employee: Avatar + Name + Email */}
                <td className='py-3 px-4 sm:px-5'>
                  <div className='flex items-center gap-2.5'>
                    <div className='w-8 h-8 rounded-xl bg-purple-50 text-[#714B67] border border-purple-100 font-bold text-xs flex items-center justify-center shrink-0 select-none'>
                      {emp.avatar || emp.firstName?.charAt(0) || 'E'}
                    </div>
                    <div className='min-w-0'>
                      <button
                        type='button'
                        onClick={() => onView(emp)}
                        className='font-bold text-[#1E293B] hover:text-[#714B67] truncate text-left block cursor-pointer transition-colors'
                        title={`View profile for ${emp.name}`}
                      >
                        {emp.name}
                      </button>
                      <span className='text-[11px] text-gray-400 truncate block font-normal'>
                        {emp.email}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Employee ID */}
                <td className='py-3 px-3 whitespace-nowrap'>
                  <span className='font-mono text-[11px] font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/80'>
                    {emp.employeeId}
                  </span>
                </td>

                {/* Department */}
                <td className='py-3 px-3 whitespace-nowrap font-medium text-[#1E293B]'>
                  {emp.department}
                </td>

                {/* Job Position */}
                <td className='py-3 px-3 text-gray-600 max-w-[170px] truncate' title={emp.jobPosition}>
                  {emp.jobPosition}
                </td>

                {/* Status */}
                <td className='py-3 px-3 whitespace-nowrap'>
                  <EmployeeStatusBadge status={emp.status} />
                </td>

                {/* Contract */}
                <td className='py-3 px-3 whitespace-nowrap'>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getContractBadge(
                      emp.contractStatus
                    )}`}
                  >
                    {emp.contractStatus}
                  </span>
                </td>

                {/* Actions */}
                <td className='py-3 px-4 text-right whitespace-nowrap'>
                  <div className='inline-flex items-center gap-1.5'>
                    <button
                      type='button'
                      onClick={() => onView(emp)}
                      className='px-2.5 py-1 rounded-lg text-xs font-bold text-[#714B67] hover:bg-purple-50 transition-colors cursor-pointer border border-transparent hover:border-purple-200'
                      title={`View ${emp.name}'s full profile`}
                    >
                      View
                    </button>
                    <button
                      type='button'
                      onClick={() => onEdit(emp)}
                      className='px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-600 hover:text-[#1E293B] hover:bg-gray-100 transition-colors cursor-pointer'
                      title={`Edit ${emp.name}`}
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
