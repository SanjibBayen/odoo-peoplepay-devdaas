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
      // FIX: Backend returns { success, data }
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
    return <LoadingState message='Loading employee payslip...' />;
  }

  if (error || !payslip) {
    return <ErrorState message={error || 'Salary slip not found.'} onRetry={loadPayslip} />;
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

  // Use payslip lines if available, otherwise show summary
  const lines = payslip.lines || [];
  
  const earnings = lines.length > 0
    ? lines.filter((l) => ['BASIC', 'ALLOWANCE', 'GROSS'].includes(l.category))
    : [{ name: 'Gross Salary', amount: grossSalary }];

  const deductions = lines.length > 0
    ? lines.filter((l) => ['DEDUCTION', 'TAX', 'CONTRIBUTION'].includes(l.category))
    : [{ name: 'Total Deductions', amount: totalDeductions }];

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Toolbar */}
      <div className='flex items-center justify-between print:hidden'>
        <BackButton label='Back to Payslips' onClick={() => navigate('/payslips')} />

        <div className='flex items-center gap-2'>
          <button type='button' onClick={handleSendEmail} className='px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl cursor-pointer'>
            ✉️ Email
          </button>
          <button type='button' onClick={handlePrint} className='px-4 py-1.5 text-xs font-bold text-white bg-[#714B67] rounded-xl cursor-pointer'>
            🖨️ Print
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between print:hidden ${
          actionMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{actionMessage.text}</span>
          <button type='button' onClick={() => setActionMessage(null)} className='font-bold ml-2 cursor-pointer'>✕</button>
        </div>
      )}

      {/* Printable Payslip */}
      <div className='bg-white rounded-3xl border p-6 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0'>
        {/* Header */}
        <div className='flex flex-wrap items-start justify-between gap-4 pb-6 border-b'>
          <div>
            <span className='text-2xl font-black'>PeoplePay</span>
            <p className='text-xs text-gray-500 mt-1'>HR & Payroll Management System</p>
          </div>
          <div className='text-right'>
            <span className='inline-block text-xs font-mono font-bold text-[#714B67] bg-purple-50 px-3 py-1 rounded-xl border'>{slipCode}</span>
            <div className='text-xs text-gray-400 mt-1.5'>Status: <strong className='text-emerald-700'>{payslip.status || 'PAID'}</strong></div>
          </div>
        </div>

        {/* Employee Details */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FAF8F5] border text-xs'>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase'>Employee</span>
            <strong className='block mt-0.5'>{empName}</strong>
            <span className='text-[11px] font-mono text-gray-500'>{empCode}</span>
          </div>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase'>Department</span>
            <span className='font-semibold block mt-0.5'>{deptName}</span>
            <span className='text-[11px] text-gray-500'>{posName}</span>
          </div>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase'>Pay Period</span>
            <span className='font-semibold block mt-0.5'>{period}</span>
          </div>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase'>Worked Days</span>
            <span className='font-semibold block mt-0.5'>{payslip.workedDays || 0} days</span>
          </div>
        </div>

        {/* Earnings & Deductions */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='border rounded-2xl overflow-hidden'>
            <div className='bg-emerald-50 px-4 py-2.5 border-b'>
              <h4 className='text-xs font-bold uppercase text-emerald-900'>Earnings</h4>
            </div>
            <div className='divide-y text-xs'>
              {earnings.map((e, idx) => (
                <div key={idx} className='px-4 py-2.5 flex justify-between'>
                  <span className='font-medium'>{e.ruleName || e.name}</span>
                  <span className='font-bold'>{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
            <div className='bg-gray-50 px-4 py-3 border-t flex justify-between font-bold text-xs'>
              <span>Gross Salary</span>
              <span className='text-emerald-800'>{formatCurrency(grossSalary)}</span>
            </div>
          </div>

          <div className='border rounded-2xl overflow-hidden'>
            <div className='bg-rose-50 px-4 py-2.5 border-b'>
              <h4 className='text-xs font-bold uppercase text-rose-900'>Deductions</h4>
            </div>
            <div className='divide-y text-xs'>
              {deductions.map((d, idx) => (
                <div key={idx} className='px-4 py-2.5 flex justify-between'>
                  <span className='font-medium'>{d.ruleName || d.name}</span>
                  <span className='font-bold text-rose-700'>-{formatCurrency(d.amount)}</span>
                </div>
              ))}
            </div>
            <div className='bg-gray-50 px-4 py-3 border-t flex justify-between font-bold text-xs'>
              <span>Total Deductions</span>
              <span className='text-rose-700'>-{formatCurrency(totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Net Salary */}
        <div className='p-5 rounded-2xl bg-[#714B67] text-white flex items-center justify-between'>
          <span className='text-xs uppercase font-bold text-purple-200'>Net Salary Payable</span>
          <span className='text-2xl sm:text-3xl font-black'>{formatCurrency(netSalary)}</span>
        </div>

        {/* Footer */}
        <div className='pt-6 border-t text-center text-[11px] text-gray-400'>
          <p>This document is computer-generated and requires no physical signature.</p>
        </div>
      </div>
    </div>
  );
}