import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import TimeOffNavTabs from './TimeOffNavTabs.jsx';
import timeOffApi from '../../services/timeOffApi.js';
import employeeApi from '../../services/employeeApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';
import { LEAVE_STATUS } from '../../utils/constants.js';

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    timeOffTypeId: '',
    allocatedAmount: 12,
    validityStart: '',
    validityEnd: '',
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
        const list = allocRes.value.data || (Array.isArray(allocRes.value) ? allocRes.value : []);
        setAllocations(list);
      } else {
        setError(extractErrorMessage(allocRes.reason, 'Failed to load leave allocations.'));
      }

      if (typesRes.status === 'fulfilled') {
        const types = typesRes.value.data || (Array.isArray(typesRes.value) ? typesRes.value : []);
        setLeaveTypes(types);
      }

      if (empRes.status === 'fulfilled') {
        setEmployees(empRes.value.data || []);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load allocation data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [allocRes, typesRes, empRes] = await Promise.allSettled([
          timeOffApi.getAllocations(),
          timeOffApi.getTimeOffTypes(),
          employeeApi.getEmployees({ limit: 100 }),
        ]);

        if (!active) return;

        if (allocRes.status === 'fulfilled') {
          const list = allocRes.value.data || (Array.isArray(allocRes.value) ? allocRes.value : []);
          setAllocations(list);
        } else {
          setError(extractErrorMessage(allocRes.reason, 'Failed to load leave allocations.'));
        }

        if (typesRes.status === 'fulfilled') {
          const types = typesRes.value.data || (Array.isArray(typesRes.value) ? typesRes.value : []);
          setLeaveTypes(types);
        }

        if (empRes.status === 'fulfilled') {
          setEmployees(empRes.value.data || []);
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load allocation data.'));
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
    const curYear = new Date().getFullYear();
    setFormData({
      employeeId: employees[0]?.id || '',
      timeOffTypeId: leaveTypes[0]?.id || '',
      allocatedAmount: 12,
      validityStart: `${curYear}-01-01`,
      validityEnd: `${curYear}-12-31`,
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
        validityStart: formData.validityStart,
        validityEnd: formData.validityEnd,
        notes: formData.notes,
      });
      setIsModalOpen(false);
      await loadData();
      setStatusBanner({ type: 'success', text: 'Leave balance allocated successfully.' });
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
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to approve allocation') });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const filteredAllocations = allocations.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    const empName = a.employee?.firstName
      ? `${a.employee.firstName} ${a.employee.lastName || ''}`.toLowerCase()
      : (a.employeeName || '').toLowerCase();
    const typeName = (a.timeOffType?.name || a.leaveTypeName || '').toLowerCase();
    return !q || empName.includes(q) || typeName.includes(q);
  });

  const totalPages = Math.ceil(filteredAllocations.length / pageSize) || 1;
  const paginated = filteredAllocations.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Leave Allocations & Balances'
        subtitle='Manage annual leave quotas, balance grants, and workforce allowances.'
        actions={
          <button
            type='button'
            onClick={handleOpenAdd}
            className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1'
          >
            <span>+</span>
            <span>Grant Allocation</span>
          </button>
        }
      />

      <TimeOffNavTabs />

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

      {/* Filter Bar */}
      <div className='bg-white p-3 rounded-2xl border border-[#EAE6DF] shadow-2xs flex flex-wrap items-center justify-between gap-3'>
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

        <div className='text-xs font-bold text-gray-500'>
          Showing {filteredAllocations.length} allocations
        </div>
      </div>

      {loading ? (
        <LoadingState message='Loading leave allocations...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredAllocations.length === 0 ? (
        <EmptyState
          title='No leave allocations found'
          description='Grant an allocation quota or adjust your search filter.'
          actionLabel='+ Grant Allocation'
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
                  <th className='py-3 px-4'>Allocated</th>
                  <th className='py-3 px-4'>Remaining</th>
                  <th className='py-3 px-4'>Status</th>
                  <th className='py-3 px-4 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {paginated.map((item) => {
                  const empName = item.employee?.firstName
                    ? `${item.employee.firstName} ${item.employee.lastName || ''}`.trim()
                    : item.employeeName || 'Employee';
                  const empCode = item.employee?.employeeCode || item.employeeId || '';
                  const typeName = item.timeOffType?.name || item.leaveTypeName || 'Leave';
                  const allocated = item.allocatedAmount ?? 0;
                  const remaining = item.remainingAmount ?? allocated;
                  const st = (item.status || 'APPROVED').toUpperCase();
                  const badge = LEAVE_STATUS[st] || LEAVE_STATUS.APPROVED;

                  return (
                    <tr key={item.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                      <td className='py-3 px-4'>
                        <div className='font-bold text-gray-900'>{empName}</div>
                        <div className='text-[10px] text-gray-500 font-mono'>{empCode}</div>
                      </td>
                      <td className='py-3 px-4 font-semibold text-gray-800'>{typeName}</td>
                      <td className='py-3 px-4 font-bold text-gray-900'>{allocated} Days</td>
                      <td className='py-3 px-4 font-black text-emerald-700'>{remaining} Days</td>
                      <td className='py-3 px-4'>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className='py-3 px-4 text-right'>
                        {st === 'PENDING' ? (
                          <button
                            type='button'
                            onClick={() => handleApprove(item.id)}
                            className='px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer'
                          >
                            Approve
                          </button>
                        ) : (
                          <span className='text-[11px] text-gray-400 font-medium'>Active</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className='p-3 border-t border-[#EAE6DF]'>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredAllocations.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* Grant Allocation Modal */}
      {isModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-2.5'>
              <h3 className='text-sm font-black text-[#1E293B]'>Grant Leave Allocation</h3>
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

            <form onSubmit={handleCreateAllocation} className='space-y-3 text-xs'>
              <div>
                <label className='block font-bold text-gray-700 mb-1'>Employee *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                >
                  <option value=''>Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : emp.name} ({emp.employeeCode || emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Leave Type *</label>
                <select
                  required
                  value={formData.timeOffTypeId}
                  onChange={(e) => setFormData({ ...formData, timeOffTypeId: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                >
                  <option value=''>Select leave type</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Allocated Days *</label>
                <input
                  type='number'
                  required
                  min='1'
                  value={formData.allocatedAmount}
                  onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Start Date</label>
                  <input
                    type='date'
                    value={formData.validityStart}
                    onChange={(e) => setFormData({ ...formData, validityStart: e.target.value })}
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>End Date</label>
                  <input
                    type='date'
                    value={formData.validityEnd}
                    onChange={(e) => setFormData({ ...formData, validityEnd: e.target.value })}
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Notes / Policy Clause</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder='Grant reference or policy rationale'
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
                  {isSubmitting ? 'Allocating...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
