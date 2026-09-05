import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import payrunApi from '../../services/payrunApi.js';
import { getEmployees } from '../../data/employeeStore.js';
import { getSalaryStructuresFromStorage } from '../../data/salaryData.js';
import { getPayrunsFromStorage } from '../../data/payrunsData.js';

export default function PayrunsPage() {
  const [payruns, setPayruns] = useState(() => getPayrunsFromStorage());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  // Two-Step Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);

  // Validation details modal
  const [validationModalPayrun, setValidationModalPayrun] = useState(null);

  const employees = getEmployees();
  const salaryStructures = getSalaryStructuresFromStorage();

  // Step 1 Form Data
  const [step1Data, setStep1Data] = useState({
    name: 'September 2026 Regular Payrun',
    structureId: 'str-1',
    month: 'September',
    year: 2026,
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    scope: 'All', // All, Department
    department: 'Engineering',
  });

  // Step 2 Form Data (Selected Employee IDs)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

  const loadPayruns = () => {
    payrunApi
      .getPayruns()
      .then((res) => {
        setPayruns(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load payruns.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPayruns();
  }, []);

  const handleOpenCreateModal = () => {
    setCreateStep(1);
    setStep1Data({
      name: `October 2026 Regular Payrun`,
      structureId: salaryStructures[0]?.id || 'str-1',
      month: 'October',
      year: 2026,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      scope: 'All',
      department: 'Engineering',
    });
    setSelectedEmployeeIds(employees.map((e) => e.employeeId));
    setIsCreateModalOpen(true);
  };

  const handleStep1Next = (e) => {
    e.preventDefault();
    if (step1Data.scope === 'Department') {
      const deptEmployees = employees
        .filter((e) => e.department === step1Data.department)
        .map((e) => e.employeeId);
      setSelectedEmployeeIds(deptEmployees);
    } else {
      setSelectedEmployeeIds(employees.map((e) => e.employeeId));
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

    const structure = salaryStructures.find((s) => s.id === step1Data.structureId);

    try {
      await payrunApi.createPayrun({
        name: step1Data.name,
        structureId: step1Data.structureId,
        structureName: structure ? structure.name : 'Standard Structure',
        period: {
          month: step1Data.month,
          year: step1Data.year,
          startDate: step1Data.startDate,
          endDate: step1Data.endDate,
        },
        employeeIds: selectedEmployeeIds,
      });
      setIsCreateModalOpen(false);
      await loadPayruns();
      setStatusBanner({ type: 'success', text: 'Payrun batch created successfully.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: err.message || 'Failed to create payrun' });
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
      setStatusBanner({ type: 'error', text: err.message || 'Computation failed' });
    }
  };

  const handleValidate = async (id) => {
    try {
      await payrunApi.validatePayrun(id);
      await loadPayruns();
      setStatusBanner({ type: 'success', text: 'Payrun validated and approved for disbursal.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: err.message || 'Validation failed' });
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await payrunApi.markPayrunPaid(id);
      await loadPayruns();
      setStatusBanner({ type: 'success', text: 'Payrun marked as paid.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: err.message || 'Failed to mark as paid' });
    }
  };

  const handleSendPayslips = async (id) => {
    try {
      const res = await payrunApi.sendPayslips(id);
      setStatusBanner({ type: 'success', text: res.message || 'Payslips dispatched to employees.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: err.message || 'Failed to send payslips' });
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
            <span>New Payrun</span>
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
        <LoadingState message='Loading payruns and computation status...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadPayruns} />
      ) : payruns.length === 0 ? (
        <EmptyState
          title='No payruns found'
          description='Create your first payroll batch.'
          action={
            <button
              type='button'
              onClick={handleOpenCreateModal}
              className='px-3.5 py-1.5 rounded-xl bg-[#714B67] text-white text-xs font-bold'
            >
              Start Payrun
            </button>
          }
        />
      ) : (
        <div className='space-y-4'>
          {payruns.map((pr) => (
            <div
              key={pr.id}
              className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4 hover:border-gray-300 transition-all'
            >
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div>
                  <div className='flex items-center gap-2'>
                    <h3 className='text-base font-black text-[#1E293B]'>
                      {pr.name}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                        pr.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : pr.status === 'VALIDATED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : pr.status === 'COMPUTED'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {pr.status}
                    </span>
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    {pr.payrunCode} • {pr.periodMonth} {pr.periodYear} ({pr.startDate} &rarr; {pr.endDate})
                  </p>
                </div>

                {/* Metrics */}
                <div className='flex items-center gap-6 text-right'>
                  <div>
                    <div className='text-[10px] uppercase font-bold text-gray-400'>
                      Employees
                    </div>
                    <div className='text-sm font-bold text-gray-800'>
                      {pr.eligibleEmployeesCount}
                    </div>
                  </div>
                  <div>
                    <div className='text-[10px] uppercase font-bold text-gray-400'>
                      Gross Total
                    </div>
                    <div className='text-sm font-bold text-gray-800'>
                      ₹{pr.totalGrossWage?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className='text-[10px] uppercase font-bold text-gray-400'>
                      Net Disbursal
                    </div>
                    <div className='text-base font-black text-[#714B67]'>
                      ₹{pr.totalNetSalary?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation Status Strip */}
              {pr.validationResults && (
                <div className='flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] border border-gray-200/80 text-xs'>
                  <div className='flex items-center gap-3'>
                    <span className='font-bold text-gray-700'>
                      Pre-Finalization Checks:
                    </span>
                    <span className='text-emerald-700 font-bold'>
                      {pr.validationResults.checks?.filter((c) => c.status === 'PASS').length} Passed
                    </span>
                    {pr.validationResults.warningsCount > 0 && (
                      <span className='text-amber-700 font-bold'>
                        {pr.validationResults.warningsCount} Warnings
                      </span>
                    )}
                    {pr.validationResults.errorsCount > 0 && (
                      <span className='text-rose-600 font-bold'>
                        {pr.validationResults.errorsCount} Errors
                      </span>
                    )}
                  </div>

                  <button
                    type='button'
                    onClick={() => setValidationModalPayrun(pr)}
                    className='text-[#714B67] font-bold hover:underline cursor-pointer'
                  >
                    View Validation Details &rarr;
                  </button>
                </div>
              )}

              {/* Action Buttons per Lifecycle Stage */}
              <div className='pt-2 border-t border-gray-100 flex items-center justify-between'>
                <span className='text-[11px] text-gray-400'>
                  {pr.paymentReference ? `Ref: ${pr.paymentReference}` : `Updated ${pr.updatedAt}`}
                </span>

                <div className='flex items-center gap-2'>
                  {pr.status === 'DRAFT' && (
                    <button
                      type='button'
                      onClick={() => handleCompute(pr.id)}
                      className='px-3.5 py-1.5 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer'
                    >
                      Compute Payrun
                    </button>
                  )}

                  {pr.status === 'COMPUTED' && (
                    <>
                      <button
                        type='button'
                        onClick={() => handleCompute(pr.id)}
                        className='px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer'
                      >
                        Re-Compute
                      </button>
                      <button
                        type='button'
                        onClick={() => handleValidate(pr.id)}
                        className='px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition-colors cursor-pointer'
                      >
                        Validate Payrun
                      </button>
                    </>
                  )}

                  {pr.status === 'VALIDATED' && (
                    <button
                      type='button'
                      onClick={() => handleMarkPaid(pr.id)}
                      className='px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer'
                    >
                      Mark as Paid & Disburse
                    </button>
                  )}

                  {pr.status === 'PAID' && (
                    <button
                      type='button'
                      onClick={() => handleSendPayslips(pr.id)}
                      className='px-3.5 py-1.5 text-xs font-bold text-[#714B67] bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors cursor-pointer'
                    >
                      Send Payslips to All
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Two-Step Payrun Creation Modal */}
      {isCreateModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <div>
                <h3 className='text-base font-black text-[#1E293B]'>
                  Create Payrun Batch — Step {createStep} of 2
                </h3>
                <p className='text-xs text-gray-500 mt-0.5'>
                  {createStep === 1
                    ? 'Configure structure, payroll period, and employee scope.'
                    : 'Select eligible employees included in this calculation.'}
                </p>
              </div>
              <button
                type='button'
                onClick={() => setIsCreateModalOpen(false)}
                className='text-gray-400 font-bold'
              >
                ✕
              </button>
            </div>

            {createStep === 1 ? (
              <form onSubmit={handleStep1Next} className='space-y-3.5 text-xs'>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>
                    Payrun Batch Name *
                  </label>
                  <input
                    type='text'
                    required
                    value={step1Data.name}
                    onChange={(e) =>
                      setStep1Data({ ...step1Data, name: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>

                <div>
                  <label className='block font-bold text-gray-700 mb-1'>
                    Salary Structure *
                  </label>
                  <select
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
                    <label className='block font-bold text-gray-700 mb-1'>Period Start Date *</label>
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
                    <label className='block font-bold text-gray-700 mb-1'>Period End Date *</label>
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

                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block font-bold text-gray-700 mb-1'>Employee Scope</label>
                    <select
                      value={step1Data.scope}
                      onChange={(e) =>
                        setStep1Data({ ...step1Data, scope: e.target.value })
                      }
                      className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                    >
                      <option value='All'>All Active Employees</option>
                      <option value='Department'>By Department</option>
                    </select>
                  </div>
                  {step1Data.scope === 'Department' && (
                    <div>
                      <label className='block font-bold text-gray-700 mb-1'>Department</label>
                      <select
                        value={step1Data.department}
                        onChange={(e) =>
                          setStep1Data({ ...step1Data, department: e.target.value })
                        }
                        className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                      >
                        <option value='Engineering'>Engineering</option>
                        <option value='Operations'>Operations</option>
                        <option value='Sales & BD'>Sales & BD</option>
                        <option value='Marketing'>Marketing</option>
                        <option value='Finance & Payroll'>Finance & Payroll</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className='pt-2 flex items-center justify-end gap-2 border-t border-gray-100'>
                  <BackButton label='Cancel' onClick={() => setIsCreateModalOpen(false)} />
                  <button
                    type='submit'
                    className='px-4 py-2 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs cursor-pointer'
                  >
                    Next: Select Employees &rarr;
                  </button>
                </div>
              </form>
            ) : (
              <div className='space-y-4 text-xs'>
                <div className='flex items-center justify-between'>
                  <span className='font-bold text-gray-700'>
                    Eligible Employees ({selectedEmployeeIds.length} of {employees.length} selected)
                  </span>
                  <button
                    type='button'
                    onClick={() =>
                      setSelectedEmployeeIds(
                        selectedEmployeeIds.length === employees.length
                          ? []
                          : employees.map((e) => e.employeeId)
                      )
                    }
                    className='text-[#714B67] font-bold hover:underline cursor-pointer'
                  >
                    Toggle All
                  </button>
                </div>

                <div className='max-h-56 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl p-2 bg-[#FAF8F5]'>
                  {employees.map((emp) => {
                    const isChecked = selectedEmployeeIds.includes(emp.employeeId);
                    return (
                      <label
                        key={emp.id}
                        className='flex items-center justify-between p-2 hover:bg-white rounded-lg cursor-pointer'
                      >
                        <div className='flex items-center gap-2'>
                          <input
                            type='checkbox'
                            checked={isChecked}
                            onChange={() => handleToggleEmployee(emp.employeeId)}
                            className='w-3.5 h-3.5 rounded text-[#714B67] accent-[#714B67]'
                          />
                          <div>
                            <div className='font-bold text-gray-800'>{emp.name}</div>
                            <div className='text-[10px] text-gray-400'>
                              {emp.employeeId} • {emp.department}
                            </div>
                          </div>
                        </div>
                        <span className='text-[11px] font-bold text-gray-600'>
                          {emp.contractStatus}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className='pt-2 flex items-center justify-between border-t border-gray-100'>
                  <BackButton label='Back' onClick={() => setCreateStep(1)} />
                  <button
                    type='button'
                    onClick={handleFinalizeCreate}
                    className='px-4 py-2 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs cursor-pointer'
                  >
                    Create Payrun Batch
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pre-Finalization Check Details Modal */}
      {validationModalPayrun && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <div>
                <h3 className='text-base font-black text-[#1E293B]'>
                  Payroll Pre-Validation
                </h3>
                <p className='text-xs text-gray-500 mt-0.5'>
                  {validationModalPayrun.name}
                </p>
              </div>
              <button
                type='button'
                onClick={() => setValidationModalPayrun(null)}
                className='text-gray-400 font-bold'
              >
                ✕
              </button>
            </div>

            <div className='space-y-2 text-xs'>
              {validationModalPayrun.validationResults?.checks?.map((chk) => (
                <div
                  key={chk.id}
                  className='p-3 rounded-xl border border-gray-100 flex items-start gap-2.5 bg-[#FAF8F5]'
                >
                  <span
                    className={`font-black text-xs ${
                      chk.status === 'PASS'
                        ? 'text-emerald-700'
                        : chk.status === 'WARN'
                        ? 'text-amber-700'
                        : 'text-rose-600'
                    }`}
                  >
                    {chk.status === 'PASS' ? '✓' : chk.status === 'WARN' ? '⚠' : '✕'}
                  </span>
                  <div>
                    <div className='font-bold text-gray-800'>{chk.label}</div>
                    <div className='text-[11px] text-gray-500 mt-0.5'>
                      {chk.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className='pt-2 flex justify-end border-t border-gray-100'>
              <BackButton label='Close' onClick={() => setValidationModalPayrun(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
