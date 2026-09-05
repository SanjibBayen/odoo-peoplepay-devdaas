import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import scheduleApi from '../../services/scheduleApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DAY_NUMBER_MAP = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const DEFAULT_DAYS = {
  Monday: { active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
  Tuesday: { active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
  Wednesday: { active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
  Thursday: { active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
  Friday: { active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
  Saturday: { active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
  Sunday: { active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
};

function calculateDailyHours(day) {
  if (!day || !day.active) return 0;
  const [sH, sM] = (day.start || '09:00').split(':').map(Number);
  const [eH, eM] = (day.end || '18:00').split(':').map(Number);
  const totalM = (eH * 60 + eM) - (sH * 60 + sM) - (day.breakMinutes || 0);
  return Math.max(0, Math.round((totalM / 60) * 10) / 10);
}

function calculateWeeklyHours(days) {
  if (!days) return 40;
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
    days: DEFAULT_DAYS,
  });

  const loadSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await scheduleApi.getSchedules();
      const list = res.data || (Array.isArray(res) ? res : []);
      setSchedules(list);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load work schedules.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await scheduleApi.getSchedules();
        if (!active) return;
        const list = res.data || (Array.isArray(res) ? res : []);
        setSchedules(list);
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err, 'Failed to load work schedules.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setFormError(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      days: DEFAULT_DAYS,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sch) => {
    setEditingSchedule(sch);
    setFormError(null);
    setFormData({
      name: sch.name,
      code: sch.code,
      description: sch.description || '',
      days: sch.days || DEFAULT_DAYS,
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
    setFormError(null);
    setIsSubmitting(true);

    // Transform days map to backend array
    const backendDays = Object.entries(formData.days).map(([dayName, d]) => ({
      dayOfWeek: DAY_NUMBER_MAP[dayName],
      startTime: d.start,
      endTime: d.end,
      breakMinutes: Number(d.breakMinutes) || 0,
      isWorkingDay: Boolean(d.active),
    }));

    try {
      if (editingSchedule) {
        await scheduleApi.updateSchedule(editingSchedule.id, {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description,
          scheduleType: 'WEEKLY',
        });
        // Update days
        await scheduleApi.updateScheduleDays(editingSchedule.id, backendDays);
        setStatusBanner({ type: 'success', text: 'Schedule updated successfully.' });
      } else {
        await scheduleApi.createSchedule({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description,
          scheduleType: 'WEEKLY',
          days: backendDays,
        });
        setStatusBanner({ type: 'success', text: 'New schedule created successfully.' });
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
        subtitle='Define standard shifts, active working days, break rules, and weekly expected hours.'
        actions={
          <button
            type='button'
            onClick={handleOpenAdd}
            className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1'
          >
            <span>+</span>
            <span>New Schedule</span>
          </button>
        }
      />

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

      {loading ? (
        <LoadingState message='Loading work schedules...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadSchedules} />
      ) : schedules.length === 0 ? (
        <EmptyState
          title='No schedules defined'
          description='Create standard work schedules to manage team rosters and biometric logs.'
          actionLabel='+ New Schedule'
          onAction={handleOpenAdd}
        />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {schedules.map((sch) => {
            const count = sch.employeeCount || sch.assignedEmployeesCount || 0;
            const hours = sch.weeklyHours || 40;

            return (
              <div
                key={sch.id}
                className='bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-2xs space-y-4 hover:border-gray-300 transition-colors'
              >
                <div className='flex items-start justify-between'>
                  <div>
                    <h4 className='text-sm font-black text-[#1E293B]'>{sch.name}</h4>
                    <span className='text-[10px] font-bold text-[#714B67] tracking-wider'>
                      CODE: {sch.code}
                    </span>
                  </div>
                  <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200'>
                    {count} Staff
                  </span>
                </div>

                <div className='p-3 rounded-xl bg-[#FAF8F5] border border-gray-100 flex items-center justify-between text-xs'>
                  <span className='text-gray-500 font-medium'>Weekly Capacity</span>
                  <span className='font-black text-gray-900'>{hours} hrs / week</span>
                </div>

                <div className='flex justify-end pt-2 border-t border-gray-100'>
                  <button
                    type='button'
                    onClick={() => handleOpenEdit(sch)}
                    className='text-xs font-bold text-[#714B67] hover:underline cursor-pointer'
                  >
                    Edit Shifts
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <h3 className='text-sm font-black text-[#1E293B]'>
                {editingSchedule ? 'Edit Work Schedule' : 'New Work Schedule'}
              </h3>
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

            <form onSubmit={handleSave} className='space-y-4 text-xs'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Schedule Name *</label>
                  <input
                    type='text'
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder='e.g. Standard 40h Shift'
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Schedule Code *</label>
                  <input
                    type='text'
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder='e.g. STD-40'
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Description</label>
                <input
                  type='text'
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder='Shift coverage notes'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              {/* Day Schedules Table */}
              <div className='space-y-2 border-t border-gray-100 pt-3'>
                <div className='flex items-center justify-between font-bold text-gray-700 text-xs'>
                  <span>Working Days & Hours</span>
                  <span className='text-[#714B67]'>
                    Total: {calculateWeeklyHours(formData.days)} hrs
                  </span>
                </div>

                <div className='space-y-1.5'>
                  {DAYS_OF_WEEK.map((day) => {
                    const d = formData.days[day] || {
                      active: false,
                      start: '09:00',
                      end: '18:00',
                      breakMinutes: 60,
                    };
                    return (
                      <div
                        key={day}
                        className={`p-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs transition-colors ${
                          d.active
                            ? 'bg-[#FAF8F5] border-gray-200'
                            : 'bg-gray-50/50 border-gray-100 opacity-60'
                        }`}
                      >
                        <div className='flex items-center gap-2 min-w-[100px]'>
                          <input
                            type='checkbox'
                            id={`day-${day}`}
                            checked={d.active}
                            onChange={(e) => handleDayChange(day, 'active', e.target.checked)}
                            className='rounded text-[#714B67] focus:ring-[#714B67]'
                          />
                          <label htmlFor={`day-${day}`} className='font-bold text-gray-800 select-none'>
                            {day}
                          </label>
                        </div>

                        {d.active && (
                          <div className='flex items-center gap-2'>
                            <input
                              type='time'
                              value={d.start}
                              onChange={(e) => handleDayChange(day, 'start', e.target.value)}
                              className='px-2 py-1 rounded-lg border border-gray-200 text-[11px] bg-white'
                            />
                            <span>to</span>
                            <input
                              type='time'
                              value={d.end}
                              onChange={(e) => handleDayChange(day, 'end', e.target.value)}
                              className='px-2 py-1 rounded-lg border border-gray-200 text-[11px] bg-white'
                            />
                            <span className='text-[10px] text-gray-400 font-semibold'>
                              ({calculateDailyHours(d)}h)
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
