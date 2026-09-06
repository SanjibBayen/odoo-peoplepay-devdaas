import React, { useEffect, useState } from 'react';
import employeeApi from '../../services/employeeApi.js';
import LoadingState from '../common/LoadingState.jsx';
import ErrorState from '../common/ErrorState.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { extractErrorMessage } from '../../services/apiClient.js';
import { formatDate } from '../../utils/formatDate.js';
import { LEAVE_STATUS } from '../../utils/constants.js';

export default function EmployeeTimeOffTab({ employeeId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTimeOff = React.useCallback(async () => {
    if (!employeeId) {
      setLoading(false);
      setRequests([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await employeeApi.getEmployeeTimeOffRequests(employeeId);
      const list = res?.requests || res?.data || (Array.isArray(res) ? res : []);
      setRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load employee time off requests.'));
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchTimeOff();
  }, [fetchTimeOff]);

  if (loading) return <LoadingState message='Loading time off requests...' />;
  if (error) return <ErrorState message={error} onRetry={fetchTimeOff} />;
  if (requests.length === 0) {
    return (
      <EmptyState
        title='No time off requests'
        description='This employee has not submitted any time off requests.'
      />
    );
  }

  return (
    <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='w-full text-left text-xs'>
          <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[10px]'>
            <tr>
              <th className='py-3 px-4'>Leave Type</th>
              <th className='py-3 px-4'>Period</th>
              <th className='py-3 px-4'>Duration</th>
              <th className='py-3 px-4'>Reason</th>
              <th className='py-3 px-4'>Status</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100'>
            {requests.map((r) => {
              const typeName = r.timeOffType?.name || r.leaveTypeName || 'Leave';
              const days = r.duration || r.days || 1;
              const st = (r.status || 'PENDING').toUpperCase();
              const badge = LEAVE_STATUS[st] || LEAVE_STATUS.PENDING;

              return (
                <tr key={r.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                  <td className='py-3 px-4 font-bold text-gray-900'>{typeName}</td>
                  <td className='py-3 px-4 font-medium text-gray-600'>
                    {formatDate(r.startDate, 'DD Mon YYYY')} → {formatDate(r.endDate, 'DD Mon YYYY')}
                  </td>
                  <td className='py-3 px-4 font-bold text-gray-900'>
                    {days} {Number(days) === 1 ? 'day' : 'days'}
                  </td>
                  <td className='py-3 px-4 text-gray-600 max-w-xs truncate'>
                    {r.reason || '--'}
                  </td>
                  <td className='py-3 px-4'>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
