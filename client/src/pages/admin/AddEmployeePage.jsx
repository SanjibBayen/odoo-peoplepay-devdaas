import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import authApi from '../../services/authApi.js';
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

  // Load initial dropdowns
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
          const list = deptRes.value?.data || [];
          setDepartments(Array.isArray(list) ? list : []);
        }
        if (typeRes.status === 'fulfilled') {
          const list = typeRes.value?.data || [];
          setEmployeeTypes(Array.isArray(list) ? list : []);
        }
        if (schRes.status === 'fulfilled') {
          const list = schRes.value?.data || [];
          setSchedules(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.warn('Failed to load dropdowns:', err);
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

    if (!deptId) {
      setJobPositions([]);
      return;
    }

    setLoadingPositions(true);
    try {
      const res = await jobPositionApi.getJobPositions({
        active: true,
        departmentId: deptId,
      });
      const list = res?.data || [];
      setJobPositions(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load positions:', err);
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

    if (!formData.firstName.trim()) errs.firstName = 'First name is required.';
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required.';

    const trimmedCode = formData.employeeCode.trim();
    if (!trimmedCode) errs.employeeCode = 'Employee ID is required.';
    else if (trimmedCode.length > 50) errs.employeeCode = 'Employee ID must not exceed 50 characters.';

    const trimmedEmail = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) errs.email = 'Work email is required.';
    else if (!emailRegex.test(trimmedEmail)) errs.email = 'Please provide a valid email.';

    if (!formData.departmentId) errs.departmentId = 'Department is required.';
    if (!formData.jobPositionId) errs.jobPositionId = 'Job position is required.';
    if (!formData.joiningDate) errs.joiningDate = 'Date of joining is required.';

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
      // Payload for POST /api/auth/register-employee (Magic Link flow - no password)
      const registerPayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        employeeCode: formData.employeeCode.trim(),
        email: formData.email.trim().toLowerCase(),
        joiningDate: formData.joiningDate,
        roleCodes: ['EMPLOYEE'],
        phone: formData.phone?.trim() || undefined,
        departmentId: formData.departmentId || undefined,
        jobPositionId: formData.jobPositionId || undefined,
        employeeTypeId: formData.employeeTypeId || undefined,
        scheduleId: formData.scheduleId || undefined,
      };

      // Call backend register-employee (sends magic link)
      const registerRes = await authApi.registerEmployee(registerPayload);

      setSuccessInfo({
        email: formData.email.trim().toLowerCase(),
        message: registerRes?.message || 'Employee created. Magic link sent for password setup.',
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        navigate('/employees');
      }, 2800);
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || '';

      if (serverMsg.toLowerCase().includes('already exists')) {
        setSubmitError(serverMsg);
      } else if (status === 403) {
        setSubmitError('You do not have permission to create employees.');
      } else if (!err.response) {
        setSubmitError('Unable to connect to the server. Please check your network.');
      } else {
        setSubmitError(extractErrorMessage(err, 'Failed to create employee.'));
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate('/employees');

  const inputClass = (fieldName) =>
    `w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
      fieldErrors[fieldName]
        ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
        : 'border-[#EAE6DF] focus:ring-[#714B67]/20 focus:border-[#714B67]'
    }`;

  return (
    <div className='max-w-4xl mx-auto space-y-6 pb-12'>
      <BackButton label='Back to Employees' onClick={() => navigate('/employees')} />

      <PageHeader
        title='Add New Employee'
        subtitle='Create an employee account and send them a magic link for password setup.'
        handwrittenNote='Fast Onboarding'
      />

      {/* Success Banner */}
      {successInfo && (
        <div className='p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3 shadow-xs animate-fadeIn'>
          <div className='w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 font-bold'>✓</div>
          <div>
            <p className='text-sm font-bold text-emerald-900'>Employee created successfully!</p>
            <p className='text-xs text-emerald-700 mt-0.5'>
              Magic link sent to <strong>{successInfo.email}</strong>. Redirecting...
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {submitError && (
        <div className='p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3 shadow-xs animate-fadeIn'>
          <div className='w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0 font-bold'>!</div>
          <div>
            <p className='text-sm font-bold text-rose-900'>Submission Failed</p>
            <p className='text-xs text-rose-700 mt-0.5'>{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className='space-y-6'>
        {/* SECTION 1 — BASIC IDENTITY */}
        <section className='bg-white border border-[#EAE6DF] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4'>
          <div className='flex items-center gap-2 border-b border-[#EAE6DF] pb-3'>
            <span className='w-6 h-6 rounded-full bg-purple-50 text-[#714B67] border border-purple-200 text-xs font-black flex items-center justify-center'>1</span>
            <h2 className='text-xs font-bold uppercase tracking-wider text-gray-700'>Basic Identity</h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-bold text-gray-700 mb-1.5'>First Name <span className='text-rose-500'>*</span></label>
              <input name='firstName' type='text' value={formData.firstName} onChange={handleInputChange} placeholder='e.g. Alex' className={inputClass('firstName')} />
              {fieldErrors.firstName && <p className='text-[11px] text-rose-600 mt-1'>{fieldErrors.firstName}</p>}
            </div>

            <div>
              <label className='block text-xs font-bold text-gray-700 mb-1.5'>Last Name <span className='text-rose-500'>*</span></label>
              <input name='lastName' type='text' value={formData.lastName} onChange={handleInputChange} placeholder='e.g. Morgan' className={inputClass('lastName')} />
              {fieldErrors.lastName && <p className='text-[11px] text-rose-600 mt-1'>{fieldErrors.lastName}</p>}
            </div>

            <div>
              <label className='block text-xs font-bold text-gray-700 mb-1.5'>Employee ID <span className='text-rose-500'>*</span></label>
              <input name='employeeCode' type='text' value={formData.employeeCode} onChange={handleInputChange} placeholder='EMP-2026-001' className={inputClass('employeeCode')} />
              {fieldErrors.employeeCode && <p className='text-[11px] text-rose-600 mt-1'>{fieldErrors.employeeCode}</p>}
            </div>

            <div>
              <label className='block text-xs font-bold text-gray-700 mb-1.5'>Gender <span className='text-gray-400 text-[10px]'>(Optional)</span></label>
              <select name='gender' value={formData.gender} onChange={handleInputChange} className='w-full px-3.5 py-2.5 bg-white border border-[#EAE6DF] rounded-xl text-xs cursor-pointer'>
                <option value=''>Select gender</option>
                <option value='Male'>Male</option>
                <option value='Female'>Female</option>
                <option value='Other'>Other</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 2 — CONTACT */}
        <section className='bg-white border border-[#EAE6DF] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4'>
          <div className='flex items-center gap-2 border-b border-[#EAE6DF] pb-3'>
            <span className='w-6 h-6 rounded-full bg-purple-50 text-[#714B67] border border-purple-200 text-xs font-black flex items-center justify-center'>2</span>
            <h2 className='text-xs font-bold uppercase tracking-wider text-gray-700'>Contact Information</h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-bold text-gray-700 mb-1.5'>Work Email <span className='text-rose-500'>*</span></label>
              <input name='email' type='email' value={formData.email} onChange={handleInputChange} placeholder='name@peoplepay.com' className={inputClass('email')} />
              {fieldErrors.email && <p className='text-[11px] text-rose-600 mt-1'>{fieldErrors.email}</p>}
            </div>

            <div>
              <label className='block text-xs font-bold text-gray-700 mb-1.5'>Phone <span className='text-gray-400 text-[10px]'>(Optional)</span></label>
              <input name='phone' type='tel' value={formData.phone} onChange={handleInputChange} placeholder='+91 98765 43210' className={inputClass('phone')} />
            </div>
          </div>
        </section>

        {/* SECTION 3 — EMPLOYMENT */}
        <section className='bg-white border border-[#EAE6DF] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4'>
          <div className='flex items-center gap-2 border-b border-[#EAE6DF] pb-3'>
            <span className='w-6 h-6 rounded-full bg-purple-50 text-[#714B67] border border-purple-200 text-xs font-black flex items-center justify-center'>3</span>
            <h2 className='text-xs font-bold uppercase tracking-wider text-gray-700'>Employment & Role</h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-bold text-gray-700 mb-1.5'>Department <span className='text-rose-500'>*</span></label>
              <select name='departmentId' value={formData.departmentId} onChange={(e) => handleDepartmentChange(e.target.value)} className={inputClass('departmentId')}>
                <option value=''>{loadingDropdowns ? 'Loading...' : 'Select department'}</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                ))}
              </select>
              {fieldErrors.departmentId && <p className='text-[11px] text-rose-600 mt-1'>{fieldErrors.departmentId}</p>}
            </div>

            <div>
              <label className='block text-xs font-bold text-gray-700 mb-1.5'>Job Position <span className='text-rose-500'>*</span></label>
              <select name='jobPositionId' value={formData.jobPositionId} onChange={handleInputChange} disabled={!formData.departmentId || loadingPositions} className={inputClass('jobPositionId')}>
                <option value=''>
                  {!formData.departmentId ? 'Select department first' : loadingPositions ? 'Loading...' : jobPositions.length === 0 ? 'No positions available' : 'Select position'}
                </option>
                {jobPositions.map((pos) => (
                  <option key={pos.id} value={pos.id}>{pos.name || pos.title}</option>
                ))}
              </select>
              {fieldErrors.jobPositionId && <p className='text-[11px] text-rose-600 mt-1'>{fieldErrors.jobPositionId}</p>}
            </div>

            <div>
              <label className='block text-xs font-bold text-gray-700 mb-1.5'>Employee Type <span className='text-gray-400 text-[10px]'>(Optional)</span></label>
              <select name='employeeTypeId' value={formData.employeeTypeId} onChange={handleInputChange} className='w-full px-3.5 py-2.5 bg-white border border-[#EAE6DF] rounded-xl text-xs cursor-pointer'>
                <option value=''>Select type</option>
                {employeeTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-xs font-bold text-gray-700 mb-1.5'>Work Schedule <span className='text-gray-400 text-[10px]'>(Optional)</span></label>
              <select name='scheduleId' value={formData.scheduleId} onChange={handleInputChange} className='w-full px-3.5 py-2.5 bg-white border border-[#EAE6DF] rounded-xl text-xs cursor-pointer'>
                <option value=''>Select schedule</option>
                {schedules.map((sch) => (
                  <option key={sch.id} value={sch.id}>{sch.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-xs font-bold text-gray-700 mb-1.5'>Date of Joining <span className='text-rose-500'>*</span></label>
              <input name='joiningDate' type='date' value={formData.joiningDate} onChange={handleInputChange} className={inputClass('joiningDate')} />
              {fieldErrors.joiningDate && <p className='text-[11px] text-rose-600 mt-1'>{fieldErrors.joiningDate}</p>}
            </div>
          </div>
        </section>

        {/* ACTION BUTTONS */}
        <div className='flex items-center justify-end gap-3 pt-4 border-t border-[#EAE6DF]'>
          <button type='button' onClick={handleCancel} disabled={isSubmitting} className='px-5 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl cursor-pointer disabled:opacity-50'>
            Cancel
          </button>
          <button type='submit' disabled={isSubmitting} className='px-6 py-2.5 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-2'>
            {isSubmitting ? (
              <>
                <svg className='animate-spin h-3.5 w-3.5' viewBox='0 0 24 24' fill='none'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8H4z' />
                </svg>
                Creating...
              </>
            ) : (
              'Save Employee'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}