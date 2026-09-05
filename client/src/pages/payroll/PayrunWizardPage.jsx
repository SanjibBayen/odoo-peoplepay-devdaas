import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import payrunApi from '../../services/payrunApi.js';
import employeeApi from '../../services/employeeApi.js';
import salaryStructureApi from '../../services/salaryStructureApi.js';
import departmentApi from '../../services/departmentApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function PayrunWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Step 1 Form Data
  const [step1Data, setStep1Data] = useState({
    name: '',
    structureId: '',
    startDate: '',
    endDate: '',
  });

  // Step 2 Selection
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [searchEmployee, setSearchEmployee] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [empRes, strRes, deptRes] = await Promise.allSettled([
          employeeApi.getEmployees({ limit: 150 }),
          salaryStructureApi.getSalaryStructures(),
          departmentApi.getDepartments(),
        ]);

        if (!active) return;

        let empList = [];
        let strList = [];

        if (empRes.status === 'fulfilled') {
          empList = empRes.value.data || (Array.isArray(empRes.value) ? empRes.value : []);
          setEmployees(empList);
          setSelectedEmployeeIds(empList.map((e) => e.id));
        }

        if (strRes.status === 'fulfilled') {
          strList = strRes.value.data || (Array.isArray(strRes.value) ? strRes.value : []);
          setSalaryStructures(strList);
        }

        if (deptRes.status === 'fulfilled') {
          setDepartments(deptRes.value.data || (Array.isArray(deptRes.value) ? deptRes.value : []));
        }

        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = String(now.getMonth() + 1).padStart(2, '0');
        const start = `${curYear}-${curMonth}-01`;
        const lastDay = new Date(curYear, now.getMonth() + 1, 0).getDate();
        const end = `${curYear}-${curMonth}-${String(lastDay).padStart(2, '0')}`;

        setStep1Data({
          name: `${now.toLocaleString('default', { month: 'long' })} ${curYear} Regular Payrun`,
          structureId: strList[0]?.id || '',
          startDate: start,
          endDate: end,
        });
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err, 'Failed to initialize payrun wizard.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setFormError(null);
    if (!step1Data.name.trim()) {
      setFormError('Please provide a payrun title.');
      return;
    }
    if (!step1Data.structureId) {
      setFormError('Please select a salary structure.');
      return;
    }
    setStep(2);
  };

  const handleToggleSelectAll = () => {
    const visibleIds = filteredEmployees.map((e) => e.id);
    const allSelected = visibleIds.every((id) => selectedEmployeeIds.includes(id));
    if (allSelected) {
      setSelectedEmployeeIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedEmployeeIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleEmployee = (id) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((empId) => empId !== id) : [...prev, id]
    );
  };

  const handleFinalizePayrun = async () => {
    if (selectedEmployeeIds.length === 0) {
      setFormError('Please select at least one employee for this payroll batch.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await payrunApi.createPayrun({
        name: step1Data.name,
        salaryStructureId: step1Data.structureId,
        periodStart: step1Data.startDate,
        periodEnd: step1Data.endDate,
      });

      const newPayrunId = res.data?.id || res.id;
      if (newPayrunId && selectedEmployeeIds.length > 0) {
        await payrunApi.addEmployeesToPayrun(newPayrunId, selectedEmployeeIds);
      }

      navigate(`/payruns/${newPayrunId}`);
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to create payrun batch.'));
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const deptMatches =
      departmentFilter === 'ALL' ||
      emp.departmentId === departmentFilter ||
      emp.department === departmentFilter ||
      emp.department?.name === departmentFilter;

    const q = searchEmployee.toLowerCase().trim();
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const code = (emp.employeeCode || emp.employeeId || '').toLowerCase();
    const searchMatches = !q || fullName.includes(q) || code.includes(q);

    return deptMatches && searchMatches;
  });

  if (loading) {
    return <LoadingState message='Setting up payrun wizard...' />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <BackButton label='Back to Payruns' fallback='/payruns' />
        <span className='text-xs font-bold text-gray-500'>
          Step {step} of 2: {step === 1 ? 'Period & Structure' : 'Employee Roster'}
        </span>
      </div>

      <PageHeader
        title='Create Payroll Run'
        subtitle='Two-step payroll initialization: configure pay period bounds and assign eligible workforce roster.'
      />

      {/* Step Indicator Bar */}
      <div className='flex items-center gap-3'>
        <div
          className={`flex-1 h-2 rounded-full transition-all ${
            step >= 1 ? 'bg-[#714B67]' : 'bg-gray-200'
          }`}
        />
        <div
          className={`flex-1 h-2 rounded-full transition-all ${
            step >= 2 ? 'bg-[#714B67]' : 'bg-gray-200'
          }`}
        />
      </div>

      {formError && (
        <div className='p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold'>
          {formError}
        </div>
      )}

      {step === 1 ? (
        <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-xs p-6'>
          <form onSubmit={handleStep1Submit} className='space-y-4 text-xs'>
            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>
                Payrun Batch Name *
              </label>
              <input
                type='text'
                required
                value={step1Data.name}
                onChange={(e) => setStep1Data({ ...step1Data, name: e.target.value })}
                placeholder='e.g. October 2026 Regular Payroll'
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs font-semibold'
              />
            </div>

            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>
                Salary Structure *
              </label>
              <select
                required
                value={step1Data.structureId}
                onChange={(e) => setStep1Data({ ...step1Data, structureId: e.target.value })}
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs font-semibold'
              >
                <option value=''>Select structure</option>
                {salaryStructures.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block font-bold text-gray-700 mb-1.5'>Period Start *</label>
                <input
                  type='date'
                  required
                  value={step1Data.startDate}
                  onChange={(e) => setStep1Data({ ...step1Data, startDate: e.target.value })}
                  className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs font-semibold'
                />
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1.5'>Period End *</label>
                <input
                  type='date'
                  required
                  value={step1Data.endDate}
                  onChange={(e) => setStep1Data({ ...step1Data, endDate: e.target.value })}
                  className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs font-semibold'
                />
              </div>
            </div>

            <div className='pt-4 flex justify-end gap-2 border-t border-gray-100'>
              <BackButton label='Cancel' fallback='/payruns' />
              <button
                type='submit'
                className='px-5 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer'
              >
                Continue to Select Workforce →
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-xs p-6 space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <h3 className='text-sm font-black text-[#1E293B]'>Select Eligible Employees</h3>
              <p className='text-xs text-gray-500 font-medium'>
                {selectedEmployeeIds.length} of {employees.length} employees selected
              </p>
            </div>

            <div className='flex items-center gap-2'>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className='px-3 py-1.5 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs font-bold'
              >
                <option value='ALL'>All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <button
                type='button'
                onClick={handleToggleSelectAll}
                className='px-3 py-1.5 text-xs font-bold text-[#714B67] bg-purple-50 hover:bg-purple-100 rounded-xl cursor-pointer'
              >
                Toggle Visible All
              </button>
            </div>
          </div>

          <div className='relative'>
            <input
              type='text'
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              placeholder='Search employees by name or code...'
              className='w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs'
            />
            <span className='absolute left-2.5 top-2.5 text-gray-400'>
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
              </svg>
            </span>
          </div>

          <div className='max-h-80 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl'>
            {filteredEmployees.map((emp) => {
              const checked = selectedEmployeeIds.includes(emp.id);
              const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name;
              const deptName = emp.department?.name || emp.department || 'General';

              return (
                <div
                  key={emp.id}
                  onClick={() => handleToggleEmployee(emp.id)}
                  className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                    checked ? 'bg-[#FAF8F5]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    <input
                      type='checkbox'
                      checked={checked}
                      onChange={() => {}}
                      className='rounded text-[#714B67] focus:ring-[#714B67]'
                    />
                    <div>
                      <div className='text-xs font-bold text-gray-900'>{fullName}</div>
                      <div className='text-[10px] text-gray-500 font-medium'>
                        {emp.employeeCode || emp.employeeId} • {deptName}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      checked
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                  >
                    {checked ? 'Included' : 'Excluded'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className='pt-4 flex justify-between items-center border-t border-gray-100'>
            <button
              type='button'
              onClick={() => setStep(1)}
              className='px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer'
            >
              ← Back to Step 1
            </button>

            <button
              type='button'
              disabled={isSubmitting || selectedEmployeeIds.length === 0}
              onClick={handleFinalizePayrun}
              className={`px-5 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer ${
                isSubmitting || selectedEmployeeIds.length === 0 ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Creating Payrun...' : 'Initialize & Generate Payrun →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
