import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import scheduleApi from '../../services/scheduleApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DAY_NUMBER_MAP = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
};

const DEFAULT_DAYS = {
  Monday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  Tuesday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  Wednesday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  Thursday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  Friday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  Saturday: { isWorkingDay: false, startTime: null, endTime: null, breakMinutes: 0 },
  Sunday: { isWorkingDay: false, startTime: null, endTime: null, breakMinutes: 0 },
};

function calculateDailyHours(day) {
  if (!day || !day.isWorkingDay) return 0;
  const [sH, sM] = (day.startTime || '09:00').split(':').map(Number);
  const [eH, eM] = (day.endTime || '18:00').split(':').map(Number);
  const totalM = (eH * 60 + eM) - (sH * 60 + sM) - (day.breakMinutes || 0);
  return Math.max(0, Math.round((totalM / 60) * 10) / 10);
}

function calculateWeeklyHours(days) {
  if (!days) return 0;
  return Object.values(days).reduce((acc, d) => acc + calculateDailyHours(d), 0);
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusBanner, setStatusBanner] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    days: { ...DEFAULT_DAYS },
  });

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await scheduleApi.getSchedules();
      // FIX: Backend returns { success, data }
      const list = res?.data || [];
      setSchedules(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load work schedules.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setFormError(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      days: { ...DEFAULT_DAYS },
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sch) => {
    setEditingSchedule(sch);
    setFormError(null);
    setFormData({
      name: sch.name || '',
      code: sch.code || '',
      description: sch.description || '',
      days: { ...DEFAULT_DAYS },
    });
    setIsModalOpen(true);
  };

  const handleDayChange = (dayName, field, value) => {
    setFormData((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [dayName]: {
          ...prev.days[dayName],
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Schedule name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Schedule code is required.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    const backendDays = Object.entries(formData.days).map(([dayName, d]) => ({
      dayOfWeek: DAY_NUMBER_MAP[dayName],
      startTime: d.isWorkingDay ? d.startTime : null,
      endTime: d.isWorkingDay ? d.endTime : null,
      breakMinutes: d.isWorkingDay ? Number(d.breakMinutes) || 0 : 0,
      isWorkingDay: Boolean(d.isWorkingDay),
    }));

    try {
      if (editingSchedule) {
        await scheduleApi.updateSchedule(editingSchedule.id, {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description || null,
          scheduleType: 'WEEKLY',
        });
        await scheduleApi.updateScheduleDays(editingSchedule.id, backendDays);
        setStatusBanner({ type: 'success', text: 'Schedule updated.' });
      } else {
        await scheduleApi.createSchedule({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description || null,
          scheduleType: 'WEEKLY',
          days: backendDays,
        });
        setStatusBanner({ type: 'success', text: 'Schedule created.' });
      }
      setIsModalOpen(false);
      await loadSchedules();
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to save schedule.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Work Schedules'
        subtitle='Define standard shifts, working days, and break rules.'
        actions={
          <button type='button' onClick={handleOpenAdd} className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] rounded-xl cursor-pointer'>
            + New Schedule
          </button>
        }
      />

      {statusBanner && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          statusBanner.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{statusBanner.text}</span>
          <button type='button' onClick={() => setStatusBanner(null)} className='font-bold ml-2 cursor-pointer'>✕</button>
        </div>
      )}

      {loading ? (
        <LoadingState message='Loading work schedules...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadSchedules} />
      ) : schedules.length === 0 ? (
        <EmptyState title='No schedules defined' description='Create work schedules for team rosters.' actionLabel='+ New Schedule' onAction={handleOpenAdd} />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {schedules.map((sch) => (
            <div key={sch.id} className='bg-white p-5 rounded-2xl border space-y-4'>
              <div className='flex items-start justify-between'>
                <div>
                  <h4 className='text-sm font-black'>{sch.name}</h4>
                  <span className='text-[10px] font-bold text-[#714B67]'>CODE: {sch.code}</span>
                </div>
                <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border'>
                  {sch.employeeCount || 0} Staff
                </span>
              </div>
              <div className='p-3 rounded-xl bg-[#FAF8F5] border flex items-center justify-between text-xs'>
                <span className='text-gray-500'>Weekly Capacity</span>
                <span className='font-black'>{sch.weeklyHours || 0} hrs</span>
              </div>
              <div className='flex justify-end pt-2 border-t'>
                <button type='button' onClick={() => handleOpenEdit(sch)} className='text-xs font-bold text-[#714B67] hover:underline cursor-pointer'>Edit Shifts</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40' role='dialog' aria-modal='true'>
          <div className='bg-white rounded-2xl max-w-lg w-full p-5 border shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b pb-3'>
              <h3 className='text-sm font-black'>{editingSchedule ? 'Edit Schedule' : 'New Schedule'}</h3>
              <button type='button' onClick={() => setIsModalOpen(false)} className='cursor-pointer'>✕</button>
            </div>

            {formError && <div className='p-2.5 rounded-xl bg-red-50 border text-red-700 text-xs'>{formError}</div>}

            <form onSubmit={handleSave} className='space-y-4 text-xs'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-bold mb-1'>Schedule Name *</label>
                  <input type='text' required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
                </div>
                <div>
                  <label className='block font-bold mb-1'>Schedule Code *</label>
                  <input type='text' required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
                </div>
              </div>

              <div>
                <label className='block font-bold mb-1'>Description</label>
                <input type='text' value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
              </div>

              <div className='space-y-2 border-t pt-3'>
                <div className='flex justify-between font-bold'>
                  <span>Working Days & Hours</span>
                  <span className='text-[#714B67]'>Total: {calculateWeeklyHours(formData.days)} hrs</span>
                </div>
                {DAYS_OF_WEEK.map((day) => {
                  const d = formData.days[day] || { isWorkingDay: false, startTime: '09:00', endTime: '18:00', breakMinutes: 60 };
                  return (
                    <div key={day} className={`p-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${d.isWorkingDay ? 'bg-[#FAF8F5] border-gray-200' : 'bg-gray-50/50 opacity-60'}`}>
                      <div className='flex items-center gap-2 min-w-[100px]'>
                        <input type='checkbox' checked={d.isWorkingDay} onChange={(e) => handleDayChange(day, 'isWorkingDay', e.target.checked)} className='rounded cursor-pointer' />
                        <label className='font-bold'>{day}</label>
                      </div>
                      {d.isWorkingDay && (
                        <div className='flex items-center gap-2'>
                          <input type='time' value={d.startTime || '09:00'} onChange={(e) => handleDayChange(day, 'startTime', e.target.value)} className='px-2 py-1 rounded-lg border text-[11px] cursor-pointer' />
                          <span>to</span>
                          <input type='time' value={d.endTime || '18:00'} onChange={(e) => handleDayChange(day, 'endTime', e.target.value)} className='px-2 py-1 rounded-lg border text-[11px] cursor-pointer' />
                          <span className='text-[10px] text-gray-400'>({calculateDailyHours(d)}h)</span>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                  {isSubmitting ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}