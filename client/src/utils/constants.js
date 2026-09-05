/**
 * Central system constants, enum maps, and badge styling configurations for PeoplePay.
 */

export const ROLE_NAMES = {
  admin: 'Administrator',
  hr_manager: 'HR Manager',
  hr_payroll_manager: 'HR Payroll Manager',
  hr_payroll_user: 'HR Payroll User',
  employee: 'Employee',
};

export const EMPLOYEE_STATUS = {
  ACTIVE: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  ON_LEAVE: { label: 'On Leave', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  TERMINATED: { label: 'Terminated', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  INACTIVE: { label: 'Inactive', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
};

export const LEAVE_STATUS = {
  PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  REFUSED: { label: 'Refused', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
};

export const PAYRUN_STATUS = {
  DRAFT: { label: 'Draft', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  COMPUTED: { label: 'Computed', bg: 'bg-purple-50', text: 'text-[#714B67]', border: 'border-purple-200' },
  VALIDATED: { label: 'Validated', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  PAID: { label: 'Paid', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

export const CONTRACT_STATUS = {
  ACTIVE: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  DRAFT: { label: 'Draft', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  EXPIRED: { label: 'Expired', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  TERMINATED: { label: 'Terminated', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export const ATTENDANCE_STATUS = {
  PRESENT: { label: 'Present', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  ABSENT: { label: 'Absent', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  HALF_DAY: { label: 'Half Day', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  LEAVE: { label: 'On Leave', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  LATE: { label: 'Late', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  OVERTIME: { label: 'Overtime', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  EARLY_EXIT: { label: 'Early Exit', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  CORRECTED: { label: 'Corrected', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
};

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const SALARY_RULE_CATEGORIES = [
  { value: 'BASIC', label: 'Basic Salary' },
  { value: 'ALW', label: 'Allowance' },
  { value: 'DED', label: 'Deduction' },
  { value: 'GROSS', label: 'Gross Total' },
  { value: 'NET', label: 'Net Disbursal' },
];

export const SALARY_CALCULATION_TYPES = [
  { value: 'FIXED', label: 'Fixed Amount' },
  { value: 'PERCENTAGE', label: 'Percentage of Base' },
  { value: 'FORMULA', label: 'Formula Expression' },
];

export default {
  ROLE_NAMES,
  EMPLOYEE_STATUS,
  LEAVE_STATUS,
  PAYRUN_STATUS,
  CONTRACT_STATUS,
  ATTENDANCE_STATUS,
  DAYS_OF_WEEK,
  SALARY_RULE_CATEGORIES,
  SALARY_CALCULATION_TYPES,
};
