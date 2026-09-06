import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import payslipApi from '../../services/payslipApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

function normalizePayslip(slip) {
  if (!slip) return null;
  const emp = slip.employee || {};
  const empName = emp.firstName
    ? `${emp.firstName} ${emp.lastName || ''}`.trim()
    : slip.employeeName || 'Employee';
  const empCode = emp.employeeCode || '';
  const period = slip.periodStart
    ? `${slip.periodStart} → ${slip.periodEnd}`
    : 'Current Period';

  return {
    ...slip,
    id: slip.id,
    slipNumber: slip.payslipNumber || `PS-${slip.id?.slice(-6) || '000000'}`,
    employeeName: empName,
    employeeId: empCode,
    period,
    grossSalary: Number(slip.grossSalary || 0),
    totalDeductions: Number(slip.totalDeductions || 0),
    netSalary: Number(slip.netSalary || 0),
    status: slip.status || 'COMPUTED',
  };
}

export default function PayslipsPage() {
  const navigate = useNavigate();

  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const loadPayslips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await payslipApi.getPayslips();
      // FIX: Backend returns { success, data }
      const list = res?.data || [];
      setPayslips(Array.isArray(list) ? list.map(normalizePayslip) : []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load payslips.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayslips();
  }, [loadPayslips]);

  const handleSend = async (id) => {
    try {
      const res = await payslipApi.sendPayslip(id);
      setStatusBanner({ type: 'success', text: res?.message || 'Payslip emailed.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to send') });
    }
  };

  const filtered = payslips.filter((p) => {
    const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus.toUpperCase() || p.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.employeeName?.toLowerCase().includes(q) ||
      p.employeeId?.toLowerCase().includes(q) ||
      p.slipNumber?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getStatusClass = (status) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'VALIDATED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COMPUTED': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Payslips'
        subtitle='Itemized earnings, deductions, tax withholdings, and net salary disbursal records.'
      />

      {statusBanner && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          statusBanner.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{statusBanner.text}</span>
          <button type='button' onClick={() => setStatusBanner(null)} className='font-bold ml-2 cursor-pointer'>✕</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className='bg-white p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3'>
        <input
          type='text'
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          placeholder='Search by slip ID or employee...'
          className='px-3 py-1.5 rounded-xl border text-xs w-full max-w-xs'
        />
        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          className='px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer'
        >
          <option value='All'>All Statuses</option>
          <option value='DRAFT'>Draft</option>
          <option value='COMPUTED'>Computed</option>
          <option value='VALIDATED'>Validated</option>
          <option value='PAID'>Paid</option>
        </select>
        <div className='text-xs font-bold text-gray-500'>Showing {filtered.length} payslips</div>
      </div>

      {loading ? (
        <LoadingState message='Loading payslips...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadPayslips} />
      ) : filtered.length === 0 ? (
        <EmptyState title='No payslips found' description='Generate a payrun batch to compute workforce payslips.' />
      ) : (
        <div className='bg-white rounded-2xl border overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-[#FAF8F5] border-b text-gray-500 font-bold uppercase text-[10px]'>
                <tr>
                  <th className='py-3 px-4'>Slip Number</th>
                  <th className='py-3 px-4'>Employee</th>
                  <th className='py-3 px-4'>Period</th>
                  <th className='py-3 px-4'>Gross</th>
                  <th className='py-3 px-4'>Deductions</th>
                  <th className='py-3 px-4'>Net</th>
                  <th className='py-3 px-4'>Status</th>
                  <th className='py-3 px-4 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {paginated.map((p) => (
                  <tr key={p.id} className='hover:bg-[#FAF8F5]/60'>
                    <td className='py-3 px-4 font-mono font-bold'>{p.slipNumber}</td>
                    <td className='py-3 px-4'>
                      <div className='font-bold'>{p.employeeName}</div>
                      <div className='text-[10px] text-gray-500'>{p.employeeId}</div>
                    </td>
                    <td className='py-3 px-4 text-gray-600'>{p.period}</td>
                    <td className='py-3 px-4'>{formatCurrency(p.grossSalary)}</td>
                    <td className='py-3 px-4 text-rose-600'>-{formatCurrency(p.totalDeductions)}</td>
                    <td className='py-3 px-4 font-black text-[#714B67]'>{formatCurrency(p.netSalary)}</td>
                    <td className='py-3 px-4'>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusClass(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className='py-3 px-4 text-right space-x-2'>
                      <button type='button' onClick={() => navigate(`/payslips/${p.id}`)} className='text-[#714B67] hover:underline font-bold cursor-pointer'>
                        View
                      </button>
                      <button type='button' onClick={() => handleSend(p.id)} className='text-emerald-700 hover:underline font-bold cursor-pointer'>
                        Send
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='p-3 border-t'>
            <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}