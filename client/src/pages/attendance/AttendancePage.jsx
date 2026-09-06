import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import attendanceApi from '../../services/attendanceApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

const ATTENDANCE_STATUSES = [
  'All Statuses',
  'PRESENT',
  'LATE',
  'ABSENT',
  'EARLY_EXIT',
  'OVERTIME',
  'MISSING_CHECKOUT',
  'CORRECTED',
];

function normalizeAttendance(att) {
  if (!att) return null;
  const emp = att.employee || {};
  const empName = emp.firstName
    ? `${emp.firstName} ${emp.lastName || ''}`.trim()
    : att.employeeName || 'Employee';
  const empCode = emp.employeeCode || att.employeeId || '';
  const deptName = emp.department?.name || att.department || 'General';
  const workedHours = att.workedMinutes
    ? Math.round((att.workedMinutes / 60) * 10) / 10
    : att.workedHours || 0;

  const formatTime = (t) => {
    if (!t) return '--:--';
    try {
      return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return t;
    }
  };

  return {
    ...att,
    id: att.id,
    date: att.workDate || att.date || '',
    employeeName: empName,
    employeeId: empCode,
    department: deptName,
    checkIn: formatTime(att.checkIn),
    checkOut: formatTime(att.checkOut),
    rawCheckIn: att.checkIn,
    rawCheckOut: att.checkOut,
    workedHours,
    lateMinutes: att.lateMinutes || 0,
    earlyExitMinutes: att.earlyExitMinutes || 0,
    overtimeMinutes: att.overtimeMinutes || 0,
    breakMinutes: att.breakMinutes || 0,
    status: att.status || 'PRESENT',
  };
}

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [correctionTarget, setCorrectionTarget] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    checkIn: '',
    checkOut: '',
    breakMinutes: 0,
    correctionReason: '',
  });

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.getAttendance();
      // FIX: Backend returns { success, data } - use "data" key
      const list = res?.data || [];
      setRecords(Array.isArray(list) ? list.map(normalizeAttendance) : []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load attendance logs.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const handleCheckIn = async () => {
    try {
      await attendanceApi.checkIn({});
      await loadAttendance();
      setStatusBanner({ type: 'success', text: 'Punch-in recorded successfully.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Punch-in failed') });
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceApi.checkOut({});
      await loadAttendance();
      setStatusBanner({ type: 'success', text: 'Punch-out recorded successfully.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Punch-out failed') });
    }
  };

  const handleOpenCorrection = (record) => {
    setCorrectionTarget(record);
    setCorrectionForm({
      checkIn: record.rawCheckIn ? new Date(record.rawCheckIn).toISOString().slice(0, 16) : '',
      checkOut: record.rawCheckOut ? new Date(record.rawCheckOut).toISOString().slice(0, 16) : '',
      breakMinutes: record.breakMinutes || 0,
      correctionReason: record.correctionReason || 'Manual adjustment',
    });
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!correctionTarget) return;

    try {
      await attendanceApi.correctAttendance(correctionTarget.id, {
        checkIn: correctionForm.checkIn ? new Date(correctionForm.checkIn).toISOString() : undefined,
        checkOut: correctionForm.checkOut ? new Date(correctionForm.checkOut).toISOString() : undefined,
        breakMinutes: Number(correctionForm.breakMinutes) || 0,
        correctionReason: correctionForm.correctionReason,
      });
      setCorrectionTarget(null);
      await loadAttendance();
      setStatusBanner({ type: 'success', text: 'Attendance record adjusted.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to update attendance') });
    }
  };

  const filtered = records.filter((r) => {
    const matchesStatus = selectedStatus === 'All Statuses' || r.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.employeeName?.toLowerCase().includes(q) ||
      r.employeeId?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedRecords = filtered.slice((page - 1) * pageSize, page * pageSize);

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
              className='px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl cursor-pointer'
            >
              Punch In
            </button>
            <button
              type='button'
              onClick={handleCheckOut}
              className='px-3.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl cursor-pointer'
            >
              Punch Out
            </button>
          </div>
        }
      />

      {statusBanner && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-fadeIn ${
          statusBanner.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{statusBanner.text}</span>
          <button type='button' onClick={() => setStatusBanner(null)} className='font-bold ml-2 cursor-pointer'>✕</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className='bg-white p-3 rounded-2xl border border-[#EAE6DF] shadow-2xs flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]'>
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder='Search by employee or department...'
            className='px-3 py-1.5 rounded-xl border border-gray-200 text-xs w-full max-w-xs'
          />
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className='px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold cursor-pointer'
          >
            {ATTENDANCE_STATUSES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
        <div className='text-xs font-bold text-gray-500'>Showing {filtered.length} records</div>
      </div>

      {loading ? (
        <LoadingState message='Loading attendance records...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAttendance} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title='No attendance logs found'
          description='Try changing your search query or status filter.'
          actionLabel='Reset Filters'
          onAction={() => { setSearchQuery(''); setSelectedStatus('All Statuses'); }}
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
                  <tr key={r.id} className='hover:bg-[#FAF8F5]/60'>
                    <td className='py-3 px-4 font-bold text-gray-800'>{r.date}</td>
                    <td className='py-3 px-4'>
                      <div className='font-bold text-gray-900'>{r.employeeName}</div>
                      <div className='text-[10px] text-gray-500'>{r.employeeId} • {r.department}</div>
                    </td>
                    <td className='py-3 px-4'>{r.checkIn}</td>
                    <td className='py-3 px-4'>{r.checkOut}</td>
                    <td className='py-3 px-4 font-bold'>{r.workedHours > 0 ? `${r.workedHours} hrs` : '--'}</td>
                    <td className='py-3 px-4 text-[11px]'>
                      {r.lateMinutes > 0 && <span className='text-amber-700 block'>+{r.lateMinutes}m late</span>}
                      {r.earlyExitMinutes > 0 && <span className='text-rose-600 block'>-{r.earlyExitMinutes}m early</span>}
                      {r.overtimeMinutes > 0 && <span className='text-emerald-700 block'>+{r.overtimeMinutes}m OT</span>}
                      {!r.lateMinutes && !r.earlyExitMinutes && !r.overtimeMinutes && <span className='text-gray-400'>None</span>}
                    </td>
                    <td className='py-3 px-4'>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        r.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        r.status === 'LATE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        r.status === 'OVERTIME' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        r.status === 'EARLY_EXIT' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className='py-3 px-4 text-right'>
                      <button type='button' onClick={() => handleOpenCorrection(r)} className='text-[#714B67] hover:underline font-bold cursor-pointer'>Correct</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='p-3 border-t border-[#EAE6DF]'>
            <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {correctionTarget && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn' role='dialog' aria-modal='true'>
          <div className='bg-white rounded-2xl max-w-md w-full p-6 border border-[#EAE6DF] shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <div>
                <h3 className='text-sm font-black'>Adjust Attendance Record</h3>
                <p className='text-xs text-gray-500'>{correctionTarget.employeeName} ({correctionTarget.employeeId}) • {correctionTarget.date}</p>
              </div>
              <button type='button' onClick={() => setCorrectionTarget(null)} className='text-gray-400 font-bold cursor-pointer'>✕</button>
            </div>

            <form onSubmit={handleSaveCorrection} className='space-y-3.5 text-xs'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-bold mb-1'>Check-In</label>
                  <input type='datetime-local' value={correctionForm.checkIn} onChange={(e) => setCorrectionForm({ ...correctionForm, checkIn: e.target.value })} className='w-full px-3 py-2 rounded-xl border border-gray-200' />
                </div>
                <div>
                  <label className='block font-bold mb-1'>Check-Out</label>
                  <input type='datetime-local' value={correctionForm.checkOut} onChange={(e) => setCorrectionForm({ ...correctionForm, checkOut: e.target.value })} className='w-full px-3 py-2 rounded-xl border border-gray-200' />
                </div>
              </div>

              <div>
                <label className='block font-bold mb-1'>Break Minutes</label>
                <input type='number' min='0' value={correctionForm.breakMinutes} onChange={(e) => setCorrectionForm({ ...correctionForm, breakMinutes: e.target.value })} className='w-full px-3 py-2 rounded-xl border border-gray-200' />
              </div>

              <div>
                <label className='block font-bold mb-1'>Correction Reason *</label>
                <textarea required rows={2} value={correctionForm.correctionReason} onChange={(e) => setCorrectionForm({ ...correctionForm, correctionReason: e.target.value })} className='w-full px-3 py-2 rounded-xl border border-gray-200' />
              </div>

              <div className='pt-2 flex justify-end gap-2 border-t border-gray-100'>
                <button
                  type='button'
                  onClick={() => setCorrectionTarget(null)}
                  className='px-4 py-2 font-semibold text-gray-700 hover:text-gray-900 border rounded-xl hover:bg-gray-50 cursor-pointer'
                >
                  Cancel
                </button>
                <button type='submit' className='px-4 py-2 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl cursor-pointer'>Save Correction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}