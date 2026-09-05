/**
 * Payslips mock data and earnings/deductions breakdown models.
 * Formula: Net Salary = Gross Salary - Total Deductions
 */

export const INITIAL_PAYSLIPS = [
  {
    id: 'ps-2026-09-001',
    slipNumber: 'SLIP-2026-09-001',
    employeeId: 'EMP-2024-001',
    employeeName: 'Ayush Sharma',
    department: 'Engineering',
    jobPosition: 'Senior Full Stack Engineer',
    period: 'September 2026',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    contractCode: 'CNT-2024-ENG-01',
    structureName: 'Standard Tech Engineering Structure',
    grossSalary: 140000,
    totalEarnings: 140000,
    totalDeductions: 19800,
    tax: 11200,
    netSalary: 120200, // 140000 - 19800
    status: 'Computed', // Draft, Computed, Confirmed, Paid
    earnings: [
      { name: 'Basic Salary', amount: 70000 },
      { name: 'House Rent Allowance (HRA)', amount: 35000 },
      { name: 'Special Allowance', amount: 35000 },
    ],
    deductions: [
      { name: 'Provident Fund (PF)', amount: 8400 },
      { name: 'Professional Tax (PT)', amount: 200 },
      { name: 'Income Tax (TDS)', amount: 11200 },
    ],
    bankAccount: 'HDFC Bank •••• 4091',
    disbursalDate: '2026-09-30',
  },
  {
    id: 'ps-2026-09-002',
    slipNumber: 'SLIP-2026-09-002',
    employeeId: 'EMP-2023-014',
    employeeName: 'Rahul Verma',
    department: 'Engineering',
    jobPosition: 'Lead DevOps Specialist',
    period: 'September 2026',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    contractCode: 'CNT-2023-ENG-02',
    structureName: 'Standard Tech Engineering Structure',
    grossSalary: 155000,
    totalEarnings: 155000,
    totalDeductions: 22600,
    tax: 13100,
    netSalary: 132400,
    status: 'Computed',
    earnings: [
      { name: 'Basic Salary', amount: 77500 },
      { name: 'House Rent Allowance (HRA)', amount: 38750 },
      { name: 'Special Allowance', amount: 38750 },
    ],
    deductions: [
      { name: 'Provident Fund (PF)', amount: 9300 },
      { name: 'Professional Tax (PT)', amount: 200 },
      { name: 'Income Tax (TDS)', amount: 13100 },
    ],
    bankAccount: 'ICICI Bank •••• 7120',
    disbursalDate: '2026-09-30',
  },
  {
    id: 'ps-2026-08-001',
    slipNumber: 'SLIP-2026-08-001',
    employeeId: 'EMP-2024-001',
    employeeName: 'Ayush Sharma',
    department: 'Engineering',
    jobPosition: 'Senior Full Stack Engineer',
    period: 'August 2026',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    contractCode: 'CNT-2024-ENG-01',
    structureName: 'Standard Tech Engineering Structure',
    grossSalary: 140000,
    totalEarnings: 140000,
    totalDeductions: 19800,
    tax: 11200,
    netSalary: 120200,
    status: 'Paid',
    earnings: [
      { name: 'Basic Salary', amount: 70000 },
      { name: 'House Rent Allowance (HRA)', amount: 35000 },
      { name: 'Special Allowance', amount: 35000 },
    ],
    deductions: [
      { name: 'Provident Fund (PF)', amount: 8400 },
      { name: 'Professional Tax (PT)', amount: 200 },
      { name: 'Income Tax (TDS)', amount: 11200 },
    ],
    bankAccount: 'HDFC Bank •••• 4091',
    disbursalDate: '2026-08-31',
  },
];

const STORAGE_KEY = 'peoplepay_payslips_roster';

export function getPayslipsFromStorage() {
  if (typeof sessionStorage === 'undefined') return [...INITIAL_PAYSLIPS];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PAYSLIPS));
  } catch (e) {
    console.error('Failed to read payslips', e);
  }
  return [...INITIAL_PAYSLIPS];
}

export function savePayslipsToStorage(payslips) {
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payslips));
    } catch (e) {
      console.error('Failed to save payslips', e);
    }
  }
}
