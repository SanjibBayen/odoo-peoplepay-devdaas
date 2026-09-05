import React, { useState } from 'react';
import BackButton from '../common/BackButton.jsx';

/**
 * Reusable modal form for creating or editing departments.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Function} props.onSave - (data) => Promise<void>
 * @param {Object} [props.initialData]
 * @param {Array} [props.employees=[]]
 * @param {Array} [props.departments=[]]
 */
export default function DepartmentForm({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  employees = [],
  departments = [],
}) {
  const isEdit = Boolean(initialData);

  const [prevInitialData, setPrevInitialData] = useState(initialData);
  const [formData, setFormData] = useState(() => ({
    name: initialData?.name || '',
    code: initialData?.code || '',
    description: initialData?.description || '',
    managerId: initialData?.managerId || initialData?.manager?.id || '',
    parentDepartmentId:
      initialData?.parentDepartmentId || initialData?.parentDepartment?.id || '',
  }));

  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (prevInitialData !== initialData) {
    setPrevInitialData(initialData);
    setFormData({
      name: initialData?.name || '',
      code: initialData?.code || '',
      description: initialData?.description || '',
      managerId: initialData?.managerId || initialData?.manager?.id || '',
      parentDepartmentId:
        initialData?.parentDepartmentId || initialData?.parentDepartment?.id || '',
    });
  }

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Department name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Department code is required.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      await onSave({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        managerId: formData.managerId || undefined,
        parentDepartmentId: formData.parentDepartmentId || undefined,
      });
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to save department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const eligibleParents = departments.filter((d) => d.id !== initialData?.id);

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
      role='dialog'
      aria-modal='true'
    >
      <div className='bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4'>
        <div className='flex items-center justify-between border-b border-gray-100 pb-2.5'>
          <h3 className='text-sm font-black text-[#1E293B]'>
            {isEdit ? 'Edit Department' : 'New Department'}
          </h3>
          <button
            type='button'
            onClick={onClose}
            className='text-gray-400 font-bold hover:text-gray-600'
          >
            ✕
          </button>
        </div>

        {formError && (
          <div className='p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium'>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-3 text-xs'>
          <div>
            <label className='block font-bold text-gray-700 mb-1'>Department Name *</label>
            <input
              type='text'
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder='e.g. Finance & Accounting'
              className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
            />
          </div>

          <div>
            <label className='block font-bold text-gray-700 mb-1'>Department Code *</label>
            <input
              type='text'
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder='e.g. FIN'
              className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5] font-mono'
            />
          </div>

          {employees.length > 0 && (
            <div>
              <label className='block font-bold text-gray-700 mb-1'>Department Manager</label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              >
                <option value=''>Unassigned / None</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : emp.name} ({emp.employeeCode || emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
          )}

          {eligibleParents.length > 0 && (
            <div>
              <label className='block font-bold text-gray-700 mb-1'>Parent Department</label>
              <select
                value={formData.parentDepartmentId}
                onChange={(e) =>
                  setFormData({ ...formData, parentDepartmentId: e.target.value })
                }
                className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              >
                <option value=''>Top-Level Department (No Parent)</option>
                {eligibleParents.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className='block font-bold text-gray-700 mb-1'>Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder='Mission and organizational scope'
              className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
            />
          </div>

          <div className='pt-2 flex justify-end gap-2 border-t border-gray-100'>
            <BackButton label='Cancel' onClick={onClose} />
            <button
              type='submit'
              disabled={isSubmitting}
              className={`px-4 py-1.5 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl cursor-pointer ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
