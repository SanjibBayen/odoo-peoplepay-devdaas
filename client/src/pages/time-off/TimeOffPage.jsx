import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import timeOffApi from '../../services/timeOffApi.js';
import { getEmployees } from '../../data/employeeStore.js';
import {
  getAllocationsFromStorage,
  getTimeOffRequestsFromStorage,
  INITIAL_LEAVE_TYPES,
} from '../../data/timeOffData.js';

export default function TimeOffPage() {
  const [requests, setRequests] = useState(() => getTimeOffRequestsFromStorage());
  const [allocations, setAllocations] = useState(() => getAllocationsFromStorage());
  const [leaveTypes, setLeaveTypes] = useState(() => INITIAL_LEAVE_TYPES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // New Request Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState(null);

  const employees = getEmployees();
  const [formData, setFormData] = useState({
    employeeId: employees[0]?.employeeId || 'EMP-2024-001',
    leaveTypeId: 'lt-1',
    startDate: '',
    endDate: '',
    days: 1,
    reason: '',
  });

  const loadData = () => {
    Promise.all([
      timeOffApi.getLeaveTypes(),
      timeOffApi.getAllocations(),
      timeOffApi.getRequests(),
    ])
      .then(([typesRes, allocRes, reqRes]) => {
        setLeaveTypes(typesRes.data || []);
        setAllocations(allocRes.data || []);
        setRequests(reqRes.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load time off data.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setFormError(null);
    setFormData({
      employeeId: employees[0]?.employeeId || 'EMP-2024-001',
      leaveTypeId: leaveTypes[0]?.id || 'lt-1',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      days: 1,
      reason: '',
    });
    setIsModalOpen(true);
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setFormError(null);

    const emp = employees.find((x) => x.employeeId === formData.employeeId);
    const lt = leaveTypes.find((x) => x.id === formData.leaveTypeId);

    try {
      await timeOffApi.createRequest({
        ...formData,
        employeeName: emp ? emp.name : 'Employee',
        department: emp ? emp.department : 'General',
        leaveTypeName: lt ? lt.name : 'Leave',
        days: Number(formData.days),
      });
      setIsModalOpen(false);
      await loadData();
      setStatusBanner({ type: 'success', text: 'Time off request submitted successfully.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setFormError(err.message || 'Failed to submit time off request');
    }
  };

  const handleApprove = async (id) => {
    try {
      await timeOffApi.approveRequest(id, { reviewNotes: 'Approved' });
      await loadData();
      setStatusBanner({ type: 'success', text: 'Time off request approved.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: err.message || 'Failed to approve request' });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const handleReject = async (id) => {
    try {
      await timeOffApi.rejectRequest(id, { reason: 'Schedule clash' });
      await loadData();
      setStatusBanner({ type: 'success', text: 'Time off request rejected.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: err.message || 'Failed to reject request' });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus =
      selectedStatus === 'All' || r.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.employeeName?.toLowerCase().includes(q) ||
      r.employeeId?.toLowerCase().includes(q) ||
      r.leaveTypeName?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginated = filteredRequests.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Time Off'
        subtitle='Leave types, remaining allocation balances, and approvals.'
        actions={
          <button
            type='button'
            onClick={handleOpenAdd}
            className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1'
          >
            <span>+</span>
            <span>Request Time Off</span>
          </button>
        }
      />

      {statusBanner && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusBanner.text}
        </div>
      )}

      {/* Allocation Balances Strip */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5'>
        {leaveTypes.map((type) => {
          const alloc = allocations.find((a) => a.leaveTypeId === type.id);
          const total = alloc?.allocatedDays ?? type.defaultDays;
          const used = alloc?.approvedUsedDays ?? 0;
          const remaining = total - used;

          return (
            <div
              key={type.id}
              className='bg-white rounded-2xl p-4 border border-[#EAE6DF] shadow-2xs space-y-2'
            >
              <div className='flex items-center justify-between'>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${type.color}`}>
                  {type.code}
                </span>
                <span className='text-[11px] text-gray-400 font-medium'>
                  {used} used
                </span>
              </div>
              <h4 className='text-xs font-bold text-gray-800 truncate'>{type.name}</h4>
              <div className='flex items-baseline gap-1.5 pt-1'>
                <span className='text-xl font-black text-[#1E293B]'>{remaining}</span>
                <span className='text-xs text-gray-500 font-medium'>days available</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Requests Filter Bar */}
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
              placeholder='Search by employee or leave type...'
              className='w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67]'
            />
            <span className='absolute left-2.5 top-2 text-gray-400'>
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
              </svg>
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
            <option value='All'>All Requests</option>
            <option value='Pending'>Pending</option>
            <option value='Approved'>Approved</option>
            <option value='Rejected'>Rejected</option>
          </select>
        </div>

        <div className='text-xs font-bold text-gray-500'>
          Showing {filteredRequests.length} requests
        </div>
      </div>

      {loading ? (
        <LoadingState message='Loading time off requests and balances...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title='No time off requests found'
          description='Submit a new request or change your filter.'
          action={
            <button
              type='button'
              onClick={handleOpenAdd}
              className='px-3.5 py-1.5 rounded-xl bg-[#714B67] text-white text-xs font-bold'
            >
              New Request
            </button>
          }
        />
      ) : (
        <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[10px]'>
                <tr>
                  <th className='py-3 px-4'>Request ID</th>
                  <th className='py-3 px-4'>Employee</th>
                  <th className='py-3 px-4'>Leave Type</th>
                  <th className='py-3 px-4'>Period</th>
                  <th className='py-3 px-4'>Days</th>
                  <th className='py-3 px-4'>Reason</th>
                  <th className='py-3 px-4'>Status</th>
                  <th className='py-3 px-4 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {paginated.map((r) => (
                  <tr key={r.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                    <td className='py-3 px-4 font-bold text-gray-800'>{r.requestId}</td>
                    <td className='py-3 px-4'>
                      <div className='font-bold text-gray-900'>{r.employeeName}</div>
                      <div className='text-[10px] text-gray-500'>{r.employeeId}</div>
                    </td>
                    <td className='py-3 px-4 font-bold text-gray-700'>{r.leaveTypeName}</td>
                    <td className='py-3 px-4 text-gray-600'>
                      {r.startDate} &rarr; {r.endDate}
                    </td>
                    <td className='py-3 px-4 font-bold text-gray-900'>{r.days} d</td>
                    <td className='py-3 px-4 text-gray-600 max-w-xs truncate'>
                      {r.reason}
                    </td>
                    <td className='py-3 px-4'>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className='py-3 px-4 text-right space-x-2'>
                      {r.status === 'Pending' ? (
                        <>
                          <button
                            type='button'
                            onClick={() => handleApprove(r.id)}
                            className='text-emerald-700 hover:underline font-bold cursor-pointer'
                          >
                            Approve
                          </button>
                          <button
                            type='button'
                            onClick={() => handleReject(r.id)}
                            className='text-rose-600 hover:underline font-bold cursor-pointer'
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className='text-gray-400 font-medium'>Reviewed</span>
                      )}
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
              totalItems={filteredRequests.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {isModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <h3 className='text-base font-black text-[#1E293B]'>
                Request Time Off
              </h3>
              <button
                type='button'
                onClick={() => setIsModalOpen(false)}
                className='text-gray-400 font-bold'
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className='p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold'>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className='space-y-3.5 text-xs'>
              <div>
                <label className='block font-bold text-gray-700 mb-1'>Employee</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeId: e.target.value })
                  }
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.employeeId}>
                      {emp.name} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Leave Type</label>
                <select
                  value={formData.leaveTypeId}
                  onChange={(e) =>
                    setFormData({ ...formData, leaveTypeId: e.target.value })
                  }
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                >
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Start Date</label>
                  <input
                    type='date'
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>End Date</label>
                  <input
                    type='date'
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Days Count</label>
                <input
                  type='number'
                  min='0.5'
                  step='0.5'
                  required
                  value={formData.days}
                  onChange={(e) =>
                    setFormData({ ...formData, days: e.target.value })
                  }
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Reason</label>
                <textarea
                  required
                  rows='2'
                  placeholder='Provide context for approval...'
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div className='pt-2 flex items-center justify-end gap-2 border-t border-gray-100'>
                <BackButton label='Cancel' onClick={() => setIsModalOpen(false)} />
                <button
                  type='submit'
                  className='px-4 py-2 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs cursor-pointer'
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
