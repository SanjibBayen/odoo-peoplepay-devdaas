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

const LEAVE_STATUS = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  REFUSED: { label: 'Refused', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  EXPIRED: { label: 'Expired', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
};

export default function TimeOffAllocationsPage() {
  const [allocations, setAllocations] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    timeOffTypeId: '',
    allocatedAmount: 12,
    validFrom: '',
    validTo: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allocRes, typesRes, empRes] = await Promise.allSettled([
        timeOffApi.getAllocations(),
        timeOffApi.getTimeOffTypes(),
        employeeApi.getEmployees({ limit: 100 }),
      ]);

      if (allocRes.status === 'fulfilled') {
        const list = allocRes.value?.data || [];
        setAllocations(Array.isArray(list) ? list : []);
      } else {
        setError(extractErrorMessage(allocRes.reason, 'Failed to load leave allocations.'));
      }

      if (typesRes.status === 'fulfilled') {
        const types = typesRes.value?.data || [];
        setLeaveTypes(Array.isArray(types) ? types : []);
      }

      if (empRes.status === 'fulfilled') {
        setEmployees(empRes.value?.employees || empRes.value?.data || []);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load allocation data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setFormError(null);
    const curYear = new Date().getFullYear();
    setFormData({
      employeeId: employees[0]?.id || '',
      timeOffTypeId: leaveTypes[0]?.id || '',
      allocatedAmount: 12,
      validFrom: `${curYear}-01-01`,
      validTo: `${curYear}-12-31`,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleCreateAllocation = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await timeOffApi.createAllocation({
        employeeId: formData.employeeId,
        timeOffTypeId: formData.timeOffTypeId,
        allocatedAmount: Number(formData.allocatedAmount),
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        notes: formData.notes || null,
      });
      setIsModalOpen(false);
      await loadData();
      setStatusBanner({ type: 'success', text: 'Leave balance allocated.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to allocate leave balance.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await timeOffApi.approveAllocation(id);
      await loadData();
      setStatusBanner({ type: 'success', text: 'Allocation approved.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to approve') });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const filteredAllocations = allocations.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    const empName = a.employee?.firstName
      ? `${a.employee.firstName} ${a.employee.lastName || ''}`.toLowerCase()
      : '';
    const typeName = (a.timeOffType?.name || '').toLowerCase();
    return !q || empName.includes(q) || typeName.includes(q);
  });

  const totalPages = Math.ceil(filteredAllocations.length / pageSize) || 1;
  const paginated = filteredAllocations.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Leave Allocations & Balances'
        subtitle='Manage annual leave quotas and balance grants.'
        actions={
          <button type='button' onClick={handleOpenAdd} className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] rounded-xl cursor-pointer'>
            + Grant Allocation
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

      {/* Search */}
      <div className='bg-white p-3 rounded-2xl border'>
        <input
          type='text'
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          placeholder='Search by employee or leave type...'
          className='px-3 py-1.5 rounded-xl border text-xs w-full max-w-xs'
        />
      </div>

      {loading ? (
        <LoadingState message='Loading leave allocations...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredAllocations.length === 0 ? (
        <EmptyState title='No leave allocations found' description='Grant an allocation quota.' actionLabel='+ Grant Allocation' onAction={handleOpenAdd} />
      ) : (
        <div className='bg-white rounded-2xl border overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-[#FAF8F5] border-b text-gray-500 font-bold uppercase text-[10px]'>
                <tr>
                  <th className='py-3 px-4'>Employee</th>
                  <th className='py-3 px-4'>Leave Type</th>
                  <th className='py-3 px-4'>Allocated</th>
                  <th className='py-3 px-4'>Used</th>
                  <th className='py-3 px-4'>Remaining</th>
                  <th className='py-3 px-4'>Status</th>
                  <th className='py-3 px-4 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {paginated.map((item) => {
                  const empName = item.employee?.firstName
                    ? `${item.employee.firstName} ${item.employee.lastName || ''}`.trim()
                    : 'Employee';
                  const typeName = item.timeOffType?.name || 'Leave';
                  const allocated = parseFloat(item.allocatedAmount || 0);
                  const used = parseFloat(item.usedAmount || 0);
                  const remaining = parseFloat(item.remainingAmount || (allocated - used));
                  const st = (item.status || 'DRAFT').toUpperCase();
                  const badge = LEAVE_STATUS[st] || LEAVE_STATUS.DRAFT;

                  return (
                    <tr key={item.id} className='hover:bg-[#FAF8F5]/60'>
                      <td className='py-3 px-4 font-bold'>{empName}</td>
                      <td className='py-3 px-4'>{typeName}</td>
                      <td className='py-3 px-4'>{allocated} Days</td>
                      <td className='py-3 px-4 text-rose-600'>{used} Days</td>
                      <td className='py-3 px-4 font-black text-emerald-700'>{remaining} Days</td>
                      <td className='py-3 px-4'>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className='py-3 px-4 text-right'>
                        {st === 'PENDING' ? (
                          <button type='button' onClick={() => handleApprove(item.id)} className='px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border rounded-lg cursor-pointer'>
                            Approve
                          </button>
                        ) : (
                          <span className='text-[11px] text-gray-400'>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className='p-3 border-t'>
            <Pagination currentPage={page} totalPages={totalPages} totalItems={filteredAllocations.length} pageSize={pageSize} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40' role='dialog' aria-modal='true'>
          <div className='bg-white rounded-2xl max-w-sm w-full p-5 border shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b pb-2.5'>
              <h3 className='text-sm font-black'>Grant Leave Allocation</h3>
              <button type='button' onClick={() => setIsModalOpen(false)} className='cursor-pointer'>✕</button>
            </div>

            {formError && <div className='p-2.5 rounded-xl bg-red-50 border text-red-700 text-xs'>{formError}</div>}

            <form onSubmit={handleCreateAllocation} className='space-y-3 text-xs'>
              <div>
                <label className='block font-bold mb-1'>Employee *</label>
                <select required value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} className='w-full px-3 py-2 rounded-xl border cursor-pointer'>
                  <option value=''>Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block font-bold mb-1'>Leave Type *</label>
                <select required value={formData.timeOffTypeId} onChange={(e) => setFormData({ ...formData, timeOffTypeId: e.target.value })} className='w-full px-3 py-2 rounded-xl border cursor-pointer'>
                  <option value=''>Select leave type</option>
                  {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
                </select>
              </div>

              <div>
                <label className='block font-bold mb-1'>Allocated Days *</label>
                <input type='number' required min='1' value={formData.allocatedAmount} onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block font-bold mb-1'>Valid From *</label>
                  <input type='date' required value={formData.validFrom} onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })} className='w-full px-3 py-2 rounded-xl border cursor-pointer' />
                </div>
                <div>
                  <label className='block font-bold mb-1'>Valid To *</label>
                  <input type='date' required value={formData.validTo} onChange={(e) => setFormData({ ...formData, validTo: e.target.value })} className='w-full px-3 py-2 rounded-xl border cursor-pointer' />
                </div>
              </div>

              <div>
                <label className='block font-bold mb-1'>Notes</label>
                <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
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
                  {isSubmitting ? 'Allocating...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}