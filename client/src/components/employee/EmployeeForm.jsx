import React, { useEffect, useState } from 'react';
import { CONTRACT_STATUSES, DEPARTMENTS } from '../../data/employees.js';

/**
 * Reusable modal form for both Adding and Editing an employee.
 * Organized into clear, compact logical sections.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Dismiss callback
 * @param {Function} props.onSave - Save callback passing updated/new employee
 * @param {Object} [props.initialData] - Existing employee if editing, or null if adding
 */
function getInitialFormData(initialData) {
  if (initialData) {
    return {
      firstName: initialData.firstName || '',
      lastName: initialData.lastName || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      dateOfBirth: initialData.dateOfBirth || '',
      joiningDate: initialData.joiningDate || '',
      department: initialData.department || 'Engineering',
      jobPosition: initialData.jobPosition || '',
      employeeId: initialData.employeeId || '',
      status: initialData.status || 'Active',
      contractStatus: initialData.contractStatus || 'Permanent',
      workLocation: initialData.workLocation || 'HQ Campus • Floor 3',
      manager: initialData.manager || 'Sarah Jenkins',
      emergencyContact: initialData.emergencyContact || '',
      address: initialData.address || '',
    };
  }
  const randomDigits = Math.floor(100 + Math.random() * 900);
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '1998-01-01',
    joiningDate: new Date().toISOString().split('T')[0],
    department: 'Engineering',
    jobPosition: '',
    employeeId: `EMP-2026-${randomDigits}`,
    status: 'Active',
    contractStatus: 'Permanent',
    workLocation: 'HQ Campus • Floor 3',
    manager: 'Sarah Jenkins',
    emergencyContact: '',
    address: '',
  };
}

export default function EmployeeForm({
  isOpen,
  onClose,
  onSave,
  initialData = null,
}) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState(() => getInitialFormData(initialData));
  const [errors, setErrors] = useState({});

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.firstName.trim()) errs.firstName = 'First name is required.';
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required.';
    if (!formData.employeeId.trim()) errs.employeeId = 'Employee ID is required.';
    if (!formData.email.trim()) {
      errs.email = 'Work email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Invalid email address.';
    }
    if (!formData.jobPosition.trim()) errs.jobPosition = 'Job position is required.';
    if (!formData.joiningDate) errs.joiningDate = 'Joining date is required.';

    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      ...formData,
      id: initialData?.id || `emp-${Date.now()}`,
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      avatar: `${formData.firstName.charAt(0)}${formData.lastName.charAt(0)}`.toUpperCase(),
    };

    onSave(payload);
  };

  const departmentOptions = DEPARTMENTS.filter((d) => d !== 'All Departments');
  const contractOptions = CONTRACT_STATUSES.filter((c) => c !== 'All Contracts');

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fadeIn overflow-y-auto'
      role='dialog'
      aria-modal='true'
      aria-labelledby='employee-form-title'
    >
      <div
        className='bg-white rounded-3xl p-5 sm:p-7 max-w-2xl w-full border border-[#EAE6DF] shadow-2xl relative my-8 max-h-[92vh] flex flex-col'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className='flex items-center justify-between pb-4 border-b border-gray-100 shrink-0'>
          <div>
            <h2
              id='employee-form-title'
              className='text-lg sm:text-xl font-black text-[#1E293B] tracking-tight'
            >
              {isEditing ? 'Edit Employee Record' : 'Add New Employee'}
            </h2>
            <p className='text-xs text-gray-500 mt-0.5'>
              {isEditing
                ? `Update workforce profile for ${formData.firstName} ${formData.lastName}`
                : 'Create a new employee profile in the organizational roster.'}
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer'
            aria-label='Close form'
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Organized into 4 Compact Sections */}
        <form onSubmit={handleSubmit} noValidate className='overflow-y-auto pr-1 py-4 space-y-5 flex-1'>
          {/* Section 1: Basic Identity */}
          <div className='bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-gray-200/60 space-y-3'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-[#714B67] block'>
              1. Basic Identity
            </span>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              {/* First Name */}
              <div>
                <label className='block text-xs font-bold text-gray-700 mb-1'>
                  First Name <span className='text-rose-500'>*</span>
                </label>
                <input
                  type='text'
                  name='firstName'
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder='e.g. Alex'
                  className={`w-full px-3 py-2 text-xs rounded-xl bg-white border ${
                    errors.firstName ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                  } focus:outline-none focus:ring-1.5 focus:ring-[#714B67]`}
                />
                {errors.firstName && (
                  <p className='text-[10px] font-semibold text-rose-600 mt-1'>{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className='block text-xs font-bold text-gray-700 mb-1'>
                  Last Name <span className='text-rose-500'>*</span>
                </label>
                <input
                  type='text'
                  name='lastName'
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder='e.g. Morgan'
                  className={`w-full px-3 py-2 text-xs rounded-xl bg-white border ${
                    errors.lastName ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                  } focus:outline-none focus:ring-1.5 focus:ring-[#714B67]`}
                />
                {errors.lastName && (
                  <p className='text-[10px] font-semibold text-rose-600 mt-1'>{errors.lastName}</p>
                )}
              </div>

              {/* Employee ID */}
              <div>
                <label className='block text-xs font-bold text-gray-700 mb-1'>
                  Employee ID <span className='text-rose-500'>*</span>
                </label>
                <input
                  type='text'
                  name='employeeId'
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder='EMP-2026-001'
                  className={`w-full px-3 py-2 text-xs font-mono rounded-xl bg-white border ${
                    errors.employeeId ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                  } focus:outline-none focus:ring-1.5 focus:ring-[#714B67]`}
                />
                {errors.employeeId && (
                  <p className='text-[10px] font-semibold text-rose-600 mt-1'>{errors.employeeId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className='bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-gray-200/60 space-y-3'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-[#714B67] block'>
              2. Contact Information
            </span>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {/* Email */}
              <div>
                <label className='block text-xs font-bold text-gray-700 mb-1'>
                  Work Email <span className='text-rose-500'>*</span>
                </label>
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='name@peoplepay.internal'
                  className={`w-full px-3 py-2 text-xs rounded-xl bg-white border ${
                    errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                  } focus:outline-none focus:ring-1.5 focus:ring-[#714B67]`}
                />
                {errors.email && (
                  <p className='text-[10px] font-semibold text-rose-600 mt-1'>{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className='block text-xs font-bold text-gray-700 mb-1'>
                  Phone Number
                </label>
                <input
                  type='tel'
                  name='phone'
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder='+91 98765 43210'
                  className='w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-1.5 focus:ring-[#714B67]'
                />
              </div>
            </div>
          </div>

          {/* Section 3: Employment Details */}
          <div className='bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-gray-200/60 space-y-3'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-[#714B67] block'>
              3. Employment & Role
            </span>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {/* Department */}
              <div>
                <label className='block text-xs font-bold text-gray-700 mb-1'>
                  Department <span className='text-rose-500'>*</span>
                </label>
                <select
                  name='department'
                  value={formData.department}
                  onChange={handleChange}
                  className='w-full px-3 py-2 text-xs font-medium rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-1.5 focus:ring-[#714B67] cursor-pointer'
                >
                  {departmentOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Position */}
              <div>
                <label className='block text-xs font-bold text-gray-700 mb-1'>
                  Job Position <span className='text-rose-500'>*</span>
                </label>
                <input
                  type='text'
                  name='jobPosition'
                  value={formData.jobPosition}
                  onChange={handleChange}
                  placeholder='e.g. Software Engineer'
                  className={`w-full px-3 py-2 text-xs rounded-xl bg-white border ${
                    errors.jobPosition ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                  } focus:outline-none focus:ring-1.5 focus:ring-[#714B67]`}
                />
                {errors.jobPosition && (
                  <p className='text-[10px] font-semibold text-rose-600 mt-1'>{errors.jobPosition}</p>
                )}
              </div>

              {/* Date of Joining */}
              <div>
                <label className='block text-xs font-bold text-gray-700 mb-1'>
                  Date of Joining <span className='text-rose-500'>*</span>
                </label>
                <input
                  type='date'
                  name='joiningDate'
                  value={formData.joiningDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-xs rounded-xl bg-white border ${
                    errors.joiningDate ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200'
                  } focus:outline-none focus:ring-1.5 focus:ring-[#714B67]`}
                />
                {errors.joiningDate && (
                  <p className='text-[10px] font-semibold text-rose-600 mt-1'>{errors.joiningDate}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className='block text-xs font-bold text-gray-700 mb-1'>
                  Date of Birth
                </label>
                <input
                  type='date'
                  name='dateOfBirth'
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className='w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-1.5 focus:ring-[#714B67]'
                />
              </div>
            </div>
          </div>

          {/* Section 4: Status & Contract */}
          <div className='bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-gray-200/60 space-y-3'>
            <span className='text-[10px] font-bold uppercase tracking-wider text-[#714B67] block'>
              4. Status & Contract
            </span>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {/* Status */}
              <div>
                <label className='block text-xs font-bold text-gray-700 mb-1'>
                  Employment Status
                </label>
                <select
                  name='status'
                  value={formData.status}
                  onChange={handleChange}
                  className='w-full px-3 py-2 text-xs font-medium rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-1.5 focus:ring-[#714B67] cursor-pointer'
                >
                  <option value='Active'>Active</option>
                  <option value='Inactive'>Inactive</option>
                  <option value='On Leave'>On Leave</option>
                </select>
              </div>

              {/* Contract Status */}
              <div>
                <label className='block text-xs font-bold text-gray-700 mb-1'>
                  Contract Type
                </label>
                <select
                  name='contractStatus'
                  value={formData.contractStatus}
                  onChange={handleChange}
                  className='w-full px-3 py-2 text-xs font-medium rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-1.5 focus:ring-[#714B67] cursor-pointer'
                >
                  {contractOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='pt-2 flex items-center justify-end gap-2.5 border-t border-gray-100 shrink-0'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-xs font-bold text-gray-600 hover:text-[#1E293B] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='px-5 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5'
            >
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2.2'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
              </svg>
              <span>{isEditing ? 'Save Changes' : 'Save Employee'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
