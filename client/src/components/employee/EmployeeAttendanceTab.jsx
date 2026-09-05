import React, { useEffect, useState } from 'react';
import employeeApi from '../../services/employeeApi.js';
import LoadingState from '../common/LoadingState.jsx';
import ErrorState from '../common/ErrorState.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { extractErrorMessage } from '../../services/apiClient.js';
import { formatDate } from '../../utils/formatDate.js';
import { ATTENDANCE_STATUS } from '../../utils/constants.js';

export default function EmployeeAttendanceTab({ employeeId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendance = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await employeeApi.getEmployeeAttendance(employeeId);
      const list = res.data || (Array.isArray(res) ? res : []);
      setRecords(list);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load employee attendance.'));
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await employeeApi.getEmployeeAttendance(employeeId);
        if (active) {
          const list = res.data || (Array.isArray(res) ? res : []);
          setRecords(list);
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load employee attendance.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [employeeId]);

  if (loading) return <LoadingState message='Loading attendance records...' />;
  if (error) return <ErrorState message={error} onRetry={fetchAttendance} />;
  if (records.length === 0) {
    return (
      <EmptyState
        title='No attendance logs found'
        description='This employee has no punch-in or attendance records logged.'
      />
    );
  }

  const formatClock = (t) => {
    if (!t) return '--:--';
    if (typeof t === 'string' && t.includes('T')) {
      try {
        return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        return t;
      }
    }
    return t;
  };

  return (
    <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='w-full text-left text-xs'>
          <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[10px]'>
            <tr>
              <th className='py-3 px-4'>Date</th>
              <th className='py-3 px-4'>Check In</th>
              <th className='py-3 px-4'>Check Out</th>
              <th className='py-3 px-4'>Worked Hours</th>
              <th className='py-3 px-4'>Status</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100'>
            {records.map((r) => {
              const dateStr = r.workDate || r.date || (r.createdAt ? r.createdAt.split('T')[0] : '');
              const workedHours = r.workedMinutes
                ? Math.round((r.workedMinutes / 60) * 10) / 10
                : r.workedHours || 0;
              const st = (r.status || 'PRESENT').toUpperCase();
              const badge = ATTENDANCE_STATUS[st] || ATTENDANCE_STATUS.PRESENT;

              return (
                <tr key={r.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                  <td className='py-3 px-4 font-bold text-gray-900'>{formatDate(dateStr, 'DD Mon YYYY')}</td>
                  <td className='py-3 px-4 font-medium text-gray-700'>{formatClock(r.checkIn)}</td>
                  <td className='py-3 px-4 font-medium text-gray-700'>{formatClock(r.checkOut)}</td>
                  <td className='py-3 px-4 font-bold text-gray-900'>
                    {workedHours > 0 ? `${workedHours} hrs` : '--'}
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
