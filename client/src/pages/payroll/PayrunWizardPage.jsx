import React, { useEffect, useState, useCallback } from 'react';
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

  const [step1Data, setStep1Data] = useState({
    name: '',
    structureId: '',
    startDate: '',
    endDate: '',
  });

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [searchEmployee, setSearchEmployee] = useState('');

  const loadWizardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, strRes, deptRes] = await Promise.allSettled([
        employeeApi.getEmployees({ limit: 150 }),
        salaryStructureApi.getSalaryStructures(),
        departmentApi.getDepartments(),
      ]);

      let empList = [];
      let strList = [];

      if (empRes.status === 'fulfilled') {
        empList = empRes.value?.employees || empRes.value?.data || [];
        setEmployees(Array.isArray(empList) ? empList : []);
        setSelectedEmployeeIds(Array.isArray(empList) ? empList.map((e) => e.id) : []);
      }

      if (strRes.status === 'fulfilled') {
        strList = strRes.value?.data || [];
        setSalaryStructures(Array.isArray(strList) ? strList : []);
      }

      if (deptRes.status === 'fulfilled') {
        setDepartments(deptRes.value?.data || []);
      }

      const now = new Date();
      const curYear = now.getFullYear();
      const curMonth = String(now.getMonth() + 1).padStart(2, '0');
      const start = `${curYear}-${curMonth}-01`;
      const lastDay = new Date(curYear, now.getMonth() + 1, 0).getDate();
      const end = `${curYear}-${curMonth}-${String(lastDay).padStart(2, '0')}`;

      setStep1Data({
        name: `${now.toLocaleString('default', { month: 'long' })} ${curYear} Payrun`,
        structureId: strList[0]?.id || '',
        startDate: start,
        endDate: end,
      });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to initialize payrun wizard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWizardData();
  }, [loadWizardData]);

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
      setFormError('Please select at least one employee.');
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

      const newPayrunId = res?.data?.id || res?.id;
      if (newPayrunId) {
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
    const code = (emp.employeeCode || '').toLowerCase();
    const searchMatches = !q || fullName.includes(q) || code.includes(q);

    return deptMatches && searchMatches;
  });

  if (loading) {
    return <LoadingState message='Setting up payrun wizard...' />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadWizardData} />;
  }

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <BackButton label='Back to Payruns' onClick={() => navigate('/payruns')} />

      <PageHeader
        title='Create Payroll Run'
        subtitle='Two-step payroll initialization: configure period and select workforce.'
      />

      {/* Step Indicator */}
      <div className='flex items-center gap-3'>
        <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-[#714B67]' : 'bg-gray-200'}`} />
        <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-[#714B67]' : 'bg-gray-200'}`} />
      </div>

      {formError && (
        <div className='p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold'>
          {formError}
        </div>
      )}

      {step === 1 ? (
        <div className='bg-white rounded-2xl border p-6'>
          <form onSubmit={handleStep1Submit} className='space-y-4 text-xs'>
            <div>
              <label className='block font-bold mb-1.5'>Payrun Batch Name *</label>
              <input type='text' required value={step1Data.name} onChange={(e) => setStep1Data({ ...step1Data, name: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border' />
            </div>

            <div>
              <label className='block font-bold mb-1.5'>Salary Structure *</label>
              <select required value={step1Data.structureId} onChange={(e) => setStep1Data({ ...step1Data, structureId: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border cursor-pointer'>
                <option value=''>Select structure</option>
                {salaryStructures.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
              </select>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block font-bold mb-1.5'>Period Start *</label>
                <input type='date' required value={step1Data.startDate} onChange={(e) => setStep1Data({ ...step1Data, startDate: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border cursor-pointer' />
              </div>
              <div>
                <label className='block font-bold mb-1.5'>Period End *</label>
                <input type='date' required value={step1Data.endDate} onChange={(e) => setStep1Data({ ...step1Data, endDate: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border cursor-pointer' />
              </div>
            </div>

            <div className='pt-4 flex justify-end gap-2 border-t'>
              <BackButton label='Cancel' onClick={() => navigate('/payruns')} />
              <button type='submit' className='px-5 py-2 text-xs font-bold text-white bg-[#714B67] rounded-xl cursor-pointer'>
                Continue →
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className='bg-white rounded-2xl border p-6 space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <h3 className='text-sm font-black'>Select Eligible Employees</h3>
              <p className='text-xs text-gray-500'>{selectedEmployeeIds.length} of {employees.length} selected</p>
            </div>
            <div className='flex items-center gap-2'>
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className='px-3 py-1.5 rounded-xl border text-xs cursor-pointer'>
                <option value='ALL'>All Departments</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button type='button' onClick={handleToggleSelectAll} className='px-3 py-1.5 text-xs font-bold text-[#714B67] bg-purple-50 rounded-xl cursor-pointer'>
                Toggle All
              </button>
            </div>
          </div>

          <input
            type='text'
            value={searchEmployee}
            onChange={(e) => setSearchEmployee(e.target.value)}
            placeholder='Search employees...'
            className='w-full px-3 py-2 rounded-xl border text-xs'
          />

          <div className='max-h-80 overflow-y-auto border rounded-xl'>
            {filteredEmployees.map((emp) => {
              const checked = selectedEmployeeIds.includes(emp.id);
              const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name;
              return (
                <div key={emp.id} onClick={() => handleToggleEmployee(emp.id)} className={`p-3 flex items-center justify-between cursor-pointer ${checked ? 'bg-[#FAF8F5]' : ''}`}>
                  <div className='flex items-center gap-3'>
                    <input type='checkbox' checked={checked} onChange={() => {}} className='rounded' />
                    <span className='text-xs font-bold'>{fullName}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${checked ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {checked ? 'Included' : 'Excluded'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className='pt-4 flex justify-between border-t'>
            <button type='button' onClick={() => setStep(1)} className='px-4 py-2 text-xs font-bold text-gray-600 rounded-xl cursor-pointer'>← Back</button>
            <button type='button' disabled={isSubmitting || selectedEmployeeIds.length === 0} onClick={handleFinalizePayrun} className={`px-5 py-2 text-xs font-bold text-white bg-[#714B67] rounded-xl cursor-pointer ${isSubmitting ? 'opacity-60' : ''}`}>
              {isSubmitting ? 'Creating...' : 'Create Payrun →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}