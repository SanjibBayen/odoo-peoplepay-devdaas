import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import payslipApi from '../../services/payslipApi.js';
import { getPayslipsFromStorage } from '../../data/payslipsData.js';

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState(() => getPayslipsFromStorage());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Detail Modal State
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const loadPayslips = () => {
    payslipApi
      .getPayslips()
      .then((res) => {
        setPayslips(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load payslips.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPayslips();
  }, []);

  const handleDownload = async (id) => {
    try {
      await payslipApi.downloadPayslip(id);
    } catch (err) {
      alert(err.message || 'Download failed');
    }
  };

  const handleSend = async (id) => {
    try {
      const res = await payslipApi.sendPayslip(id);
      alert(res.message || 'Payslip sent to employee.');
    } catch (err) {
      alert(err.message || 'Failed to send');
    }
  };

  const filtered = payslips.filter((p) => {
    const matchesStatus =
      selectedStatus === 'All' || p.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.employeeName?.toLowerCase().includes(q) ||
      p.employeeId?.toLowerCase().includes(q) ||
      p.slipNumber?.toLowerCase().includes(q) ||
      p.period?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Payslips'
        subtitle='Itemized earnings, deductions, tax withholdings, and net salary disbursal records.'
      />

      {/* Filter Toolbar */}
      <div className='bg-white p-3 rounded-2xl border border-[#EAE6DF] shadow-2xs flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]'>
          <div className='relative flex-1 max-w-xs'>
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder='Search by slip ID, employee, or period...'
              className='w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67]'
            />
            <span className='absolute left-2.5 top-2 text-gray-400 text-xs'>
              🔍
            </span>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className='px-3 py-1.5 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs font-bold text-gray-700 focus:bg-white focus:outline-none'
          >
            <option value='All'>All Statuses</option>
            <option value='Computed'>Computed</option>
            <option value='Confirmed'>Confirmed</option>
            <option value='Paid'>Paid</option>
          </select>
        </div>

        <div className='text-xs font-bold text-gray-500'>
          Showing {filtered.length} payslips
        </div>
      </div>

      {loading ? (
        <LoadingState message='Loading payslips and earnings calculations...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadPayslips} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title='No payslips found'
          description='Generate a payrun batch to compute workforce payslips.'
        />
      ) : (
        <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[10px]'>
                <tr>
                  <th className='py-3 px-4'>Slip Number</th>
                  <th className='py-3 px-4'>Employee</th>
                  <th className='py-3 px-4'>Period</th>
                  <th className='py-3 px-4'>Gross Wage</th>
                  <th className='py-3 px-4'>Deductions</th>
                  <th className='py-3 px-4'>Net Disbursal</th>
                  <th className='py-3 px-4'>Status</th>
                  <th className='py-3 px-4 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {paginated.map((p) => (
                  <tr key={p.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                    <td className='py-3 px-4 font-bold text-gray-900'>
                      {p.slipNumber}
                    </td>
                    <td className='py-3 px-4'>
                      <div className='font-bold text-gray-900'>{p.employeeName}</div>
                      <div className='text-[10px] text-gray-500'>{p.employeeId}</div>
                    </td>
                    <td className='py-3 px-4 text-gray-600 font-medium'>
                      {p.period}
                    </td>
                    <td className='py-3 px-4 font-medium text-gray-800'>
                      ₹{p.grossSalary?.toLocaleString()}
                    </td>
                    <td className='py-3 px-4 text-rose-600 font-medium'>
                      -₹{p.totalDeductions?.toLocaleString()}
                    </td>
                    <td className='py-3 px-4 font-black text-[#714B67] text-sm'>
                      ₹{p.netSalary?.toLocaleString()}
                    </td>
                    <td className='py-3 px-4'>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-purple-50 text-[#714B67] border-purple-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className='py-3 px-4 text-right space-x-2'>
                      <button
                        type='button'
                        onClick={() => setSelectedPayslip(p)}
                        className='text-[#714B67] hover:underline font-bold cursor-pointer'
                      >
                        View
                      </button>
                      <button
                        type='button'
                        onClick={() => handleDownload(p.id)}
                        className='text-gray-600 hover:underline font-bold cursor-pointer'
                      >
                        Download
                      </button>
                      <button
                        type='button'
                        onClick={() => handleSend(p.id)}
                        className='text-emerald-700 hover:underline font-bold cursor-pointer'
                      >
                        Send
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='p-3 border-t border-[#EAE6DF]'>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* Detailed Salary Breakdown Modal */}
      {selectedPayslip && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <div>
                <h3 className='text-base font-black text-[#1E293B]'>
                  Payslip Breakdown — {selectedPayslip.slipNumber}
                </h3>
                <p className='text-xs text-gray-500 mt-0.5'>
                  {selectedPayslip.employeeName} ({selectedPayslip.employeeId}) • {selectedPayslip.period}
                </p>
              </div>
              <button
                type='button'
                onClick={() => setSelectedPayslip(null)}
                className='text-gray-400 font-bold'
              >
                ✕
              </button>
            </div>

            <div className='space-y-4 text-xs'>
              {/* Summary Cards */}
              <div className='grid grid-cols-3 gap-2.5 text-center'>
                <div className='p-3 rounded-xl bg-gray-50 border border-gray-200/80'>
                  <div className='text-[10px] uppercase font-bold text-gray-500'>Gross Wage</div>
                  <div className='text-sm font-black text-gray-900 mt-1'>
                    ₹{selectedPayslip.grossSalary?.toLocaleString()}
                  </div>
                </div>
                <div className='p-3 rounded-xl bg-rose-50/50 border border-rose-200/80'>
                  <div className='text-[10px] uppercase font-bold text-rose-600'>Deductions</div>
                  <div className='text-sm font-black text-rose-700 mt-1'>
                    -₹{selectedPayslip.totalDeductions?.toLocaleString()}
                  </div>
                </div>
                <div className='p-3 rounded-xl bg-purple-50/50 border border-purple-200/80'>
                  <div className='text-[10px] uppercase font-bold text-[#714B67]'>Net Disbursal</div>
                  <div className='text-sm font-black text-[#714B67] mt-1'>
                    ₹{selectedPayslip.netSalary?.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2'>
                {/* Earnings */}
                <div className='border border-gray-200 rounded-xl p-3 bg-[#FAF8F5] space-y-2'>
                  <h4 className='font-bold text-emerald-800 text-[11px] uppercase tracking-wider border-b border-gray-200 pb-1'>
                    Earnings
                  </h4>
                  <div className='space-y-1.5'>
                    {selectedPayslip.earnings?.map((e, idx) => (
                      <div key={idx} className='flex items-center justify-between'>
                        <span className='text-gray-700'>{e.name}</span>
                        <span className='font-bold text-gray-900'>₹{e.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deductions */}
                <div className='border border-gray-200 rounded-xl p-3 bg-[#FAF8F5] space-y-2'>
                  <h4 className='font-bold text-rose-800 text-[11px] uppercase tracking-wider border-b border-gray-200 pb-1'>
                    Deductions & Taxes
                  </h4>
                  <div className='space-y-1.5'>
                    {selectedPayslip.deductions?.map((d, idx) => (
                      <div key={idx} className='flex items-center justify-between'>
                        <span className='text-gray-700'>{d.name}</span>
                        <span className='font-bold text-rose-700'>-₹{d.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className='p-3 rounded-xl bg-gray-50 text-[11px] text-gray-600 flex items-center justify-between'>
                <span>Bank: <strong className='text-gray-900'>{selectedPayslip.bankAccount}</strong></span>
                <span>Disbursal: <strong className='text-gray-900'>{selectedPayslip.disbursalDate}</strong></span>
              </div>
            </div>

            <div className='pt-2 flex items-center justify-between border-t border-gray-100'>
              <button
                type='button'
                onClick={() => handleDownload(selectedPayslip.id)}
                className='px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer'
              >
                Download Receipt (.txt)
              </button>
              <button
                type='button'
                onClick={() => setSelectedPayslip(null)}
                className='px-4 py-1.5 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl cursor-pointer'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
