export const ROLES = {
  EMPLOYEE: {
    id: 'employee',
    slug: 'employee',
    name: 'Employee',
    roleIndicator: 'Employee Portal',
    title: 'Welcome back',
    subtitle: 'Access your PeoplePay workspace.',
    loginRoute: '/login/employee',
    dashboardRoute: '/dashboard/employee',
    icon: 'EMP',
    tagline:
      'Your self-service workspace for clocking in, time off, and digital payslips.',
    handwrittenNote: 'Attendance & payslips made easy',
    accentColor: '#10B981',
    badgeStyles: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    demoEmail: 'alex.morgan@company.com',
    stats: [
      { label: 'Upcoming Payslip', value: 'Sep 30' },
      { label: 'Leave Balance', value: '14 Days' },
    ],
  },
  HR_MANAGER: {
    id: 'hr-manager',
    slug: 'hr-manager',
    name: 'HR Manager',
    roleIndicator: 'HR Manager Portal',
    title: 'Welcome back',
    subtitle: 'Manage your people and HR operations.',
    loginRoute: '/login/hr-manager',
    dashboardRoute: '/dashboard/hr-manager',
    icon: 'HRM',
    tagline:
      'Coordinate team structures, leave approvals, and employee onboarding.',
    handwrittenNote: 'People ops in total sync',
    accentColor: '#2563EB',
    badgeStyles: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
    },
    demoEmail: 'sarah.jenkins@company.com',
    stats: [
      { label: 'Active Employees', value: '248' },
      { label: 'Pending Approvals', value: '4 Requests' },
    ],
  },
  HR_PAYROLL_USER: {
    id: 'hr-payroll-user',
    slug: 'hr-payroll-user',
    name: 'HR Payroll User',
    roleIndicator: 'HR Payroll User Portal',
    title: 'Welcome back',
    subtitle: 'Manage payroll operations with confidence.',
    loginRoute: '/login/hr-payroll-user',
    dashboardRoute: '/dashboard/hr-payroll-user',
    icon: 'HPU',
    tagline:
      'Execute precise salary runs, deductions, and attendance synchronizations.',
    handwrittenNote: 'Precision in every calculation',
    accentColor: '#D97706',
    badgeStyles: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    demoEmail: 'marcus.vance@company.com',
    stats: [
      { label: 'Current Batch', value: 'Batch #2026-09' },
      { label: 'Computation Status', value: '98% Ready' },
    ],
  },
  HR_PAYROLL_MANAGER: {
    id: 'hr-payroll-manager',
    slug: 'hr-payroll-manager',
    name: 'HR Payroll Manager',
    roleIndicator: 'HR Payroll Manager Portal',
    title: 'Welcome back',
    subtitle: 'Review, validate and manage payroll.',
    loginRoute: '/login/hr-payroll-manager',
    dashboardRoute: '/dashboard/hr-payroll-manager',
    icon: 'HPM',
    tagline:
      'Authorize disbursements, review audit logs, and oversee payroll compliance.',
    handwrittenNote: '100% compliant & approved',
    accentColor: '#714B67',
    badgeStyles: {
      bg: 'bg-purple-50',
      text: 'text-[#714B67]',
      border: 'border-purple-200',
      dot: 'bg-[#714B67]',
    },
    demoEmail: 'elena.rodriguez@company.com',
    stats: [
      { label: 'Payroll Authorizations', value: '1 Pending' },
      { label: 'Monthly Disbursement', value: '$482,500' },
    ],
  },
  ADMIN: {
    id: 'admin',
    slug: 'admin',
    name: 'Admin',
    roleIndicator: 'Administrator Portal',
    title: 'Welcome back',
    subtitle: 'Manage your PeoplePay organization.',
    loginRoute: '/login/admin',
    dashboardRoute: '/dashboard/admin',
    icon: 'ADM',
    tagline:
      'Govern organization settings, user roles, security rules, and integrations.',
    handwrittenNote: 'Total security & control',
    accentColor: '#E11D48',
    badgeStyles: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
    },
    demoEmail: 'admin@company.com',
    stats: [
      { label: 'System Health', value: 'Optimal 99.99%' },
      { label: 'Security Audit', value: 'Verified' },
    ],
  },
};

export const ROLES_LIST = Object.values(ROLES);

export function getRoleBySlug(slug) {
  return ROLES_LIST.find((r) => r.slug === slug) || ROLES.EMPLOYEE;
}
