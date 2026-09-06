import React from 'react';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function calculateDailyHours(day) {
  if (!day || !day.isWorkingDay) return 0;
  const [sH, sM] = (day.startTime || '09:00').split(':').map(Number);
  const [eH, eM] = (day.endTime || '18:00').split(':').map(Number);
  const totalM = (eH * 60 + eM) - (sH * 60 + sM) - (day.breakMinutes || 0);
  return Math.max(0, Math.round((totalM / 60) * 10) / 10);
}

function calculateTotalWeeklyHours(days) {
  if (!days) return 0;
  if (Array.isArray(days)) {
    return days.reduce((acc, d) => acc + calculateDailyHours(d), 0);
  }
  // If days is object with day names as keys
  return Object.values(days).reduce((acc, d) => acc + calculateDailyHours(d), 0);
}

export default function ScheduleDaysEditor({ days, onChange }) {
  const totalWeekly = calculateTotalWeeklyHours(days);

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between pb-2 border-b'>
        <label className='font-bold text-gray-800 text-xs'>Weekly Schedule Configuration</label>
        <span className='text-xs font-black text-[#714B67] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200'>
          Total: {totalWeekly} hrs / week
        </span>
      </div>

      <div className='space-y-2'>
        {DAYS_OF_WEEK.map((dayName) => {
          // Handle both array and object formats
          const d = Array.isArray(days)
            ? days.find((item) => item.dayName === dayName) || { isWorkingDay: false, startTime: '09:00', endTime: '18:00', breakMinutes: 60 }
            : days?.[dayName] || { isWorkingDay: false, startTime: '09:00', endTime: '18:00', breakMinutes: 60 };

          const dailyHours = calculateDailyHours(d);

          return (
            <div
              key={dayName}
              className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                d.isWorkingDay ? 'bg-[#FAF8F5] border-gray-200' : 'bg-gray-50/50 border-gray-100 opacity-60'
              }`}
            >
              <div className='flex items-center gap-2.5 min-w-[120px]'>
                <input
                  type='checkbox'
                  id={`day-${dayName}`}
                  checked={d.isWorkingDay}
                  onChange={(e) => onChange(dayName, 'isWorkingDay', e.target.checked)}
                  className='rounded cursor-pointer'
                />
                <label htmlFor={`day-${dayName}`} className='font-bold cursor-pointer'>
                  {dayName}
                </label>
              </div>

              {d.isWorkingDay ? (
                <div className='flex flex-wrap items-center gap-3'>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-gray-400 text-[11px]'>In:</span>
                    <input
                      type='time'
                      value={d.startTime || '09:00'}
                      onChange={(e) => onChange(dayName, 'startTime', e.target.value)}
                      className='px-2 py-1 rounded-lg border text-xs bg-white cursor-pointer'
                    />
                  </div>

                  <div className='flex items-center gap-1.5'>
                    <span className='text-gray-400 text-[11px]'>Out:</span>
                    <input
                      type='time'
                      value={d.endTime || '18:00'}
                      onChange={(e) => onChange(dayName, 'endTime', e.target.value)}
                      className='px-2 py-1 rounded-lg border text-xs bg-white cursor-pointer'
                    />
                  </div>

                  <div className='flex items-center gap-1.5'>
                    <span className='text-gray-400 text-[11px]'>Break (m):</span>
                    <input
                      type='number'
                      min='0'
                      max='240'
                      value={d.breakMinutes || 0}
                      onChange={(e) => onChange(dayName, 'breakMinutes', Number(e.target.value) || 0)}
                      className='w-16 px-2 py-1 rounded-lg border text-xs bg-white text-center'
                    />
                  </div>

                  <span className='text-xs font-bold text-gray-700 bg-white px-2 py-0.5 rounded border'>
                    {dailyHours} hrs
                  </span>
                </div>
              ) : (
                <span className='text-gray-400 text-[11px]'>Rest Day (Off)</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}