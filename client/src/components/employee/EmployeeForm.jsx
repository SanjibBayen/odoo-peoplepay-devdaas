import React, { useEffect, useState } from 'react';
import { DEPARTMENTS } from '../../data/employees.js';
import departmentApi from '../../services/departmentApi.js';
import jobPositionApi from '../../services/jobPositionApi.js';

const STATUS_MAP = {
  'Active': 'ACTIVE',
  'Inactive': 'INACTIVE',
  'On Leave': 'ON_LEAVE',
  'Terminated': 'TERMINATED',
};

function getInitialFormData(initialData) {
  if (initialData) {
    return {
      firstName: initialData.firstName || '',
      lastName: initialData.lastName || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      dateOfBirth: initialData.dateOfBirth || initialData.dob || '',
      joiningDate: initialData.joiningDate || '',
      department: initialData.department || 'General',
      departmentId: initialData.departmentId || null,
      jobPosition: initialData.jobPosition || '',
      jobPositionId: initialData.jobPositionId || null,
      employeeId: initialData.employeeId || initialData.employeeCode || '',
      status: initialData.status || 'Active',
      address: initialData.address || '',
    };
  }
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '1998-01-01',
    joiningDate: new Date().toISOString().split('T')[0],
    department: 'General',
    departmentId: null,
    jobPosition: '',
    jobPositionId: null,
    employeeId: `EMP-${Date.now().toString().slice(-4)}`,
    status: 'Active',
    address: '',
  };
}

export default function EmployeeForm({ isOpen, onClose, onSave, initialData = null }) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState(() => getInitialFormData(initialData));
  const [departmentList, setDepartmentList] = useState([]);
  const [jobPositionList, setJobPositionList] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    departmentApi.getDepartments()
      .then((res) => {
        const list = res?.data || [];
        if (Array.isArray(list) && list.length > 0) setDepartmentList(list);
      })
      .catch(() => {});

    jobPositionApi.getJobPositions()
      .then((res) => {
        const list = res?.data || [];
        if (Array.isArray(list) && list.length > 0) setJobPositionList(list);
      })
      .catch(() => {});
  }, []);

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
    if (!formData.email.trim()) {
      errs.email = 'Work email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Invalid email address.';
    }
    if (!formData.joiningDate) errs.joiningDate = 'Joining date is required.';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const selectedDeptObj = departmentList.find(
      (d) => d.name === formData.department || d.id === formData.departmentId
    );
    const selectedPosObj = jobPositionList.find(
      (p) => p.name === formData.jobPosition || p.id === formData.jobPositionId
    );

    // FIX: Map status to backend enum
    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone,
      dob: formData.dateOfBirth || null,
      joiningDate: formData.joiningDate,
      departmentId: selectedDeptObj?.id || formData.departmentId || null,
      jobPositionId: selectedPosObj?.id || formData.jobPositionId || null,
      employeeCode: formData.employeeId,
      status: STATUS_MAP[formData.status] || 'ACTIVE',
      address: formData.address,
    };

    onSave(payload);
  };

  const departmentOptions = departmentList.length > 0
    ? departmentList.map((d) => d.name)
    : DEPARTMENTS.filter((d) => d !== 'All Departments');

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fadeIn overflow-y-auto' role='dialog' aria-modal='true'>
      <div className='bg-white rounded-3xl p-5 sm:p-7 max-w-2xl w-full border border-[#EAE6DF] shadow-2xl relative my-8 max-h-[92vh] flex flex-col' onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className='flex items-center justify-between pb-4 border-b border-gray-100 shrink-0'>
          <div>
            <h2 className='text-lg sm:text-xl font-black text-[#1E293B]'>
              {isEditing ? 'Edit Employee Record' : 'Add New Employee'}
            </h2>
            <p className='text-xs text-gray-500 mt-0.5'>
              {isEditing ? `Update profile for ${formData.firstName} ${formData.lastName}` : 'Create a new employee profile.'}
            </p>
          </div>
          <button type='button' onClick={onClose} className='p-1.5 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer' aria-label='Close'>✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className='overflow-y-auto pr-1 py-4 space-y-5 flex-1'>
          {/* Section 1: Basic Identity */}
          <div className='bg-[#FAF8F5] p-3.5 rounded-2xl border space-y-3'>
            <span className='text-[10px] font-bold uppercase text-[#714B67]'>1. Basic Identity</span>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              <div>
                <label className='block text-xs font-bold mb-1'>First Name *</label>
                <input type='text' name='firstName' value={formData.firstName} onChange={handleChange} className='w-full px-3 py-2 text-xs rounded-xl bg-white border focus:outline-none focus:ring-1.5 focus:ring-[#714B67]' />
                {errors.firstName && <p className='text-[10px] text-rose-600 mt-1'>{errors.firstName}</p>}
              </div>
              <div>
                <label className='block text-xs font-bold mb-1'>Last Name *</label>
                <input type='text' name='lastName' value={formData.lastName} onChange={handleChange} className='w-full px-3 py-2 text-xs rounded-xl bg-white border focus:outline-none focus:ring-1.5 focus:ring-[#714B67]' />
                {errors.lastName && <p className='text-[10px] text-rose-600 mt-1'>{errors.lastName}</p>}
              </div>
              <div>
                <label className='block text-xs font-bold mb-1'>Employee ID</label>
                <input type='text' name='employeeId' value={formData.employeeId} onChange={handleChange} className='w-full px-3 py-2 text-xs font-mono rounded-xl bg-white border focus:outline-none focus:ring-1.5 focus:ring-[#714B67]' />
              </div>
            </div>
          </div>

          {/* Section 2: Contact */}
          <div className='bg-[#FAF8F5] p-3.5 rounded-2xl border space-y-3'>
            <span className='text-[10px] font-bold uppercase text-[#714B67]'>2. Contact Information</span>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-bold mb-1'>Work Email *</label>
                <input type='email' name='email' value={formData.email} onChange={handleChange} className='w-full px-3 py-2 text-xs rounded-xl bg-white border focus:outline-none focus:ring-1.5 focus:ring-[#714B67]' />
                {errors.email && <p className='text-[10px] text-rose-600 mt-1'>{errors.email}</p>}
              </div>
              <div>
                <label className='block text-xs font-bold mb-1'>Phone</label>
                <input type='tel' name='phone' value={formData.phone} onChange={handleChange} className='w-full px-3 py-2 text-xs rounded-xl bg-white border focus:outline-none focus:ring-1.5 focus:ring-[#714B67]' />
              </div>
            </div>
          </div>

          {/* Section 3: Employment */}
          <div className='bg-[#FAF8F5] p-3.5 rounded-2xl border space-y-3'>
            <span className='text-[10px] font-bold uppercase text-[#714B67]'>3. Employment & Role</span>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-bold mb-1'>Department *</label>
                <select name='department' value={formData.department} onChange={handleChange} className='w-full px-3 py-2 text-xs rounded-xl bg-white border cursor-pointer focus:outline-none focus:ring-1.5 focus:ring-[#714B67]'>
                  {departmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className='block text-xs font-bold mb-1'>Job Position</label>
                <input type='text' name='jobPosition' value={formData.jobPosition} onChange={handleChange} className='w-full px-3 py-2 text-xs rounded-xl bg-white border focus:outline-none focus:ring-1.5 focus:ring-[#714B67]' />
              </div>
              <div>
                <label className='block text-xs font-bold mb-1'>Date of Joining *</label>
                <input type='date' name='joiningDate' value={formData.joiningDate} onChange={handleChange} className='w-full px-3 py-2 text-xs rounded-xl bg-white border cursor-pointer focus:outline-none focus:ring-1.5 focus:ring-[#714B67]' />
                {errors.joiningDate && <p className='text-[10px] text-rose-600 mt-1'>{errors.joiningDate}</p>}
              </div>
              <div>
                <label className='block text-xs font-bold mb-1'>Date of Birth</label>
                <input type='date' name='dateOfBirth' value={formData.dateOfBirth} onChange={handleChange} className='w-full px-3 py-2 text-xs rounded-xl bg-white border cursor-pointer focus:outline-none focus:ring-1.5 focus:ring-[#714B67]' />
              </div>
            </div>
          </div>

          {/* Section 4: Status */}
          <div className='bg-[#FAF8F5] p-3.5 rounded-2xl border space-y-3'>
            <span className='text-[10px] font-bold uppercase text-[#714B67]'>4. Status</span>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-bold mb-1'>Employment Status</label>
                <select name='status' value={formData.status} onChange={handleChange} className='w-full px-3 py-2 text-xs rounded-xl bg-white border cursor-pointer focus:outline-none focus:ring-1.5 focus:ring-[#714B67]'>
                  <option value='Active'>Active</option>
                  <option value='Inactive'>Inactive</option>
                  <option value='On Leave'>On Leave</option>
                  <option value='Terminated'>Terminated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className='pt-2 flex items-center justify-end gap-2.5 border-t shrink-0'>
            <button type='button' onClick={onClose} className='px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer'>Cancel</button>
            <button type='submit' className='px-5 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl cursor-pointer'>
              {isEditing ? 'Save Changes' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}