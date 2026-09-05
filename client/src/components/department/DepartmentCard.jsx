import React from 'react';

/**
 * Reusable Department Summary Card component.
 *
 * @param {Object} props
 * @param {Object} props.department
 * @param {Function} [props.onEdit]
 * @param {Function} [props.onDelete]
 */
export default function DepartmentCard({ department, onEdit, onDelete }) {
  const managerName = department.manager?.firstName
    ? `${department.manager.firstName} ${department.manager.lastName || ''}`.trim()
    : typeof department.manager === 'string'
    ? department.manager
    : 'Unassigned';

  const count = department.employeeCount ?? department.headCount ?? 0;
  const parentName = department.parentDepartment?.name;

  return (
    <div className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4 hover:border-gray-300 transition-colors'>
      <div className='flex items-start justify-between'>
        <div>
          <h4 className='text-sm font-black text-[#1E293B]'>{department.name}</h4>
          <div className='flex items-center gap-1.5 mt-0.5'>
            <span className='text-[10px] font-mono font-bold text-[#714B67]'>
              {department.code}
            </span>
            {parentName && (
              <span className='text-[10px] text-gray-400 font-medium'>
                • under {parentName}
              </span>
            )}
          </div>
        </div>

        <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200'>
          {count} {count === 1 ? 'Member' : 'Members'}
        </span>
      </div>

      <div className='pt-2 border-t border-gray-100 text-xs space-y-1.5 text-gray-600'>
        <div className='flex items-center gap-2'>
          <div className='w-6 h-6 rounded-full bg-purple-100 text-[#714B67] font-bold text-[10px] flex items-center justify-center shrink-0'>
            {managerName.charAt(0)}
          </div>
          <span className='truncate'>
            Manager: <strong className='text-gray-900'>{managerName}</strong>
          </span>
        </div>

        {department.description && (
          <p className='text-[11px] text-gray-500 line-clamp-2 pt-0.5'>
            {department.description}
          </p>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className='flex items-center justify-end gap-3 pt-2 border-t border-gray-100 text-xs font-bold'>
          {onEdit && (
            <button
              type='button'
              onClick={() => onEdit(department)}
              className='text-[#714B67] hover:underline cursor-pointer'
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type='button'
              onClick={() => onDelete(department.id)}
              className='text-rose-600 hover:underline cursor-pointer'
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
