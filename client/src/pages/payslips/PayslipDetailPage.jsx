import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DetailSkeleton } from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import payslipApi from '../../services/payslipApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';
import { formatDate } from '../../utils/formatDate.js';
import { downloadPayslipPdf } from '../../utils/pdfGenerator.js';

export default function PayslipDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const loadPayslip = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await payslipApi.getPayslipById(id);
      const data = res?.data || res;
      setPayslip(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load payslip details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPayslip();
  }, [loadPayslip]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!payslip || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await downloadPayslipPdf(payslip);
      setActionMessage({ type: 'success', text: 'Payslip PDF downloaded successfully.' });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: extractErrorMessage(err, 'Unable to generate PDF.'),
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      const res = await payslipApi.sendPayslip(id);
      setActionMessage({ type: 'success', text: res?.message || 'Payslip emailed to employee.' });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setActionMessage({ type: 'error', text: extractErrorMessage(err, 'Failed to email payslip.') });
    }
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !payslip) {
    return (
      <div className='space-y-4'>
        <BackButton label='Back to Payslips' fallback='/payslips' onClick={() => navigate('/payslips')} />
        <ErrorState message={error || 'Salary slip not found.'} onRetry={loadPayslip} />
      </div>
    );
  }

  const emp = payslip.employee || {};
  const empName = emp.firstName
    ? `${emp.firstName} ${emp.lastName || ''}`.trim()
    : payslip.employeeName || 'Employee';
  const empCode = emp.employeeCode || 'EMP-000';
  const deptName = emp.department?.name || 'General';
  const posName = emp.jobPosition?.name || 'Staff';
  const slipCode = payslip.payslipNumber || `PS-${payslip.id?.slice(-6) || '000000'}`;
  const period = payslip.periodStart
    ? `${formatDate(payslip.periodStart)} → ${formatDate(payslip.periodEnd)}`
    : 'Current Period';

  const grossSalary = Number(payslip.grossSalary || 0);
  const totalDeductions = Number(payslip.totalDeductions || 0);
  const netSalary = Number(payslip.netSalary || 0);

  const lines = payslip.lines || [];
  const earnings =
    lines.length > 0
      ? lines.filter((l) => ['BASIC', 'ALLOWANCE', 'GROSS'].includes(l.category))
      : [{ name: 'Gross Salary', amount: grossSalary }];

  const deductions =
    lines.length > 0
      ? lines.filter((l) => ['DEDUCTION', 'TAX', 'CONTRIBUTION'].includes(l.category))
      : [{ name: 'Total Deductions', amount: totalDeductions }];

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Breadcrumb Navigation */}
      <div className='print:hidden'>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'Payslips', to: '/payslips' },
            { label: slipCode },
          ]}
        />
      </div>

      {/* Toolbar with contextual BackButton */}
      <div className='flex items-center justify-between print:hidden'>
        <BackButton label='Back to Payslips' fallback='/payslips' onClick={() => navigate('/payslips')} />

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className='px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60'
          >
            <svg className='w-3.5 h-3.5 text-[#714B67]' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' />
            </svg>
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          <button
            type='button'
            onClick={handleSendEmail}
            className='px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5'
          >
            <span>✉️</span>
            <span>Email</span>
          </button>

          <button
            type='button'
            onClick={handlePrint}
            className='px-4 py-1.5 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5'
          >
            <span>🖨️</span>
            <span>Print</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between print:hidden animate-fadeIn ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            type='button'
            onClick={() => setActionMessage(null)}
            className='font-bold ml-2 cursor-pointer'
          >
            ✕
          </button>
        </div>
      )}

      {/* Printable Payslip Card */}
      <div className='bg-white rounded-3xl border border-[#EAE6DF] p-6 sm:p-10 space-y-8 shadow-xs print:border-none print:shadow-none print:p-0'>
        {/* Header */}
        <div className='flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#EAE6DF]'>
          <div>
            <span className='text-2xl font-black text-[#1E293B]'>PeoplePay</span>
            <p className='text-xs text-gray-500 mt-1'>HR & Payroll Management System</p>
          </div>
          <div className='text-right'>
            <span className='inline-block text-xs font-mono font-bold text-[#714B67] bg-purple-50 px-3 py-1 rounded-xl border border-purple-200/80'>
              {slipCode}
            </span>
            <div className='text-xs text-gray-400 mt-1.5'>
              Status: <strong className='text-emerald-700'>{payslip.status || 'PAID'}</strong>
            </div>
          </div>
        </div>

        {/* Employee Details */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs'>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase tracking-wider'>Employee</span>
            <strong className='block mt-0.5 text-[#1E293B]'>{empName}</strong>
            <span className='text-[11px] font-mono text-gray-500'>{empCode}</span>
          </div>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase tracking-wider'>Department</span>
            <span className='font-semibold block mt-0.5 text-[#1E293B]'>{deptName}</span>
            <span className='text-[11px] text-gray-500'>{posName}</span>
          </div>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase tracking-wider'>Pay Period</span>
            <span className='font-semibold block mt-0.5 text-[#1E293B]'>{period}</span>
          </div>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase tracking-wider'>Disbursal Date</span>
            <span className='font-semibold block mt-0.5 text-[#1E293B]'>
              {payslip.updatedAt ? formatDate(payslip.updatedAt) : 'Recent'}
            </span>
          </div>
        </div>

        {/* Earnings & Deductions Tables */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
          {/* Earnings */}
          <div className='space-y-3'>
            <h3 className='text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-1.5'>
              Earnings & Allowances
            </h3>
            <div className='space-y-2 text-xs'>
              {earnings.map((e, idx) => (
                <div key={idx} className='flex justify-between py-1 border-b border-gray-50'>
                  <span className='text-gray-600'>{e.name || e.code || 'Allowance'}</span>
                  <span className='font-semibold text-gray-900'>₹{Number(e.amount || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className='flex justify-between pt-2 border-t font-bold text-xs'>
              <span>Gross Salary</span>
              <span className='text-emerald-700'>₹{grossSalary.toLocaleString()}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className='space-y-3'>
            <h3 className='text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-1.5'>
              Deductions
            </h3>
            <div className='space-y-2 text-xs'>
              {deductions.map((d, idx) => (
                <div key={idx} className='flex justify-between py-1 border-b border-gray-50'>
                  <span className='text-gray-600'>{d.name || d.code || 'Deduction'}</span>
                  <span className='font-semibold text-gray-900'>₹{Number(d.amount || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className='flex justify-between pt-2 border-t font-bold text-xs'>
              <span>Total Deductions</span>
              <span className='text-red-700'>₹{totalDeductions.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Net Salary Banner */}
        <div className='p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-between'>
          <div>
            <span className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>Net Disbursed Salary</span>
            <p className='text-xs text-gray-500 mt-0.5'>Transferred to primary salary account</p>
          </div>
          <div className='text-right'>
            <span className='text-2xl font-black text-[#714B67]'>₹{netSalary.toLocaleString()}</span>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className='text-center pt-4 border-t text-[11px] text-gray-400'>
          This is an electronically generated statement by PeoplePay HR & Payroll Platform.
        </div>
      </div>
    </div>
  );
}