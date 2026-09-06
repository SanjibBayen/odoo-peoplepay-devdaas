import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import TimeOffNavTabs from './TimeOffNavTabs.jsx';
import timeOffApi from '../../services/timeOffApi.js';
import employeeApi from '../../services/employeeApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';
import { selectCurrentRole, selectCurrentUser } from '../../redux/selectors/authSelectors.js';

function normalizeRequest(req) {
  if (!req) return null;
  const emp = req.employee || {};
  const empName = emp.firstName
    ? `${emp.firstName} ${emp.lastName || ''}`.trim()
    : req.employeeName || 'Employee';
  const empCode = emp.employeeCode || '';
  const typeName = req.timeOffType?.name || 'Time Off';

  return {
    ...req,
    id: req.id,
    employeeName: empName,
    employeeId: empCode,
    leaveTypeName: typeName,
    days: parseFloat(req.duration || 0),
    startDate: req.startDate,
    endDate: req.endDate,
    rawStatus: req.status,
    reason: req.reason || '',
  };
}

export default function TimeOffPage() {
  const currentRole = useSelector(selectCurrentRole) || 'employee';
  const currentUser = useSelector(selectCurrentUser);
  const isEmployee = currentRole.toLowerCase().includes('employee');
  const ownEmployeeId = currentUser?.employee?.id || null;

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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const promises = [
        timeOffApi.getTimeOffTypes(),
        timeOffApi.getAllocations(),
        timeOffApi.getRequests(),
      ];

      // Only fetch full workforce employee list for management roles who have employees:read_all
      if (!isEmployee) {
        promises.push(employeeApi.getEmployees({ limit: 100 }));
      }

      const results = await Promise.allSettled(promises);
      const typesRes = results[0];
      const allocRes = results[1];
      const reqRes = results[2];
      const empRes = results[3];

      if (typesRes?.status === 'fulfilled') {
        setLeaveTypes(typesRes.value?.data || []);
      }
      if (allocRes?.status === 'fulfilled') {
        setAllocations(allocRes.value?.data || []);
      }
      if (reqRes?.status === 'fulfilled') {
        const list = reqRes.value?.data || [];
        setRequests(Array.isArray(list) ? list.map(normalizeRequest) : []);
      }
      if (empRes?.status === 'fulfilled') {
        setEmployees(empRes.value?.employees || empRes.value?.data || []);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load time off records.'));
    } finally {
      setLoading(false);
    }
  }, [isEmployee]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setFormError(null);
    const today = new Date().toISOString().split('T')[0];
    const defaultEmpId = isEmployee
      ? (ownEmployeeId || '')
      : (employees[0]?.id || ownEmployeeId || '');

    setFormData({
      employeeId: defaultEmpId,
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
      setStatusBanner({ type: 'success', text: 'Time off request submitted.' });
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
      setStatusBanner({ type: 'success', text: 'Request approved.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to approve') });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const handleReject = async (id) => {
    try {
      await timeOffApi.refuseRequest(id, { refusalReason: 'Operational conflict' });
      await loadData();
      setStatusBanner({ type: 'success', text: 'Request refused.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to refuse') });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const getStatusLabel = (rawStatus) => {
    switch (rawStatus) {
      case 'APPROVED': return 'Approved';
      case 'REFUSED': return 'Rejected';
      case 'CANCELLED': return 'Cancelled';
      case 'EXPIRED': return 'Expired';
      case 'DRAFT': return 'Draft';
      default: return 'Pending';
    }
  };

  const getStatusBadgeClass = (rawStatus) => {
    switch (rawStatus) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REFUSED': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CANCELLED': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const filteredRequests = requests.filter((r) => {
    const statusLabel = getStatusLabel(r.rawStatus);
    const matchesStatus = selectedStatus === 'All' || statusLabel === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.employeeName?.toLowerCase().includes(q) ||
      r.employeeId?.toLowerCase().includes(q) ||
      r.leaveTypeName?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginated = filteredRequests.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Time Off'
        subtitle='Leave types, balances, and approvals.'
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

      {/* Allocation Summary */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
        {allocations.slice(0, 4).map((item) => {
          const typeName = item.timeOffType?.name || 'Leave';
          const remaining = parseFloat(item.remainingAmount || 0);
          const total = parseFloat(item.allocatedAmount || 0);
          return (
            <div key={item.id} className='bg-white p-4 rounded-2xl border space-y-1'>
              <div className='flex justify-between text-xs font-bold text-gray-500'>
                <span>{typeName}</span>
                <span className='text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full'>Total: {total}d</span>
              </div>
              <div className='text-xl font-black'>{remaining} Days</div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className='bg-white p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3'>
        <input
          type='text'
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          placeholder='Search by employee or leave type...'
          className='px-3 py-1.5 rounded-xl border text-xs w-full max-w-xs'
        />
        <div className='flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border text-xs font-bold'>
          {['All', 'Pending', 'Approved', 'Rejected'].map((st) => (
            <button
              key={st}
              type='button'
              onClick={() => { setSelectedStatus(st); setPage(1); }}
              className={`px-3 py-1 rounded-lg cursor-pointer ${selectedStatus === st ? 'bg-white text-[#714B67]' : 'text-gray-500'}`}
            >
              {st}
            </button>
          ))}
        </div>
        <div className='text-xs font-bold text-gray-500'>Showing {filteredRequests.length}</div>
      </div>

      {loading ? (
        <LoadingState message='Loading time off requests...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredRequests.length === 0 ? (
        <EmptyState title='No time off requests found' description='Submit a new request.' actionLabel='+ New Request' onAction={handleOpenAdd} />
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
                  const statusLabel = getStatusLabel(req.rawStatus);
                  return (
                    <tr key={req.id} className='hover:bg-[#FAF8F5]/60'>
                      <td className='py-3 px-4'>
                        <div className='font-bold'>{req.employeeName}</div>
                        <div className='text-[10px] text-gray-500'>{req.employeeId}</div>
                      </td>
                      <td className='py-3 px-4'>{req.leaveTypeName}</td>
                      <td className='py-3 px-4'>{req.startDate} → {req.endDate}</td>
                      <td className='py-3 px-4 font-bold'>{req.days} {req.days === 1 ? 'day' : 'days'}</td>
                      <td className='py-3 px-4'>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(req.rawStatus)}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className='py-3 px-4 text-right'>
                        {req.rawStatus === 'PENDING' ? (
                          !isEmployee ? (
                            <div className='inline-flex items-center gap-2'>
                              <button type='button' onClick={() => handleApprove(req.id)} className='px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border rounded-lg cursor-pointer'>Approve</button>
                              <button type='button' onClick={() => handleReject(req.id)} className='px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 border rounded-lg cursor-pointer'>Refuse</button>
                            </div>
                          ) : (
                            <span className='text-[11px] font-bold text-amber-600'>Pending Approval</span>
                          )
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

      {/* Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40' role='dialog' aria-modal='true'>
          <div className='bg-white rounded-2xl max-w-sm w-full p-5 border shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b pb-2.5'>
              <h3 className='text-sm font-black'>New Time Off Request</h3>
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
    </div>
  );
}