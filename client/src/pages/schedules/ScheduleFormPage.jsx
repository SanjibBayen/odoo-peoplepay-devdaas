import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import ScheduleDaysEditor from './ScheduleDaysEditor.jsx';
import scheduleApi from '../../services/scheduleApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';
import { DAYS_OF_WEEK } from '../../utils/constants.js';

const DAY_NUMBER_MAP = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const NUMBER_DAY_MAP = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

const DEFAULT_DAYS = {
  Monday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  Tuesday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  Wednesday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  Thursday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  Friday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  Saturday: { isWorkingDay: false, startTime: '00:00', endTime: '00:00', breakMinutes: 0 },
  Sunday: { isWorkingDay: false, startTime: '00:00', endTime: '00:00', breakMinutes: 0 },
};

export default function ScheduleFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState(() => ({
    name: '',
    code: isEdit ? '' : `SCH-${Date.now().toString().slice(-4)}`,
    description: '',
    days: DEFAULT_DAYS,
  }));

  useEffect(() => {
    if (!isEdit) return;

    let active = true;
    (async () => {
      try {
        const [schRes, daysRes] = await Promise.allSettled([
          scheduleApi.getScheduleById(id),
          scheduleApi.getScheduleDays(id),
        ]);

        if (!active) return;

        if (schRes.status === 'fulfilled') {
          const s = schRes.value.data || schRes.value;
          const daysMap = { ...DEFAULT_DAYS };

          if (daysRes.status === 'fulfilled') {
            const rawDays = daysRes.value.data || (Array.isArray(daysRes.value) ? daysRes.value : []);
            rawDays.forEach((d) => {
              const dayName = NUMBER_DAY_MAP[d.dayOfWeek];
              if (dayName) {
                daysMap[dayName] = {
                  isWorkingDay: Boolean(d.isWorkingDay),
                  startTime: d.startTime || '09:00',
                  endTime: d.endTime || '18:00',
                  breakMinutes: d.breakMinutes || 0,
                };
              }
            });
          }

          setFormData({
            name: s.name || '',
            code: s.code || '',
            description: s.description || '',
            days: daysMap,
          });
        } else {
          setError(extractErrorMessage(schRes.reason, 'Failed to load schedule.'));
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load schedule.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEdit]);

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

  const handleSubmit = async (e) => {
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

    const backendDays = DAYS_OF_WEEK.map((dayName) => {
      const d = formData.days[dayName];
      return {
        dayOfWeek: DAY_NUMBER_MAP[dayName],
        startTime: d.isWorkingDay ? d.startTime : '00:00',
        endTime: d.isWorkingDay ? d.endTime : '00:00',
        breakMinutes: d.isWorkingDay ? Number(d.breakMinutes) : 0,
        isWorkingDay: Boolean(d.isWorkingDay),
      };
    });

    try {
      if (isEdit) {
        await scheduleApi.updateSchedule(id, {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description,
          scheduleType: 'WEEKLY',
        });
        await scheduleApi.updateScheduleDays(id, backendDays);
      } else {
        await scheduleApi.createSchedule({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description,
          scheduleType: 'WEEKLY',
          days: backendDays,
        });
      }
      navigate('/schedules');
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to save schedule.'));
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState message='Loading work schedule...' />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <BackButton label='Back to Schedules' fallback='/schedules' />
        <span className='text-xs font-mono font-bold text-gray-500 bg-[#FAF8F5] px-3 py-1 rounded-xl border border-gray-200'>
          {isEdit ? `Editing: ${formData.code}` : 'New Schedule'}
        </span>
      </div>

      <PageHeader
        title={isEdit ? 'Edit Work Schedule' : 'Create Work Schedule'}
        subtitle='Define active working days, shift intervals, lunch break lengths, and standard capacities.'
      />

      {formError && (
        <div className='p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold'>
          {formError}
        </div>
      )}

      <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-xs p-6 sm:p-8'>
        <form onSubmit={handleSubmit} className='space-y-5 text-xs'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>Schedule Name *</label>
              <input
                type='text'
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='e.g. Standard 40h Regular Shift'
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              />
            </div>

            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>Schedule Code *</label>
              <input
                type='text'
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder='e.g. STD-40'
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5] font-mono'
              />
            </div>
          </div>

          <div>
            <label className='block font-bold text-gray-700 mb-1.5'>Description</label>
            <input
              type='text'
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder='Brief notes on shift timing and operational teams'
              className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
            />
          </div>

          <ScheduleDaysEditor days={formData.days} onChange={handleDayChange} />

          <div className='pt-4 flex justify-end gap-2 border-t border-gray-100'>
            <BackButton label='Cancel' fallback='/schedules' />
            <button
              type='submit'
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Saving Schedule...' : isEdit ? 'Update Schedule' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
