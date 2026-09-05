/**
 * Working schedules data and automated working-hours calculation utilities.
 * Worked Hours = (Check-out - Check-in) - Break
 * Weekly Hours = sum of daily working hours
 */

export function calculateDailyHours(startStr, endStr, breakMinutes = 0) {
  if (!startStr || !endStr) return 0;
  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);
  const totalStartMinutes = startH * 60 + startM;
  const totalEndMinutes = endH * 60 + endM;
  const diffMinutes = Math.max(0, totalEndMinutes - totalStartMinutes - breakMinutes);
  return Number((diffMinutes / 60).toFixed(2));
}

export function calculateWeeklyHours(daysConfig) {
  let total = 0;
  Object.values(daysConfig).forEach((day) => {
    if (day.active) {
      total += calculateDailyHours(day.start, day.end, day.breakMinutes || 0);
    }
  });
  return Number(total.toFixed(2));
}

export const INITIAL_SCHEDULES = [
  {
    id: 'sch-1',
    name: 'Standard Tech 40H (Mon-Fri)',
    code: 'SCH-TECH-40',
    description: 'Core 40-hour engineering schedule with 1 hour lunch break.',
    days: {
      Monday: { active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
      Tuesday: { active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
      Wednesday: { active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
      Thursday: { active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
      Friday: { active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
      Saturday: { active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
      Sunday: { active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
    },
    weeklyHours: 40.0,
    assignedEmployeesCount: 142,
  },
  {
    id: 'sch-2',
    name: 'Operations Extended 45H',
    code: 'SCH-OPS-45',
    description: 'Operations and facilities roster covering 5 working days with half Saturday.',
    days: {
      Monday: { active: true, start: '08:30', end: '17:30', breakMinutes: 60 },
      Tuesday: { active: true, start: '08:30', end: '17:30', breakMinutes: 60 },
      Wednesday: { active: true, start: '08:30', end: '17:30', breakMinutes: 60 },
      Thursday: { active: true, start: '08:30', end: '17:30', breakMinutes: 60 },
      Friday: { active: true, start: '08:30', end: '17:30', breakMinutes: 60 },
      Saturday: { active: true, start: '09:00', end: '14:00', breakMinutes: 0 },
      Sunday: { active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
    },
    weeklyHours: 45.0,
    assignedEmployeesCount: 54,
  },
  {
    id: 'sch-3',
    name: 'Flexible Core 35H',
    code: 'SCH-FLEX-35',
    description: 'Flexible hybrid research and product schedule.',
    days: {
      Monday: { active: true, start: '10:00', end: '18:00', breakMinutes: 60 },
      Tuesday: { active: true, start: '10:00', end: '18:00', breakMinutes: 60 },
      Wednesday: { active: true, start: '10:00', end: '18:00', breakMinutes: 60 },
      Thursday: { active: true, start: '10:00', end: '18:00', breakMinutes: 60 },
      Friday: { active: true, start: '10:00', end: '18:00', breakMinutes: 60 },
      Saturday: { active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
      Sunday: { active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
    },
    weeklyHours: 35.0,
    assignedEmployeesCount: 40,
  },
];

const STORAGE_KEY = 'peoplepay_schedules_roster';

export function getSchedulesFromStorage() {
  if (typeof sessionStorage === 'undefined') return [...INITIAL_SCHEDULES];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SCHEDULES));
  } catch (e) {
    console.error('Failed to read schedules', e);
  }
  return [...INITIAL_SCHEDULES];
}

export function saveSchedulesToStorage(schedules) {
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    } catch (e) {
      console.error('Failed to save schedules', e);
    }
  }
}
