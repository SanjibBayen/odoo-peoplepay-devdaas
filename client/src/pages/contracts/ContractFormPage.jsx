import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import contractApi from '../../services/contractApi.js';
import employeeApi from '../../services/employeeApi.js';
import salaryStructureApi from '../../services/salaryStructureApi.js';
import scheduleApi from '../../services/scheduleApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';
import { validateContractForm } from '../../utils/validators.js';

export default function ContractFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [employees, setEmployees] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [formData, setFormData] = useState({
    employeeId: '',
    contractNumber: '',
    salaryStructureId: '',
    workScheduleId: '',
    wage: 65000,
    wageType: 'MONTHLY',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    notes: '',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [empRes, strRes, schRes] = await Promise.allSettled([
          employeeApi.getEmployees({ limit: 100 }),
          salaryStructureApi.getSalaryStructures(),
          scheduleApi.getSchedules(),
        ]);

        if (!active) return;

        let empList = [];
        let strList = [];
        let schList = [];

        if (empRes.status === 'fulfilled') {
          empList = empRes.value.data || (Array.isArray(empRes.value) ? empRes.value : []);
          setEmployees(empList);
        }
        if (strRes.status === 'fulfilled') {
          strList = strRes.value.data || (Array.isArray(strRes.value) ? strRes.value : []);
          setSalaryStructures(strList);
        }
        if (schRes.status === 'fulfilled') {
          schList = schRes.value.data || (Array.isArray(schRes.value) ? schRes.value : []);
          setSchedules(schList);
        }

        if (isEdit) {
          const contractRes = await contractApi.getContractById(id);
          const c = contractRes.data || contractRes;
          setFormData({
            employeeId: c.employeeId || c.employee?.id || '',
            contractNumber: c.contractNumber || c.contractCode || '',
            salaryStructureId: c.salaryStructureId || '',
            workScheduleId: c.workScheduleId || '',
            wage: Number(c.wage || 65000),
            wageType: c.wageType || 'MONTHLY',
            startDate: c.startDate ? c.startDate.split('T')[0] : '',
            endDate: c.endDate ? c.endDate.split('T')[0] : '',
            status: c.status || 'ACTIVE',
            notes: c.notes || '',
          });
        } else {
          const today = new Date().toISOString().split('T')[0];
          setFormData({
            employeeId: empList[0]?.id || '',
            contractNumber: `CNT-${Date.now().toString().slice(-6)}`,
            salaryStructureId: strList[0]?.id || '',
            workScheduleId: schList[0]?.id || '',
            wage: 65000,
            wageType: 'MONTHLY',
            startDate: today,
            endDate: '',
            status: 'ACTIVE',
            notes: '',
          });
        }
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err, 'Failed to initialize contract form.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateContractForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const payload = {
      employeeId: formData.employeeId,
      contractNumber: formData.contractNumber || `CNT-${Date.now().toString().slice(-6)}`,
      salaryStructureId: formData.salaryStructureId || undefined,
      workScheduleId: formData.workScheduleId || undefined,
      wage: Number(formData.wage),
      wageType: formData.wageType,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      status: formData.status,
      notes: formData.notes || undefined,
    };

    try {
      if (isEdit) {
        await contractApi.updateContract(id, payload);
        navigate(`/contracts/${id}`);
      } else {
        const res = await contractApi.createContract(payload);
        const newId = res.data?.id || res.id;
        navigate(newId ? `/contracts/${newId}` : '/contracts');
      }
    } catch (err) {
      setFormErrors({ general: extractErrorMessage(err, 'Failed to save contract.') });
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState message='Loading contract details...' />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <BackButton label='Back to Contracts' fallback='/contracts' />
        <span className='text-xs font-mono font-bold text-gray-500 bg-[#FAF8F5] px-3 py-1 rounded-xl border border-gray-200'>
          {isEdit ? `Editing: ${formData.contractNumber}` : 'New Contract'}
        </span>
      </div>

      <PageHeader
        title={isEdit ? 'Edit Employment Contract' : 'Create Employment Contract'}
        subtitle='Define compensation package, salary structure binding, and contract dates.'
      />

      {formErrors.general && (
        <div className='p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold'>
          {formErrors.general}
        </div>
      )}

      <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-xs p-6 sm:p-8'>
        <form onSubmit={handleSubmit} className='space-y-4 text-xs'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>
                Employee *
              </label>
              <select
                required
                disabled={isEdit}
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              >
                <option value=''>Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : emp.name} ({emp.employeeCode || emp.employeeId})
                  </option>
                ))}
              </select>
              {formErrors.employeeId && (
                <p className='text-[11px] text-red-600 mt-1'>{formErrors.employeeId}</p>
              )}
            </div>

            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>
                Contract Number *
              </label>
              <input
                type='text'
                required
                value={formData.contractNumber}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5] font-mono'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>
                Salary Structure
              </label>
              <select
                value={formData.salaryStructureId}
                onChange={(e) =>
                  setFormData({ ...formData, salaryStructureId: e.target.value })
                }
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              >
                <option value=''>Standard Structure</option>
                {salaryStructures.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>
                Work Schedule
              </label>
              <select
                value={formData.workScheduleId}
                onChange={(e) =>
                  setFormData({ ...formData, workScheduleId: e.target.value })
                }
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              >
                <option value=''>Standard Schedule</option>
                {schedules.map((sch) => (
                  <option key={sch.id} value={sch.id}>
                    {sch.name} ({sch.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>
                Monthly Wage (₹) *
              </label>
              <input
                type='number'
                required
                min='1'
                value={formData.wage}
                onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              />
              {formErrors.wage && (
                <p className='text-[11px] text-red-600 mt-1'>{formErrors.wage}</p>
              )}
            </div>

            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>
                Contract Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              >
                <option value='ACTIVE'>Active</option>
                <option value='DRAFT'>Draft</option>
                <option value='TERMINATED'>Terminated</option>
                <option value='EXPIRED'>Expired</option>
              </select>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>
                Start Date *
              </label>
              <input
                type='date'
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              />
              {formErrors.startDate && (
                <p className='text-[11px] text-red-600 mt-1'>{formErrors.startDate}</p>
              )}
            </div>

            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>
                End Date (Optional)
              </label>
              <input
                type='date'
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              />
              {formErrors.endDate && (
                <p className='text-[11px] text-red-600 mt-1'>{formErrors.endDate}</p>
              )}
            </div>
          </div>

          <div>
            <label className='block font-bold text-gray-700 mb-1.5'>
              Contract Terms & Special Clauses
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder='Special conditions, probation period, bonus agreement'
              className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
            />
          </div>

          <div className='pt-4 flex justify-end gap-2 border-t border-gray-100'>
            <BackButton label='Cancel' fallback='/contracts' />
            <button
              type='submit'
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Saving Contract...' : isEdit ? 'Update Contract' : 'Create Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
