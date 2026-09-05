/**
 * Mock aggregated data models for lightweight SVG/CSS reports.
 */

export const PAYROLL_COST_REPORT = {
  fiscalYear: 'FY 2026-27',
  totalYearlyCost: '₹16.84 Cr',
  currentMonthCost: '₹1.42 Cr',
  grossDisbursed: '₹1.28 Cr',
  statutoryTaxes: '₹14.2 L',
  netDisbursed: '₹1.14 Cr',
};

export const MONTHLY_TREND_REPORT = [
  { month: 'Apr', amount: 1.34, label: '₹1.34 Cr' },
  { month: 'May', amount: 1.36, label: '₹1.36 Cr' },
  { month: 'Jun', amount: 1.38, label: '₹1.38 Cr' },
  { month: 'Jul', amount: 1.40, label: '₹1.40 Cr' },
  { month: 'Aug', amount: 1.41, label: '₹1.41 Cr' },
  { month: 'Sep', amount: 1.42, label: '₹1.42 Cr' },
];

export const DEPARTMENT_COST_REPORT = [
  { department: 'Engineering', percentage: 58, cost: '₹82.4 L' },
  { department: 'Operations', percentage: 16, cost: '₹22.7 L' },
  { department: 'Sales & BD', percentage: 12, cost: '₹17.0 L' },
  { department: 'Marketing', percentage: 7, cost: '₹9.9 L' },
  { department: 'Finance & Admin', percentage: 7, cost: '₹9.9 L' },
];

export const ATTENDANCE_HEALTH_REPORT = {
  presentRate: 94.6,
  lateRate: 3.8,
  absentRate: 1.6,
  totalWorkHoursLogged: 42800,
  averageWorkHoursPerEmployee: 172.5,
};

export const EMPLOYEE_STATS_REPORT = {
  totalEmployees: 248,
  activePermanent: 220,
  probation: 22,
  contractor: 6,
  genderRatio: '62% M / 38% F',
  averageTenure: '2.4 Years',
};
