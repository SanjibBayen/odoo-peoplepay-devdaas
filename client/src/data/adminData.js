/**
 * Mock data for Administration modules: Users, Departments, Audit Logs, Settings.
 */

export const INITIAL_USERS = [
  {
    id: 'usr-1',
    name: 'Ayush Sharma',
    email: 'ayush.sharma@peoplepay.internal',
    role: 'employee',
    department: 'Engineering',
    status: 'Active',
    lastActive: '10 mins ago',
  },
  {
    id: 'usr-2',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@peoplepay.internal',
    role: 'hr_manager',
    department: 'People Operations',
    status: 'Active',
    lastActive: '1 hour ago',
  },
  {
    id: 'usr-3',
    name: 'Devraj Patel',
    email: 'devraj.patel@peoplepay.internal',
    role: 'hr_payroll_user',
    department: 'Finance & Payroll',
    status: 'Active',
    lastActive: '25 mins ago',
  },
  {
    id: 'usr-4',
    name: 'Meera Nambiar',
    email: 'meera.nambiar@peoplepay.internal',
    role: 'hr_payroll_manager',
    department: 'Finance & Payroll',
    status: 'Active',
    lastActive: '3 hours ago',
  },
  {
    id: 'usr-5',
    name: 'Sanjib Bayen (Admin)',
    email: 'admin@peoplepay.internal',
    role: 'admin',
    department: 'Executive Administration',
    status: 'Active',
    lastActive: 'Just now',
  },
];

export const INITIAL_DEPARTMENTS = [
  { id: 'dept-1', name: 'Engineering', code: 'ENG', manager: 'Sarah Jenkins', headCount: 142, budget: '₹1.8 Cr' },
  { id: 'dept-2', name: 'Operations', code: 'OPS', manager: 'Priya Sundaram', headCount: 48, budget: '₹65L' },
  { id: 'dept-3', name: 'Sales & BD', code: 'SBD', manager: 'Vikram Mehta', headCount: 36, budget: '₹55L' },
  { id: 'dept-4', name: 'Marketing', code: 'MKT', manager: 'Vikram Mehta', headCount: 18, budget: '₹40L' },
  { id: 'dept-5', name: 'Finance & Payroll', code: 'FIN', manager: 'Meera Nambiar', headCount: 14, budget: '₹35L' },
  { id: 'dept-6', name: 'Administration', code: 'ADM', manager: 'Sanjib Bayen', headCount: 8, budget: '₹25L' },
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'log-1',
    timestamp: '2026-09-05 17:42:10',
    user: 'Sanjib Bayen',
    role: 'Admin',
    action: 'MODIFIED_CONFIG',
    module: 'Salary Rules',
    detail: 'Updated TDS tax slab threshold to ₹50,000',
    ip: '10.0.4.12',
    status: 'SUCCESS',
  },
  {
    id: 'log-2',
    timestamp: '2026-09-05 16:30:04',
    user: 'Devraj Patel',
    role: 'HR Payroll User',
    action: 'COMPUTE_PAYRUN',
    module: 'Payruns',
    detail: 'Executed payrun computation for Batch #26-09',
    ip: '10.0.4.55',
    status: 'SUCCESS',
  },
  {
    id: 'log-3',
    timestamp: '2026-09-05 15:10:22',
    user: 'Sarah Jenkins',
    role: 'HR Manager',
    action: 'APPROVE_LEAVE',
    module: 'Time Off',
    detail: 'Approved 2 days PAL for Ayush Sharma',
    ip: '10.0.4.19',
    status: 'SUCCESS',
  },
  {
    id: 'log-4',
    timestamp: '2026-09-05 14:02:11',
    user: 'Ayush Sharma',
    role: 'Employee',
    action: 'CHECK_IN',
    module: 'Attendance',
    detail: 'Biometric web check-in at 09:04 AM',
    ip: '10.0.4.82',
    status: 'SUCCESS',
  },
];

export const INITIAL_SETTINGS = {
  companyName: 'PeoplePay Enterprise Technologies Pvt Ltd',
  taxRegistrationNumber: 'GSTIN29AAACB1234F1Z5',
  currency: 'INR (₹)',
  fiscalYearStart: 'April 1',
  payrunCutoffDay: 25,
  workingDaysPerMonth: 22,
  enableBiometricSync: true,
  autoSendPayslips: false,
};
