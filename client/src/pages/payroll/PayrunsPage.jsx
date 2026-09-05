import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import payrunApi from '../../services/payrunApi.js';
import employeeApi from '../../services/employeeApi.js';
import salaryStructureApi from '../../services/salaryStructureApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

function normalizePayrun(pr) {
  if (!pr) return null;
  return {
    ...pr,
    id: pr.id,
    payrunCode: pr.code || `PR-${pr.id.slice(-6)}`,
    name: pr.name,
    status: pr.status || 'DRAFT',
    structureName: pr.salaryStructure?.name || 'Standard Structure',
    startDate: pr.periodStart,
    endDate: pr.periodEnd,
    totalGrossWage: Number(pr.totalGross || pr.totalGrossWage || pr.grossTotal || 0),
    totalDeductions: Number(pr.totalDeductions || pr.deductionsTotal || 0),
    totalNetSalary: Number(pr.totalNet || pr.totalNetSalary || pr.netTotal || 0),
    eligibleEmployeesCount: pr.payslipsCount || pr.employeeCount || 0,
    paymentReference: pr.paymentReference,
  };
}

export default function PayrunsPage() {
  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  // Two-Step Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reference data loaded from APIs
  const [employees, setEmployees] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);

  // Step 1 Form Data
  const [step1Data, setStep1Data] = useState({
    name: '',
    structureId: '',
    startDate: '',
    endDate: '',
    scope: 'All',
    department: 'Engineering',
  });

  // Step 2 Form Data (Selected Employee IDs)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);


  const loadPayruns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await payrunApi.getPayruns();
      const list = res.data || (Array.isArray(res) ? res : []);
      setPayruns(list.map(normalizePayrun));
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load payrun batches.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [payrunsRes, empRes, strRes] = await Promise.allSettled([
          payrunApi.getPayruns(),
          employeeApi.getEmployees({ limit: 100 }),
          salaryStructureApi.getSalaryStructures(),
        ]);
        if (!active) return;
        if (payrunsRes.status === 'fulfilled') {
          const res = payrunsRes.value;
          const list = res.data || (Array.isArray(res) ? res : []);
          setPayruns(list.map(normalizePayrun));
        } else {
          setError(extractErrorMessage(payrunsRes.reason, 'Failed to load payrun batches.'));
        }
        if (empRes.status === 'fulfilled') {
          setEmployees(empRes.value.data || []);
        }
        if (strRes.status === 'fulfilled') {
          setSalaryStructures(strRes.value.data || (Array.isArray(strRes.value) ? strRes.value : []));
        }
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err, 'Failed to load payrun batches.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
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
      name: `${now.toLocaleString('default', { month: 'long' })} ${curYear} Regular Payrun`,
      structureId: salaryStructures[0]?.id || '',
      startDate: start,
      endDate: end,
      scope: 'All',
      department: 'Engineering',
    });
    setSelectedEmployeeIds(employees.map((e) => e.id));
    setIsCreateModalOpen(true);
  };

  const handleStep1Next = (e) => {
    e.preventDefault();
    if (step1Data.scope === 'Department') {
      const deptEmployees = employees
        .filter((e) => e.department === step1Data.department || e.department?.name === step1Data.department)
        .map((e) => e.id);
      setSelectedEmployeeIds(deptEmployees);
    } else {
      setSelectedEmployeeIds(employees.map((e) => e.id));
    }
    setCreateStep(2);
  };

  const handleToggleEmployee = (empId) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleFinalizeCreate = async () => {
    if (selectedEmployeeIds.length === 0) {
      setStatusBanner({ type: 'error', text: 'Please select at least one employee for the payrun.' });
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

      const newPayrunId = res.data?.id || res.id;
      if (newPayrunId && selectedEmployeeIds.length > 0) {
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

  // Lifecycle Actions
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
      setStatusBanner({ type: 'success', text: 'Payrun validated and approved for disbursal.' });
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
      setStatusBanner({ type: 'success', text: res.message || 'Payslips dispatched to employees.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to send payslips') });
    }
  };

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Payruns'
        subtitle='Two-step payrun creation, automated lifecycle transitions, and pre-finalization checks.'
        actions={
          <button
            type='button'
            onClick={handleOpenCreateModal}
            className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1'
          >
            <span>+</span>
            <span>New Payrun Batch</span>
          </button>
        }
      />

      {statusBanner && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-fadeIn ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{statusBanner.text}</span>
          <button
            type='button'
            onClick={() => setStatusBanner(null)}
            className='font-bold ml-2 cursor-pointer'
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <LoadingState message='Loading payrun batches...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadPayruns} />
      ) : payruns.length === 0 ? (
        <EmptyState
          title='No payruns created yet'
          description='Initiate your monthly payroll run to calculate gross wages, deductions, and payslips.'
          actionLabel='+ New Payrun Batch'
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className='space-y-4'>
          {payruns.map((pr) => {
            const isDraft = pr.status === 'DRAFT';
            const isComputed = pr.status === 'COMPUTED';
            const isValidated = pr.status === 'VALIDATED';
            const isPaid = pr.status === 'PAID';

            return (
              <div
                key={pr.id}
                className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs p-5 space-y-4 hover:border-gray-300 transition-colors'
              >
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div>
                    <div className='flex items-center gap-2'>
                      <h4 className='text-sm font-black text-[#1E293B]'>{pr.name}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isValidated
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : isComputed
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {pr.status}
                      </span>
                    </div>
                    <div className='text-xs text-gray-500 mt-1 font-medium'>
                      Period: {pr.startDate} → {pr.endDate} • {pr.structureName}
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className='flex items-center gap-4 text-xs font-bold'>
                    <div className='text-right'>
                      <div className='text-gray-400 text-[10px] uppercase'>Gross Total</div>
                      <div className='text-gray-900'>₹{pr.totalGrossWage.toLocaleString()}</div>
                    </div>
                    <div className='text-right'>
                      <div className='text-gray-400 text-[10px] uppercase'>Deductions</div>
                      <div className='text-rose-600'>-₹{pr.totalDeductions.toLocaleString()}</div>
                    </div>
                    <div className='text-right pl-3 border-l border-gray-100'>
                      <div className='text-[#714B67] text-[10px] uppercase'>Net Disbursal</div>
                      <div className='text-emerald-700 font-black text-sm'>
                        ₹{pr.totalNetSalary.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lifecycle Toolbar */}
                <div className='pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3'>
                  <div className='text-xs text-gray-500 font-medium'>
                    Batch Code: <span className='font-mono font-bold text-gray-800'>{pr.payrunCode}</span>
                  </div>

                  <div className='flex items-center gap-2'>
                    {isDraft && (
                      <button
                        type='button'
                        onClick={() => handleCompute(pr.id)}
                        className='px-3.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors cursor-pointer'
                      >
                        Compute Salary Rules
                      </button>
                    )}

                    {isComputed && (
                      <button
                        type='button'
                        onClick={() => handleValidate(pr.id)}
                        className='px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer'
                      >
                        Validate Payrun
                      </button>
                    )}

                    {isValidated && (
                      <button
                        type='button'
                        onClick={() => handleMarkPaid(pr.id)}
                        className='px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer'
                      >
                        Mark as Disbursed
                      </button>
                    )}

                    {isPaid && (
                      <button
                        type='button'
                        onClick={() => handleSendPayslips(pr.id)}
                        className='px-3.5 py-1.5 text-xs font-bold text-[#714B67] bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors cursor-pointer'
                      >
                        Send Payslip Emails
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Two-Step Payrun Wizard Modal */}
      {isCreateModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-lg w-full p-6 border border-[#EAE6DF] shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <div>
                <h3 className='text-sm font-black text-[#1E293B]'>
                  New Payrun Batch • Step {createStep} of 2
                </h3>
                <p className='text-xs text-gray-500 font-medium'>
                  {createStep === 1
                    ? 'Define pay period scope and calculation structure'
                    : 'Select eligible employee roster for batch calculation'}
                </p>
              </div>
              <button
                type='button'
                onClick={() => setIsCreateModalOpen(false)}
                className='text-gray-400 font-bold hover:text-gray-600'
              >
                ✕
              </button>
            </div>

            {createStep === 1 ? (
              <form onSubmit={handleStep1Next} className='space-y-3.5 text-xs'>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Batch Title *</label>
                  <input
                    type='text'
                    required
                    value={step1Data.name}
                    onChange={(e) => setStep1Data({ ...step1Data, name: e.target.value })}
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>

                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Salary Structure *</label>
                  <select
                    required
                    value={step1Data.structureId}
                    onChange={(e) =>
                      setStep1Data({ ...step1Data, structureId: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  >
                    {salaryStructures.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block font-bold text-gray-700 mb-1'>Period Start *</label>
                    <input
                      type='date'
                      required
                      value={step1Data.startDate}
                      onChange={(e) =>
                        setStep1Data({ ...step1Data, startDate: e.target.value })
                      }
                      className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                    />
                  </div>
                  <div>
                    <label className='block font-bold text-gray-700 mb-1'>Period End *</label>
                    <input
                      type='date'
                      required
                      value={step1Data.endDate}
                      onChange={(e) =>
                        setStep1Data({ ...step1Data, endDate: e.target.value })
                      }
                      className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                    />
                  </div>
                </div>

                <div className='pt-2 flex justify-end gap-2 border-t border-gray-100'>
                  <BackButton label='Cancel' onClick={() => setIsCreateModalOpen(false)} />
                  <button
                    type='submit'
                    className='px-4 py-1.5 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl cursor-pointer'
                  >
                    Next: Select Employees →
                  </button>
                </div>
              </form>
            ) : (
              <div className='space-y-4 text-xs'>
                <div className='flex items-center justify-between'>
                  <span className='font-bold text-gray-700'>
                    Select Workforce Roster ({selectedEmployeeIds.length} of {employees.length})
                  </span>
                  <button
                    type='button'
                    onClick={() =>
                      setSelectedEmployeeIds(
                        selectedEmployeeIds.length === employees.length
                          ? []
                          : employees.map((e) => e.id)
                      )
                    }
                    className='text-[#714B67] font-bold hover:underline cursor-pointer'
                  >
                    {selectedEmployeeIds.length === employees.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className='max-h-56 overflow-y-auto space-y-1.5 border border-gray-100 p-2 rounded-xl bg-[#FAF8F5]'>
                  {employees.map((emp) => {
                    const checked = selectedEmployeeIds.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => handleToggleEmployee(emp.id)}
                        className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                          checked
                            ? 'bg-white border-[#714B67]/40 shadow-2xs font-semibold text-gray-900'
                            : 'border-transparent text-gray-500'
                        }`}
                      >
                        <div className='flex items-center gap-2'>
                          <input
                            type='checkbox'
                            checked={checked}
                            onChange={() => {}}
                            className='rounded text-[#714B67] focus:ring-[#714B67]'
                          />
                          <span>
                            {emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : emp.name}
                          </span>
                        </div>
                        <span className='text-[10px] text-gray-400'>
                          {emp.employeeCode || emp.employeeId}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className='pt-2 flex justify-end gap-2 border-t border-gray-100'>
                  <button
                    type='button'
                    onClick={() => setCreateStep(1)}
                    className='px-3 py-1.5 font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer'
                  >
                    ← Back
                  </button>
                  <button
                    type='button'
                    disabled={isSubmitting}
                    onClick={handleFinalizeCreate}
                    className={`px-4 py-1.5 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl cursor-pointer ${
                      isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Creating...' : 'Finalize & Create Batch'}
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
