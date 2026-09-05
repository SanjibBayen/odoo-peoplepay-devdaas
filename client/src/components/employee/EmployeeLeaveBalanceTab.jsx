import React, { useEffect, useState } from 'react';
import employeeApi from '../../services/employeeApi.js';
import LoadingState from '../common/LoadingState.jsx';
import ErrorState from '../common/ErrorState.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function EmployeeLeaveBalanceTab({ employeeId }) {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBalances = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await employeeApi.getEmployeeLeaveBalances(employeeId);
      const list = res.data || (Array.isArray(res) ? res : []);
      setBalances(list);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load employee leave balances.'));
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await employeeApi.getEmployeeLeaveBalances(employeeId);
        if (active) {
          const list = res.data || (Array.isArray(res) ? res : []);
          setBalances(list);
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load employee leave balances.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [employeeId]);

  if (loading) return <LoadingState message='Loading leave balances...' />;
  if (error) return <ErrorState message={error} onRetry={fetchBalances} />;
  if (balances.length === 0) {
    return (
      <EmptyState
        title='No leave balances allocated'
        description='This employee currently has no active leave allocations assigned.'
      />
    );
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
      {balances.map((b) => {
        const typeName = b.timeOffType?.name || b.leaveTypeName || 'Leave Balance';
        const allocated = b.allocatedAmount ?? b.totalDays ?? 12;
        const remaining = b.remainingAmount ?? b.remainingDays ?? allocated;
        const used = Math.max(0, allocated - remaining);
        const pctUsed = allocated > 0 ? Math.min(100, Math.round((used / allocated) * 100)) : 0;

        return (
          <div
            key={b.id || typeName}
            className='bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-2xs space-y-3'
          >
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-black text-[#1E293B]'>{typeName}</h4>
              <span className='text-xs font-bold text-gray-500'>
                {remaining} / {allocated} days left
              </span>
            </div>

            <div className='w-full bg-gray-100 rounded-full h-2 overflow-hidden'>
              <div
                className='bg-[#714B67] h-full rounded-full transition-all'
                style={{ width: `${pctUsed}%` }}
              />
            </div>

            <div className='flex items-center justify-between text-[11px] text-gray-500 font-medium pt-1'>
              <span>Used: {used}d ({pctUsed}%)</span>
              <span className='font-bold text-emerald-700'>Available: {remaining}d</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
