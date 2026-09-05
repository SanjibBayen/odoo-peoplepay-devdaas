import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import payrunApi from '../../services/payrunApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import { PAYRUN_STATUS } from '../../utils/constants.js';

export default function PayrunDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payrun, setPayrun] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusBanner, setStatusBanner] = useState(null);

  const loadPayrunDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detailRes, warnRes] = await Promise.allSettled([
        payrunApi.getPayrunById(id),
        payrunApi.getPayrunWarnings(id),
      ]);

      if (detailRes.status === 'fulfilled') {
        const data = detailRes.value.data || detailRes.value;
        setPayrun(data);
      } else {
        setError(extractErrorMessage(detailRes.reason, 'Failed to load payrun details.'));
      }

      if (warnRes.status === 'fulfilled') {
        setWarnings(warnRes.value.data || (Array.isArray(warnRes.value) ? warnRes.value : []));
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load payrun batch.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [detailRes, warnRes] = await Promise.allSettled([
          payrunApi.getPayrunById(id),
          payrunApi.getPayrunWarnings(id),
        ]);

        if (!active) return;
        if (detailRes.status === 'fulfilled') {
          setPayrun(detailRes.value.data || detailRes.value);
        } else {
          setError(extractErrorMessage(detailRes.reason, 'Failed to load payrun details.'));
        }

        if (warnRes.status === 'fulfilled') {
          setWarnings(warnRes.value.data || (Array.isArray(warnRes.value) ? warnRes.value : []));
        }
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err, 'Failed to load payrun batch.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const handleCompute = async () => {
    setActionLoading(true);
    try {
      await payrunApi.computePayrun(id);
      await loadPayrunDetail();
      setStatusBanner({ type: 'success', text: 'Salary rules and payslips computed successfully.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to compute payrun.') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    setActionLoading(true);
    try {
      await payrunApi.validatePayrun(id);
      await loadPayrunDetail();
      setStatusBanner({ type: 'success', text: 'Payrun validated and confirmed for disbursal.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to validate payrun.') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setActionLoading(true);
    try {
      await payrunApi.markPayrunPaid(id);
      await loadPayrunDetail();
      setStatusBanner({ type: 'success', text: 'Payrun marked as disbursed/paid.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to mark as paid.') });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPayslips = async () => {
    setActionLoading(true);
    try {
      const res = await payrunApi.sendPayslips(id);
      setStatusBanner({ type: 'success', text: res.message || 'Payslip emails dispatched.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to send payslips.') });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message='Loading payrun batch details...' />;
  }

  if (error || !payrun) {
    return (
      <ErrorState
        message={error || 'Payrun not found.'}
        onRetry={loadPayrunDetail}
      />
    );
  }

  const st = (payrun.status || 'DRAFT').toUpperCase();
  const badge = PAYRUN_STATUS[st] || PAYRUN_STATUS.DRAFT;
  const payslips = payrun.payslips || [];
  const gross = Number(payrun.totalGross || payrun.totalGrossWage || payrun.grossTotal || 0);
  const deductions = Number(payrun.totalDeductions || payrun.deductionsTotal || 0);
  const net = Number(payrun.totalNet || payrun.totalNetSalary || payrun.netTotal || 0);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <BackButton label='Back to Payruns' fallback='/payruns' onClick={() => navigate('/payruns')} />
        <span className='text-xs font-mono font-bold text-gray-500 bg-[#FAF8F5] px-3 py-1 rounded-xl border border-gray-200'>
          ID: {payrun.id}
        </span>
      </div>

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

      {/* Main Payrun Header Card */}
      <div className='bg-white rounded-3xl border border-[#EAE6DF] shadow-2xs p-6 space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <div className='flex items-center gap-3'>
              <h1 className='text-xl sm:text-2xl font-black text-[#1E293B] tracking-tight'>
                {payrun.name}
              </h1>
              <span
                className={`inline-flex px-3 py-0.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
              >
                {badge.label}
              </span>
            </div>
            <p className='text-xs text-gray-500 mt-1 font-medium'>
              Period: {formatDate(payrun.periodStart, 'DD Mon YYYY')} →{' '}
              {formatDate(payrun.periodEnd, 'DD Mon YYYY')} •{' '}
              <span className='text-[#714B67] font-semibold'>
                {payrun.salaryStructure?.name || 'Standard Salary Structure'}
              </span>
            </p>
          </div>

          {/* Lifecycle Action Buttons */}
          <div className='flex items-center gap-2'>
            {st === 'DRAFT' && (
              <button
                type='button'
                disabled={actionLoading}
                onClick={handleCompute}
                className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5'
              >
                <span>⚡</span>
                <span>Compute Salary Rules</span>
              </button>
            )}

            {st === 'COMPUTED' && (
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  disabled={actionLoading}
                  onClick={handleCompute}
                  className='px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer'
                >
                  Re-Compute
                </button>
                <button
                  type='button'
                  disabled={actionLoading}
                  onClick={handleValidate}
                  className='px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer'
                >
                  Validate & Confirm
                </button>
              </div>
            )}

            {st === 'VALIDATED' && (
              <button
                type='button'
                disabled={actionLoading}
                onClick={handleMarkPaid}
                className='px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer'
              >
                Mark Disbursed / Paid
              </button>
            )}

            {st === 'PAID' && (
              <button
                type='button'
                disabled={actionLoading}
                onClick={handleSendPayslips}
                className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5'
              >
                <span>✉️</span>
                <span>Dispatch Payslip Emails</span>
              </button>
            )}
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100'>
          <div className='p-3.5 rounded-2xl bg-[#FAF8F5] border border-gray-200/70'>
            <span className='text-[10px] font-bold text-gray-400 uppercase tracking-wider block'>
              Gross Wages
            </span>
            <span className='text-base sm:text-lg font-black text-gray-900 mt-1 block'>
              {formatCurrency(gross)}
            </span>
          </div>

          <div className='p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/70'>
            <span className='text-[10px] font-bold text-rose-600 uppercase tracking-wider block'>
              Total Deductions
            </span>
            <span className='text-base sm:text-lg font-black text-rose-700 mt-1 block'>
              -{formatCurrency(deductions)}
            </span>
          </div>

          <div className='p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70'>
            <span className='text-[10px] font-bold text-emerald-700 uppercase tracking-wider block'>
              Net Disbursal
            </span>
            <span className='text-base sm:text-lg font-black text-emerald-800 mt-1 block'>
              {formatCurrency(net)}
            </span>
          </div>

          <div className='p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200/70'>
            <span className='text-[10px] font-bold text-[#714B67] uppercase tracking-wider block'>
              Payslips Generated
            </span>
            <span className='text-base sm:text-lg font-black text-[#714B67] mt-1 block'>
              {payslips.length} Employees
            </span>
          </div>
        </div>
      </div>

      {/* Warnings & Sanity Checks */}
      {warnings.length > 0 && (
        <div className='bg-amber-50 rounded-2xl p-4 border border-amber-200 text-xs text-amber-900 space-y-1.5'>
          <div className='font-bold flex items-center gap-1.5'>
            <span>⚠️</span>
            <span>Pre-computation Warnings ({warnings.length})</span>
          </div>
          <ul className='list-disc list-inside space-y-1 text-[11px] font-medium'>
            {warnings.map((w, idx) => (
              <li key={idx}>{typeof w === 'string' ? w : w.message || JSON.stringify(w)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Generated Payslips Roster */}
      <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden space-y-2 p-4 sm:p-5'>
        <div className='flex items-center justify-between pb-3 border-b border-gray-100'>
          <h3 className='text-sm font-black text-[#1E293B]'>Payslips in this Run</h3>
          <span className='text-xs font-bold text-gray-500'>
            {payslips.length} total records
          </span>
        </div>

        {payslips.length === 0 ? (
          <div className='py-8 text-center text-xs text-gray-400 font-medium'>
            No payslips generated yet. Click "Compute Salary Rules" above to generate employee slips.
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[10px]'>
                <tr>
                  <th className='py-3 px-3'>Slip Number</th>
                  <th className='py-3 px-3'>Employee</th>
                  <th className='py-3 px-3'>Gross Wage</th>
                  <th className='py-3 px-3'>Deductions</th>
                  <th className='py-3 px-3'>Net Pay</th>
                  <th className='py-3 px-3'>Status</th>
                  <th className='py-3 px-3 text-right'>Action</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {payslips.map((slip) => {
                  const empName = slip.employee?.firstName
                    ? `${slip.employee.firstName} ${slip.employee.lastName || ''}`.trim()
                    : slip.employeeName || 'Employee';
                  const empCode = slip.employee?.employeeCode || slip.employeeId || '';
                  const slipCode = slip.payslipNumber || slip.slipNumber || `PS-${slip.id.slice(-6)}`;

                  return (
                    <tr key={slip.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                      <td className='py-3 px-3 font-mono font-bold text-gray-900'>
                        {slipCode}
                      </td>
                      <td className='py-3 px-3'>
                        <div className='font-bold text-gray-900'>{empName}</div>
                        <div className='text-[10px] text-gray-500 font-mono'>{empCode}</div>
                      </td>
                      <td className='py-3 px-3 font-medium text-gray-700'>
                        {formatCurrency(slip.grossSalary)}
                      </td>
                      <td className='py-3 px-3 text-rose-600 font-medium'>
                        -{formatCurrency(slip.totalDeductions)}
                      </td>
                      <td className='py-3 px-3 font-black text-emerald-700'>
                        {formatCurrency(slip.netSalary)}
                      </td>
                      <td className='py-3 px-3'>
                        <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700'>
                          {slip.status || 'COMPUTED'}
                        </span>
                      </td>
                      <td className='py-3 px-3 text-right'>
                        <Link
                          to={`/payslips/${slip.id}`}
                          className='text-xs font-bold text-[#714B67] hover:underline cursor-pointer'
                        >
                          View Payslip →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
