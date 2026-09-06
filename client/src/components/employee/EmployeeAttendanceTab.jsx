import React, { useEffect, useState, useCallback } from 'react';
import employeeApi from '../../services/employeeApi.js';
import LoadingState from '../common/LoadingState.jsx';
import ErrorState from '../common/ErrorState.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { extractErrorMessage } from '../../services/apiClient.js';
import { formatDate } from '../../utils/formatDate.js';

const ATTENDANCE_STATUS = {
  PRESENT: { label: 'Present', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  LATE: { label: 'Late', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ABSENT: { label: 'Absent', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  EARLY_EXIT: { label: 'Early Exit', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  OVERTIME: { label: 'Overtime', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  MISSING_CHECKOUT: { label: 'Missing Checkout', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  CORRECTED: { label: 'Corrected', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

export default function EmployeeAttendanceTab({ employeeId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendance = useCallback(async () => {
    if (!employeeId) {
      setLoading(false);
      setRecords([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await employeeApi.getEmployeeAttendance(employeeId);
      // FIX: Backend returns { success, count, attendance }
      const list = res?.attendance || res?.data || [];
      setRecords(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load employee attendance.'));
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

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
    try {
      return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return t;
    }
  };

  return (
    <div className='bg-white rounded-2xl border overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='w-full text-left text-xs'>
          <thead className='bg-[#FAF8F5] border-b text-gray-500 font-bold uppercase text-[10px]'>
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
              const dateStr = r.workDate || r.date || '';
              const workedHours = r.workedMinutes
                ? Math.round((r.workedMinutes / 60) * 10) / 10
                : 0;
              const st = (r.status || 'PRESENT').toUpperCase();
              const badge = ATTENDANCE_STATUS[st] || ATTENDANCE_STATUS.PRESENT;

              return (
                <tr key={r.id} className='hover:bg-[#FAF8F5]/60'>
                  <td className='py-3 px-4 font-bold'>{formatDate(dateStr, 'DD Mon YYYY')}</td>
                  <td className='py-3 px-4'>{formatClock(r.checkIn)}</td>
                  <td className='py-3 px-4'>{formatClock(r.checkOut)}</td>
                  <td className='py-3 px-4 font-bold'>
                    {workedHours > 0 ? `${workedHours} hrs` : '--'}
                  </td>
                  <td className='py-3 px-4'>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
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