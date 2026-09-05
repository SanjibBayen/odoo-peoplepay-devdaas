import React from 'react';
import { DAYS_OF_WEEK } from '../../utils/constants.js';

function calculateDailyHours(day) {
  if (!day || !day.isWorkingDay) return 0;
  const [sH, sM] = (day.startTime || '09:00').split(':').map(Number);
  const [eH, eM] = (day.endTime || '18:00').split(':').map(Number);
  const totalM = (eH * 60 + eM) - (sH * 60 + sM) - (day.breakMinutes || 0);
  return Math.max(0, Math.round((totalM / 60) * 10) / 10);
}

function calculateTotalWeeklyHours(days) {
  if (!days) return 40;
  return Object.values(days).reduce((acc, d) => acc + calculateDailyHours(d), 0);
}

/**
 * Reusable 7-day weekly work schedule days editor component.
 *
 * @param {Object} props
 * @param {Object} props.days - Map of day names to day configurations
 * @param {Function} props.onChange - Callback (dayName, field, value) => void
 */
export default function ScheduleDaysEditor({ days, onChange }) {
  const totalWeekly = calculateTotalWeeklyHours(days);

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between pb-2 border-b border-gray-100'>
        <label className='font-bold text-gray-800 text-xs'>
          Weekly Schedule Configuration (7-Day Pattern)
        </label>
        <span className='text-xs font-black text-[#714B67] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200'>
          Total: {totalWeekly} hrs / week
        </span>
      </div>

      <div className='space-y-2'>
        {DAYS_OF_WEEK.map((dayName) => {
          const d = days[dayName] || {
            isWorkingDay: false,
            startTime: '09:00',
            endTime: '18:00',
            breakMinutes: 60,
          };
          const dailyHours = calculateDailyHours(d);

          return (
            <div
              key={dayName}
              className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${
                d.isWorkingDay
                  ? 'bg-[#FAF8F5] border-gray-200 shadow-2xs'
                  : 'bg-gray-50/50 border-gray-100 opacity-60'
              }`}
            >
              {/* Working Day Toggle */}
              <div className='flex items-center gap-2.5 min-w-[120px]'>
                <input
                  type='checkbox'
                  id={`day-${dayName}`}
                  checked={d.isWorkingDay}
                  onChange={(e) => onChange(dayName, 'isWorkingDay', e.target.checked)}
                  className='rounded text-[#714B67] focus:ring-[#714B67]'
                />
                <label
                  htmlFor={`day-${dayName}`}
                  className='font-bold text-gray-900 select-none cursor-pointer'
                >
                  {dayName}
                </label>
              </div>

              {/* Working Hours & Break Controls */}
              {d.isWorkingDay ? (
                <div className='flex flex-wrap items-center gap-3'>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-gray-400 text-[11px]'>In:</span>
                    <input
                      type='time'
                      value={d.startTime}
                      onChange={(e) => onChange(dayName, 'startTime', e.target.value)}
                      className='px-2 py-1 rounded-lg border border-gray-200 text-xs bg-white'
                    />
                  </div>

                  <div className='flex items-center gap-1.5'>
                    <span className='text-gray-400 text-[11px]'>Out:</span>
                    <input
                      type='time'
                      value={d.endTime}
                      onChange={(e) => onChange(dayName, 'endTime', e.target.value)}
                      className='px-2 py-1 rounded-lg border border-gray-200 text-xs bg-white'
                    />
                  </div>

                  <div className='flex items-center gap-1.5'>
                    <span className='text-gray-400 text-[11px]'>Break (m):</span>
                    <input
                      type='number'
                      min='0'
                      max='240'
                      value={d.breakMinutes}
                      onChange={(e) =>
                        onChange(dayName, 'breakMinutes', Number(e.target.value) || 0)
                      }
                      className='w-16 px-2 py-1 rounded-lg border border-gray-200 text-xs bg-white text-center'
                    />
                  </div>

                  <span className='text-xs font-bold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200'>
                    {dailyHours} hrs
                  </span>
                </div>
              ) : (
                <span className='text-gray-400 text-[11px] font-medium'>Rest Day (Off)</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
