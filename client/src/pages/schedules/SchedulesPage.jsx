import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import scheduleApi from '../../services/scheduleApi.js';
import {
  calculateDailyHours,
  calculateWeeklyHours,
  getSchedulesFromStorage,
} from '../../data/schedulesData.js';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DEFAULT_DAYS = {
  Monday: { active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
  Tuesday: { active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
  Wednesday: { active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
  Thursday: { active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
  Friday: { active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
  Saturday: { active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
  Sunday: { active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState(() => getSchedulesFromStorage());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    days: DEFAULT_DAYS,
  });

  const loadSchedules = () => {
    scheduleApi
      .getSchedules()
      .then((res) => {
        setSchedules(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load schedules.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setFormData({
      name: '',
      code: `SCH-${Date.now().toString().slice(-4)}`,
      description: '',
      days: { ...DEFAULT_DAYS },
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sch) => {
    setEditingSchedule(sch);
    setFormData({
      name: sch.name,
      code: sch.code,
      description: sch.description,
      days: { ...sch.days },
    });
    setIsModalOpen(true);
  };

  const handleDayChange = (dayName, field, value) => {
    setFormData((prev) => {
      const currentDay = prev.days[dayName];
      const updatedDay = { ...currentDay, [field]: value };
      return {
        ...prev,
        days: { ...prev.days, [dayName]: updatedDay },
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await scheduleApi.updateSchedule(editingSchedule.id, formData);
      } else {
        await scheduleApi.createSchedule(formData);
      }
      setIsModalOpen(false);
      await loadSchedules();
    } catch (err) {
      alert(err.message || 'Failed to save schedule');
    }
  };

  // Calculated in real-time
  const computedWeeklyHours = calculateWeeklyHours(formData.days);

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Working Schedules'
        subtitle='Define weekly operating shifts, break durations, and automated hour calculations.'
        actions={
          <button
            type='button'
            onClick={handleOpenAdd}
            className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1'
          >
            <span>+</span>
            <span>Create Schedule</span>
          </button>
        }
      />

      {loading ? (
        <LoadingState message='Loading working schedules...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadSchedules} />
      ) : schedules.length === 0 ? (
        <EmptyState
          title='No working schedules defined'
          description='Create your organization core work schedule.'
          action={
            <button
              type='button'
              onClick={handleOpenAdd}
              className='px-3.5 py-1.5 rounded-xl bg-[#714B67] text-white text-xs font-bold'
            >
              Create First Schedule
            </button>
          }
        />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {schedules.map((sch) => {
            const weeklyHours = sch.weeklyHours || calculateWeeklyHours(sch.days || {});
            return (
              <div
                key={sch.id}
                className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-4 hover:border-gray-300 transition-all flex flex-col justify-between'
              >
                <div className='space-y-2'>
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <h4 className='text-sm font-black text-[#1E293B]'>
                        {sch.name}
                      </h4>
                      <div className='text-[10px] font-bold text-[#714B67]'>
                        {sch.code}
                      </div>
                    </div>
                    <span className='px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-[#714B67] border border-purple-200/60'>
                      {weeklyHours} hrs/wk
                    </span>
                  </div>
                  <p className='text-xs text-gray-500 line-clamp-2'>
                    {sch.description || 'Standard work schedule'}
                  </p>
                </div>

                {/* Day summary mini strip */}
                <div className='space-y-1 text-[11px] pt-2 border-t border-gray-100'>
                  {DAYS_OF_WEEK.map((day) => {
                    const d = sch.days?.[day];
                    const active = d?.active;
                    const hours = active
                      ? calculateDailyHours(d.start, d.end, d.breakMinutes)
                      : 0;
                    return (
                      <div
                        key={day}
                        className='flex items-center justify-between text-gray-600'
                      >
                        <span className={active ? 'font-bold text-gray-800' : 'text-gray-400'}>
                          {day.slice(0, 3)}
                        </span>
                        <span className={active ? 'text-gray-700' : 'text-gray-400'}>
                          {active ? `${d.start} - ${d.end} (${hours}h)` : 'Off'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className='pt-2 border-t border-gray-100 flex items-center justify-between text-xs'>
                  <span className='text-gray-500 font-medium'>
                    {sch.assignedEmployeesCount || 0} employees
                  </span>
                  <button
                    type='button'
                    onClick={() => handleOpenEdit(sch)}
                    className='font-bold text-[#714B67] hover:underline cursor-pointer'
                  >
                    Edit Schedule
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Schedule Modal */}
      {isModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4 max-h-[92vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <div>
                <h3 className='text-base font-black text-[#1E293B]'>
                  {editingSchedule ? 'Edit Schedule' : 'Create Working Schedule'}
                </h3>
                <p className='text-xs text-gray-500 mt-0.5'>
                  Automated computation: Worked Hours = End - Start - Break
                </p>
              </div>
              <button
                type='button'
                onClick={() => setIsModalOpen(false)}
                className='text-gray-400 hover:text-gray-700 cursor-pointer font-bold'
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className='space-y-4 text-xs'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>
                    Schedule Name *
                  </label>
                  <input
                    type='text'
                    required
                    placeholder='e.g. Standard Core 40H'
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>
                    Schedule Code *
                  </label>
                  <input
                    type='text'
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>
                  Description
                </label>
                <input
                  type='text'
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder='Shift details and lunch policy...'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              {/* Weekly Day Schedule Config Table */}
              <div className='border border-gray-200 rounded-xl overflow-hidden'>
                <div className='bg-[#FAF8F5] px-3 py-2 font-bold text-gray-700 border-b border-gray-200 flex items-center justify-between'>
                  <span>Daily Shift Configuration</span>
                  <span className='text-[#714B67]'>
                    Total: {computedWeeklyHours} Hours / Week
                  </span>
                </div>

                <div className='divide-y divide-gray-100 p-2 space-y-2'>
                  {DAYS_OF_WEEK.map((day) => {
                    const dayConfig = formData.days[day] || {
                      active: false,
                      start: '09:00',
                      end: '18:00',
                      breakMinutes: 60,
                    };
                    const dailyHours = dayConfig.active
                      ? calculateDailyHours(
                          dayConfig.start,
                          dayConfig.end,
                          dayConfig.breakMinutes
                        )
                      : 0;

                    return (
                      <div
                        key={day}
                        className='flex items-center gap-2 pt-1 pb-1 text-xs'
                      >
                        <div className='w-24 flex items-center gap-1.5'>
                          <input
                            type='checkbox'
                            checked={dayConfig.active}
                            onChange={(e) =>
                              handleDayChange(day, 'active', e.target.checked)
                            }
                            className='w-3.5 h-3.5 rounded text-[#714B67] accent-[#714B67]'
                          />
                          <span
                            className={
                              dayConfig.active
                                ? 'font-bold text-gray-800'
                                : 'text-gray-400'
                            }
                          >
                            {day}
                          </span>
                        </div>

                        {dayConfig.active ? (
                          <div className='flex-1 flex items-center gap-2'>
                            <input
                              type='time'
                              value={dayConfig.start}
                              onChange={(e) =>
                                handleDayChange(day, 'start', e.target.value)
                              }
                              className='px-2 py-1 rounded border border-gray-200 bg-[#FAF8F5]'
                            />
                            <span className='text-gray-400'>to</span>
                            <input
                              type='time'
                              value={dayConfig.end}
                              onChange={(e) =>
                                handleDayChange(day, 'end', e.target.value)
                              }
                              className='px-2 py-1 rounded border border-gray-200 bg-[#FAF8F5]'
                            />
                            <div className='flex items-center gap-1 text-[11px] text-gray-500'>
                              <span>Break:</span>
                              <input
                                type='number'
                                min='0'
                                step='15'
                                value={dayConfig.breakMinutes}
                                onChange={(e) =>
                                  handleDayChange(
                                    day,
                                    'breakMinutes',
                                    Number(e.target.value)
                                  )
                                }
                                className='w-12 px-1.5 py-0.5 rounded border border-gray-200 bg-[#FAF8F5]'
                              />
                              <span>m</span>
                            </div>
                            <span className='ml-auto font-bold text-gray-700 text-[11px]'>
                              {dailyHours}h
                            </span>
                          </div>
                        ) : (
                          <span className='text-gray-400 italic text-[11px]'>
                            Off day
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className='pt-2 flex items-center justify-end gap-2 border-t border-gray-100'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='px-3.5 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs cursor-pointer'
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
