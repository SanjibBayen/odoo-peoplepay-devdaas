import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import payrunApi from '../../services/payrunApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

const PAYRUN_STATUS = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  COMPUTING: { label: 'Computing', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  COMPUTED: { label: 'Computed', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  VALIDATED: { label: 'Validated', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  PAID: { label: 'Paid', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function PayrunDetailPage() {
  const { id } = useParams();

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
        const data = detailRes.value?.data || detailRes.value;
        setPayrun(data);
      } else {
        setError(extractErrorMessage(detailRes.reason, 'Failed to load payrun details.'));
      }

      if (warnRes.status === 'fulfilled') {
        const warnData = warnRes.value?.data || [];
        setWarnings(Array.isArray(warnData) ? warnData : []);
      } else {
        setWarnings([]);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load payrun batch.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPayrunDetail();
  }, [loadPayrunDetail]);

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
      setStatusBanner({ type: 'success', text: 'Payrun validated.' });
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
      setStatusBanner({ type: 'success', text: 'Payrun marked as paid.' });
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
      setStatusBanner({ type: 'success', text: res?.message || 'Payslip emails dispatched.' });
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
    return <ErrorState message={error || 'Payrun not found.'} onRetry={loadPayrunDetail} />;
  }

  const st = (payrun.status || 'DRAFT').toUpperCase();
  const badge = PAYRUN_STATUS[st] || PAYRUN_STATUS.DRAFT;
  const payslips = payrun.payslips || [];
  const gross = Number(payrun.totalGross || 0);
  const deductions = Number(payrun.totalDeductions || 0);
  const net = Number(payrun.totalNet || 0);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <BackButton label='Back to Payruns' fallback='/payruns' />
        <Breadcrumbs items={[
          { label: 'Payruns', to: '/payruns' },
          { label: payrun.name || 'Detail' },
        ]} />
      </div>

      {statusBanner && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          statusBanner.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{statusBanner.text}</span>
          <button type='button' onClick={() => setStatusBanner(null)} className='font-bold ml-2 cursor-pointer'>✕</button>
        </div>
      )}

      {/* Header Card */}
      <div className='bg-white rounded-3xl border border-[#EAE6DF] shadow-2xs p-6 space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <div className='flex items-center gap-3'>
              <h1 className='text-xl sm:text-2xl font-black'>{payrun.name}</h1>
              <span className={`inline-flex px-3 py-0.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                {badge.label}
              </span>
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              Period: {formatDate(payrun.periodStart)} → {formatDate(payrun.periodEnd)} • {payrun.salaryStructure?.name || 'Standard'}
            </p>
          </div>

          <div className='flex items-center gap-2'>
            {st === 'DRAFT' && (
              <button type='button' disabled={actionLoading} onClick={handleCompute} className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] rounded-xl cursor-pointer'>
                Compute Salary Rules
              </button>
            )}
            {st === 'COMPUTED' && (
              <>
                <button type='button' disabled={actionLoading} onClick={handleCompute} className='px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 rounded-xl cursor-pointer'>
                  Re-Compute
                </button>
                <button type='button' disabled={actionLoading} onClick={handleValidate} className='px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl cursor-pointer'>
                  Validate
                </button>
              </>
            )}
            {st === 'VALIDATED' && (
              <button type='button' disabled={actionLoading} onClick={handleMarkPaid} className='px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl cursor-pointer'>
                Mark Paid
              </button>
            )}
            {st === 'PAID' && (
              <button type='button' disabled={actionLoading} onClick={handleSendPayslips} className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] rounded-xl cursor-pointer'>
                Send Payslips
              </button>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100'>
          <div className='p-3.5 rounded-2xl bg-[#FAF8F5] border'>
            <span className='text-[10px] font-bold text-gray-400 uppercase'>Gross Wages</span>
            <span className='text-base font-black mt-1 block'>{formatCurrency(gross)}</span>
          </div>
          <div className='p-3.5 rounded-2xl bg-rose-50 border border-rose-200'>
            <span className='text-[10px] font-bold text-rose-600 uppercase'>Deductions</span>
            <span className='text-base font-black text-rose-700 mt-1 block'>-{formatCurrency(deductions)}</span>
          </div>
          <div className='p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200'>
            <span className='text-[10px] font-bold text-emerald-700 uppercase'>Net Disbursal</span>
            <span className='text-base font-black text-emerald-800 mt-1 block'>{formatCurrency(net)}</span>
          </div>
          <div className='p-3.5 rounded-2xl bg-purple-50 border border-purple-200'>
            <span className='text-[10px] font-bold text-[#714B67] uppercase'>Payslips</span>
            <span className='text-base font-black mt-1 block'>{payslips.length}</span>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className='bg-amber-50 rounded-2xl p-4 border border-amber-200 text-xs text-amber-900 space-y-1.5'>
          <div className='font-bold'>⚠️ Pre-computation Warnings ({warnings.length})</div>
          <ul className='list-disc list-inside space-y-1 text-[11px]'>
            {warnings.map((w, idx) => (
              <li key={idx}>{typeof w === 'string' ? w : w.message || w.warningType || JSON.stringify(w)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Payslips Table */}
      <div className='bg-white rounded-2xl border border-[#EAE6DF] overflow-hidden p-4'>
        <div className='flex items-center justify-between pb-3 border-b border-gray-100'>
          <h3 className='text-sm font-black'>Payslips in this Run</h3>
          <span className='text-xs font-bold text-gray-500'>{payslips.length} records</span>
        </div>

        {payslips.length === 0 ? (
          <div className='py-8 text-center text-xs text-gray-400'>
            No payslips generated yet. Click "Compute Salary Rules" to generate.
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-[#FAF8F5] border-b text-gray-500 font-bold uppercase text-[10px]'>
                <tr>
                  <th className='py-3 px-3'>Slip Number</th>
                  <th className='py-3 px-3'>Employee</th>
                  <th className='py-3 px-3'>Gross</th>
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
                    : 'Employee';
                  const slipCode = slip.payslipNumber || slip.id;
                  return (
                    <tr key={slip.id} className='hover:bg-[#FAF8F5]/60'>
                      <td className='py-3 px-3 font-mono font-bold'>{slipCode}</td>
                      <td className='py-3 px-3 font-bold'>{empName}</td>
                      <td className='py-3 px-3'>{formatCurrency(slip.grossSalary)}</td>
                      <td className='py-3 px-3 text-rose-600'>-{formatCurrency(slip.totalDeductions)}</td>
                      <td className='py-3 px-3 font-black text-emerald-700'>{formatCurrency(slip.netSalary)}</td>
                      <td className='py-3 px-3'>
                        <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100'>{slip.status || 'COMPUTED'}</span>
                      </td>
                      <td className='py-3 px-3 text-right'>
                        <Link to={`/payslips/${slip.id}`} className='text-xs font-bold text-[#714B67] hover:underline'>
                          View →
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