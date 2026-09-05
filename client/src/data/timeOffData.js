/**
 * Time off data models, allocations, requests, and balance calculations.
 * Business Rules:
 * - Taken = sum of approved leave duration
 * - Remaining = allocation - approved used
 * - Pending requests do NOT consume balance until approved.
 * - Validation prevents overlapping approved leaves and exceeding allocation.
 */

export const INITIAL_LEAVE_TYPES = [
  { id: 'lt-1', name: 'Paid Annual Leave', code: 'PAL', defaultDays: 18, color: 'text-emerald-700 bg-emerald-50' },
  { id: 'lt-2', name: 'Sick & Wellness Leave', code: 'SWL', defaultDays: 12, color: 'text-blue-700 bg-blue-50' },
  { id: 'lt-3', name: 'Casual Leave', code: 'CL', defaultDays: 8, color: 'text-purple-700 bg-purple-50' },
  { id: 'lt-4', name: 'Compensatory Off', code: 'COMP', defaultDays: 4, color: 'text-amber-700 bg-amber-50' },
];

export const INITIAL_ALLOCATIONS = [
  {
    id: 'alloc-1',
    employeeId: 'EMP-2024-001',
    employeeName: 'Ayush Sharma',
    leaveTypeId: 'lt-1',
    leaveTypeName: 'Paid Annual Leave',
    allocatedDays: 18,
    approvedUsedDays: 6,
  },
  {
    id: 'alloc-2',
    employeeId: 'EMP-2024-001',
    employeeName: 'Ayush Sharma',
    leaveTypeId: 'lt-2',
    leaveTypeName: 'Sick & Wellness Leave',
    allocatedDays: 12,
    approvedUsedDays: 2,
  },
  {
    id: 'alloc-3',
    employeeId: 'EMP-2024-001',
    employeeName: 'Ayush Sharma',
    leaveTypeId: 'lt-3',
    leaveTypeName: 'Casual Leave',
    allocatedDays: 8,
    approvedUsedDays: 3,
  },
];

export const INITIAL_REQUESTS = [
  {
    id: 'req-1',
    requestId: 'REQ-2026-091',
    employeeId: 'EMP-2024-001',
    employeeName: 'Ayush Sharma',
    department: 'Engineering',
    leaveTypeId: 'lt-1',
    leaveTypeName: 'Paid Annual Leave',
    startDate: '2026-09-18',
    endDate: '2026-09-19',
    days: 2,
    reason: 'Family wedding attendance in Jaipur',
    status: 'Pending',
    createdAt: '2026-09-04',
  },
  {
    id: 'req-2',
    requestId: 'REQ-2026-088',
    employeeId: 'EMP-2023-014',
    employeeName: 'Rahul Verma',
    department: 'Engineering',
    leaveTypeId: 'lt-2',
    leaveTypeName: 'Sick & Wellness Leave',
    startDate: '2026-09-05',
    endDate: '2026-09-06',
    days: 2,
    reason: 'Viral fever rest per physician',
    status: 'Approved',
    createdAt: '2026-09-03',
  },
  {
    id: 'req-3',
    requestId: 'REQ-2026-079',
    employeeId: 'EMP-2022-089',
    employeeName: 'Priya Sundaram',
    department: 'Operations',
    leaveTypeId: 'lt-1',
    leaveTypeName: 'Paid Annual Leave',
    startDate: '2026-08-10',
    endDate: '2026-08-14',
    days: 5,
    reason: 'Annual family holiday',
    status: 'Approved',
    createdAt: '2026-08-01',
  },
  {
    id: 'req-4',
    requestId: 'REQ-2026-074',
    employeeId: 'EMP-2024-055',
    employeeName: 'Vikram Mehta',
    department: 'Marketing',
    leaveTypeId: 'lt-3',
    leaveTypeName: 'Casual Leave',
    startDate: '2026-08-25',
    endDate: '2026-08-25',
    days: 1,
    reason: 'Personal urgent errand',
    status: 'Rejected',
    reviewNotes: 'Critical campaign sprint on date',
    createdAt: '2026-08-20',
  },
];

const REQUESTS_STORAGE_KEY = 'peoplepay_timeoff_requests';
const ALLOC_STORAGE_KEY = 'peoplepay_timeoff_allocations';

export function getTimeOffRequestsFromStorage() {
  if (typeof sessionStorage === 'undefined') return [...INITIAL_REQUESTS];
  try {
    const raw = sessionStorage.getItem(REQUESTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    sessionStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(INITIAL_REQUESTS));
  } catch (e) {
    console.error('Failed to read time off requests', e);
  }
  return [...INITIAL_REQUESTS];
}

export function saveTimeOffRequestsToStorage(requests) {
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    } catch (e) {
      console.error('Failed to save time off requests', e);
    }
  }
}

export function getAllocationsFromStorage() {
  if (typeof sessionStorage === 'undefined') return [...INITIAL_ALLOCATIONS];
  try {
    const raw = sessionStorage.getItem(ALLOC_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    sessionStorage.setItem(ALLOC_STORAGE_KEY, JSON.stringify(INITIAL_ALLOCATIONS));
  } catch (e) {
    console.error('Failed to read allocations', e);
  }
  return [...INITIAL_ALLOCATIONS];
}

export function saveAllocationsToStorage(allocations) {
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(ALLOC_STORAGE_KEY, JSON.stringify(allocations));
    } catch (e) {
      console.error('Failed to save allocations', e);
    }
  }
}
