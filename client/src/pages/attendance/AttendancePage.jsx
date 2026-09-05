import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import attendanceApi from '../../services/attendanceApi.js';
import { ATTENDANCE_STATUSES, getAttendanceFromStorage } from '../../data/attendanceData.js';

export default function AttendancePage() {
  const [records, setRecords] = useState(() => getAttendanceFromStorage());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Correction Modal State
  const [correctionTarget, setCorrectionTarget] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    checkIn: '',
    checkOut: '',
    status: 'PRESENT',
    notes: '',
  });

  const loadAttendance = () => {
    attendanceApi
      .getAttendance()
      .then((res) => {
        setRecords(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load attendance logs.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handleCheckIn = async () => {
    const timeNow = new Date().toTimeString().slice(0, 5);
    try {
      await attendanceApi.checkIn({
        employeeId: 'EMP-2024-001',
        checkInTime: timeNow,
        notes: 'Manual punch',
      });
      await loadAttendance();
    } catch (err) {
      alert(err.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    const timeNow = new Date().toTimeString().slice(0, 5);
    try {
      await attendanceApi.checkOut({
        attendanceId: records[0]?.id,
        checkOutTime: timeNow,
        notes: 'Evening shift end',
      });
      await loadAttendance();
    } catch (err) {
      alert(err.message || 'Check-out failed');
    }
  };

  const handleOpenCorrection = (record) => {
    setCorrectionTarget(record);
    setCorrectionForm({
      checkIn: record.checkIn || '09:00',
      checkOut: record.checkOut || '18:00',
      status: record.status || 'PRESENT',
      notes: record.notes || '',
    });
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!correctionTarget) return;

    try {
      await attendanceApi.updateAttendance(correctionTarget.id, {
        ...correctionForm,
        workedHours: 8.0,
      });
      setCorrectionTarget(null);
      await loadAttendance();
    } catch (err) {
      alert(err.message || 'Failed to update attendance');
    }
  };

  // Filter
  const filtered = records.filter((r) => {
    const matchesStatus =
      selectedStatus === 'All Statuses' || r.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.employeeName?.toLowerCase().includes(q) ||
      r.employeeId?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedRecords = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Attendance'
        subtitle='Biometric punch logs, status tracking, and manager manual reconciliation.'
        actions={
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={handleCheckIn}
              className='px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer'
            >
              Punch In
            </button>
            <button
              type='button'
              onClick={handleCheckOut}
              className='px-3.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors cursor-pointer'
            >
              Punch Out
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
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
              placeholder='Search by employee or department...'
              className='w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67]'
            />
            <span className='absolute left-2.5 top-2 text-gray-400 text-xs'>
              🔍
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
            {ATTENDANCE_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className='text-xs font-bold text-gray-500'>
          Showing {filtered.length} records
        </div>
      </div>

      {loading ? (
        <LoadingState message='Loading attendance records...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAttendance} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title='No attendance logs found'
          description='Try changing your search query or status filter.'
          action={
            <button
              type='button'
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('All Statuses');
              }}
              className='px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold'
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[10px]'>
                <tr>
                  <th className='py-3 px-4'>Date</th>
                  <th className='py-3 px-4'>Employee</th>
                  <th className='py-3 px-4'>Check In</th>
                  <th className='py-3 px-4'>Check Out</th>
                  <th className='py-3 px-4'>Worked Hours</th>
                  <th className='py-3 px-4'>Discrepancy</th>
                  <th className='py-3 px-4'>Status</th>
                  <th className='py-3 px-4 text-right'>Action</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {paginatedRecords.map((r) => (
                  <tr key={r.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                    <td className='py-3 px-4 font-bold text-gray-800'>{r.date}</td>
                    <td className='py-3 px-4'>
                      <div className='font-bold text-gray-900'>{r.employeeName}</div>
                      <div className='text-[10px] text-gray-500'>{r.employeeId} • {r.department}</div>
                    </td>
                    <td className='py-3 px-4 font-medium text-gray-700'>
                      {r.checkIn || '--:--'}
                    </td>
                    <td className='py-3 px-4 font-medium text-gray-700'>
                      {r.checkOut || '--:--'}
                    </td>
                    <td className='py-3 px-4 font-bold text-gray-900'>
                      {r.workedHours > 0 ? `${r.workedHours} hrs` : '--'}
                    </td>
                    <td className='py-3 px-4 text-[11px] text-gray-500'>
                      {r.lateMinutes > 0 && (
                        <span className='text-amber-700 block'>+{r.lateMinutes}m late</span>
                      )}
                      {r.earlyExitMinutes > 0 && (
                        <span className='text-rose-600 block'>-{r.earlyExitMinutes}m early</span>
                      )}
                      {r.overtimeMinutes > 0 && (
                        <span className='text-emerald-700 block'>+{r.overtimeMinutes}m OT</span>
                      )}
                      {!r.lateMinutes && !r.earlyExitMinutes && !r.overtimeMinutes && (
                        <span className='text-gray-400'>None</span>
                      )}
                    </td>
                    <td className='py-3 px-4'>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.status === 'LATE'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : r.status === 'OVERTIME'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : r.status === 'EARLY_EXIT'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className='py-3 px-4 text-right'>
                      <button
                        type='button'
                        onClick={() => handleOpenCorrection(r)}
                        className='text-[#714B67] hover:underline font-bold cursor-pointer'
                      >
                        Correct
                      </button>
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
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* Manual Correction Modal */}
      {correctionTarget && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-sm w-full p-5 border border-[#EAE6DF] shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-2.5'>
              <h3 className='text-sm font-black text-[#1E293B]'>
                Manual Attendance Correction
              </h3>
              <button
                type='button'
                onClick={() => setCorrectionTarget(null)}
                className='text-gray-400 font-bold'
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className='space-y-3 text-xs'>
              <div className='text-gray-600 font-bold'>
                {correctionTarget.employeeName} ({correctionTarget.date})
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Check In</label>
                  <input
                    type='time'
                    value={correctionForm.checkIn}
                    onChange={(e) =>
                      setCorrectionForm({ ...correctionForm, checkIn: e.target.value })
                    }
                    className='w-full px-2 py-1.5 rounded border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Check Out</label>
                  <input
                    type='time'
                    value={correctionForm.checkOut}
                    onChange={(e) =>
                      setCorrectionForm({ ...correctionForm, checkOut: e.target.value })
                    }
                    className='w-full px-2 py-1.5 rounded border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Status</label>
                <select
                  value={correctionForm.status}
                  onChange={(e) =>
                    setCorrectionForm({ ...correctionForm, status: e.target.value })
                  }
                  className='w-full px-2 py-1.5 rounded border border-gray-200 bg-[#FAF8F5]'
                >
                  <option value='PRESENT'>PRESENT</option>
                  <option value='LATE'>LATE</option>
                  <option value='ABSENT'>ABSENT</option>
                  <option value='EARLY_EXIT'>EARLY_EXIT</option>
                  <option value='OVERTIME'>OVERTIME</option>
                </select>
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Manager Reason / Note</label>
                <input
                  type='text'
                  required
                  placeholder='Correction rationale...'
                  value={correctionForm.notes}
                  onChange={(e) =>
                    setCorrectionForm({ ...correctionForm, notes: e.target.value })
                  }
                  className='w-full px-2 py-1.5 rounded border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div className='pt-2 flex items-center justify-end gap-2 border-t border-gray-100'>
                <button
                  type='button'
                  onClick={() => setCorrectionTarget(null)}
                  className='px-3 py-1.5 font-bold text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-3.5 py-1.5 font-bold text-white bg-[#714B67] rounded-lg cursor-pointer'
                >
                  Apply Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
