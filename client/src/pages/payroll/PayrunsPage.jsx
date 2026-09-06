import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import payrunApi from '../../services/payrunApi.js';
import employeeApi from '../../services/employeeApi.js';
import salaryStructureApi from '../../services/salaryStructureApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

function normalizePayrun(pr) {
  if (!pr) return null;
  return {
    ...pr,
    id: pr.id,
    payrunCode: pr.id ? `PR-${pr.id.slice(-6)}` : 'PR-000000',
    name: pr.name,
    status: pr.status || 'DRAFT',
    structureName: pr.salaryStructure?.name || 'Standard Structure',
    startDate: pr.periodStart,
    endDate: pr.periodEnd,
    totalGrossWage: Number(pr.totalGross || 0),
    totalDeductions: Number(pr.totalDeductions || 0),
    totalNetSalary: Number(pr.totalNet || 0),
  };
}

export default function PayrunsPage() {
  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);

  const [step1Data, setStep1Data] = useState({
    name: '',
    structureId: '',
    startDate: '',
    endDate: '',
  });

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

  const loadPayruns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await payrunApi.getPayruns();
      // FIX: Backend returns { success, data }
      const list = res?.data || [];
      setPayruns(Array.isArray(list) ? list.map(normalizePayrun) : []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load payrun batches.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayruns();
  }, [loadPayruns]);

  useEffect(() => {
    const loadRefData = async () => {
      try {
        const [empRes, strRes] = await Promise.allSettled([
          employeeApi.getEmployees({ limit: 100 }),
          salaryStructureApi.getSalaryStructures(),
        ]);
        if (empRes.status === 'fulfilled') {
          setEmployees(empRes.value?.employees || empRes.value?.data || []);
        }
        if (strRes.status === 'fulfilled') {
          setSalaryStructures(strRes.value?.data || []);
        }
      } catch (err) {
        console.warn('Failed to load reference data:', err);
      }
    };
    loadRefData();
  }, []);

  const handleOpenCreateModal = () => {
    setCreateStep(1);
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');
    const start = `${curYear}-${curMonth}-01`;
    const lastDay = new Date(curYear, now.getMonth() + 1, 0).getDate();
    const end = `${curYear}-${curMonth}-${String(lastDay).padStart(2, '0')}`;

    setStep1Data({
      name: `${now.toLocaleString('default', { month: 'long' })} ${curYear} Payrun`,
      structureId: salaryStructures[0]?.id || '',
      startDate: start,
      endDate: end,
    });
    setSelectedEmployeeIds(employees.map((e) => e.id));
    setIsCreateModalOpen(true);
  };

  const handleStep1Next = (e) => {
    e.preventDefault();
    setSelectedEmployeeIds(employees.map((e) => e.id));
    setCreateStep(2);
  };

  const handleToggleEmployee = (empId) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleFinalizeCreate = async () => {
    if (selectedEmployeeIds.length === 0) {
      setStatusBanner({ type: 'error', text: 'Please select at least one employee.' });
      return;
    }

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

      setIsCreateModalOpen(false);
      await loadPayruns();
      setStatusBanner({ type: 'success', text: 'Payrun batch created successfully.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to create payrun') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompute = async (id) => {
    try {
      await payrunApi.computePayrun(id);
      await loadPayruns();
      setStatusBanner({ type: 'success', text: 'Payrun computation complete.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Computation failed') });
    }
  };

  const handleValidate = async (id) => {
    try {
      await payrunApi.validatePayrun(id);
      await loadPayruns();
      setStatusBanner({ type: 'success', text: 'Payrun validated.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Validation failed') });
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await payrunApi.markPayrunPaid(id);
      await loadPayruns();
      setStatusBanner({ type: 'success', text: 'Payrun marked as paid.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to mark as paid') });
    }
  };

  const handleSendPayslips = async (id) => {
    try {
      const res = await payrunApi.sendPayslips(id);
      setStatusBanner({ type: 'success', text: res?.message || 'Payslips dispatched.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to send payslips') });
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'VALIDATED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COMPUTED': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'COMPUTING': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Payruns'
        subtitle='Two-step payrun creation and lifecycle transitions.'
        actions={
          <button type='button' onClick={handleOpenCreateModal} className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] rounded-xl cursor-pointer'>
            + New Payrun Batch
          </button>
        }
      />

      {statusBanner && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          statusBanner.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{statusBanner.text}</span>
          <button type='button' onClick={() => setStatusBanner(null)} className='font-bold ml-2 cursor-pointer'>✕</button>
        </div>
      )}

      {loading ? (
        <LoadingState message='Loading payruns...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadPayruns} />
      ) : payruns.length === 0 ? (
        <EmptyState title='No payruns created yet' description='Initiate your monthly payroll run.' actionLabel='+ New Payrun Batch' onAction={handleOpenCreateModal} />
      ) : (
        <div className='space-y-4'>
          {payruns.map((pr) => (
            <div key={pr.id} className='bg-white rounded-2xl border p-5 space-y-4'>
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div>
                  <div className='flex items-center gap-2'>
                    <h4 className='text-sm font-black'>{pr.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusClass(pr.status)}`}>
                      {pr.status}
                    </span>
                  </div>
                  <div className='text-xs text-gray-500 mt-1'>Period: {pr.startDate} → {pr.endDate} • {pr.structureName}</div>
                </div>
                <div className='text-right'>
                  <div className='text-gray-400 text-[10px] uppercase'>Net Disbursal</div>
                  <div className='text-emerald-700 font-black text-sm'>₹{pr.totalNetSalary.toLocaleString()}</div>
                </div>
              </div>

              <div className='pt-3 border-t flex flex-wrap items-center justify-between gap-3'>
                <span className='text-xs text-gray-500 font-mono'>{pr.payrunCode}</span>
                <div className='flex items-center gap-2'>
                  {pr.status === 'DRAFT' && (
                    <button type='button' onClick={() => handleCompute(pr.id)} className='px-3.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-xl cursor-pointer'>
                      Compute
                    </button>
                  )}
                  {pr.status === 'COMPUTED' && (
                    <button type='button' onClick={() => handleValidate(pr.id)} className='px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer'>
                      Validate
                    </button>
                  )}
                  {pr.status === 'VALIDATED' && (
                    <button type='button' onClick={() => handleMarkPaid(pr.id)} className='px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer'>
                      Mark Paid
                    </button>
                  )}
                  {pr.status === 'PAID' && (
                    <button type='button' onClick={() => handleSendPayslips(pr.id)} className='px-3.5 py-1.5 text-xs font-bold text-[#714B67] bg-purple-50 border border-purple-200 rounded-xl cursor-pointer'>
                      Send Payslips
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wizard Modal */}
      {isCreateModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40' role='dialog' aria-modal='true'>
          <div className='bg-white rounded-2xl max-w-lg w-full p-6 border shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b pb-3'>
              <h3 className='text-sm font-black'>New Payrun • Step {createStep} of 2</h3>
              <button type='button' onClick={() => setIsCreateModalOpen(false)} className='cursor-pointer'>✕</button>
            </div>

            {createStep === 1 ? (
              <form onSubmit={handleStep1Next} className='space-y-3 text-xs'>
                <div>
                  <label className='block font-bold mb-1'>Batch Title *</label>
                  <input type='text' required value={step1Data.name} onChange={(e) => setStep1Data({ ...step1Data, name: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
                </div>
                <div>
                  <label className='block font-bold mb-1'>Salary Structure *</label>
                  <select required value={step1Data.structureId} onChange={(e) => setStep1Data({ ...step1Data, structureId: e.target.value })} className='w-full px-3 py-2 rounded-xl border cursor-pointer'>
                    {salaryStructures.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block font-bold mb-1'>Period Start *</label>
                    <input type='date' required value={step1Data.startDate} onChange={(e) => setStep1Data({ ...step1Data, startDate: e.target.value })} className='w-full px-3 py-2 rounded-xl border cursor-pointer' />
                  </div>
                  <div>
                    <label className='block font-bold mb-1'>Period End *</label>
                    <input type='date' required value={step1Data.endDate} onChange={(e) => setStep1Data({ ...step1Data, endDate: e.target.value })} className='w-full px-3 py-2 rounded-xl border cursor-pointer' />
                  </div>
                </div>
                <div className='pt-2 flex justify-end gap-2 border-t'>
                  <button
                    type='button'
                    onClick={() => setIsCreateModalOpen(false)}
                    className='px-3.5 py-1.5 font-semibold text-gray-700 hover:text-gray-900 border rounded-xl hover:bg-gray-50 cursor-pointer'
                  >
                    Cancel
                  </button>
                  <button type='submit' className='px-4 py-1.5 font-bold text-white bg-[#714B67] rounded-xl cursor-pointer'>Next →</button>
                </div>
              </form>
            ) : (
              <div className='space-y-4 text-xs'>
                <div className='flex items-center justify-between'>
                  <span className='font-bold'>{selectedEmployeeIds.length} of {employees.length} selected</span>
                  <button type='button' onClick={() => setSelectedEmployeeIds(selectedEmployeeIds.length === employees.length ? [] : employees.map((e) => e.id))} className='text-[#714B67] font-bold cursor-pointer'>
                    {selectedEmployeeIds.length === employees.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className='max-h-56 overflow-y-auto space-y-1.5 border p-2 rounded-xl'>
                  {employees.map((emp) => {
                    const checked = selectedEmployeeIds.includes(emp.id);
                    return (
                      <div key={emp.id} onClick={() => handleToggleEmployee(emp.id)} className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer ${checked ? 'bg-white border-[#714B67]/40' : 'border-transparent'}`}>
                        <span>{emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : emp.name}</span>
                        <span className='text-[10px] text-gray-400'>{emp.employeeCode}</span>
                      </div>
                    );
                  })}
                </div>
                <div className='pt-2 flex justify-end gap-2 border-t'>
                  <button type='button' onClick={() => setCreateStep(1)} className='px-3 py-1.5 font-bold text-gray-600 rounded-xl cursor-pointer'>← Back</button>
                  <button type='button' disabled={isSubmitting} onClick={handleFinalizeCreate} className={`px-4 py-1.5 font-bold text-white bg-[#714B67] rounded-xl cursor-pointer ${isSubmitting ? 'opacity-60' : ''}`}>
                    {isSubmitting ? 'Creating...' : 'Create Batch'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}