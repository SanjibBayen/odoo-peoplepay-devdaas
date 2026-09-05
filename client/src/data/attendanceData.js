/**
 * Attendance records data and status calculation helpers.
 * Statuses: PRESENT, LATE, ABSENT, EARLY_EXIT, OVERTIME, MISSING_CHECKOUT
 */

export const ATTENDANCE_STATUSES = [
  'All Statuses',
  'PRESENT',
  'LATE',
  'ABSENT',
  'EARLY_EXIT',
  'OVERTIME',
  'MISSING_CHECKOUT',
];

export const INITIAL_ATTENDANCE = [
  {
    id: 'att-1',
    employeeId: 'EMP-2024-001',
    employeeName: 'Ayush Sharma',
    department: 'Engineering',
    date: '2026-09-05',
    checkIn: '09:04',
    checkOut: '18:15',
    workedHours: 8.18,
    lateMinutes: 4,
    earlyExitMinutes: 0,
    overtimeMinutes: 15,
    status: 'PRESENT',
    notes: 'Biometric punch verified',
  },
  {
    id: 'att-2',
    employeeId: 'EMP-2023-014',
    employeeName: 'Rahul Verma',
    department: 'Engineering',
    date: '2026-09-05',
    checkIn: '09:32',
    checkOut: '18:30',
    workedHours: 7.97,
    lateMinutes: 32,
    earlyExitMinutes: 0,
    overtimeMinutes: 30,
    status: 'LATE',
    notes: 'Traffic delay on Outer Ring Road',
  },
  {
    id: 'att-3',
    employeeId: 'EMP-2022-089',
    employeeName: 'Priya Sundaram',
    department: 'Operations',
    date: '2026-09-05',
    checkIn: '08:28',
    checkOut: '17:35',
    workedHours: 8.12,
    lateMinutes: 0,
    earlyExitMinutes: 0,
    overtimeMinutes: 5,
    status: 'PRESENT',
    notes: 'On time',
  },
  {
    id: 'att-4',
    employeeId: 'EMP-2024-055',
    employeeName: 'Vikram Mehta',
    department: 'Marketing',
    date: '2026-09-05',
    checkIn: '09:00',
    checkOut: '16:45',
    workedHours: 6.75,
    lateMinutes: 0,
    earlyExitMinutes: 75,
    overtimeMinutes: 0,
    status: 'EARLY_EXIT',
    notes: 'Approved doctor visit early exit',
  },
  {
    id: 'att-5',
    employeeId: 'EMP-2024-102',
    employeeName: 'Ananya Rao',
    department: 'Finance & Payroll',
    date: '2026-09-05',
    checkIn: '08:55',
    checkOut: '20:10',
    workedHours: 10.25,
    lateMinutes: 0,
    earlyExitMinutes: 0,
    overtimeMinutes: 130,
    status: 'OVERTIME',
    notes: 'Payroll closing overtime',
  },
  {
    id: 'att-6',
    employeeId: 'EMP-2021-003',
    employeeName: 'Rohan Gupta',
    department: 'Administration',
    date: '2026-09-05',
    checkIn: '09:12',
    checkOut: null,
    workedHours: 0,
    lateMinutes: 12,
    earlyExitMinutes: 0,
    overtimeMinutes: 0,
    status: 'MISSING_CHECKOUT',
    notes: 'Forgot evening tap-out',
  },
  {
    id: 'att-7',
    employeeId: 'EMP-2023-045',
    employeeName: 'Kavita Nair',
    department: 'Engineering',
    date: '2026-09-05',
    checkIn: null,
    checkOut: null,
    workedHours: 0,
    lateMinutes: 0,
    earlyExitMinutes: 0,
    overtimeMinutes: 0,
    status: 'ABSENT',
    notes: 'Unplanned absence',
  },
];

const STORAGE_KEY = 'peoplepay_attendance_roster';

export function getAttendanceFromStorage() {
  if (typeof sessionStorage === 'undefined') return [...INITIAL_ATTENDANCE];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ATTENDANCE));
  } catch (e) {
    console.error('Failed to read attendance', e);
  }
  return [...INITIAL_ATTENDANCE];
}

export function saveAttendanceToStorage(records) {
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save attendance', e);
    }
  }
}
