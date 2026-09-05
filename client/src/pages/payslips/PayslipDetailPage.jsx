import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import payslipApi from '../../services/payslipApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

export default function PayslipDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const loadPayslip = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await payslipApi.getPayslipById(id);
      const data = res.data || res;
      setPayslip(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load payslip details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await payslipApi.getPayslipById(id);
        if (active) {
          const data = res.data || res;
          setPayslip(data);
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load payslip details.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      await payslipApi.downloadPayslip(id, payslip);
      setActionMessage({ type: 'success', text: 'Payslip document downloaded.' });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setActionMessage({ type: 'error', text: extractErrorMessage(err, 'Download failed.') });
    }
  };

  const handleSendEmail = async () => {
    try {
      const res = await payslipApi.sendPayslip(id);
      setActionMessage({ type: 'success', text: res.message || 'Payslip emailed to employee.' });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setActionMessage({ type: 'error', text: extractErrorMessage(err, 'Failed to email payslip.') });
    }
  };

  if (loading) {
    return <LoadingState message='Loading employee payslip...' />;
  }

  if (error || !payslip) {
    return (
      <ErrorState
        message={error || 'Salary slip not found.'}
        onRetry={loadPayslip}
      />
    );
  }

  const emp = payslip.employee || {};
  const empName = emp.firstName
    ? `${emp.firstName} ${emp.lastName || ''}`.trim()
    : payslip.employeeName || 'Employee';
  const empCode = emp.employeeCode || payslip.employeeId || 'EMP-000';
  const deptName = emp.department?.name || payslip.department || 'General';
  const posName = emp.jobPosition?.name || payslip.jobPosition || 'Staff Member';
  const slipCode = payslip.payslipNumber || payslip.slipNumber || `PS-${payslip.id.slice(-6)}`;
  const period = payslip.periodStart
    ? `${formatDate(payslip.periodStart, 'DD Mon YYYY')} → ${formatDate(payslip.periodEnd, 'DD Mon YYYY')}`
    : payslip.period || 'Current Period';

  const grossSalary = Number(payslip.grossSalary || 0);
  const totalDeductions = Number(payslip.totalDeductions || 0);
  const netSalary = Number(payslip.netSalary || 0);

  // Parse or provide items
  const earnings = payslip.earnings || [
    { name: 'Basic Salary', amount: Math.round(grossSalary * 0.5) },
    { name: 'House Rent Allowance (HRA)', amount: Math.round(grossSalary * 0.25) },
    { name: 'Special Allowance', amount: Math.round(grossSalary * 0.15) },
    { name: 'Medical Allowance', amount: Math.max(0, grossSalary - Math.round(grossSalary * 0.9)) },
  ];

  const deductions = payslip.deductions || [
    { name: 'Provident Fund (PF)', amount: Math.round(totalDeductions * 0.6) },
    { name: 'Professional Tax (PT)', amount: Math.min(200, totalDeductions) },
    { name: 'Income Tax (TDS)', amount: Math.max(0, totalDeductions - Math.round(totalDeductions * 0.6) - 200) },
  ];

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Top Toolbar (Hidden when printing) */}
      <div className='flex items-center justify-between print:hidden'>
        <BackButton label='Back to Payslips' fallback='/payslips' onClick={() => navigate('/payslips')} />

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={handleDownload}
            className='px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5'
          >
            <span>📥</span>
            <span>Download</span>
          </button>
          <button
            type='button'
            onClick={handleSendEmail}
            className='px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5'
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
            <span>Print Payslip</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-fadeIn print:hidden ${
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

      {/* Printable Payslip Container */}
      <div className='bg-white rounded-3xl border border-[#EAE6DF] shadow-xs p-6 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0'>
        {/* Company & Document Header */}
        <div className='flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-gray-200'>
          <div>
            <div className='flex items-center gap-2'>
              <div className='w-9 h-9 rounded-xl bg-[#714B67] text-white font-black text-lg flex items-center justify-center shadow-xs'>
                P
              </div>
              <span className='text-2xl font-black text-[#1E293B] tracking-tight'>
                People<span className='text-[#714B67]'>Pay</span>
              </span>
            </div>
            <p className='text-xs text-gray-500 mt-1 font-medium'>
              Corporate Payroll & Human Resources Services
            </p>
          </div>

          <div className='text-right'>
            <span className='inline-block text-xs font-mono font-bold text-[#714B67] bg-purple-50 px-3 py-1 rounded-xl border border-purple-200'>
              {slipCode}
            </span>
            <div className='text-xs text-gray-400 font-medium mt-1.5'>
              Status: <strong className='text-emerald-700 uppercase'>{payslip.status || 'PAID'}</strong>
            </div>
          </div>
        </div>

        {/* Employee & Pay Period Details */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs'>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase block'>Employee</span>
            <strong className='text-gray-900 block mt-0.5'>{empName}</strong>
            <span className='text-[11px] font-mono text-gray-500'>{empCode}</span>
          </div>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase block'>Department</span>
            <span className='font-semibold text-gray-800 block mt-0.5'>{deptName}</span>
            <span className='text-[11px] text-gray-500'>{posName}</span>
          </div>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase block'>Pay Period</span>
            <span className='font-semibold text-gray-800 block mt-0.5'>{period}</span>
            <span className='text-[11px] text-gray-500'>Monthly Cycle</span>
          </div>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase block'>Disbursal Account</span>
            <span className='font-mono font-semibold text-gray-800 block mt-0.5'>
              {payslip.bankAccountNumber || payslip.bankAccount || 'Salary Direct Transfer'}
            </span>
            <span className='text-[11px] text-gray-500'>
              {payslip.disbursalDate ? formatDate(payslip.disbursalDate, 'DD Mon YYYY') : 'End of Period'}
            </span>
          </div>
        </div>

        {/* Dual Column: Earnings vs Deductions */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Earnings Column */}
          <div className='border border-gray-200 rounded-2xl overflow-hidden'>
            <div className='bg-emerald-50/70 px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between'>
              <h4 className='text-xs font-bold uppercase tracking-wider text-emerald-900'>
                Earnings & Allowances
              </h4>
              <span className='text-xs font-bold text-emerald-800'>Amount (₹)</span>
            </div>
            <div className='divide-y divide-gray-100 text-xs'>
              {earnings.map((e, idx) => (
                <div key={idx} className='px-4 py-2.5 flex items-center justify-between'>
                  <span className='text-gray-700 font-medium'>{e.name}</span>
                  <span className='font-bold text-gray-900'>{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
            <div className='bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between font-bold text-xs'>
              <span className='text-gray-900 uppercase'>Total Earnings</span>
              <span className='text-emerald-800 text-sm font-black'>{formatCurrency(grossSalary)}</span>
            </div>
          </div>

          {/* Deductions Column */}
          <div className='border border-gray-200 rounded-2xl overflow-hidden'>
            <div className='bg-rose-50/70 px-4 py-2.5 border-b border-rose-100 flex items-center justify-between'>
              <h4 className='text-xs font-bold uppercase tracking-wider text-rose-900'>
                Deductions & Withholdings
              </h4>
              <span className='text-xs font-bold text-rose-800'>Amount (₹)</span>
            </div>
            <div className='divide-y divide-gray-100 text-xs'>
              {deductions.map((d, idx) => (
                <div key={idx} className='px-4 py-2.5 flex items-center justify-between'>
                  <span className='text-gray-700 font-medium'>{d.name}</span>
                  <span className='font-bold text-rose-700'>-{formatCurrency(d.amount)}</span>
                </div>
              ))}
            </div>
            <div className='bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between font-bold text-xs'>
              <span className='text-gray-900 uppercase'>Total Deductions</span>
              <span className='text-rose-700 text-sm font-black'>-{formatCurrency(totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Net Salary Highlight Bar */}
        <div className='p-5 rounded-2xl bg-[#714B67] text-white flex flex-wrap items-center justify-between gap-4'>
          <div>
            <span className='text-xs uppercase font-bold text-purple-200 tracking-wider block'>
              Net Salary Payable
            </span>
            <span className='text-xs text-purple-100 font-medium mt-0.5 block'>
              Disbursed electronically to designated bank account
            </span>
          </div>
          <div className='text-right'>
            <span className='text-2xl sm:text-3xl font-black tracking-tight'>
              {formatCurrency(netSalary)}
            </span>
          </div>
        </div>

        {/* Footer Note */}
        <div className='pt-6 border-t border-gray-200 text-center text-[11px] text-gray-400 space-y-1'>
          <p>This document is computer-generated and requires no physical signature.</p>
          <p>For inquiries regarding salary calculations or tax deductions, contact payroll@peoplepay.internal.</p>
        </div>
      </div>
    </div>
  );
}
