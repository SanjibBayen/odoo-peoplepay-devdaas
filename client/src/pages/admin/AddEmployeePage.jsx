import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import authApi from '../../services/authApi.js';
import employeeApi from '../../services/employeeApi.js';
import departmentApi from '../../services/departmentApi.js';
import jobPositionApi from '../../services/jobPositionApi.js';
import employeeTypeApi from '../../services/employeeTypeApi.js';
import scheduleApi from '../../services/scheduleApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function AddEmployeePage() {
  const navigate = useNavigate();

  // Reference data lists
  const [departments, setDepartments] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // Loading states
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [positionsError, setPositionsError] = useState(null);

  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Form data state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeCode: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    departmentId: '',
    jobPositionId: '',
    employeeTypeId: '',
    scheduleId: '',
    joiningDate: new Date().toISOString().split('T')[0],
    dob: '',
    bankAccountNumber: '',
    bankName: '',
    ifscCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  // Load initial dropdowns (Departments, Employee Types, Schedules) on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [deptRes, typeRes, schRes] = await Promise.allSettled([
          departmentApi.getDepartments({ active: true }),
          employeeTypeApi.getEmployeeTypes({ active: true }),
          scheduleApi.getSchedules({ active: true }),
        ]);

        if (!active) return;

        if (deptRes.status === 'fulfilled') {
          const list = deptRes.value.data || (Array.isArray(deptRes.value) ? deptRes.value : []);
          setDepartments(list);
        }
        if (typeRes.status === 'fulfilled') {
          const list = typeRes.value.data || (Array.isArray(typeRes.value) ? typeRes.value : []);
          setEmployeeTypes(list);
        }
        if (schRes.status === 'fulfilled') {
          const list = schRes.value.data || (Array.isArray(schRes.value) ? schRes.value : []);
          setSchedules(list);
        }
      } catch (err) {
        if (active) {
          setSubmitError(extractErrorMessage(err, 'Failed to load organization settings.'));
        }
      } finally {
        if (active) setLoadingDropdowns(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Fetch job positions when department changes
  const handleDepartmentChange = async (deptId) => {
    setFormData((prev) => ({
      ...prev,
      departmentId: deptId,
      jobPositionId: '',
    }));

    if (fieldErrors.departmentId) {
      setFieldErrors((prev) => ({ ...prev, departmentId: null }));
    }

    if (!deptId) {
      setJobPositions([]);
      setPositionsError(null);
      return;
    }

    setLoadingPositions(true);
    setPositionsError(null);
    try {
      const res = await jobPositionApi.getJobPositions({
        active: true,
        departmentId: deptId,
      });
      const list = res.data || (Array.isArray(res) ? res : []);
      setJobPositions(list);
    } catch (err) {
      setPositionsError(extractErrorMessage(err, 'Unable to load job positions.'));
      setJobPositions([]);
    } finally {
      setLoadingPositions(false);
    }
  };

  // Generic input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  // Client-side validation
  const validateForm = () => {
    const errs = {};
    const today = new Date().toISOString().split('T')[0];

    // Basic Identity
    const trimmedFirstName = formData.firstName.trim();
    if (!trimmedFirstName) {
      errs.firstName = 'First name is required.';
    } else if (trimmedFirstName.length > 100) {
      errs.firstName = 'First name must not exceed 100 characters.';
    }

    const trimmedLastName = formData.lastName.trim();
    if (!trimmedLastName) {
      errs.lastName = 'Last name is required.';
    } else if (trimmedLastName.length > 100) {
      errs.lastName = 'Last name must not exceed 100 characters.';
    }

    const trimmedCode = formData.employeeCode.trim();
    if (!trimmedCode) {
      errs.employeeCode = 'Employee ID is required.';
    } else if (trimmedCode.length > 50) {
      errs.employeeCode = 'Employee ID must not exceed 50 characters.';
    }

    // Contact Information
    const trimmedEmail = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errs.email = 'Work email is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errs.email = 'Please provide a valid work email address.';
    }

    if (formData.phone && formData.phone.length > 30) {
      errs.phone = 'Phone number must not exceed 30 characters.';
    }

    // Employment & Role
    if (!formData.departmentId) {
      errs.departmentId = 'Department selection is required.';
    }

    if (!formData.jobPositionId) {
      errs.jobPositionId = 'Job position selection is required.';
    }

    if (!formData.joiningDate) {
      errs.joiningDate = 'Date of joining is required.';
    }

    if (formData.dob) {
      if (formData.dob >= today) {
        errs.dob = 'Date of birth must be a past date.';
      }
    }

    // Bank Details
    if (formData.bankAccountNumber && formData.bankAccountNumber.length > 100) {
      errs.bankAccountNumber = 'Account number must not exceed 100 characters.';
    }
    if (formData.bankName && formData.bankName.length > 150) {
      errs.bankName = 'Bank name must not exceed 150 characters.';
    }
    if (formData.ifscCode && formData.ifscCode.length > 50) {
      errs.ifscCode = 'IFSC code must not exceed 50 characters.';
    }

    // Emergency Contact
    if (formData.emergencyContactName && formData.emergencyContactName.length > 150) {
      errs.emergencyContactName = 'Contact name must not exceed 150 characters.';
    }
    if (formData.emergencyContactPhone && formData.emergencyContactPhone.length > 30) {
      errs.emergencyContactPhone = 'Contact phone must not exceed 30 characters.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean payload for POST /api/auth/register-employee
      const registerPayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        employeeCode: formData.employeeCode.trim(),
        email: formData.email.trim().toLowerCase(),
        joiningDate: formData.joiningDate,
        roleCodes: ['EMPLOYEE'],
        phone: formData.phone.trim() || undefined,
        departmentId: formData.departmentId || undefined,
        jobPositionId: formData.jobPositionId || undefined,
        employeeTypeId: formData.employeeTypeId || undefined,
        scheduleId: formData.scheduleId || undefined,
        gender: formData.gender || undefined,
        address: formData.address.trim() || undefined,
        dob: formData.dob || undefined,
        bankAccountNumber: formData.bankAccountNumber.trim() || undefined,
        bankName: formData.bankName.trim() || undefined,
        ifscCode: formData.ifscCode.trim() || undefined,
        emergencyContactName: formData.emergencyContactName.trim() || undefined,
        emergencyContactPhone: formData.emergencyContactPhone.trim() || undefined,
      };

      // Call authoritative backend endpoint
      const registerRes = await authApi.registerEmployee(registerPayload);

      // Check if newly created employee ID needs supplementary profile fields
      const createdEmployeeId = registerRes?.employee?.id;
      if (createdEmployeeId) {
        const extraPayload = {};
        if (formData.gender) extraPayload.gender = formData.gender;
        if (formData.dob) extraPayload.dob = formData.dob;
        if (formData.address.trim()) extraPayload.address = formData.address.trim();
        if (formData.scheduleId) extraPayload.scheduleId = formData.scheduleId;
        if (formData.bankAccountNumber.trim()) extraPayload.bankAccountNumber = formData.bankAccountNumber.trim();
        if (formData.bankName.trim()) extraPayload.bankName = formData.bankName.trim();
        if (formData.ifscCode.trim()) extraPayload.ifscCode = formData.ifscCode.trim();
        if (formData.emergencyContactName.trim()) extraPayload.emergencyContactName = formData.emergencyContactName.trim();
        if (formData.emergencyContactPhone.trim()) extraPayload.emergencyContactPhone = formData.emergencyContactPhone.trim();

        if (Object.keys(extraPayload).length > 0) {
          try {
            await employeeApi.updateEmployee(createdEmployeeId, extraPayload);
          } catch {
            // Supplementary field sync failure is non-blocking to magic link creation
          }
        }
      }

      setSuccessInfo({
        email: formData.email.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        employeeCode: formData.employeeCode.trim(),
        message: registerRes?.message || 'Employee created. Magic link sent for password setup.',
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Auto-navigate to workforce list after 2.8s
      setTimeout(() => {
        navigate('/employees');
      }, 2800);
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || err.message || '';

      if (status === 409 || serverMsg.toLowerCase().includes('already exists')) {
        if (serverMsg.toLowerCase().includes('code')) {
          setSubmitError('Employee ID already exists in the system.');
        } else {
          setSubmitError('An employee with this email address already exists.');
        }
      } else if (status === 403) {
        setSubmitError('You do not have permission to create employees.');
      } else if (status === 400) {
        setSubmitError(extractErrorMessage(err, 'Invalid employee data submitted. Please check the fields.'));
      } else if (!err.response) {
        setSubmitError('Unable to connect to the PeoplePay server. Please check your network connection.');
      } else {
        setSubmitError(extractErrorMessage(err, 'Failed to create employee.'));
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/employees');
  };

  return (
    <div className='max-w-4xl mx-auto space-y-6 pb-12'>
      {/* Page Header with Back Button */}
      <div className='flex items-center justify-between gap-3'>
        <BackButton label='Back to Employees' onClick={() => navigate('/employees')} />
      </div>

      <PageHeader
        title='Add New Employee'
        subtitle='Create an employee account and send them a magic link for password setup.'
        handwrittenNote='Fast Onboarding'
      />

      {/* Success Notification Banner */}
      {successInfo && (
        <div
          role='alert'
          className='p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fadeIn'
        >
          <div className='flex items-start gap-3'>
            <div className='w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 font-bold'>
              ✓
            </div>
            <div>
              <p className='text-sm font-bold text-emerald-900'>Employee created successfully!</p>
              <p className='text-xs text-emerald-700 mt-0.5'>
                Magic link sent to <strong>{successInfo.email}</strong> for password setup. Redirecting to employee list...
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={() => navigate('/employees')}
            className='px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer'
          >
            View Employees Now
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {submitError && (
        <div
          role='alert'
          className='p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3 shadow-xs animate-fadeIn'
        >
          <div className='w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0 font-bold'>
            !
          </div>
          <div>
            <p className='text-sm font-bold text-rose-900'>Submission Failed</p>
            <p className='text-xs text-rose-700 mt-0.5'>{submitError}</p>
          </div>
        </div>
      )}

      {/* Main Employee Creation Form */}
      <form onSubmit={handleSubmit} noValidate className='space-y-6'>
        {/* SECTION 1 — BASIC IDENTITY */}
        <section className='bg-white border border-[#EAE6DF] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4'>
          <div className='flex items-center gap-2 border-b border-[#EAE6DF] pb-3'>
            <span className='w-6 h-6 rounded-full bg-purple-50 text-[#714B67] border border-purple-200 text-xs font-black flex items-center justify-center'>
              1
            </span>
            <h2 className='text-xs font-bold uppercase tracking-wider text-gray-700'>
              Basic Identity
            </h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* First Name */}
            <div>
              <label htmlFor='firstName' className='block text-xs font-bold text-gray-700 mb-1.5'>
                First Name <span className='text-rose-500'>*</span>
              </label>
              <input
                id='firstName'
                name='firstName'
                type='text'
                required
                maxLength={100}
                placeholder='e.g. Alex'
                value={formData.firstName}
                onChange={handleInputChange}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.firstName
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-[#EAE6DF] focus:ring-[#714B67]/20 focus:border-[#714B67]'
                }`}
              />
              {fieldErrors.firstName && (
                <p className='text-[11px] text-rose-600 font-medium mt-1'>{fieldErrors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor='lastName' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Last Name <span className='text-rose-500'>*</span>
              </label>
              <input
                id='lastName'
                name='lastName'
                type='text'
                required
                maxLength={100}
                placeholder='e.g. Morgan'
                value={formData.lastName}
                onChange={handleInputChange}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.lastName
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-[#EAE6DF] focus:ring-[#714B67]/20 focus:border-[#714B67]'
                }`}
              />
              {fieldErrors.lastName && (
                <p className='text-[11px] text-rose-600 font-medium mt-1'>{fieldErrors.lastName}</p>
              )}
            </div>

            {/* Employee ID (employeeCode) */}
            <div>
              <label htmlFor='employeeCode' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Employee ID <span className='text-rose-500'>*</span>
              </label>
              <input
                id='employeeCode'
                name='employeeCode'
                type='text'
                required
                maxLength={50}
                placeholder='EMP-2026-874'
                value={formData.employeeCode}
                onChange={handleInputChange}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.employeeCode
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-[#EAE6DF] focus:ring-[#714B67]/20 focus:border-[#714B67]'
                }`}
              />
              {fieldErrors.employeeCode && (
                <p className='text-[11px] text-rose-600 font-medium mt-1'>{fieldErrors.employeeCode}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label htmlFor='gender' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Gender <span className='text-gray-400 text-[10px]'>(Optional)</span>
              </label>
              <select
                id='gender'
                name='gender'
                value={formData.gender}
                onChange={handleInputChange}
                className='w-full px-3.5 py-2.5 bg-white border border-[#EAE6DF] rounded-xl text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all cursor-pointer'
              >
                <option value=''>Select gender</option>
                <option value='Male'>Male</option>
                <option value='Female'>Female</option>
                <option value='Other'>Other</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 2 — CONTACT INFORMATION */}
        <section className='bg-white border border-[#EAE6DF] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4'>
          <div className='flex items-center gap-2 border-b border-[#EAE6DF] pb-3'>
            <span className='w-6 h-6 rounded-full bg-purple-50 text-[#714B67] border border-purple-200 text-xs font-black flex items-center justify-center'>
              2
            </span>
            <h2 className='text-xs font-bold uppercase tracking-wider text-gray-700'>
              Contact Information
            </h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Work Email */}
            <div>
              <label htmlFor='email' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Work Email <span className='text-rose-500'>*</span>
              </label>
              <input
                id='email'
                name='email'
                type='email'
                required
                placeholder='name@peoplepay.com'
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.email
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-[#EAE6DF] focus:ring-[#714B67]/20 focus:border-[#714B67]'
                }`}
              />
              {fieldErrors.email && (
                <p className='text-[11px] text-rose-600 font-medium mt-1'>{fieldErrors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor='phone' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Phone Number <span className='text-gray-400 text-[10px]'>(Optional)</span>
              </label>
              <input
                id='phone'
                name='phone'
                type='tel'
                maxLength={30}
                placeholder='+91 98765 43210'
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.phone
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-[#EAE6DF] focus:ring-[#714B67]/20 focus:border-[#714B67]'
                }`}
              />
              {fieldErrors.phone && (
                <p className='text-[11px] text-rose-600 font-medium mt-1'>{fieldErrors.phone}</p>
              )}
            </div>

            {/* Address */}
            <div className='md:col-span-2'>
              <label htmlFor='address' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Address <span className='text-gray-400 text-[10px]'>(Optional)</span>
              </label>
              <textarea
                id='address'
                name='address'
                rows={2}
                placeholder='Enter address'
                value={formData.address}
                onChange={handleInputChange}
                className='w-full px-3.5 py-2.5 bg-white border border-[#EAE6DF] rounded-xl text-xs text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all resize-none'
              />
            </div>
          </div>
        </section>

        {/* SECTION 3 — EMPLOYMENT & ROLE */}
        <section className='bg-white border border-[#EAE6DF] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4'>
          <div className='flex items-center gap-2 border-b border-[#EAE6DF] pb-3'>
            <span className='w-6 h-6 rounded-full bg-purple-50 text-[#714B67] border border-purple-200 text-xs font-black flex items-center justify-center'>
              3
            </span>
            <h2 className='text-xs font-bold uppercase tracking-wider text-gray-700'>
              Employment & Role
            </h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Department */}
            <div>
              <label htmlFor='departmentId' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Department <span className='text-rose-500'>*</span>
              </label>
              <select
                id='departmentId'
                name='departmentId'
                required
                value={formData.departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                disabled={loadingDropdowns}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1E293B] focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                  fieldErrors.departmentId
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-[#EAE6DF] focus:ring-[#714B67]/20 focus:border-[#714B67]'
                }`}
              >
                <option value=''>
                  {loadingDropdowns ? 'Loading departments...' : 'Select department'}
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              {fieldErrors.departmentId && (
                <p className='text-[11px] text-rose-600 font-medium mt-1'>{fieldErrors.departmentId}</p>
              )}
            </div>

            {/* Job Position (Filtered by Department) */}
            <div>
              <label htmlFor='jobPositionId' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Job Position <span className='text-rose-500'>*</span>
              </label>
              <select
                id='jobPositionId'
                name='jobPositionId'
                required
                value={formData.jobPositionId}
                onChange={handleInputChange}
                disabled={!formData.departmentId || loadingPositions}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1E293B] focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                  fieldErrors.jobPositionId
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-[#EAE6DF] focus:ring-[#714B67]/20 focus:border-[#714B67]'
                }`}
              >
                <option value=''>
                  {!formData.departmentId
                    ? 'First select a department above'
                    : loadingPositions
                    ? 'Loading positions...'
                    : jobPositions.length === 0
                    ? 'No job positions available for this department'
                    : 'Select job position'}
                </option>
                {jobPositions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.title || pos.name}
                  </option>
                ))}
              </select>
              {fieldErrors.jobPositionId && (
                <p className='text-[11px] text-rose-600 font-medium mt-1'>{fieldErrors.jobPositionId}</p>
              )}
              {positionsError && (
                <p className='text-[11px] text-amber-700 font-medium mt-1'>{positionsError}</p>
              )}
            </div>

            {/* Employee Type */}
            <div>
              <label htmlFor='employeeTypeId' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Employee Type <span className='text-gray-400 text-[10px]'>(Optional)</span>
              </label>
              <select
                id='employeeTypeId'
                name='employeeTypeId'
                value={formData.employeeTypeId}
                onChange={handleInputChange}
                className='w-full px-3.5 py-2.5 bg-white border border-[#EAE6DF] rounded-xl text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all cursor-pointer'
              >
                <option value=''>Select employment type</option>
                {employeeTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Work Schedule */}
            <div>
              <label htmlFor='scheduleId' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Work Schedule <span className='text-gray-400 text-[10px]'>(Optional)</span>
              </label>
              <select
                id='scheduleId'
                name='scheduleId'
                value={formData.scheduleId}
                onChange={handleInputChange}
                className='w-full px-3.5 py-2.5 bg-white border border-[#EAE6DF] rounded-xl text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all cursor-pointer'
              >
                <option value=''>Select work schedule</option>
                {schedules.map((sch) => (
                  <option key={sch.id} value={sch.id}>
                    {sch.name} {sch.code ? `(${sch.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date of Joining */}
            <div>
              <label htmlFor='joiningDate' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Date of Joining <span className='text-rose-500'>*</span>
              </label>
              <input
                id='joiningDate'
                name='joiningDate'
                type='date'
                required
                value={formData.joiningDate}
                onChange={handleInputChange}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1E293B] focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                  fieldErrors.joiningDate
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-[#EAE6DF] focus:ring-[#714B67]/20 focus:border-[#714B67]'
                }`}
              />
              {fieldErrors.joiningDate && (
                <p className='text-[11px] text-rose-600 font-medium mt-1'>{fieldErrors.joiningDate}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor='dob' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Date of Birth <span className='text-gray-400 text-[10px]'>(Optional)</span>
              </label>
              <input
                id='dob'
                name='dob'
                type='date'
                value={formData.dob}
                onChange={handleInputChange}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1E293B] focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                  fieldErrors.dob
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-[#EAE6DF] focus:ring-[#714B67]/20 focus:border-[#714B67]'
                }`}
              />
              {fieldErrors.dob && (
                <p className='text-[11px] text-rose-600 font-medium mt-1'>{fieldErrors.dob}</p>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 4 — BANK DETAILS */}
        <section className='bg-white border border-[#EAE6DF] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4'>
          <div className='flex items-center gap-2 border-b border-[#EAE6DF] pb-3'>
            <span className='w-6 h-6 rounded-full bg-purple-50 text-[#714B67] border border-purple-200 text-xs font-black flex items-center justify-center'>
              4
            </span>
            <h2 className='text-xs font-bold uppercase tracking-wider text-gray-700'>
              Bank Details
            </h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Bank Account Number */}
            <div>
              <label htmlFor='bankAccountNumber' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Bank Account Number <span className='text-gray-400 text-[10px]'>(Optional)</span>
              </label>
              <input
                id='bankAccountNumber'
                name='bankAccountNumber'
                type='text'
                maxLength={100}
                placeholder='Enter account number'
                value={formData.bankAccountNumber}
                onChange={handleInputChange}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.bankAccountNumber
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-[#EAE6DF] focus:ring-[#714B67]/20 focus:border-[#714B67]'
                }`}
              />
              {fieldErrors.bankAccountNumber && (
                <p className='text-[11px] text-rose-600 font-medium mt-1'>{fieldErrors.bankAccountNumber}</p>
              )}
            </div>

            {/* Bank Name */}
            <div>
              <label htmlFor='bankName' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Bank Name <span className='text-gray-400 text-[10px]'>(Optional)</span>
              </label>
              <input
                id='bankName'
                name='bankName'
                type='text'
                maxLength={150}
                placeholder='e.g. HDFC Bank'
                value={formData.bankName}
                onChange={handleInputChange}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.bankName
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-[#EAE6DF] focus:ring-[#714B67]/20 focus:border-[#714B67]'
                }`}
              />
              {fieldErrors.bankName && (
                <p className='text-[11px] text-rose-600 font-medium mt-1'>{fieldErrors.bankName}</p>
              )}
            </div>

            {/* IFSC Code */}
            <div>
              <label htmlFor='ifscCode' className='block text-xs font-bold text-gray-700 mb-1.5'>
                IFSC Code <span className='text-gray-400 text-[10px]'>(Optional)</span>
              </label>
              <input
                id='ifscCode'
                name='ifscCode'
                type='text'
                maxLength={50}
                placeholder='e.g. HDFC0001234'
                value={formData.ifscCode}
                onChange={handleInputChange}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1E293B] placeholder-gray-400 uppercase focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.ifscCode
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-[#EAE6DF] focus:ring-[#714B67]/20 focus:border-[#714B67]'
                }`}
              />
              {fieldErrors.ifscCode && (
                <p className='text-[11px] text-rose-600 font-medium mt-1'>{fieldErrors.ifscCode}</p>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 5 — EMERGENCY CONTACT */}
        <section className='bg-white border border-[#EAE6DF] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4'>
          <div className='flex items-center gap-2 border-b border-[#EAE6DF] pb-3'>
            <span className='w-6 h-6 rounded-full bg-purple-50 text-[#714B67] border border-purple-200 text-xs font-black flex items-center justify-center'>
              5
            </span>
            <h2 className='text-xs font-bold uppercase tracking-wider text-gray-700'>
              Emergency Contact
            </h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Contact Name */}
            <div>
              <label htmlFor='emergencyContactName' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Contact Name <span className='text-gray-400 text-[10px]'>(Optional)</span>
              </label>
              <input
                id='emergencyContactName'
                name='emergencyContactName'
                type='text'
                maxLength={150}
                placeholder='e.g. John Morgan'
                value={formData.emergencyContactName}
                onChange={handleInputChange}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.emergencyContactName
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-[#EAE6DF] focus:ring-[#714B67]/20 focus:border-[#714B67]'
                }`}
              />
              {fieldErrors.emergencyContactName && (
                <p className='text-[11px] text-rose-600 font-medium mt-1'>{fieldErrors.emergencyContactName}</p>
              )}
            </div>

            {/* Contact Phone */}
            <div>
              <label htmlFor='emergencyContactPhone' className='block text-xs font-bold text-gray-700 mb-1.5'>
                Contact Phone <span className='text-gray-400 text-[10px]'>(Optional)</span>
              </label>
              <input
                id='emergencyContactPhone'
                name='emergencyContactPhone'
                type='tel'
                maxLength={30}
                placeholder='+91 98765 43211'
                value={formData.emergencyContactPhone}
                onChange={handleInputChange}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.emergencyContactPhone
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-[#EAE6DF] focus:ring-[#714B67]/20 focus:border-[#714B67]'
                }`}
              />
              {fieldErrors.emergencyContactPhone && (
                <p className='text-[11px] text-rose-600 font-medium mt-1'>{fieldErrors.emergencyContactPhone}</p>
              )}
            </div>
          </div>
        </section>

        {/* BOTTOM ACTION BAR */}
        <div className='flex items-center justify-end gap-3 pt-4 border-t border-[#EAE6DF]'>
          <button
            type='button'
            onClick={handleCancel}
            disabled={isSubmitting}
            className='px-5 py-2.5 text-xs font-bold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all cursor-pointer disabled:opacity-50'
          >
            Cancel
          </button>

          <button
            type='submit'
            disabled={isSubmitting}
            className='px-6 py-2.5 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs hover:shadow transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:transform-none flex items-center gap-2'
          >
            {isSubmitting ? (
              <>
                <svg className='animate-spin h-3.5 w-3.5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z'></path>
                </svg>
                <span>Creating employee...</span>
              </>
            ) : (
              <span>Save Employee</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
