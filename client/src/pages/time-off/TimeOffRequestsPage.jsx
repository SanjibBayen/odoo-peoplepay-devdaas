import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import TimeOffNavTabs from './TimeOffNavTabs.jsx';
import timeOffApi from '../../services/timeOffApi.js';
import employeeApi from '../../services/employeeApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';
import { formatDate } from '../../utils/formatDate.js';

const LEAVE_STATUS = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  REFUSED: { label: 'Refused', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  EXPIRED: { label: 'Expired', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
};

export default function TimeOffRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refusalTarget, setRefusalTarget] = useState(null);
  const [refusalReason, setRefusalReason] = useState('');

  const [formData, setFormData] = useState({
    employeeId: '',
    timeOffTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, typesRes, empRes] = await Promise.allSettled([
        timeOffApi.getRequests(selectedStatus !== 'ALL' ? { status: selectedStatus } : {}),
        timeOffApi.getTimeOffTypes(),
        employeeApi.getEmployees({ limit: 100 }),
      ]);

      if (reqRes.status === 'fulfilled') {
        const list = reqRes.value?.data || [];
        setRequests(Array.isArray(list) ? list : []);
      } else {
        setError(extractErrorMessage(reqRes.reason, 'Failed to load leave requests.'));
      }

      if (typesRes.status === 'fulfilled') {
        const types = typesRes.value?.data || [];
        setLeaveTypes(Array.isArray(types) ? types : []);
      }

      if (empRes.status === 'fulfilled') {
        setEmployees(empRes.value?.employees || empRes.value?.data || []);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load time off requests.'));
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        reason: formData.reason || null,
      });
      setIsModalOpen(false);
      await loadData();
      setStatusBanner({ type: 'success', text: 'Leave request submitted.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to submit request.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await timeOffApi.approveRequest(id);
      await loadData();
      setStatusBanner({ type: 'success', text: 'Leave request approved.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to approve') });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const handleConfirmRefuse = async () => {
    if (!refusalTarget) return;
    try {
      await timeOffApi.refuseRequest(refusalTarget.id, { refusalReason: refusalReason || 'Not specified' });
      setRefusalTarget(null);
      setRefusalReason('');
      await loadData();
      setStatusBanner({ type: 'success', text: 'Leave request refused.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to refuse') });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const handleCancel = async (id) => {
    try {
      await timeOffApi.cancelRequest(id);
      await loadData();
      setStatusBanner({ type: 'success', text: 'Leave request cancelled.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to cancel') });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const empName = r.employee?.firstName
      ? `${r.employee.firstName} ${r.employee.lastName || ''}`.toLowerCase()
      : '';
    const typeName = (r.timeOffType?.name || '').toLowerCase();
    return !q || empName.includes(q) || typeName.includes(q);
  });

  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginated = filteredRequests.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Leave Requests'
        subtitle='Review, approve, and manage time off submissions.'
        actions={
          <button type='button' onClick={handleOpenAdd} className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] rounded-xl cursor-pointer'>
            + New Request
          </button>
        }
      />

      <TimeOffNavTabs />

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
          placeholder='Search by employee or leave type...'
          className='px-3 py-1.5 rounded-xl border text-xs w-full max-w-xs'
        />
        <div className='flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border text-xs font-bold overflow-x-auto'>
          {['ALL', 'PENDING', 'APPROVED', 'REFUSED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              type='button'
              onClick={() => { setSelectedStatus(st); setPage(1); }}
              className={`px-3 py-1 rounded-lg cursor-pointer whitespace-nowrap ${selectedStatus === st ? 'bg-white text-[#714B67]' : 'text-gray-500'}`}
            >
              {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className='text-xs font-bold text-gray-500'>Showing {filteredRequests.length}</div>
      </div>

      {loading ? (
        <LoadingState message='Loading leave requests...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredRequests.length === 0 ? (
        <EmptyState title='No leave requests found' description='Submit a new request.' actionLabel='+ New Request' onAction={handleOpenAdd} />
      ) : (
        <div className='bg-white rounded-2xl border overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-[#FAF8F5] border-b text-gray-500 font-bold uppercase text-[10px]'>
                <tr>
                  <th className='py-3 px-4'>Employee</th>
                  <th className='py-3 px-4'>Leave Type</th>
                  <th className='py-3 px-4'>Period</th>
                  <th className='py-3 px-4'>Duration</th>
                  <th className='py-3 px-4'>Status</th>
                  <th className='py-3 px-4 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {paginated.map((req) => {
                  const empName = req.employee?.firstName
                    ? `${req.employee.firstName} ${req.employee.lastName || ''}`.trim()
                    : 'Employee';
                  const typeName = req.timeOffType?.name || 'Leave';
                  const days = parseFloat(req.duration || 0);
                  const st = (req.status || 'PENDING').toUpperCase();
                  const badge = LEAVE_STATUS[st] || LEAVE_STATUS.PENDING;

                  return (
                    <tr key={req.id} className='hover:bg-[#FAF8F5]/60'>
                      <td className='py-3 px-4 font-bold'>{empName}</td>
                      <td className='py-3 px-4'>{typeName}</td>
                      <td className='py-3 px-4'>{formatDate(req.startDate)} → {formatDate(req.endDate)}</td>
                      <td className='py-3 px-4 font-bold'>{days} {days === 1 ? 'day' : 'days'}</td>
                      <td className='py-3 px-4'>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className='py-3 px-4 text-right'>
                        {st === 'PENDING' ? (
                          <div className='inline-flex items-center gap-1.5'>
                            <button type='button' onClick={() => handleApprove(req.id)} className='px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border rounded-lg cursor-pointer'>Approve</button>
                            <button type='button' onClick={() => setRefusalTarget(req)} className='px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 border rounded-lg cursor-pointer'>Refuse</button>
                          </div>
                        ) : st === 'APPROVED' ? (
                          <button type='button' onClick={() => handleCancel(req.id)} className='text-xs font-bold text-gray-500 hover:underline cursor-pointer'>Cancel</button>
                        ) : (
                          <span className='text-[11px] text-gray-400'>Processed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className='p-3 border-t'>
            <Pagination currentPage={page} totalPages={totalPages} totalItems={filteredRequests.length} pageSize={pageSize} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40' role='dialog' aria-modal='true'>
          <div className='bg-white rounded-2xl max-w-sm w-full p-5 border shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b pb-2.5'>
              <h3 className='text-sm font-black'>New Leave Request</h3>
              <button type='button' onClick={() => setIsModalOpen(false)} className='cursor-pointer'>✕</button>
            </div>

            {formError && <div className='p-2.5 rounded-xl bg-red-50 border text-red-700 text-xs'>{formError}</div>}

            <form onSubmit={handleCreateRequest} className='space-y-3 text-xs'>
              {employees.length > 0 && (
                <div>
                  <label className='block font-bold mb-1'>Employee</label>
                  <select value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} className='w-full px-3 py-2 rounded-xl border cursor-pointer'>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : emp.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className='block font-bold mb-1'>Leave Type *</label>
                <select required value={formData.timeOffTypeId} onChange={(e) => setFormData({ ...formData, timeOffTypeId: e.target.value })} className='w-full px-3 py-2 rounded-xl border cursor-pointer'>
                  <option value=''>Select leave type</option>
                  {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
                </select>
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block font-bold mb-1'>Start Date *</label>
                  <input type='date' required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className='w-full px-3 py-2 rounded-xl border cursor-pointer' />
                </div>
                <div>
                  <label className='block font-bold mb-1'>End Date *</label>
                  <input type='date' required value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className='w-full px-3 py-2 rounded-xl border cursor-pointer' />
                </div>
              </div>

              <div>
                <label className='block font-bold mb-1'>Reason</label>
                <textarea rows={2} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
              </div>

              <div className='pt-2 flex justify-end gap-2 border-t'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='px-4 py-1.5 font-semibold text-gray-700 hover:text-gray-900 border rounded-xl hover:bg-gray-50 cursor-pointer'
                >
                  Cancel
                </button>
                <button type='submit' disabled={isSubmitting} className={`px-4 py-1.5 font-bold text-white bg-[#714B67] rounded-xl cursor-pointer ${isSubmitting ? 'opacity-60' : ''}`}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refusal Modal */}
      {refusalTarget && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40' role='dialog' aria-modal='true'>
          <div className='bg-white rounded-2xl max-w-sm w-full p-5 border shadow-xl space-y-3.5'>
            <h3 className='text-sm font-black'>Refuse Leave Request</h3>
            <textarea
              rows={3}
              value={refusalReason}
              onChange={(e) => setRefusalReason(e.target.value)}
              placeholder='Reason for refusal...'
              className='w-full px-3 py-2 rounded-xl border text-xs'
            />
            <div className='flex justify-end gap-2 pt-2 border-t'>
              <button type='button' onClick={() => { setRefusalTarget(null); setRefusalReason(''); }} className='px-3 py-1.5 text-xs font-bold text-gray-600 rounded-xl cursor-pointer'>Cancel</button>
              <button type='button' onClick={handleConfirmRefuse} className='px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 rounded-xl cursor-pointer'>Confirm Refusal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}