import React, { useState } from 'react';

/**
 * Compact Today's Attendance card with punch toggle, worked time, and progress bar.
 *
 * @param {Object} props
 * @param {Object} props.attendance - Attendance initial state
 */
export default function AttendanceCard({ attendance }) {
  const [isCheckedIn, setIsCheckedIn] = useState(
    attendance?.status === 'Checked In'
  );
  const [workedTime, setWorkedTime] = useState(
    attendance?.currentWorkedTime || '04h 36m'
  );

  const handleToggle = () => {
    if (isCheckedIn) {
      setIsCheckedIn(false);
      setWorkedTime('04h 36m (Ended)');
    } else {
      setIsCheckedIn(true);
      setWorkedTime('04h 37m');
    }
  };

  const progressPercentage = isCheckedIn ? 58 : 58;

  return (
    <div className='bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] shadow-2xs hover:shadow-xs transition-all'>
      {/* Top Header: Title & Status */}
      <div className='flex items-center justify-between gap-3 mb-3 pb-2 border-b border-gray-100'>
        <div className='flex items-center gap-2'>
          <div className='w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center'>
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              strokeWidth='2'
            >
              <circle cx='12' cy='12' r='9' />
              <path strokeLinecap='round' d='M12 6v6l4 2' />
            </svg>
          </div>
          <div>
            <h3 className='text-xs sm:text-sm font-bold text-[#1E293B]'>
              Today's Attendance
            </h3>
            <p className='text-[10px] text-gray-400 font-medium'>
              Shift: 09:00 AM – 06:00 PM
            </p>
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
            isCheckedIn
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gray-100 text-gray-600 border-gray-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
            }`}
          />
          <span>{isCheckedIn ? 'Checked In' : 'Checked Out'}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className='grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#FAF8F5] border border-gray-200/60 mb-3 text-left'>
        <div>
          <span className='text-[10px] font-bold text-gray-400 uppercase tracking-wider block'>
            Check-In
          </span>
          <span className='text-sm sm:text-base font-extrabold text-[#1E293B]'>
            {isCheckedIn ? '09:12 AM' : '—'}
          </span>
          <span className='text-[9px] text-emerald-600 font-bold block'>
            ● On Time
          </span>
        </div>

        <div>
          <span className='text-[10px] font-bold text-gray-400 uppercase tracking-wider block'>
            Worked Time
          </span>
          <span className='text-sm sm:text-base font-extrabold text-[#714B67]'>
            {workedTime}
          </span>
          <span className='text-[9px] text-gray-500 font-medium block'>
            Target: 08h 00m
          </span>
        </div>

        <div className='col-span-2 sm:col-span-1'>
          <span className='text-[10px] font-bold text-gray-400 uppercase tracking-wider block'>
            Break Logged
          </span>
          <span className='text-sm sm:text-base font-extrabold text-[#1E293B]'>
            45m
          </span>
          <span className='text-[9px] text-gray-400 font-medium block'>
            15m balance
          </span>
        </div>
      </div>

      {/* Work Progress Bar */}
      <div className='mb-3'>
        <div className='flex items-center justify-between text-[11px] font-bold text-gray-600 mb-1'>
          <span>Work Progress</span>
          <span className='text-[#714B67] font-extrabold'>
            {progressPercentage}%
          </span>
        </div>

        <div
          className='w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50'
          role='progressbar'
          aria-valuenow={progressPercentage}
          aria-valuemin='0'
          aria-valuemax='100'
          aria-label='Shift progress'
        >
          <div
            className='h-full rounded-full bg-[#714B67] transition-all duration-300'
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Bottom Action Row */}
      <div className='flex items-center justify-between gap-3 pt-2 border-t border-gray-100'>
        <span className='text-[11px] text-gray-400 font-medium truncate'>
          HQ Campus • Floor 3
        </span>

        <button
          type='button'
          onClick={handleToggle}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            isCheckedIn
              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              : 'bg-[#714B67] text-white hover:bg-[#5E3E56]'
          }`}
        >
          <svg
            className='w-3.5 h-3.5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth='2'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
            />
          </svg>
          <span>{isCheckedIn ? 'Check Out' : 'Check In'}</span>
        </button>
      </div>
    </div>
  );
}
