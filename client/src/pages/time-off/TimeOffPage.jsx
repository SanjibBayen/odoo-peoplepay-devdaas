import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import timeOffApi from '../../services/timeOffApi.js';
import employeeApi from '../../services/employeeApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

function normalizeRequest(req) {
  if (!req) return null;
  const emp = req.employee || {};
  const empName = emp.firstName
    ? `${emp.firstName} ${emp.lastName || ''}`.trim()
    : req.employeeName || 'Employee';
  const empCode = emp.employeeCode || req.employeeId || '';
  const typeName = req.timeOffType?.name || req.leaveTypeName || 'Time Off';

  return {
    ...req,
    id: req.id,
    employeeName: empName,
    employeeId: empCode,
    leaveTypeName: typeName,
    timeOffTypeId: req.timeOffTypeId,
    days: req.duration || req.days || 1,
    startDate: req.startDate,
    endDate: req.endDate,
    status:
      req.status === 'PENDING'
        ? 'Pending'
        : req.status === 'APPROVED'
        ? 'Approved'
        : req.status === 'REFUSED'
        ? 'Rejected'
        : req.status || 'Pending',
    rawStatus: req.status,
    reason: req.reason || '',
  };
}

export default function TimeOffPage() {
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // New Request Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    timeOffTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [typesRes, allocRes, reqRes, empRes] = await Promise.allSettled([
        timeOffApi.getTimeOffTypes(),
        timeOffApi.getAllocations(),
        timeOffApi.getRequests(),
        employeeApi.getEmployees({ limit: 100 }),
      ]);

      if (typesRes.status === 'fulfilled') {
        setLeaveTypes(typesRes.value.data || (Array.isArray(typesRes.value) ? typesRes.value : []));
      }
      if (allocRes.status === 'fulfilled') {
        setAllocations(allocRes.value.data || (Array.isArray(allocRes.value) ? allocRes.value : []));
      }
      if (reqRes.status === 'fulfilled') {
        const list = reqRes.value.data || (Array.isArray(reqRes.value) ? reqRes.value : []);
        setRequests(list.map(normalizeRequest));
      }
      if (empRes.status === 'fulfilled') {
        setEmployees(empRes.value.data || []);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load time off records.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [typesRes, allocRes, reqRes, empRes] = await Promise.allSettled([
          timeOffApi.getTimeOffTypes(),
          timeOffApi.getAllocations(),
          timeOffApi.getRequests(),
          employeeApi.getEmployees({ limit: 100 }),
        ]);
        if (!active) return;
        if (typesRes.status === 'fulfilled') {
          setLeaveTypes(typesRes.value.data || (Array.isArray(typesRes.value) ? typesRes.value : []));
        }
        if (allocRes.status === 'fulfilled') {
          setAllocations(allocRes.value.data || (Array.isArray(allocRes.value) ? allocRes.value : []));
        }
        if (reqRes.status === 'fulfilled') {
          const list = reqRes.value.data || (Array.isArray(reqRes.value) ? reqRes.value : []);
          setRequests(list.map(normalizeRequest));
        }
        if (empRes.status === 'fulfilled') {
          setEmployees(empRes.value.data || []);
        }
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err, 'Failed to load time off records.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setFormError(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      employeeId: employees[0]?.id || '',
      timeOffTypeId: leaveTypes[0]?.id || '',
      startDate: today,
      endDate: today,
      reason: '',
    });
    setIsModalOpen(true);
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await timeOffApi.createRequest({
        employeeId: formData.employeeId || undefined,
        timeOffTypeId: formData.timeOffTypeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
      });
      setIsModalOpen(false);
      await loadData();
      setStatusBanner({ type: 'success', text: 'Time off request submitted successfully.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to submit time off request.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await timeOffApi.approveRequest(id);
      await loadData();
      setStatusBanner({ type: 'success', text: 'Time off request approved.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to approve request') });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const handleReject = async (id) => {
    try {
      await timeOffApi.refuseRequest(id, { refusalReason: 'Schedule operational conflict' });
      await loadData();
      setStatusBanner({ type: 'success', text: 'Time off request refused.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to refuse request') });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus =
      selectedStatus === 'All' || r.status === selectedStatus || r.rawStatus === selectedStatus;
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
            <span>New Request</span>
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

      {/* Allocation Summary Strip */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
        {allocations.slice(0, 4).map((item) => {
          const typeName = item.timeOffType?.name || item.leaveTypeName || 'Leave Balance';
          const remaining = item.remainingAmount ?? item.allocatedAmount ?? 0;
          const total = item.allocatedAmount ?? 0;
          return (
            <div
              key={item.id}
              className='bg-white p-4 rounded-2xl border border-[#EAE6DF] shadow-2xs space-y-1'
            >
              <div className='flex items-center justify-between text-xs font-bold text-gray-500'>
                <span className='truncate'>{typeName}</span>
                <span className='text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full'>
                  Allocated: {total}d
                </span>
              </div>
              <div className='text-xl font-black text-[#1E293B]'>{remaining} Days</div>
              <p className='text-[11px] text-gray-500 font-medium'>
                {item.employee?.firstName ? `${item.employee.firstName} ${item.employee.lastName || ''}` : 'Employee Balance'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filters Toolbar */}
      <div className='bg-white p-3 rounded-2xl border border-[#EAE6DF] shadow-2xs flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]'>
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

          <div className='flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-gray-200 text-xs font-bold'>
            {['All', 'Pending', 'Approved', 'Rejected'].map((st) => (
              <button
                key={st}
                type='button'
                onClick={() => {
                  setSelectedStatus(st);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-white text-[#714B67] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className='text-xs font-bold text-gray-500'>
          Showing {filteredRequests.length} requests
        </div>
      </div>

      {loading ? (
        <LoadingState message='Loading time off requests...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title='No time off requests found'
          description='Submit a new request or adjust your search filter.'
          actionLabel='+ New Request'
          onAction={handleOpenAdd}
        />
      ) : (
        <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[10px]'>
                <tr>
                  <th className='py-3 px-4'>Employee</th>
                  <th className='py-3 px-4'>Leave Type</th>
                  <th className='py-3 px-4'>Period</th>
                  <th className='py-3 px-4'>Duration</th>
                  <th className='py-3 px-4'>Reason</th>
                  <th className='py-3 px-4'>Status</th>
                  <th className='py-3 px-4 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {paginated.map((req) => (
                  <tr key={req.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                    <td className='py-3 px-4'>
                      <div className='font-bold text-gray-900'>{req.employeeName}</div>
                      <div className='text-[10px] text-gray-500'>{req.employeeId}</div>
                    </td>
                    <td className='py-3 px-4 font-semibold text-gray-800'>
                      {req.leaveTypeName}
                    </td>
                    <td className='py-3 px-4 font-medium text-gray-600'>
                      {req.startDate} → {req.endDate}
                    </td>
                    <td className='py-3 px-4 font-bold text-gray-900'>
                      {req.days} {Number(req.days) === 1 ? 'day' : 'days'}
                    </td>
                    <td className='py-3 px-4 text-gray-600 max-w-xs truncate'>
                      {req.reason || '--'}
                    </td>
                    <td className='py-3 px-4'>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          req.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : req.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className='py-3 px-4 text-right'>
                      {req.status === 'Pending' ? (
                        <div className='inline-flex items-center gap-2'>
                          <button
                            type='button'
                            onClick={() => handleApprove(req.id)}
                            className='px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer'
                          >
                            Approve
                          </button>
                          <button
                            type='button'
                            onClick={() => handleReject(req.id)}
                            className='px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer'
                          >
                            Refuse
                          </button>
                        </div>
                      ) : (
                        <span className='text-[11px] text-gray-400 font-medium'>Processed</span>
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
          <div className='bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-2.5'>
              <h3 className='text-sm font-black text-[#1E293B]'>New Time Off Request</h3>
              <button
                type='button'
                onClick={() => setIsModalOpen(false)}
                className='text-gray-400 font-bold hover:text-gray-600'
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className='p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium'>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className='space-y-3 text-xs'>
              {employees.length > 0 && (
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Employee</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : emp.name} ({emp.employeeCode || emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Leave Type *</label>
                <select
                  required
                  value={formData.timeOffTypeId}
                  onChange={(e) => setFormData({ ...formData, timeOffTypeId: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                >
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Start Date *</label>
                  <input
                    type='date'
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>End Date *</label>
                  <input
                    type='date'
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Reason / Notes</label>
                <textarea
                  rows={2}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder='Brief reason for planned leave'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div className='pt-2 flex justify-end gap-2 border-t border-gray-100'>
                <BackButton label='Cancel' onClick={() => setIsModalOpen(false)} />
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className={`px-4 py-1.5 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl cursor-pointer ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
